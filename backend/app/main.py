import csv, hashlib, io, os, secrets, time, uuid
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import date, datetime, timezone, timedelta
from decimal import Decimal
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Query, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from .db import engine, get_db, Base
from . import models, schemas
from .security import hash_password, verify_password, get_current_user, get_current_org, bearer
from .financial_engine import (
    summarize,
    calculate_profit_loss,
    calculate_cash_flow,
    calculate_financial_health,
    generate_recommendations,
    calculate_cash_flow_forecast,
    run_walk_forward_backtest,
    money,
)
from .llm_adapter import generate_explanation
from . import ratio_service
from . import ratio_narrative
from .ratio_engine import RATIO_META

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    yield

app = FastAPI(title="ProfitAI API", version="0.1.0", lifespan=lifespan)

_cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:3000")
_cors_origins = [o.strip() for o in _cors_origins_raw.split(",") if o.strip()]
app.add_middleware(CORSMiddleware,
                   allow_origins=_cors_origins,
                   allow_credentials=True,
                   allow_methods=["*"],
                   allow_headers=["*"])

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request.state.request_id = str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response

# In-memory rate limiter untuk auth endpoints
_auth_attempts: dict = defaultdict(list)
_AUTH_LIMIT = 10        # max attempts
_AUTH_WINDOW = 60       # detik

def _check_rate_limit(ip: str):
    now = time.time()
    attempts = _auth_attempts[ip]
    # Buang attempts yang sudah expired
    _auth_attempts[ip] = [t for t in attempts if now - t < _AUTH_WINDOW]
    if len(_auth_attempts[ip]) >= _AUTH_LIMIT:
        raise HTTPException(429, "Terlalu banyak percobaan login. Coba lagi dalam 1 menit.")
    _auth_attempts[ip].append(now)

@app.exception_handler(HTTPException)
async def http_error(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={
        "error": {"code": "HTTP_ERROR", "message": exc.detail},
        "request_id": getattr(request.state, "request_id", None)})

@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={
        "error": {"code": "VALIDATION_ERROR", "message": "Input tidak valid",
                  "details": jsonable_encoder(exc.errors())},
        "request_id": getattr(request.state, "request_id", None)})

DEFAULT_CATEGORIES = [("Penjualan", "income"), ("Pendapatan Jasa", "income"),
    ("Operasional", "expense"), ("Gaji", "expense"), ("Sewa", "expense"),
    ("Transport", "expense"), ("Refund Pelanggan", "refund"),
    ("Transfer Antar Akun", "transfer"), ("Setoran Modal", "owner_contribution"),
    ("Penarikan Pemilik", "owner_draw"), ("Pinjaman Masuk", "loan_received"),
    ("Cicilan Pinjaman", "loan_repayment")]

def require_org_role(db, org_id, user, allowed=("owner", "admin")):
    m = (db.query(models.Membership)
         .filter_by(organization_id=org_id, user_id=user.id).first())
    if m is None or m.role not in allowed:
        raise HTTPException(403, "Hanya owner/admin yang dapat melakukan aksi ini")
    return m


def log_audit(db, org_id, user_id, action, entity_type=None, entity_id=None, payload=None, ip=None):
    try:
        ev = models.AuditEvent(
            organization_id=org_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            payload=jsonable_encoder(payload) if payload is not None else None,
            ip_address=ip
        )
        db.add(ev)
        db.flush()
    except Exception:
        pass

# ==========================================
# 1. SYSTEM & AUTHENTICATION
# ==========================================
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/v1/models")
@app.get("/v1/models")
def list_models():
    """
    Placeholder endpoint for LLM models discovery.
    Returns empty list as models are resolved dynamically.
    """
    return {"models": []}

@app.post("/api/v1/auth/register", status_code=201)
def register(p: schemas.RegisterIn, request: Request, db=Depends(get_db)):
    _check_rate_limit(request.client.host if request.client else "unknown")
    email = p.email.strip().lower()
    if "@" not in email:
        raise HTTPException(422, "Email tidak valid")
    if db.query(models.User).filter_by(email=email).first():
        raise HTTPException(409, "Email sudah terdaftar")
    user = models.User(email=email, password_hash=hash_password(p.password),
                       full_name=p.full_name)
    db.add(user); db.flush()
    org = models.Organization(name=p.organization_name)
    db.add(org); db.flush()
    db.add(models.Membership(organization_id=org.id, user_id=user.id, role="owner"))
    db.add(models.BusinessProfile(organization_id=org.id, industry=p.industry))
    for name, t in DEFAULT_CATEGORIES:
        db.add(models.Category(organization_id=org.id, name=name, tx_type=t))
    log_audit(db, org.id, user.id, "USER_REGISTERED", "users", user.id, {"email": email})
    db.commit()
    return {"user_id": user.id, "organization_id": org.id, "message": "Terdaftar, silakan login"}

@app.post("/api/v1/auth/login")
def login(p: schemas.LoginIn, request: Request, db=Depends(get_db)):
    _check_rate_limit(request.client.host if request.client else "unknown")
    user = db.query(models.User).filter_by(email=p.email.strip().lower()).first()
    if not user or not verify_password(p.password, user.password_hash):
        raise HTTPException(401, "Email atau password salah")
    token = secrets.token_urlsafe(32)
    db.add(models.Session(token=token, user_id=user.id,
                          expires_at=datetime.now(timezone.utc) + timedelta(days=7)))
    log_audit(db, None, user.id, "USER_LOGGED_IN", "sessions", None, {"email": user.email})
    db.commit()
    # Ambil org_id milik user ini (bukan org lain)
    membership = (db.query(models.Membership)
                  .filter_by(user_id=user.id)
                  .order_by(models.Membership.organization_id)
                  .first())
    organization_id = membership.organization_id if membership else None
    return {"access_token": token, "token_type": "bearer", "organization_id": organization_id}

@app.post("/api/v1/auth/logout")
def logout(creds=Depends(bearer), db=Depends(get_db)):
    if creds:
        sess = db.get(models.Session, creds.credentials)
        if sess:
            db.delete(sess)
            db.commit()
    return {"message": "Logout berhasil"}

@app.get("/api/v1/me")
def me(user=Depends(get_current_user), org_id=Depends(get_current_org), db=Depends(get_db)):
    m = db.query(models.Membership).filter_by(organization_id=org_id, user_id=user.id).first()
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "organization_id": org_id,
        "role": m.role if m else "viewer"
    }

# ==========================================
# 2. ORGANIZATIONS & MEMBERS
# ==========================================
@app.get("/api/v1/organizations")
def list_organizations(user=Depends(get_current_user), db=Depends(get_db)):
    memberships = db.query(models.Membership).filter_by(user_id=user.id).all()
    res = []
    for m in memberships:
        org = db.query(models.Organization).filter_by(id=m.organization_id).first()
        if org:
            prof = db.query(models.BusinessProfile).filter_by(organization_id=org.id).first()
            res.append({
                "id": org.id,
                "name": org.name,
                "role": m.role,
                "industry": prof.industry if prof else None,
                "currency": prof.currency if prof else "IDR",
                "created_at": str(org.created_at)
            })
    return res

@app.post("/api/v1/organizations", status_code=201)
def create_organization(p: schemas.OrganizationCreate, user=Depends(get_current_user), db=Depends(get_db)):
    org = models.Organization(name=p.name)
    db.add(org); db.flush()
    db.add(models.Membership(organization_id=org.id, user_id=user.id, role="owner"))
    db.add(models.BusinessProfile(
        organization_id=org.id,
        industry=p.industry,
        currency=p.currency or "IDR",
        timezone=p.timezone or "Asia/Jakarta",
        accounting_basis=p.accounting_basis or "cash"
    ))
    for name, t in DEFAULT_CATEGORIES:
        db.add(models.Category(organization_id=org.id, name=name, tx_type=t))
    log_audit(db, org.id, user.id, "ORGANIZATION_CREATED", "organizations", org.id, {"name": p.name})
    db.commit()
    return {"id": org.id, "name": org.name, "role": "owner"}

@app.get("/api/v1/organizations/{target_org_id}")
def get_organization(target_org_id: int, org_id=Depends(get_current_org), db=Depends(get_db)):
    if target_org_id != org_id:
        raise HTTPException(403, "Akses ke organisasi lain ditolak")
    org = db.query(models.Organization).filter_by(id=org_id).first()
    if not org:
        raise HTTPException(404, "Organisasi tidak ditemukan")
    profile = db.query(models.BusinessProfile).filter_by(organization_id=org_id).first()
    return {
        "id": org.id,
        "name": org.name,
        "industry": profile.industry if profile else None,
        "currency": profile.currency if profile else "IDR",
        "timezone": profile.timezone if profile else "Asia/Jakarta",
        "accounting_basis": profile.accounting_basis if profile else "cash",
    }

@app.patch("/api/v1/organizations/{target_org_id}")
def update_organization(target_org_id: int, p: schemas.OrganizationUpdate,
                        user=Depends(get_current_user), org_id=Depends(get_current_org), db=Depends(get_db)):
    if target_org_id != org_id:
        raise HTTPException(403, "Akses ke organisasi lain ditolak")
    org = db.query(models.Organization).filter_by(id=org_id).first()
    if not org:
        raise HTTPException(404, "Organisasi tidak ditemukan")
    profile = db.query(models.BusinessProfile).filter_by(organization_id=org_id).first()
    if not profile:
        profile = models.BusinessProfile(organization_id=org_id)
        db.add(profile)

    if p.name:
        org.name = p.name
    if p.industry is not None:
        profile.industry = p.industry
    if p.currency:
        profile.currency = p.currency
    if p.timezone:
        profile.timezone = p.timezone
    if p.accounting_basis:
        profile.accounting_basis = p.accounting_basis

    log_audit(db, org_id, user.id, "ORGANIZATION_UPDATED", "organizations", org_id, p.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(org)
    return {
        "id": org.id,
        "name": org.name,
        "industry": profile.industry,
        "currency": profile.currency,
        "timezone": profile.timezone,
        "accounting_basis": profile.accounting_basis,
    }

@app.get("/api/v1/organizations/{target_org_id}/members")
def list_members(target_org_id: int, org_id=Depends(get_current_org), db=Depends(get_db)):
    if target_org_id != org_id:
        raise HTTPException(403, "Akses ke organisasi lain ditolak")
    memberships = db.query(models.Membership).filter_by(organization_id=org_id).all()
    res = []
    for m in memberships:
        u = db.query(models.User).filter_by(id=m.user_id).first()
        if u:
            res.append({
                "user_id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "role": m.role,
                "joined_at": str(m.created_at)
            })
    return res

@app.post("/api/v1/organizations/{target_org_id}/members", status_code=201)
def add_member(target_org_id: int, p: schemas.MemberAdd,
               user=Depends(get_current_user), org_id=Depends(get_current_org), db=Depends(get_db)):
    require_org_role(db, org_id, user, allowed=("owner",))
    if target_org_id != org_id:
        raise HTTPException(403, "Akses ke organisasi lain ditolak")
    target_user = db.query(models.User).filter_by(email=p.email.strip().lower()).first()
    if not target_user:
        raise HTTPException(404, "User dengan email tersebut belum terdaftar di sistem")
    existing = db.query(models.Membership).filter_by(organization_id=org_id, user_id=target_user.id).first()
    if existing:
        raise HTTPException(409, "User sudah menjadi anggota organisasi ini")
    m = models.Membership(organization_id=org_id, user_id=target_user.id, role=p.role)
    db.add(m)
    log_audit(db, org_id, user.id, "MEMBER_ADDED", "organization_members", target_user.id, {"role": p.role})
    db.commit()
    return {"message": "Anggota berhasil ditambahkan", "user_id": target_user.id, "role": p.role}

@app.patch("/api/v1/organizations/{target_org_id}/members/{target_user_id}")
def update_member_role(target_org_id: int, target_user_id: int, p: schemas.MemberRoleUpdate,
                       user=Depends(get_current_user), org_id=Depends(get_current_org), db=Depends(get_db)):
    require_org_role(db, org_id, user, allowed=("owner",))
    if target_org_id != org_id:
        raise HTTPException(403, "Akses ke organisasi lain ditolak")
    m = db.query(models.Membership).filter_by(organization_id=org_id, user_id=target_user_id).first()
    if not m:
        raise HTTPException(404, "Anggota tidak ditemukan di organisasi ini")
    m.role = p.role
    log_audit(db, org_id, user.id, "MEMBER_ROLE_UPDATED", "organization_members", target_user_id, {"new_role": p.role})
    db.commit()
    return {"message": "Role anggota berhasil diperbarui", "user_id": target_user_id, "role": p.role}

@app.delete("/api/v1/organizations/{target_org_id}/members/{target_user_id}")
def remove_member(target_org_id: int, target_user_id: int,
                  user=Depends(get_current_user), org_id=Depends(get_current_org), db=Depends(get_db)):
    require_org_role(db, org_id, user, allowed=("owner",))
    if target_org_id != org_id:
        raise HTTPException(403, "Akses ke organisasi lain ditolak")
    m = db.query(models.Membership).filter_by(organization_id=org_id, user_id=target_user_id).first()
    if not m:
        raise HTTPException(404, "Anggota tidak ditemukan di organisasi ini")
    db.delete(m)
    log_audit(db, org_id, user.id, "MEMBER_REMOVED", "organization_members", target_user_id)
    db.commit()
    return {"message": "Anggota berhasil dihapus dari organisasi"}

# ==========================================
# 3. CHART OF ACCOUNTS (COA)
# ==========================================
@app.get("/api/v1/accounts")
def list_accounts(org_id=Depends(get_current_org), db=Depends(get_db)):
    rows = db.query(models.Account).filter_by(organization_id=org_id).order_by(models.Account.code).all()
    return [{
        "id": a.id, "code": a.code, "name": a.name,
        "account_type": a.account_type, "normal_balance": a.normal_balance,
        "is_active": a.is_active
    } for a in rows]

@app.post("/api/v1/accounts", status_code=201)
def create_account(p: schemas.AccountCreate, user=Depends(get_current_user),
                   org_id=Depends(get_current_org), db=Depends(get_db)):
    require_org_role(db, org_id, user)
    if db.query(models.Account).filter_by(organization_id=org_id, code=p.code).first():
        raise HTTPException(409, f"Akun dengan kode '{p.code}' sudah ada")
    a = models.Account(organization_id=org_id, **p.model_dump())
    db.add(a); db.commit(); db.refresh(a)
    log_audit(db, org_id, user.id, "ACCOUNT_CREATED", "accounts", a.id, {"code": a.code, "name": a.name})
    return {"id": a.id, "code": a.code, "name": a.name, "account_type": a.account_type}

@app.get("/api/v1/accounts/{account_id}")
def get_account(account_id: int, org_id=Depends(get_current_org), db=Depends(get_db)):
    a = db.query(models.Account).filter_by(id=account_id, organization_id=org_id).first()
    if not a:
        raise HTTPException(404, "Akun tidak ditemukan")
    return {"id": a.id, "code": a.code, "name": a.name, "account_type": a.account_type, "normal_balance": a.normal_balance, "is_active": a.is_active}

@app.patch("/api/v1/accounts/{account_id}")
def update_account(account_id: int, p: schemas.AccountUpdate, user=Depends(get_current_user),
                   org_id=Depends(get_current_org), db=Depends(get_db)):
    require_org_role(db, org_id, user)
    a = db.query(models.Account).filter_by(id=account_id, organization_id=org_id).first()
    if not a:
        raise HTTPException(404, "Akun tidak ditemukan")
    if p.name is not None: a.name = p.name
    if p.account_type is not None: a.account_type = p.account_type
    if p.normal_balance is not None: a.normal_balance = p.normal_balance
    if p.is_active is not None: a.is_active = p.is_active
    db.commit(); db.refresh(a)
    log_audit(db, org_id, user.id, "ACCOUNT_UPDATED", "accounts", a.id, p.model_dump(exclude_unset=True))
    return {"id": a.id, "code": a.code, "name": a.name, "is_active": a.is_active}

@app.delete("/api/v1/accounts/{account_id}")
def delete_account(account_id: int, user=Depends(get_current_user),
                   org_id=Depends(get_current_org), db=Depends(get_db)):
    require_org_role(db, org_id, user)
    a = db.query(models.Account).filter_by(id=account_id, organization_id=org_id).first()
    if not a:
        raise HTTPException(404, "Akun tidak ditemukan")
    a.is_active = False  # Soft deactivate to protect accounting integrity
    db.commit()
    log_audit(db, org_id, user.id, "ACCOUNT_DEACTIVATED", "accounts", a.id)
    return {"message": "Akun dinonaktifkan"}

# ==========================================
# 4. CATEGORIES
# ==========================================
@app.get("/api/v1/categories")
def categories(org_id=Depends(get_current_org), db=Depends(get_db)):
    rows = db.query(models.Category).filter_by(organization_id=org_id).order_by(models.Category.id).all()
    return [{"id": c.id, "name": c.name, "tx_type": c.tx_type, "account_id": c.account_id} for c in rows]

@app.post("/api/v1/categories", status_code=201)
def create_category(p: schemas.CategoryCreate, user=Depends(get_current_user),
                    org_id=Depends(get_current_org), db=Depends(get_db)):
    require_org_role(db, org_id, user)
    if db.query(models.Category).filter_by(organization_id=org_id, name=p.name, tx_type=p.tx_type).first():
        raise HTTPException(409, "Kategori dengan nama dan tipe tersebut sudah ada")
    c = models.Category(organization_id=org_id, **p.model_dump())
    db.add(c); db.commit(); db.refresh(c)
    log_audit(db, org_id, user.id, "CATEGORY_CREATED", "categories", c.id, {"name": c.name})
    return {"id": c.id, "name": c.name, "tx_type": c.tx_type, "account_id": c.account_id}

@app.patch("/api/v1/categories/{cat_id}")
def update_category(cat_id: int, p: schemas.CategoryUpdate, user=Depends(get_current_user),
                    org_id=Depends(get_current_org), db=Depends(get_db)):
    require_org_role(db, org_id, user)
    c = db.query(models.Category).filter_by(id=cat_id, organization_id=org_id).first()
    if not c:
        raise HTTPException(404, "Kategori tidak ditemukan")
    if p.name is not None: c.name = p.name
    if p.tx_type is not None: c.tx_type = p.tx_type
    if p.account_id is not None: c.account_id = p.account_id
    db.commit(); db.refresh(c)
    log_audit(db, org_id, user.id, "CATEGORY_UPDATED", "categories", c.id, p.model_dump(exclude_unset=True))
    return {"id": c.id, "name": c.name, "tx_type": c.tx_type, "account_id": c.account_id}

@app.delete("/api/v1/categories/{cat_id}")
def delete_category(cat_id: int, user=Depends(get_current_user),
                    org_id=Depends(get_current_org), db=Depends(get_db)):
    require_org_role(db, org_id, user)
    c = db.query(models.Category).filter_by(id=cat_id, organization_id=org_id).first()
    if not c:
        raise HTTPException(404, "Kategori tidak ditemukan")
    in_use = db.query(models.Transaction).filter_by(category_id=cat_id).first()
    if in_use:
        raise HTTPException(409, "Kategori masih digunakan dalam transaksi tercatat dan tidak dapat dihapus")
    db.delete(c)
    db.commit()
    log_audit(db, org_id, user.id, "CATEGORY_DELETED", "categories", cat_id)
    return {"message": "Kategori berhasil dihapus"}

# ==========================================
# 5. TRANSACTIONS & REVERSALS
# ==========================================
def tx_dict(t):
    return {"id": t.id, "transaction_date": str(t.transaction_date),
            "description": t.description, "amount": money(t.amount),
            "tx_type": t.tx_type, "category_id": t.category_id,
            "account_id": t.account_id, "status": t.status, "reversal_of_id": t.reversal_of_id}

@app.post("/api/v1/transactions", status_code=201)
def create_tx(p: schemas.TransactionIn, user=Depends(get_current_user),
              org_id=Depends(get_current_org), db=Depends(get_db)):
    require_org_role(db, org_id, user, allowed=("owner", "admin", "member"))
    if p.category_id is not None:
        cat = db.query(models.Category).filter_by(id=p.category_id, organization_id=org_id).first()
        if not cat:
            raise HTTPException(422, "Kategori tidak ditemukan di organisasimu")
        if cat.tx_type != p.tx_type:
            raise HTTPException(422, "Tipe kategori tidak cocok dengan tipe transaksi")
    t = models.Transaction(organization_id=org_id, created_by=user.id, **p.model_dump())
    db.add(t); db.commit(); db.refresh(t)
    log_audit(db, org_id, user.id, "TRANSACTION_CREATED", "transactions", t.id, {"amount": money(t.amount)})
    return tx_dict(t)

@app.get("/api/v1/transactions")
def list_tx(date_from: date = Query(alias="from"), date_to: date = Query(alias="to"),
            limit: int = Query(50, le=200), offset: int = 0,
            tx_type: Optional[str] = None, category_id: Optional[int] = None,
            search: Optional[str] = None,
            org_id=Depends(get_current_org), db=Depends(get_db)):
    q = db.query(models.Transaction).filter(
        models.Transaction.organization_id == org_id,
        models.Transaction.transaction_date >= date_from,
        models.Transaction.transaction_date <= date_to,
        # Baris reversal adalah jejak audit, bukan transaksi baru. Tampilkan
        # transaksi asli (status reversed) agar tidak terlihat dobel di UI.
        models.Transaction.reversal_of_id.is_(None),
    )
    if tx_type:
        q = q.filter(models.Transaction.tx_type == tx_type)
    if category_id:
        q = q.filter(models.Transaction.category_id == category_id)
    if search:
        q = q.filter(models.Transaction.description.ilike(f"%{search}%"))
    q = q.order_by(models.Transaction.transaction_date.desc(), models.Transaction.id.desc())
    total = q.count()
    rows = q.limit(limit).offset(offset).all()
    return {"total": total, "limit": limit, "offset": offset,
            "items": [tx_dict(t) for t in rows]}

@app.get("/api/v1/transactions/reversals")
def list_reversals(org_id=Depends(get_current_org), db=Depends(get_db)):
    rows = db.query(models.TransactionReversal).filter_by(organization_id=org_id).order_by(models.TransactionReversal.id.desc()).all()
    return [{
        "id": r.id, "original_transaction_id": r.original_transaction_id,
        "reversal_transaction_id": r.reversal_transaction_id, "reason": r.reason,
        "created_by": r.created_by, "created_at": str(r.created_at)
    } for r in rows]

@app.get("/api/v1/transactions/{tx_id}")
def get_tx(tx_id: int, org_id=Depends(get_current_org), db=Depends(get_db)):
    t = db.query(models.Transaction).filter_by(id=tx_id, organization_id=org_id).first()
    if not t:
        raise HTTPException(404, "Transaksi tidak ditemukan")
    return tx_dict(t)

@app.patch("/api/v1/transactions/{tx_id}")
def update_tx(tx_id: int, p: schemas.TransactionUpdate,
              user=Depends(get_current_user), org_id=Depends(get_current_org), db=Depends(get_db)):
    require_org_role(db, org_id, user, allowed=("owner", "admin", "member"))
    t = db.query(models.Transaction).filter_by(id=tx_id, organization_id=org_id).first()
    if not t:
        raise HTTPException(404, "Transaksi tidak ditemukan")
    if t.status == "reversed" or t.reversal_of_id is not None:
        raise HTTPException(409, "Transaksi yang sudah di-reverse atau baris reversal tidak dapat diubah")

    target_type = p.tx_type or t.tx_type
    target_category_id = p.category_id if p.category_id is not None else t.category_id

    if target_category_id is not None:
        cat = db.query(models.Category).filter_by(id=target_category_id, organization_id=org_id).first()
        if not cat:
            raise HTTPException(422, "Kategori tidak ditemukan di organisasimu")
        if cat.tx_type != target_type:
            raise HTTPException(422, "Tipe kategori tidak cocok dengan tipe transaksi")

    if p.transaction_date is not None: t.transaction_date = p.transaction_date
    if p.description is not None: t.description = p.description
    if p.amount is not None: t.amount = p.amount
    if p.tx_type is not None: t.tx_type = p.tx_type
    if p.category_id is not None: t.category_id = p.category_id
    if p.account_id is not None: t.account_id = p.account_id

    log_audit(db, org_id, user.id, "TRANSACTION_UPDATED", "transactions", t.id, p.model_dump(exclude_unset=True))
    db.commit(); db.refresh(t)
    return tx_dict(t)

@app.post("/api/v1/transactions/{tx_id}/reverse", status_code=201)
def reverse_tx(tx_id: int, user=Depends(get_current_user),
               org_id=Depends(get_current_org), db=Depends(get_db)):
    require_org_role(db, org_id, user)
    t = db.query(models.Transaction).filter_by(id=tx_id, organization_id=org_id).first()
    if not t:
        raise HTTPException(404, "Transaksi tidak ditemukan")
    if t.status != "posted" or t.reversal_of_id is not None:
        raise HTTPException(409, "Sudah di-reverse atau merupakan baris reversal")
    rev = models.Transaction(organization_id=org_id, transaction_date=t.transaction_date,
        description=f"Reversal of #{t.id}", amount=t.amount, tx_type=t.tx_type,
        category_id=t.category_id, account_id=t.account_id, reversal_of_id=t.id, created_by=user.id)
    t.status = "reversed"
    db.add(rev); db.flush()
    # Save to transaction_reversals table
    db.add(models.TransactionReversal(
        organization_id=org_id,
        original_transaction_id=t.id,
        reversal_transaction_id=rev.id,
        reason=f"Pembalikan transaksi #{t.id}",
        created_by=user.id
    ))
    log_audit(db, org_id, user.id, "TRANSACTION_REVERSED", "transactions", t.id, {"reversal_id": rev.id})
    db.commit(); db.refresh(rev)
    return tx_dict(rev)

# ==========================================
# 6. OPENING BALANCES
# ==========================================
@app.get("/api/v1/opening-balances")
def list_opening_balances(org_id=Depends(get_current_org), db=Depends(get_db)):
    rows = db.query(models.OpeningBalance).filter_by(organization_id=org_id).order_by(models.OpeningBalance.effective_date.desc()).all()
    res = []
    for ob in rows:
        acc = db.query(models.Account).filter_by(id=ob.account_id).first()
        res.append({
            "id": ob.id, "account_id": ob.account_id,
            "account_code": acc.code if acc else "", "account_name": acc.name if acc else "",
            "effective_date": str(ob.effective_date), "amount": money(ob.amount)
        })
    return res

@app.post("/api/v1/opening-balances", status_code=201)
def create_opening_balance(p: schemas.OpeningBalanceCreate, user=Depends(get_current_user),
                           org_id=Depends(get_current_org), db=Depends(get_db)):
    require_org_role(db, org_id, user)
    acc = db.query(models.Account).filter_by(id=p.account_id, organization_id=org_id).first()
    if not acc:
        raise HTTPException(404, "Akun tidak ditemukan di organisasimu")
    ob = models.OpeningBalance(organization_id=org_id, created_by=user.id, **p.model_dump())
    db.add(ob); db.commit(); db.refresh(ob)
    log_audit(db, org_id, user.id, "OPENING_BALANCE_SET", "opening_balances", ob.id, {"amount": money(ob.amount)})
    return {"id": ob.id, "account_id": ob.account_id, "amount": money(ob.amount), "effective_date": str(ob.effective_date)}

@app.patch("/api/v1/opening-balances/{ob_id}")
def update_opening_balance(ob_id: int, p: schemas.OpeningBalanceUpdate, user=Depends(get_current_user),
                           org_id=Depends(get_current_org), db=Depends(get_db)):
    require_org_role(db, org_id, user)
    ob = db.query(models.OpeningBalance).filter_by(id=ob_id, organization_id=org_id).first()
    if not ob:
        raise HTTPException(404, "Saldo awal tidak ditemukan")
    if p.effective_date is not None: ob.effective_date = p.effective_date
    if p.amount is not None: ob.amount = p.amount
    db.commit(); db.refresh(ob)
    return {"id": ob.id, "account_id": ob.account_id, "amount": money(ob.amount), "effective_date": str(ob.effective_date)}

# ==========================================
# 7. FINANCIAL REPORTS & CALCULATION RUNS
# ==========================================
@app.get("/api/v1/financial/summary")
def summary(date_from: date = Query(alias="from"), date_to: date = Query(alias="to"),
            org_id=Depends(get_current_org), db=Depends(get_db)):
    rows = db.query(models.Transaction).filter(
        models.Transaction.organization_id == org_id,
        models.Transaction.transaction_date >= date_from,
        models.Transaction.transaction_date <= date_to).all()
    res = summarize(rows, date_from, date_to)
    # Log calculation run
    db.add(models.FinancialCalculationRun(
        organization_id=org_id,
        period_from=date_from,
        period_to=date_to,
        formula_version=res["formula_version"],
        data_quality_status=res["data_quality"]["status"],
        calculated_metrics={"net_revenue": res["metrics"]["net_revenue"]["value"], "surplus": res["metrics"]["simple_surplus"]["value"]},
        warnings=res["data_quality"]["warnings"]
    ))
    db.commit()
    return res

@app.get("/api/v1/financial/profit-loss")
def profit_loss(date_from: date = Query(alias="from"), date_to: date = Query(alias="to"),
                org_id=Depends(get_current_org), db=Depends(get_db)):
    rows = db.query(models.Transaction).filter(
        models.Transaction.organization_id == org_id,
        models.Transaction.transaction_date >= date_from,
        models.Transaction.transaction_date <= date_to).all()
    return calculate_profit_loss(rows, date_from, date_to)

@app.get("/api/v1/financial/cash-flow")
def cash_flow(date_from: date = Query(alias="from"), date_to: date = Query(alias="to"),
              org_id=Depends(get_current_org), db=Depends(get_db)):
    rows = db.query(models.Transaction).filter(
        models.Transaction.organization_id == org_id,
        models.Transaction.transaction_date >= date_from,
        models.Transaction.transaction_date <= date_to).all()
    return calculate_cash_flow(rows, date_from, date_to)

@app.get("/api/v1/financial/runs")
def list_calculation_runs(limit: int = 20, org_id=Depends(get_current_org), db=Depends(get_db)):
    runs = db.query(models.FinancialCalculationRun).filter_by(organization_id=org_id).order_by(models.FinancialCalculationRun.id.desc()).limit(limit).all()
    return [{
        "id": r.id, "period_from": str(r.period_from), "period_to": str(r.period_to),
        "formula_version": r.formula_version, "data_quality_status": r.data_quality_status,
        "metrics": r.calculated_metrics, "created_at": str(r.created_at)
    } for r in runs]

# ==========================================
# 8. RISK RULES & SIGNALS
# ==========================================
@app.get("/api/v1/risk-rules")
def list_risk_rules(user=Depends(get_current_user), db=Depends(get_db)):
    rules = db.query(models.RiskRuleVersion).all()
    return [{
        "id": r.id, "rule_code": r.rule_code, "version": r.version,
        "description": r.description, "threshold_config": r.threshold_config, "is_active": r.is_active
    } for r in rules]

@app.patch("/api/v1/risk-rules/{rule_code}")
def update_risk_rule(rule_code: str, p: schemas.RiskRuleUpdate,
                     user=Depends(get_current_user), org_id=Depends(get_current_org), db=Depends(get_db)):
    r = db.query(models.RiskRuleVersion).filter_by(rule_code=rule_code).first()
    if not r:
        raise HTTPException(404, "Rule tidak ditemukan")
    if p.threshold_config is not None: r.threshold_config = p.threshold_config
    if p.is_active is not None: r.is_active = p.is_active
    db.commit(); db.refresh(r)
    return {"rule_code": r.rule_code, "threshold_config": r.threshold_config, "is_active": r.is_active}

@app.get("/api/v1/financial/health")
def financial_health(date_from: date = Query(alias="from"), date_to: date = Query(alias="to"),
                     org_id=Depends(get_current_org), db=Depends(get_db)):
    rows = db.query(models.Transaction).filter(
        models.Transaction.organization_id == org_id,
        models.Transaction.transaction_date >= date_from,
        models.Transaction.transaction_date <= date_to).all()
    res = calculate_financial_health(rows, date_from, date_to)
    # Save signals to risk_signals table
    for s in res["signals"]:
        db.add(models.RiskSignal(
            organization_id=org_id,
            rule_code=s["id"],
            level=s["level"],
            trigger_metric=s["trigger_metric"],
            current_value=str(s["current_value"]) if s["current_value"] is not None else None,
            threshold_value=str(s.get("threshold")) if s.get("threshold") is not None else None,
            explanation=s["explanation"],
            recommendation=s.get("recommendation")
        ))
    db.commit()
    return res

@app.get("/api/v1/financial/signals")
def list_signals(limit: int = 50, org_id=Depends(get_current_org), db=Depends(get_db)):
    rows = db.query(models.RiskSignal).filter_by(organization_id=org_id).order_by(models.RiskSignal.id.desc()).limit(limit).all()
    return [{
        "id": sig.id, "rule_code": sig.rule_code, "level": sig.level,
        "trigger_metric": sig.trigger_metric, "current_value": sig.current_value,
        "explanation": sig.explanation, "created_at": str(sig.created_at)
    } for sig in rows]

# ==========================================
# 8b. RASIO CFO & NERACA (ACCRUAL-LITE)
# ==========================================
@app.get("/api/v1/balance-sheet")
def get_balance_sheet(as_of: Optional[date] = Query(None),
                      org_id=Depends(get_current_org), db=Depends(get_db)):
    """Neraca terakhir pada/sebelum tanggal as_of.

    Jika snapshot belum ada, endpoint tetap 200 dengan status `unavailable`
    dan alasan eksplisit. Tidak ada angka nol yang dibuat-buat.
    """
    tanggal = as_of or date.today()
    return ratio_service.balance_sheet(db, org_id, tanggal)

@app.get("/api/v1/ratios")
def get_ratios(date_from: date = Query(alias="from"), date_to: date = Query(alias="to"),
               as_of: Optional[date] = Query(None),
               org_id=Depends(get_current_org), db=Depends(get_db)):
    if date_from > date_to:
        raise HTTPException(422, "Tanggal awal tidak boleh setelah tanggal akhir")
    if as_of is not None and as_of < date_from:
        raise HTTPException(422, "Tanggal snapshot tidak boleh sebelum periode")
    profile = db.query(models.BusinessProfile).filter_by(organization_id=org_id).first()
    industry = profile.industry if profile else None
    result = ratio_service.compute_ratio_snapshot(
        db, org_id, date_from, date_to, as_of=as_of, industry=industry, persist=True
    )
    db.commit()
    return result

@app.get("/api/v1/ratios/thresholds")
def get_ratio_thresholds(org_id=Depends(get_current_org), db=Depends(get_db)):
    profile = db.query(models.BusinessProfile).filter_by(organization_id=org_id).first()
    industry = profile.industry if profile else None
    return {
        "industry": industry,
        "thresholds": ratio_service.threshold_list(db, org_id, industry),
        "note": "Threshold dapat di-override per organisasi. Nilai persen disimpan sebagai desimal (0.30 = 30%).",
    }

@app.patch("/api/v1/ratios/thresholds/{ratio_code}")
def update_ratio_threshold(ratio_code: str, p: schemas.RatioThresholdUpdate,
                           user=Depends(get_current_user),
                           org_id=Depends(get_current_org), db=Depends(get_db)):
    if ratio_code not in RATIO_META:
        raise HTTPException(404, "Kode rasio tidak dikenal")
    require_org_role(db, org_id, user)

    if p.direction == "higher":
        if not (p.critical <= p.warning <= p.target):
            raise HTTPException(422, "Untuk arah higher, urutan harus critical <= warning <= target")
    else:
        if not (p.target <= p.warning <= p.critical):
            raise HTTPException(422, "Untuk arah lower, urutan harus target <= warning <= critical")

    profile = db.query(models.BusinessProfile).filter_by(organization_id=org_id).first()
    industry = profile.industry if profile else None
    row = (db.query(models.RatioThreshold)
           .filter_by(organization_id=org_id, ratio_code=ratio_code, industry=industry)
           .first())
    if row is None:
        row = models.RatioThreshold(
            organization_id=org_id, ratio_code=ratio_code, industry=industry
        )
        db.add(row)
    row.target = p.target
    row.warning = p.warning
    row.critical = p.critical
    row.direction = p.direction
    row.is_active = True
    log_audit(db, org_id, user.id, "RATIO_THRESHOLD_UPDATED", "ratio_thresholds", row.id,
              {"ratio_code": ratio_code})
    db.commit(); db.refresh(row)
    return {
        "ratio_code": row.ratio_code,
        "target": str(row.target),
        "warning": str(row.warning),
        "critical": str(row.critical),
        "direction": row.direction,
        "industry": row.industry,
    }

@app.post("/api/v1/ratios/{ratio_code}/explain")
def explain_ratio(ratio_code: str,
                  date_from: date = Query(alias="from"),
                  date_to: date = Query(alias="to"),
                  as_of: Optional[date] = Query(None),
                  org_id=Depends(get_current_org), db=Depends(get_db)):
    if ratio_code not in RATIO_META:
        raise HTTPException(404, "Kode rasio tidak dikenal")
    if date_from > date_to:
        raise HTTPException(422, "Tanggal awal tidak boleh setelah tanggal akhir")
    if as_of is not None and as_of < date_from:
        raise HTTPException(422, "Tanggal snapshot tidak boleh sebelum periode")

    profile = db.query(models.BusinessProfile).filter_by(organization_id=org_id).first()
    result = ratio_service.compute_ratio_snapshot(
        db, org_id, date_from, date_to, as_of=as_of,
        industry=profile.industry if profile else None, persist=False,
    )
    ratio = next(r for r in result["ratios"] if r["code"] == ratio_code)
    direction = ratio["threshold"]["direction"] if ratio.get("threshold") else "higher"
    narrative = ratio_narrative.explain_ratio(
        ratio_code, ratio["band"], ratio["quality"], direction,
        ratio.get("reason", ""),
    )
    return {
        "ratio_code": ratio_code,
        "ratio_name": ratio["name"],
        "period": result["period"],
        "as_of": result["as_of"],
        "band": ratio["band"],
        "quality": ratio["quality"],
        "status": ratio["status"],
        "value": ratio["value"],
        "display": ratio["display"],
        **narrative,
    }


# ==========================================
# 9. DATA INTAKE: BALANCE SHEET, PERIODS, MASTER DATA
# ==========================================

def _decimal(value) -> Decimal:
    if value is None:
        return Decimal("0")
    return Decimal(str(value))


def _period_for_date(db, org_id: int, as_of: date):
    return (
        db.query(models.AccountingPeriod)
        .filter(
            models.AccountingPeriod.organization_id == org_id,
            models.AccountingPeriod.period_from <= as_of,
            models.AccountingPeriod.period_to >= as_of,
        )
        .order_by(models.AccountingPeriod.period_from.desc())
        .first()
    )


def _validate_snapshot_lines(db, org_id: int, lines):
    ids = [line.account_id for line in lines]
    if len(ids) != len(set(ids)):
        raise HTTPException(422, "Akun duplikat dalam satu snapshot")
    accounts = (
        db.query(models.Account)
        .filter(models.Account.organization_id == org_id, models.Account.id.in_(ids))
        .all()
    )
    account_map = {a.id: a for a in accounts}
    missing = sorted(set(ids) - set(account_map))
    if missing:
        raise HTTPException(422, f"Akun tidak ditemukan pada organisasi ini: {missing}")
    return account_map


def _replace_snapshot_lines(db, snapshot_id: int, lines):
    db.query(models.BalanceSnapshotLine).filter_by(snapshot_id=snapshot_id).delete(
        synchronize_session=False
    )
    for line in lines:
        db.add(models.BalanceSnapshotLine(
            snapshot_id=snapshot_id,
            account_id=line.account_id,
            amount=line.amount,
        ))


def _snapshot_payload(db, snapshot: models.BalanceSnapshot):
    rows = ratio_service._snapshot_lines(db, snapshot.id)
    _, totals, _, warnings = ratio_service._aggregate_snapshot(db, snapshot)
    is_balanced = None
    if all(totals.get(k) is not None for k in ("total_assets", "total_liabilities", "total_equity")):
        is_balanced = (
            totals["total_assets"]
            == totals["total_liabilities"] + totals["total_equity"]
        )
    return {
        "id": snapshot.id,
        "as_of_date": str(snapshot.as_of_date),
        "status": snapshot.status,
        "notes": snapshot.notes,
        "period_id": snapshot.period_id,
        "created_by": snapshot.created_by,
        "created_at": str(snapshot.created_at),
        "lines": [
            {
                "account_id": account.id,
                "code": account.code,
                "name": account.name,
                "account_type": account.account_type,
                "account_role": account.account_role,
                "amount": money(line.amount),
            }
            for line, account in rows
        ],
        "totals": {
            key: (money(value) if value is not None else None)
            for key, value in totals.items()
        },
        "is_balanced": is_balanced,
        "warnings": warnings,
    }


def _period_payload(period: models.AccountingPeriod):
    return {
        "id": period.id,
        "period_from": str(period.period_from),
        "period_to": str(period.period_to),
        "status": period.status,
        "closed_by": period.closed_by,
        "closed_at": str(period.closed_at) if period.closed_at else None,
        "created_at": str(period.created_at),
    }


@app.get("/api/v1/balance-sheets")
def list_balance_sheets(
    as_of: Optional[date] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    q = db.query(models.BalanceSnapshot).filter_by(organization_id=org_id)
    if as_of is not None:
        q = q.filter_by(as_of_date=as_of)
    rows = q.order_by(models.BalanceSnapshot.as_of_date.desc()).limit(limit).offset(offset).all()
    return [_snapshot_payload(db, row) for row in rows]


@app.get("/api/v1/balance-sheets/{snapshot_id}")
def get_balance_sheet_snapshot(
    snapshot_id: int,
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    snapshot = db.query(models.BalanceSnapshot).filter_by(
        id=snapshot_id, organization_id=org_id
    ).first()
    if not snapshot:
        raise HTTPException(404, "Balance snapshot tidak ditemukan")
    return _snapshot_payload(db, snapshot)


@app.post("/api/v1/balance-sheets", status_code=201)
def upsert_balance_sheet(
    p: schemas.BalanceSnapshotCreate,
    user=Depends(get_current_user),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    require_org_role(db, org_id, user)
    _validate_snapshot_lines(db, org_id, p.lines)

    period = _period_for_date(db, org_id, p.as_of_date)
    if period and period.status == "closed":
        raise HTTPException(
            409,
            "Periode sudah ditutup. Buka kembali periode sebelum mengubah neraca.",
        )

    snapshot = db.query(models.BalanceSnapshot).filter_by(
        organization_id=org_id, as_of_date=p.as_of_date
    ).first()
    action = "BALANCE_SNAPSHOT_UPDATED"
    if snapshot is None:
        snapshot = models.BalanceSnapshot(
            organization_id=org_id,
            as_of_date=p.as_of_date,
            created_by=user.id,
        )
        db.add(snapshot)
        db.flush()
        action = "BALANCE_SNAPSHOT_CREATED"

    snapshot.status = p.status
    snapshot.notes = p.notes
    snapshot.period_id = period.id if period else None
    _replace_snapshot_lines(db, snapshot.id, p.lines)
    log_audit(
        db, org_id, user.id, action, "balance_snapshots", snapshot.id,
        {"as_of_date": str(p.as_of_date), "status": p.status, "lines": len(p.lines)},
    )
    db.commit()
    db.refresh(snapshot)
    return _snapshot_payload(db, snapshot)


@app.patch("/api/v1/balance-sheets/{snapshot_id}")
def update_balance_sheet(
    snapshot_id: int,
    p: schemas.BalanceSnapshotUpdate,
    user=Depends(get_current_user),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    require_org_role(db, org_id, user)
    snapshot = db.query(models.BalanceSnapshot).filter_by(
        id=snapshot_id, organization_id=org_id
    ).first()
    if not snapshot:
        raise HTTPException(404, "Balance snapshot tidak ditemukan")

    period = _period_for_date(db, org_id, snapshot.as_of_date)
    if period and period.status == "closed":
        raise HTTPException(
            409,
            "Periode sudah ditutup. Buka kembali periode sebelum mengubah neraca.",
        )

    if p.lines is not None:
        if not p.lines:
            raise HTTPException(422, "Snapshot harus memiliki minimal satu baris akun")
        _validate_snapshot_lines(db, org_id, p.lines)
        _replace_snapshot_lines(db, snapshot.id, p.lines)
    if p.status is not None:
        snapshot.status = p.status
    if p.notes is not None:
        snapshot.notes = p.notes
    snapshot.period_id = period.id if period else snapshot.period_id

    log_audit(
        db, org_id, user.id, "BALANCE_SNAPSHOT_UPDATED", "balance_snapshots", snapshot.id,
        {"status": snapshot.status, "lines_changed": p.lines is not None},
    )
    db.commit()
    db.refresh(snapshot)
    return _snapshot_payload(db, snapshot)


@app.get("/api/v1/accounting-periods")
def list_accounting_periods(
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    rows = (
        db.query(models.AccountingPeriod)
        .filter_by(organization_id=org_id)
        .order_by(models.AccountingPeriod.period_from.desc())
        .all()
    )
    return [_period_payload(row) for row in rows]


@app.post("/api/v1/accounting-periods", status_code=201)
def create_accounting_period(
    p: schemas.AccountingPeriodCreate,
    user=Depends(get_current_user),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    require_org_role(db, org_id, user)
    if p.period_from > p.period_to:
        raise HTTPException(422, "Tanggal awal periode tidak boleh setelah tanggal akhir")
    overlap = (
        db.query(models.AccountingPeriod)
        .filter(
            models.AccountingPeriod.organization_id == org_id,
            models.AccountingPeriod.period_from <= p.period_to,
            models.AccountingPeriod.period_to >= p.period_from,
        )
        .first()
    )
    if overlap:
        raise HTTPException(409, "Periode overlap dengan periode yang sudah ada")

    period = models.AccountingPeriod(
        organization_id=org_id,
        period_from=p.period_from,
        period_to=p.period_to,
        status="open",
    )
    db.add(period)
    db.flush()
    log_audit(
        db, org_id, user.id, "ACCOUNTING_PERIOD_CREATED", "accounting_periods", period.id,
        {"period_from": str(p.period_from), "period_to": str(p.period_to)},
    )
    db.commit()
    db.refresh(period)
    return _period_payload(period)


@app.post("/api/v1/accounting-periods/{period_id}/close")
def close_accounting_period(
    period_id: int,
    user=Depends(get_current_user),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    require_org_role(db, org_id, user)
    period = db.query(models.AccountingPeriod).filter_by(
        id=period_id, organization_id=org_id
    ).first()
    if not period:
        raise HTTPException(404, "Periode akuntansi tidak ditemukan")
    if period.status == "closed":
        raise HTTPException(409, "Periode sudah ditutup")

    period.status = "closed"
    period.closed_by = user.id
    period.closed_at = datetime.now(timezone.utc)
    log_audit(
        db, org_id, user.id, "ACCOUNTING_PERIOD_CLOSED", "accounting_periods", period.id,
        {"period_from": str(period.period_from), "period_to": str(period.period_to)},
    )
    db.commit()
    db.refresh(period)
    return _period_payload(period)


@app.post("/api/v1/accounting-periods/{period_id}/reopen")
def reopen_accounting_period(
    period_id: int,
    user=Depends(get_current_user),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    require_org_role(db, org_id, user)
    period = db.query(models.AccountingPeriod).filter_by(
        id=period_id, organization_id=org_id
    ).first()
    if not period:
        raise HTTPException(404, "Periode akuntansi tidak ditemukan")
    if period.status != "closed":
        raise HTTPException(409, "Periode belum ditutup")

    period.status = "open"
    period.closed_by = None
    period.closed_at = None
    log_audit(
        db, org_id, user.id, "ACCOUNTING_PERIOD_REOPENED", "accounting_periods", period.id,
        {"period_from": str(period.period_from), "period_to": str(period.period_to)},
    )
    db.commit()
    db.refresh(period)
    return _period_payload(period)


# ---------- Receivables ----------

def _derive_ar_status(current: str, amount: Decimal, paid: Decimal) -> str:
    if current == "written_off":
        return current
    if paid >= amount:
        return "paid"
    if paid > 0:
        return "partial"
    return "overdue" if current == "overdue" else "open"


def _receivable_payload(row: models.Receivable):
    amount = _decimal(row.amount)
    paid = _decimal(row.paid_amount)
    return {
        "id": row.id,
        "customer_name": row.customer_name,
        "invoice_number": row.invoice_number,
        "invoice_date": str(row.invoice_date),
        "due_date": str(row.due_date),
        "amount": money(amount),
        "paid_amount": money(paid),
        "outstanding_amount": money(amount - paid),
        "status": row.status,
        "days_overdue": max(0, (date.today() - row.due_date).days),
        "created_at": str(row.created_at),
    }


@app.get("/api/v1/receivables")
def list_receivables(
    status: Optional[str] = Query(None),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    q = db.query(models.Receivable).filter_by(organization_id=org_id)
    if status:
        q = q.filter_by(status=status)
    rows = q.order_by(models.Receivable.due_date.asc()).all()
    return [_receivable_payload(row) for row in rows]


@app.post("/api/v1/receivables", status_code=201)
def create_receivable(
    p: schemas.ReceivableCreate,
    user=Depends(get_current_user),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    require_org_role(db, org_id, user)
    if p.due_date < p.invoice_date:
        raise HTTPException(422, "Jatuh tempo tidak boleh sebelum tanggal invoice")
    if p.paid_amount > p.amount:
        raise HTTPException(422, "Jumlah dibayar tidak boleh melebihi nilai piutang")

    row = models.Receivable(
        organization_id=org_id,
        customer_name=p.customer_name.strip(),
        invoice_number=p.invoice_number,
        invoice_date=p.invoice_date,
        due_date=p.due_date,
        amount=p.amount,
        paid_amount=p.paid_amount,
        status=_derive_ar_status(p.status, p.amount, p.paid_amount),
    )
    db.add(row)
    db.flush()
    log_audit(
        db, org_id, user.id, "RECEIVABLE_CREATED", "receivables", row.id,
        {"customer_name": row.customer_name, "amount": money(p.amount)},
    )
    db.commit()
    db.refresh(row)
    return _receivable_payload(row)


@app.patch("/api/v1/receivables/{receivable_id}")
def update_receivable(
    receivable_id: int,
    p: schemas.ReceivableUpdate,
    user=Depends(get_current_user),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    require_org_role(db, org_id, user)
    row = db.query(models.Receivable).filter_by(
        id=receivable_id, organization_id=org_id
    ).first()
    if not row:
        raise HTTPException(404, "Piutang tidak ditemukan")

    data = p.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(row, key, value)
    if row.due_date < row.invoice_date:
        raise HTTPException(422, "Jatuh tempo tidak boleh sebelum tanggal invoice")
    if _decimal(row.paid_amount) > _decimal(row.amount):
        raise HTTPException(422, "Jumlah dibayar tidak boleh melebihi nilai piutang")
    row.status = _derive_ar_status(row.status, _decimal(row.amount), _decimal(row.paid_amount))

    log_audit(
        db, org_id, user.id, "RECEIVABLE_UPDATED", "receivables", row.id,
        {"status": row.status},
    )
    db.commit()
    db.refresh(row)
    return _receivable_payload(row)


# ---------- Payables ----------

def _derive_ap_status(current: str, amount: Decimal, paid: Decimal) -> str:
    if paid >= amount:
        return "paid"
    if paid > 0:
        return "partial"
    return "overdue" if current == "overdue" else "open"


def _payable_payload(row: models.Payable):
    amount = _decimal(row.amount)
    paid = _decimal(row.paid_amount)
    return {
        "id": row.id,
        "supplier_name": row.supplier_name,
        "bill_number": row.bill_number,
        "bill_date": str(row.bill_date),
        "due_date": str(row.due_date),
        "amount": money(amount),
        "paid_amount": money(paid),
        "outstanding_amount": money(amount - paid),
        "status": row.status,
        "days_overdue": max(0, (date.today() - row.due_date).days),
        "created_at": str(row.created_at),
    }


@app.get("/api/v1/payables")
def list_payables(
    status: Optional[str] = Query(None),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    q = db.query(models.Payable).filter_by(organization_id=org_id)
    if status:
        q = q.filter_by(status=status)
    rows = q.order_by(models.Payable.due_date.asc()).all()
    return [_payable_payload(row) for row in rows]


@app.post("/api/v1/payables", status_code=201)
def create_payable(
    p: schemas.PayableCreate,
    user=Depends(get_current_user),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    require_org_role(db, org_id, user)
    if p.due_date < p.bill_date:
        raise HTTPException(422, "Jatuh tempo tidak boleh sebelum tanggal tagihan")
    if p.paid_amount > p.amount:
        raise HTTPException(422, "Jumlah dibayar tidak boleh melebihi nilai utang")

    row = models.Payable(
        organization_id=org_id,
        supplier_name=p.supplier_name.strip(),
        bill_number=p.bill_number,
        bill_date=p.bill_date,
        due_date=p.due_date,
        amount=p.amount,
        paid_amount=p.paid_amount,
        status=_derive_ap_status(p.status, p.amount, p.paid_amount),
    )
    db.add(row)
    db.flush()
    log_audit(
        db, org_id, user.id, "PAYABLE_CREATED", "payables", row.id,
        {"supplier_name": row.supplier_name, "amount": money(p.amount)},
    )
    db.commit()
    db.refresh(row)
    return _payable_payload(row)


@app.patch("/api/v1/payables/{payable_id}")
def update_payable(
    payable_id: int,
    p: schemas.PayableUpdate,
    user=Depends(get_current_user),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    require_org_role(db, org_id, user)
    row = db.query(models.Payable).filter_by(
        id=payable_id, organization_id=org_id
    ).first()
    if not row:
        raise HTTPException(404, "Utang tidak ditemukan")

    for key, value in p.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    if row.due_date < row.bill_date:
        raise HTTPException(422, "Jatuh tempo tidak boleh sebelum tanggal tagihan")
    if _decimal(row.paid_amount) > _decimal(row.amount):
        raise HTTPException(422, "Jumlah dibayar tidak boleh melebihi nilai utang")
    row.status = _derive_ap_status(row.status, _decimal(row.amount), _decimal(row.paid_amount))

    log_audit(
        db, org_id, user.id, "PAYABLE_UPDATED", "payables", row.id,
        {"status": row.status},
    )
    db.commit()
    db.refresh(row)
    return _payable_payload(row)


# ---------- Inventory ----------

def _inventory_payload(row: models.InventoryItem):
    qty = _decimal(row.quantity_on_hand)
    reorder = _decimal(row.reorder_point) if row.reorder_point is not None else None
    return {
        "id": row.id,
        "sku": row.sku,
        "name": row.name,
        "unit": row.unit,
        "cost_price": money(row.cost_price),
        "quantity_on_hand": str(qty),
        "reorder_point": str(reorder) if reorder is not None else None,
        "is_low_stock": reorder is not None and qty <= reorder,
        "is_active": row.is_active,
        "created_at": str(row.created_at),
    }


@app.get("/api/v1/inventory-items")
def list_inventory_items(
    include_inactive: bool = Query(False),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    q = db.query(models.InventoryItem).filter_by(organization_id=org_id)
    if not include_inactive:
        q = q.filter_by(is_active=True)
    rows = q.order_by(models.InventoryItem.sku.asc()).all()
    return [_inventory_payload(row) for row in rows]


@app.post("/api/v1/inventory-items", status_code=201)
def create_inventory_item(
    p: schemas.InventoryItemCreate,
    user=Depends(get_current_user),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    require_org_role(db, org_id, user)
    if db.query(models.InventoryItem).filter_by(
        organization_id=org_id, sku=p.sku.strip()
    ).first():
        raise HTTPException(409, f"SKU '{p.sku}' sudah ada")
    row = models.InventoryItem(
        organization_id=org_id,
        sku=p.sku.strip(),
        name=p.name.strip(),
        unit=p.unit.strip(),
        cost_price=p.cost_price,
        quantity_on_hand=p.quantity_on_hand,
        reorder_point=p.reorder_point,
        is_active=p.is_active,
    )
    db.add(row)
    db.flush()
    log_audit(
        db, org_id, user.id, "INVENTORY_ITEM_CREATED", "inventory_items", row.id,
        {"sku": row.sku, "name": row.name},
    )
    db.commit()
    db.refresh(row)
    return _inventory_payload(row)


@app.patch("/api/v1/inventory-items/{item_id}")
def update_inventory_item(
    item_id: int,
    p: schemas.InventoryItemUpdate,
    user=Depends(get_current_user),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    require_org_role(db, org_id, user)
    row = db.query(models.InventoryItem).filter_by(
        id=item_id, organization_id=org_id
    ).first()
    if not row:
        raise HTTPException(404, "Item persediaan tidak ditemukan")
    for key, value in p.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    log_audit(
        db, org_id, user.id, "INVENTORY_ITEM_UPDATED", "inventory_items", row.id,
        {"sku": row.sku},
    )
    db.commit()
    db.refresh(row)
    return _inventory_payload(row)


@app.get("/api/v1/inventory-items/{item_id}/movements")
def list_inventory_movements(
    item_id: int,
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    item = db.query(models.InventoryItem).filter_by(
        id=item_id, organization_id=org_id
    ).first()
    if not item:
        raise HTTPException(404, "Item persediaan tidak ditemukan")
    rows = (
        db.query(models.InventoryMovement)
        .filter_by(organization_id=org_id, item_id=item_id)
        .order_by(models.InventoryMovement.movement_date.desc(), models.InventoryMovement.id.desc())
        .all()
    )
    return [
        {
            "id": row.id,
            "movement_date": str(row.movement_date),
            "movement_type": row.movement_type,
            "quantity": str(_decimal(row.quantity)),
            "unit_cost": money(row.unit_cost),
            "reference": row.reference,
            "created_at": str(row.created_at),
        }
        for row in rows
    ]


@app.post("/api/v1/inventory-items/{item_id}/movements", status_code=201)
def create_inventory_movement(
    item_id: int,
    p: schemas.InventoryMovementCreate,
    user=Depends(get_current_user),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    require_org_role(db, org_id, user)
    item = db.query(models.InventoryItem).filter_by(
        id=item_id, organization_id=org_id
    ).first()
    if not item:
        raise HTTPException(404, "Item persediaan tidak ditemukan")

    qty = _decimal(p.quantity)
    if p.movement_type in ("in", "out") and qty <= 0:
        raise HTTPException(422, "Jumlah mutasi masuk/keluar harus lebih dari 0")
    if p.movement_type == "adjustment" and qty == 0:
        raise HTTPException(422, "Jumlah adjustment tidak boleh 0")

    current = _decimal(item.quantity_on_hand)
    if p.movement_type == "in":
        new_qty = current + qty
    elif p.movement_type == "out":
        new_qty = current - qty
    else:
        new_qty = current + qty
    if new_qty < 0:
        raise HTTPException(422, "Stok tidak boleh negatif")

    item.quantity_on_hand = new_qty
    movement = models.InventoryMovement(
        organization_id=org_id,
        item_id=item.id,
        movement_date=p.movement_date,
        movement_type=p.movement_type,
        quantity=qty,
        unit_cost=p.unit_cost,
        reference=p.reference,
    )
    db.add(movement)
    db.flush()
    log_audit(
        db, org_id, user.id, "INVENTORY_MOVEMENT_CREATED", "inventory_movements", movement.id,
        {"item_id": item.id, "type": p.movement_type, "quantity": str(qty)},
    )
    db.commit()
    db.refresh(movement)
    db.refresh(item)
    return {
        "movement_id": movement.id,
        "item": _inventory_payload(item),
    }


# ---------- Fixed assets ----------

def _fixed_asset_payload(row: models.FixedAsset):
    cost = _decimal(row.acquisition_cost)
    accumulated = _decimal(row.accumulated_depreciation)
    salvage = _decimal(row.salvage_value)
    return {
        "id": row.id,
        "name": row.name,
        "asset_category": row.asset_category,
        "acquisition_date": str(row.acquisition_date),
        "acquisition_cost": money(cost),
        "accumulated_depreciation": money(accumulated),
        "book_value": money(cost - accumulated),
        "useful_life_months": row.useful_life_months,
        "salvage_value": money(salvage),
        "status": row.status,
        "created_at": str(row.created_at),
    }


def _validate_fixed_asset(cost: Decimal, accumulated: Decimal, salvage: Decimal):
    if salvage > cost:
        raise HTTPException(422, "Nilai residu tidak boleh melebihi harga perolehan")
    if accumulated < 0 or accumulated > cost - salvage:
        raise HTTPException(422, "Akumulasi penyusutan melebihi nilai yang dapat disusutkan")


@app.get("/api/v1/fixed-assets")
def list_fixed_assets(
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    rows = (
        db.query(models.FixedAsset)
        .filter_by(organization_id=org_id)
        .order_by(models.FixedAsset.acquisition_date.desc())
        .all()
    )
    return [_fixed_asset_payload(row) for row in rows]


@app.post("/api/v1/fixed-assets", status_code=201)
def create_fixed_asset(
    p: schemas.FixedAssetCreate,
    user=Depends(get_current_user),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    require_org_role(db, org_id, user)
    _validate_fixed_asset(p.acquisition_cost, p.accumulated_depreciation, p.salvage_value)
    row = models.FixedAsset(organization_id=org_id, **p.model_dump())
    db.add(row)
    db.flush()
    log_audit(
        db, org_id, user.id, "FIXED_ASSET_CREATED", "fixed_assets", row.id,
        {"name": row.name, "acquisition_cost": money(p.acquisition_cost)},
    )
    db.commit()
    db.refresh(row)
    return _fixed_asset_payload(row)


@app.patch("/api/v1/fixed-assets/{asset_id}")
def update_fixed_asset(
    asset_id: int,
    p: schemas.FixedAssetUpdate,
    user=Depends(get_current_user),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    require_org_role(db, org_id, user)
    row = db.query(models.FixedAsset).filter_by(
        id=asset_id, organization_id=org_id
    ).first()
    if not row:
        raise HTTPException(404, "Aset tetap tidak ditemukan")
    for key, value in p.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    _validate_fixed_asset(
        _decimal(row.acquisition_cost),
        _decimal(row.accumulated_depreciation),
        _decimal(row.salvage_value),
    )
    log_audit(
        db, org_id, user.id, "FIXED_ASSET_UPDATED", "fixed_assets", row.id,
        {"name": row.name},
    )
    db.commit()
    db.refresh(row)
    return _fixed_asset_payload(row)


# ---------- Loans ----------

def _loan_payload(row: models.Loan):
    return {
        "id": row.id,
        "lender": row.lender,
        "loan_type": row.loan_type,
        "principal": money(row.principal),
        "interest_rate": str(_decimal(row.interest_rate)),
        "term_months": row.term_months,
        "start_date": str(row.start_date),
        "outstanding_principal": money(row.outstanding_principal),
        "monthly_installment": (
            money(row.monthly_installment) if row.monthly_installment is not None else None
        ),
        "status": row.status,
        "created_at": str(row.created_at),
    }


def _validate_loan(principal: Decimal, outstanding: Decimal):
    if outstanding > principal:
        raise HTTPException(422, "Saldo pokok tidak boleh melebihi pokok pinjaman")


@app.get("/api/v1/loans")
def list_loans(
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    rows = (
        db.query(models.Loan)
        .filter_by(organization_id=org_id)
        .order_by(models.Loan.start_date.desc())
        .all()
    )
    return [_loan_payload(row) for row in rows]


@app.post("/api/v1/loans", status_code=201)
def create_loan(
    p: schemas.LoanCreate,
    user=Depends(get_current_user),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    require_org_role(db, org_id, user)
    _validate_loan(p.principal, p.outstanding_principal)
    row = models.Loan(organization_id=org_id, **p.model_dump())
    db.add(row)
    db.flush()
    log_audit(
        db, org_id, user.id, "LOAN_CREATED", "loans", row.id,
        {"lender": row.lender, "principal": money(p.principal)},
    )
    db.commit()
    db.refresh(row)
    return _loan_payload(row)


@app.patch("/api/v1/loans/{loan_id}")
def update_loan(
    loan_id: int,
    p: schemas.LoanUpdate,
    user=Depends(get_current_user),
    org_id=Depends(get_current_org),
    db=Depends(get_db),
):
    require_org_role(db, org_id, user)
    row = db.query(models.Loan).filter_by(
        id=loan_id, organization_id=org_id
    ).first()
    if not row:
        raise HTTPException(404, "Pinjaman tidak ditemukan")
    for key, value in p.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    _validate_loan(_decimal(row.principal), _decimal(row.outstanding_principal))
    log_audit(
        db, org_id, user.id, "LOAN_UPDATED", "loans", row.id,
        {"lender": row.lender},
    )
    db.commit()
    db.refresh(row)
    return _loan_payload(row)


# ==========================================
# 10. FORECASTS (P2 / CASH FLOW FORECAST)
# ==========================================
@app.post("/api/v1/forecasts/cash-flow", status_code=201)
def create_forecast(p: schemas.ForecastCreate, user=Depends(get_current_user),
                    org_id=Depends(get_current_org), db=Depends(get_db)):
    txs = db.query(models.Transaction).filter_by(organization_id=org_id, status="posted").all()
    fc_res = calculate_cash_flow_forecast(txs, horizon=p.horizon, period_unit=p.period_unit)

    start_date = txs[0].transaction_date if txs else date.today()
    end_date = txs[-1].transaction_date if txs else date.today()

    run = models.ForecastRun(
        organization_id=org_id,
        target=p.target,
        horizon=p.horizon,
        period_unit=p.period_unit,
        model_version=fc_res["model_version"],
        baseline_model=fc_res["baseline_model"],
        training_window_from=start_date,
        training_window_to=end_date,
        evaluation_metrics=fc_res["evaluation"],
        predictions=fc_res["predictions"],
        status=fc_res["status"]
    )
    db.add(run)
    log_audit(db, org_id, user.id, "FORECAST_GENERATED", "forecast_runs", None, {"target": p.target, "horizon": p.horizon})
    db.commit()
    db.refresh(run)

    fc_res["id"] = run.id
    return fc_res

@app.get("/api/v1/forecasts")
def list_forecasts(org_id=Depends(get_current_org), db=Depends(get_db)):
    runs = db.query(models.ForecastRun).filter_by(organization_id=org_id).order_by(models.ForecastRun.id.desc()).all()
    return [{
        "id": r.id, "target": r.target, "horizon": r.horizon,
        "model_version": r.model_version, "status": r.status,
        "evaluation": r.evaluation_metrics, "predictions": r.predictions,
        "created_at": str(r.created_at)
    } for r in runs]

@app.get("/api/v1/forecasts/backtests")
def list_forecast_backtests(limit: int = 20, org_id=Depends(get_current_org), db=Depends(get_db)):
    """Daftar hasil backtest yang pernah dijalankan untuk organisasi ini."""
    rows = db.query(models.ForecastBacktest).filter_by(
        organization_id=org_id
    ).order_by(models.ForecastBacktest.id.desc()).limit(limit).all()
    return [{
        "id": r.id,
        "model_version": r.model_version,
        "horizon": r.horizon,
        "period_unit": r.period_unit,
        "data_points": r.data_points,
        "gate_passed": r.gate_passed,
        "gate_reason": r.gate_reason,
        "status": r.status,
        "aggregate_metrics": r.aggregate_metrics,
        "baseline_metrics": r.baseline_metrics,
        "created_at": str(r.created_at)
    } for r in rows]

@app.get("/api/v1/forecasts/backtests/{backtest_id}")
def get_forecast_backtest(backtest_id: int, org_id=Depends(get_current_org), db=Depends(get_db)):
    """Detail lengkap hasil backtest termasuk semua fold."""
    r = db.query(models.ForecastBacktest).filter_by(
        id=backtest_id, organization_id=org_id
    ).first()
    if not r:
        raise HTTPException(404, "Backtest tidak ditemukan")
    return {
        "id": r.id,
        "model_version": r.model_version,
        "horizon": r.horizon,
        "period_unit": r.period_unit,
        "data_points": r.data_points,
        "training_window": {
            "from": str(r.training_window_from) if r.training_window_from else None,
            "to": str(r.training_window_to) if r.training_window_to else None,
        },
        "gate_passed": r.gate_passed,
        "gate_reason": r.gate_reason,
        "status": r.status,
        "aggregate_metrics": r.aggregate_metrics,
        "baseline_metrics": r.baseline_metrics,
        "folds": r.folds_summary,
        "created_at": str(r.created_at)
    }

@app.get("/api/v1/forecasts/{forecast_id}")
def get_forecast(forecast_id: int, org_id=Depends(get_current_org), db=Depends(get_db)):
    r = db.query(models.ForecastRun).filter_by(id=forecast_id, organization_id=org_id).first()
    if not r:
        raise HTTPException(404, "Forecast tidak ditemukan")
    return {
        "id": r.id, "target": r.target, "horizon": r.horizon, "period_unit": r.period_unit,
        "model_version": r.model_version, "baseline_model": r.baseline_model,
        "status": r.status, "evaluation": r.evaluation_metrics, "predictions": r.predictions,
        "created_at": str(r.created_at)
    }

# ==========================================
# 9b. FORECAST BACKTEST (walk-forward validation)
# ==========================================
@app.post("/api/v1/forecasts/backtest", status_code=201)
def run_forecast_backtest(p: schemas.ForecastBacktestCreate, user=Depends(get_current_user),
                          org_id=Depends(get_current_org), db=Depends(get_db)):
    """
    Jalankan walk-forward backtest pada data historis transaksi.

    - Memvalidasi apakah model Moving Average layak digunakan untuk forecast.
    - Metrik: MAE, WAPE, sMAPE, Bias, MASE.
    - Gate check: model harus beat naive baseline; bias harus acceptable.
    - Hasil disimpan ke tabel forecast_backtests untuk audit trail.
    - Sesuai FINANCIAL_AI_METHODOLOGY.md Â§7: gunakan rolling-origin, bukan random shuffle.
    """
    txs = db.query(models.Transaction).filter_by(
        organization_id=org_id, status="posted"
    ).order_by(models.Transaction.transaction_date).all()

    result = run_walk_forward_backtest(
        txs,
        horizon=p.horizon,
        period_unit=p.period_unit,
        min_train_periods=p.min_train_periods
    )

    # Parsing training window dari result
    tw = result.get("training_window", {})
    tw_from = None
    tw_to = None
    if tw.get("from"):
        from datetime import datetime as dt
        tw_from = dt.strptime(tw["from"], "%Y-%m").date()
    if tw.get("to"):
        from datetime import datetime as dt
        tw_to = dt.strptime(tw["to"], "%Y-%m").date()

    record = models.ForecastBacktest(
        organization_id=org_id,
        model_version=result["model_version"],
        period_unit=p.period_unit,
        horizon=p.horizon,
        data_points=result["data_points"],
        training_window_from=tw_from,
        training_window_to=tw_to,
        aggregate_metrics=result.get("aggregate_metrics"),
        baseline_metrics=result.get("baseline_metrics"),
        gate_passed=result["gate_passed"],
        gate_reason=result["gate_reason"],
        status=result["status"],
        folds_summary=result.get("folds")
    )
    db.add(record)
    log_audit(db, org_id, user.id, "FORECAST_BACKTEST_RUN", "forecast_backtests", None,
              {"horizon": p.horizon, "gate_passed": result["gate_passed"], "status": result["status"]})
    db.commit()
    db.refresh(record)

    result["id"] = record.id
    return result

# ==========================================
# 10. RECOMMENDATIONS
# ==========================================
@app.get("/api/v1/recommendations")
def recommendations(date_from: date = Query(alias="from"), date_to: date = Query(alias="to"),
                    limit: int = Query(50, le=200), offset: int = 0,
                    org_id=Depends(get_current_org), db=Depends(get_db)):
    rows = db.query(models.Transaction).filter(
        models.Transaction.organization_id == org_id,
        models.Transaction.transaction_date >= date_from,
        models.Transaction.transaction_date <= date_to).all()
    res = generate_recommendations(rows, date_from, date_to)
    # Persist recommendations to table if not existing
    for rec in res["recommendations"]:
        exists = db.query(models.Recommendation).filter_by(organization_id=org_id, rule_id=rec["rule_id"], title=rec["title"]).first()
        if not exists:
            db.add(models.Recommendation(
                organization_id=org_id,
                rule_id=rec["rule_id"],
                rule_version=rec["rule_version"],
                title=rec["title"],
                priority=rec["priority"],
                trigger_metrics=rec["trigger_metrics"],
                evidence=rec["evidence"],
                suggested_actions=rec["suggested_actions"],
                assumptions=rec["assumptions"],
                limitations=rec["limitations"],
                status=rec["status"]
            ))
    db.commit()
    # Read persisted recommendations with their IDs, using limit/offset
    db_recs = (db.query(models.Recommendation)
               .filter_by(organization_id=org_id)
               .order_by(models.Recommendation.id.desc())
               .limit(limit).offset(offset).all())
    res["recommendations"] = [{
        "id": str(r.id), "rule_id": r.rule_id, "rule_version": r.rule_version,
        "title": r.title, "priority": r.priority, "trigger_metrics": r.trigger_metrics,
        "evidence": r.evidence, "suggested_actions": r.suggested_actions,
        "assumptions": r.assumptions, "limitations": r.limitations,
        "status": r.status, "user_feedback": r.user_feedback, "created_at": str(r.created_at)
    } for r in db_recs]
    return res

@app.patch("/api/v1/recommendations/{rec_id}")
def update_recommendation(rec_id: int, p: schemas.RecommendationUpdate, user=Depends(get_current_user),
                          org_id=Depends(get_current_org), db=Depends(get_db)):
    r = db.query(models.Recommendation).filter_by(id=rec_id, organization_id=org_id).first()
    if not r:
        raise HTTPException(404, "Rekomendasi tidak ditemukan")
    r.status = p.status
    if p.user_feedback is not None:
        r.user_feedback = p.user_feedback
    log_audit(db, org_id, user.id, "RECOMMENDATION_FEEDBACK", "recommendations", r.id, {"status": p.status})
    db.commit(); db.refresh(r)
    return {"id": r.id, "status": r.status, "user_feedback": r.user_feedback}

@app.post("/api/v1/recommendations/{rec_id}/explain")
def explain_recommendation(rec_id: int, user=Depends(get_current_user),
                           org_id=Depends(get_current_org), db=Depends(get_db)):
    """
    Hasilkan penjelasan naratif untuk satu rekomendasi menggunakan LLM adapter.

    - Jika OPENAI_API_KEY dikonfigurasi dan output lolos validasi â†’ source: "llm"
    - Jika tidak ada API key, LLM gagal, atau output tidak valid â†’ source: "fallback"
    - Tidak ada angka absolut atau PII yang dikirim ke LLM (privacy guard).
    - Penjelasan bersifat informatif; bukan saran keuangan, pajak, atau hukum.
    """
    r = db.query(models.Recommendation).filter_by(id=rec_id, organization_id=org_id).first()
    if not r:
        raise HTTPException(404, "Rekomendasi tidak ditemukan")

    rec_payload = {
        "rule_id": r.rule_id,
        "priority": r.priority,
        "trigger_metrics": r.trigger_metrics,
        "evidence": r.evidence,
        "suggested_actions": r.suggested_actions,
    }

    result = generate_explanation(rec_payload)

    log_audit(db, org_id, user.id, "RECOMMENDATION_EXPLAINED", "recommendations", r.id,
              {"source": result["source"], "llm_enabled": result["llm_enabled"]})
    db.commit()

    return {
        "recommendation_id": rec_id,
        "rule_id": r.rule_id,
        "title": r.title,
        "explanation": result["explanation"],
        "source": result["source"],
        "llm_enabled": result["llm_enabled"],
        "privacy_note": result["privacy_note"],
        "disclaimer": (
            "Penjelasan ini dihasilkan secara otomatis dan bersifat informatif. "
            "Bukan merupakan saran keuangan, pajak, investasi, atau hukum."
        )
    }

# ==========================================
# 11. IMPORT CSV BATCHES & ROWS
# ==========================================
@app.get("/api/v1/imports/batches")
def list_import_batches(org_id=Depends(get_current_org), db=Depends(get_db)):
    batches = db.query(models.ImportBatch).filter_by(organization_id=org_id).order_by(models.ImportBatch.id.desc()).all()
    return [{
        "id": b.id, "filename": b.filename, "source": b.source, "status": b.status,
        "total_rows": b.total_rows, "valid_rows": b.valid_rows,
        "duplicate_rows": b.duplicate_rows, "error_rows": b.error_rows,
        "created_at": str(b.created_at)
    } for b in batches]

@app.get("/api/v1/imports/batches/{batch_id}")
def get_import_batch(batch_id: int, org_id=Depends(get_current_org), db=Depends(get_db)):
    b = db.query(models.ImportBatch).filter_by(id=batch_id, organization_id=org_id).first()
    if not b:
        raise HTTPException(404, "Import batch tidak ditemukan")
    rows = db.query(models.ImportRow).filter_by(import_batch_id=b.id).limit(200).all()
    return {
        "id": b.id, "filename": b.filename, "status": b.status,
        "total_rows": b.total_rows, "valid_rows": b.valid_rows,
        "duplicate_rows": b.duplicate_rows, "error_rows": b.error_rows,
        "rows": [{
            "row_index": r.row_index, "status": r.status, "is_duplicate": r.is_duplicate,
            "parsed_data": r.parsed_data, "error_message": r.error_message
        } for r in rows]
    }

@app.post("/api/v1/imports/transactions/preview")
async def preview_csv_import(file: UploadFile = File(...), user=Depends(get_current_user),
                             org_id=Depends(get_current_org), db=Depends(get_db)):
    require_org_role(db, org_id, user)
    filename = file.filename or ""
    if not filename.lower().endswith(".csv"):
        raise HTTPException(400, "File harus berformat CSV")

    max_bytes = 5 * 1024 * 1024
    contents = await file.read(max_bytes + 1)
    if len(contents) > max_bytes:
        raise HTTPException(413, "File CSV maksimal 5 MB")
    if not contents:
        raise HTTPException(422, "File CSV kosong")

    try:
        text = contents.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = contents.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    fieldnames = [f.strip().lower() for f in (reader.fieldnames or [])]
    required_cols = {"transaction_date", "description", "amount", "type"}
    if not required_cols.issubset(set(fieldnames)):
        raise HTTPException(422, f"Header CSV tidak lengkap. Wajib memiliki: {', '.join(sorted(required_cols))}")

    categories = db.query(models.Category).filter_by(organization_id=org_id).all()
    cat_map = {(c.name.lower(), c.tx_type): c.id for c in categories}

    existing_txs = db.query(
        models.Transaction.transaction_date,
        models.Transaction.description,
        models.Transaction.amount,
        models.Transaction.tx_type,
    ).filter_by(organization_id=org_id, status="posted").all()
    existing_set = {
        (str(t[0]), str(t[1]).strip().lower(), money(t[2]), t[3])
        for t in existing_txs
    }

    parsed_rows = []
    error_rows = []
    errors = []
    duplicates_count = 0
    valid_types = {"income", "expense", "transfer", "owner_contribution", "owner_draw", "loan_received", "loan_repayment", "refund"}

    def add_error(idx, row_clean, field, message):
        item = {"row": idx, "field": field, "message": message}
        errors.append(item)
        error_rows.append({
            "row_index": idx,
            "raw_data": row_clean,
            "error_message": f"{field}: {message}",
        })

    for idx, row in enumerate(reader, start=1):
        row_clean = {
            k.strip().lower(): (v.strip() if isinstance(v, str) else (v or ""))
            for k, v in row.items()
            if k is not None
        }
        date_str = row_clean.get("transaction_date", "")
        desc = row_clean.get("description", "")
        amt_str = row_clean.get("amount", "")
        tx_type = row_clean.get("type", "").lower()
        csv_cat = row_clean.get("category", "")

        try:
            d = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            add_error(idx, row_clean, "transaction_date", f"Format tanggal '{date_str}' harus YYYY-MM-DD")
            continue

        try:
            amt = Decimal(amt_str)
            if amt <= 0:
                add_error(idx, row_clean, "amount", "Nominal harus lebih dari 0")
                continue
        except Exception:
            add_error(idx, row_clean, "amount", f"Nominal '{amt_str}' tidak valid")
            continue

        if not desc:
            add_error(idx, row_clean, "description", "Deskripsi wajib diisi")
            continue

        if tx_type not in valid_types:
            add_error(idx, row_clean, "type", f"Tipe '{tx_type}' tidak dikenali")
            continue

        matched_category_id = cat_map.get((csv_cat.lower(), tx_type))
        duplicate_key = (str(d), desc.lower(), money(amt), tx_type)
        is_duplicate = duplicate_key in existing_set
        if is_duplicate:
            duplicates_count += 1

        parsed_rows.append({
            "row_index": idx,
            "transaction_date": str(d),
            "description": desc,
            "amount": money(amt),
            "tx_type": tx_type,
            "category_id": matched_category_id,
            "category_name": csv_cat,
            "is_duplicate": is_duplicate
        })

    batch = models.ImportBatch(
        organization_id=org_id,
        filename=filename,
        file_hash=hashlib.sha256(contents).hexdigest(),
        source="csv",
        status="preview",
        total_rows=len(parsed_rows) + len(error_rows),
        valid_rows=len(parsed_rows),
        duplicate_rows=duplicates_count,
        error_rows=len(error_rows),
        created_by=user.id
    )
    db.add(batch)
    db.flush()

    for pr in parsed_rows:
        db.add(models.ImportRow(
            import_batch_id=batch.id,
            row_index=pr["row_index"],
            parsed_data=pr,
            status="duplicate" if pr["is_duplicate"] else "valid",
            is_duplicate=pr["is_duplicate"]
        ))
    for er in error_rows:
        db.add(models.ImportRow(
            import_batch_id=batch.id,
            row_index=er["row_index"],
            raw_data=er["raw_data"],
            status="invalid",
            error_message=er["error_message"],
            is_duplicate=False,
        ))
    log_audit(
        db, org_id, user.id, "CSV_IMPORT_PREVIEWED", "import_batches", batch.id,
        {"filename": filename, "valid_rows": batch.valid_rows, "error_rows": batch.error_rows},
    )
    db.commit()

    return {
        "batch_id": batch.id,
        "filename": filename,
        "total_rows": batch.total_rows,
        "valid_count": batch.valid_rows,
        "duplicate_count": batch.duplicate_rows,
        "error_count": batch.error_rows,
        "rows": parsed_rows,
        "errors": errors
    }

@app.post("/api/v1/imports/transactions/confirm", status_code=201)
def confirm_csv_import(p: schemas.ImportConfirmIn, user=Depends(get_current_user),
                       org_id=Depends(get_current_org), db=Depends(get_db)):
    require_org_role(db, org_id, user)
    batch = db.query(models.ImportBatch).filter_by(
        id=p.batch_id, organization_id=org_id
    ).first()
    if not batch:
        raise HTTPException(404, "Import batch tidak ditemukan")
    if batch.status != "preview":
        raise HTTPException(409, "Batch ini sudah diproses atau tidak dapat dikonfirmasi")

    rows = (
        db.query(models.ImportRow)
        .filter_by(import_batch_id=batch.id, status="valid", is_duplicate=False)
        .order_by(models.ImportRow.row_index.asc())
        .all()
    )
    if not rows:
        raise HTTPException(422, "Tidak ada baris valid yang dapat diimpor")

    category_ids = {
        c.id for c in db.query(models.Category.id).filter_by(organization_id=org_id).all()
    }
    existing_txs = db.query(
        models.Transaction.transaction_date,
        models.Transaction.description,
        models.Transaction.amount,
        models.Transaction.tx_type,
    ).filter_by(organization_id=org_id, status="posted").all()
    existing_set = {
        (str(t[0]), str(t[1]).strip().lower(), money(t[2]), t[3])
        for t in existing_txs
    }

    count = 0
    skipped = 0
    seen = set()
    for row in rows:
        try:
            item = schemas.ImportConfirmItem(**(row.parsed_data or {}))
        except Exception:
            skipped += 1
            continue

        key = (
            str(item.transaction_date),
            item.description.strip().lower(),
            money(item.amount),
            item.tx_type,
        )
        if key in existing_set or key in seen:
            skipped += 1
            continue
        seen.add(key)

        category_id = item.category_id if item.category_id in category_ids else None
        db.add(models.Transaction(
            organization_id=org_id,
            transaction_date=item.transaction_date,
            description=item.description,
            amount=item.amount,
            tx_type=item.tx_type,
            category_id=category_id,
            account_id=item.account_id,
            status="posted",
            created_by=user.id,
        ))
        count += 1

    batch.status = "confirmed"
    batch.duplicate_rows = batch.duplicate_rows + skipped
    log_audit(
        db, org_id, user.id, "CSV_IMPORT_CONFIRMED", "import_batches", batch.id,
        {"batch_id": batch.id, "imported": count, "skipped": skipped},
    )
    db.commit()
    return {
        "batch_id": batch.id,
        "imported_count": count,
        "skipped_count": skipped,
        "message": f"Berhasil mengimpor {count} transaksi; {skipped} baris dilewati.",
    }

# ==========================================
# 12. AUDIT EVENTS
# ==========================================
@app.get("/api/v1/audit-events")
def list_audit_events(limit: int = 50, offset: int = 0,
                      org_id=Depends(get_current_org), db=Depends(get_db)):
    q = db.query(models.AuditEvent).filter_by(organization_id=org_id).order_by(models.AuditEvent.id.desc())
    total = q.count()
    rows = q.limit(limit).offset(offset).all()
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [{
            "id": ev.id, "user_id": ev.user_id, "action": ev.action,
            "entity_type": ev.entity_type, "entity_id": ev.entity_id,
            "payload": ev.payload, "created_at": str(ev.created_at)
        } for ev in rows]
    }

