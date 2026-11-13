from datetime import date
from decimal import Decimal
import random
from app.db import SessionLocal, engine, Base
from app import models
from app.security import hash_password
from app.main import DEFAULT_CATEGORIES

Base.metadata.create_all(engine)
db = SessionLocal()
email = "demo@profitai.local"
if db.query(models.User).filter_by(email=email).first():
    print("User demo sudah ada:", email, "/ Demo12345!")
else:
    user = models.User(email=email, password_hash=hash_password("Demo12345!"),
                       full_name="Demo Owner")
    db.add(user); db.flush()
    org = models.Organization(name="Warung Kopi Maju (Data Simulasi)")
    db.add(org); db.flush()
    db.add(models.Membership(organization_id=org.id, user_id=user.id, role="owner"))
    db.add(models.BusinessProfile(organization_id=org.id, industry="F&B"))
    cats = {}
    for name, t in DEFAULT_CATEGORIES:
        c = models.Category(organization_id=org.id, name=name, tx_type=t)
        db.add(c); db.flush(); cats[t] = c.id
    random.seed(42)
    for month, last_day in [(10, 31), (11, 13)]:
        for day in range(1, last_day + 1):
            d = date(2026, month, day)
            db.add(models.Transaction(organization_id=org.id, transaction_date=d,
                description="Penjualan harian (simulasi)",
                amount=Decimal(random.randint(300, 900)) * 1000,
                tx_type="income", category_id=cats["income"], created_by=user.id))
            if day % 3 == 0:
                db.add(models.Transaction(organization_id=org.id, transaction_date=d,
                    description="Belanja bahan (simulasi)",
                    amount=Decimal(random.randint(100, 400)) * 1000,
                    tx_type="expense", category_id=cats["expense"], created_by=user.id))
        db.add(models.Transaction(organization_id=org.id,
            transaction_date=date(2026, month, 5), description="Sewa tempat (simulasi)",
            amount=Decimal("1500000"), tx_type="expense",
            category_id=cats["expense"], created_by=user.id))
    db.commit()
    print("Demo siap:", email, "/ Demo12345!")
db.close()