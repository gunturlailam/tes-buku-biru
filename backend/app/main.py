import csv, io, secrets, uuid
from datetime import date, datetime
from decimal import Decimal
from fastapi import FastAPI, Depends, HTTPException, Query, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from .db import engine, get_db, Base
from . import models, schemas
from .security import hash_password, verify_password, get_current_user, get_current_org
from .financial_engine import (
    summarize,
    calculate_profit_loss,
    calculate_cash_flow,
    calculate_financial_health,
    generate_recommendations,
    money,
)

app = FastAPI(title="ProfitAI API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def startup():
    Base.metadata.create_all(engine)

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

@app.patch("/api/v1/transactions/{tx_id}")
def update_tx(tx_id: int, p: schemas.TransactionUpdate,
              user=Depends(get_current_user), org_id=Depends(get_current_org),
              db=Depends(get_db)):
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

    if p.transaction_date is not None:
        t.transaction_date = p.transaction_date
    if p.description is not None:
        t.description = p.description
    if p.amount is not None:
        t.amount = p.amount
    if p.tx_type is not None:
        t.tx_type = p.tx_type
    if p.category_id is not None:
        t.category_id = p.category_id

    db.commit()
    db.refresh(t)
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

@app.get("/api/v1/financial/health")
def financial_health(date_from: date = Query(alias="from"), date_to: date = Query(alias="to"),
                     org_id=Depends(get_current_org), db=Depends(get_db)):
    rows = db.query(models.Transaction).filter(
        models.Transaction.organization_id == org_id,
        models.Transaction.transaction_date >= date_from,
        models.Transaction.transaction_date <= date_to).all()
    return calculate_financial_health(rows, date_from, date_to)

@app.get("/api/v1/recommendations")
def recommendations(date_from: date = Query(alias="from"), date_to: date = Query(alias="to"),
                    org_id=Depends(get_current_org), db=Depends(get_db)):
    rows = db.query(models.Transaction).filter(
        models.Transaction.organization_id == org_id,
        models.Transaction.transaction_date >= date_from,
        models.Transaction.transaction_date <= date_to).all()
    return generate_recommendations(rows, date_from, date_to)

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
                        org_id=Depends(get_current_org), db=Depends(get_db)):
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

@app.post("/api/v1/imports/transactions/preview")
async def preview_csv_import(file: UploadFile = File(...), org_id=Depends(get_current_org), db=Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "File harus berformat CSV")

    contents = await file.read()
    try:
        text = contents.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = contents.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    fieldnames = [f.strip().lower() for f in (reader.fieldnames or [])]
    required_cols = {"transaction_date", "description", "amount", "type"}
    if not required_cols.issubset(set(fieldnames)):
        raise HTTPException(422, f"Header CSV tidak lengkap. Wajib memiliki: {', '.join(required_cols)}")

    # Category map for matching
    categories = db.query(models.Category).filter_by(organization_id=org_id).all()
    cat_map = {(c.name.lower(), c.tx_type): c.id for c in categories}

    # Fetch existing transactions for duplicate detection
    existing_txs = db.query(models.Transaction.transaction_date, models.Transaction.description, models.Transaction.amount).filter_by(
        organization_id=org_id, status="posted"
    ).all()
    existing_set = {(str(t[0]), str(t[1]).strip().lower(), money(t[2])) for t in existing_txs}

    parsed_rows = []
    errors = []
    duplicates_count = 0

    valid_types = {"income", "expense", "transfer", "owner_contribution", "owner_draw", "loan_received", "loan_repayment", "refund"}

    for idx, row in enumerate(reader, start=1):
        row_clean = {k.strip().lower(): (v.strip() if v else "") for k, v in row.items()}
        date_str = row_clean.get("transaction_date", "")
        desc = row_clean.get("description", "")
        amt_str = row_clean.get("amount", "")
        tx_type = row_clean.get("type", "").lower()
        csv_cat = row_clean.get("category", "")

        # Validate Date
        try:
            d = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            errors.append({"row": idx, "field": "transaction_date", "message": f"Format tanggal '{date_str}' harus YYYY-MM-DD"})
            continue

        # Validate Amount
        try:
            amt = Decimal(amt_str)
            if amt <= 0:
                errors.append({"row": idx, "field": "amount", "message": "Nominal harus lebih dari 0"})
                continue
        except Exception:
            errors.append({"row": idx, "field": "amount", "message": f"Nominal '{amt_str}' tidak valid"})
            continue

        # Validate Type
        if tx_type not in valid_types:
            errors.append({"row": idx, "field": "type", "message": f"Tipe '{tx_type}' tidak dikenali"})
            continue

        # Match Category if possible
        matched_category_id = cat_map.get((csv_cat.lower(), tx_type))

        # Check duplicate
        is_duplicate = (str(d), desc.lower(), money(amt)) in existing_set
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

    return {
        "filename": file.filename,
        "total_rows": len(parsed_rows) + len(errors),
        "valid_count": len(parsed_rows),
        "duplicate_count": duplicates_count,
        "error_count": len(errors),
        "rows": parsed_rows,
        "errors": errors
    }

@app.post("/api/v1/imports/transactions/confirm", status_code=201)
def confirm_csv_import(p: schemas.ImportConfirmIn, user=Depends(get_current_user),
                       org_id=Depends(get_current_org), db=Depends(get_db)):
    if not p.transactions:
        raise HTTPException(400, "Tidak ada transaksi untuk diimpor")

    count = 0
    for item in p.transactions:
        t = models.Transaction(
            organization_id=org_id,
            transaction_date=item.transaction_date,
            description=item.description,
            amount=item.amount,
            tx_type=item.tx_type,
            category_id=item.category_id,
            status="posted",
            created_by=user.id
        )
        db.add(t)
        count += 1

    db.commit()
    return {"imported_count": count, "message": f"Berhasil mengimpor {count} transaksi"}
