import secrets, uuid
from datetime import date
from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from .db import engine, get_db, Base
from . import models, schemas
from .security import hash_password, verify_password, get_current_user, get_current_org
from .financial_engine import summarize, money

app = FastAPI(title="ProfitAI API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def startup():
    Base.metadata.create_all(engine)  # pintasan demo; migrations resmi menyusul

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request.state.request_id = str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    return response

@app.exception_handler(HTTPException)
async def http_error(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={
        "error": {"code": "HTTP_ERROR", "message": exc.detail},
        "request_id": request.state.request_id})

@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={
        "error": {"code": "VALIDATION_ERROR", "message": "Input tidak valid",
                  "details": jsonable_encoder(exc.errors())},
        "request_id": request.state.request_id})

DEFAULT_CATEGORIES = [("Penjualan", "income"), ("Pendapatan Jasa", "income"),
    ("Operasional", "expense"), ("Gaji", "expense"), ("Sewa", "expense"),
    ("Transport", "expense"), ("Refund Pelanggan", "refund"),
    ("Transfer Antar Akun", "transfer"), ("Setoran Modal", "owner_contribution"),
    ("Penarikan Pemilik", "owner_draw"), ("Pinjaman Masuk", "loan_received"),
    ("Cicilan Pinjaman", "loan_repayment")]

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/v1/auth/register", status_code=201)
def register(p: schemas.RegisterIn, db=Depends(get_db)):
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
    db.add(models.BusinessProfile(organization_id=org.id))
    for name, t in DEFAULT_CATEGORIES:
        db.add(models.Category(organization_id=org.id, name=name, tx_type=t))
    db.commit()
    return {"user_id": user.id, "organization_id": org.id, "message": "Terdaftar, silakan login"}

@app.post("/api/v1/auth/login")
def login(p: schemas.LoginIn, db=Depends(get_db)):
    user = db.query(models.User).filter_by(email=p.email.strip().lower()).first()
    if not user or not verify_password(p.password, user.password_hash):
        raise HTTPException(401, "Email atau password salah")
    token = secrets.token_urlsafe(32)
    db.add(models.Session(token=token, user_id=user.id)); db.commit()
    return {"access_token": token, "token_type": "bearer"}

@app.get("/api/v1/me")
def me(user=Depends(get_current_user), org_id=Depends(get_current_org)):
    return {"id": user.id, "email": user.email, "full_name": user.full_name,
            "organization_id": org_id}

@app.get("/api/v1/categories")
def categories(org_id=Depends(get_current_org), db=Depends(get_db)):
    rows = db.query(models.Category).filter_by(organization_id=org_id).order_by(models.Category.id).all()
    return [{"id": c.id, "name": c.name, "tx_type": c.tx_type} for c in rows]

def tx_dict(t):
    return {"id": t.id, "transaction_date": str(t.transaction_date),
            "description": t.description, "amount": money(t.amount),
            "tx_type": t.tx_type, "category_id": t.category_id,
            "status": t.status, "reversal_of_id": t.reversal_of_id}

@app.post("/api/v1/transactions", status_code=201)
def create_tx(p: schemas.TransactionIn, user=Depends(get_current_user),
              org_id=Depends(get_current_org), db=Depends(get_db)):
    if p.category_id is not None:
        cat = db.query(models.Category).filter_by(id=p.category_id, organization_id=org_id).first()
        if not cat:
            raise HTTPException(422, "Kategori tidak ditemukan di organisasimu")
        if cat.tx_type != p.tx_type:
            raise HTTPException(422, "Tipe kategori tidak cocok dengan tipe transaksi")
    t = models.Transaction(organization_id=org_id, created_by=user.id, **p.model_dump())
    db.add(t); db.commit(); db.refresh(t)
    return tx_dict(t)

@app.get("/api/v1/transactions")
def list_tx(date_from: date = Query(alias="from"), date_to: date = Query(alias="to"),
            limit: int = Query(50, le=200), offset: int = 0,
            org_id=Depends(get_current_org), db=Depends(get_db)):
    q = db.query(models.Transaction).filter(
        models.Transaction.organization_id == org_id,
        models.Transaction.transaction_date >= date_from,
        models.Transaction.transaction_date <= date_to,
    ).order_by(models.Transaction.transaction_date.desc(), models.Transaction.id.desc())
    total = q.count()
    rows = q.limit(limit).offset(offset).all()
    return {"total": total, "limit": limit, "offset": offset,
            "items": [tx_dict(t) for t in rows]}

@app.get("/api/v1/transactions/{tx_id}")
def get_tx(tx_id: int, org_id=Depends(get_current_org), db=Depends(get_db)):
    t = db.query(models.Transaction).filter_by(id=tx_id, organization_id=org_id).first()
    if not t:
        raise HTTPException(404, "Transaksi tidak ditemukan")
    return tx_dict(t)

@app.post("/api/v1/transactions/{tx_id}/reverse", status_code=201)
def reverse_tx(tx_id: int, user=Depends(get_current_user),
               org_id=Depends(get_current_org), db=Depends(get_db)):
    t = db.query(models.Transaction).filter_by(id=tx_id, organization_id=org_id).first()
    if not t:
        raise HTTPException(404, "Transaksi tidak ditemukan")
    if t.status != "posted" or t.reversal_of_id is not None:
        raise HTTPException(409, "Sudah di-reverse atau merupakan baris reversal")
    rev = models.Transaction(organization_id=org_id, transaction_date=t.transaction_date,
        description=f"Reversal of #{t.id}", amount=t.amount, tx_type=t.tx_type,
        category_id=t.category_id, reversal_of_id=t.id, created_by=user.id)
    t.status = "reversed"
    db.add(rev); db.commit(); db.refresh(rev)
    return tx_dict(rev)

@app.get("/api/v1/financial/summary")
def summary(date_from: date = Query(alias="from"), date_to: date = Query(alias="to"),
            org_id=Depends(get_current_org), db=Depends(get_db)):
    rows = db.query(models.Transaction).filter(
        models.Transaction.organization_id == org_id,
        models.Transaction.transaction_date >= date_from,
        models.Transaction.transaction_date <= date_to).all()
    return summarize(rows, date_from, date_to)