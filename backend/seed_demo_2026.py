"""Seed 12 bulan data demo 2026 (idempotent).

Tujuan:
- Dashboard MTD (November 2026) tidak kosong.
- Ada cukup periode untuk tren dan forecast.
- Tidak mengubah data 2024 yang sudah ada.

Jalankan dari folder backend:
    ..\\venv\\Scripts\\python.exe seed_demo_2026.py
"""

from calendar import monthrange
from datetime import date
from decimal import Decimal

from app import models
from app.db import Base, SessionLocal, engine


MONTHS = [
    (2025, 12),
    (2026, 1),
    (2026, 2),
    (2026, 3),
    (2026, 4),
    (2026, 5),
    (2026, 6),
    (2026, 7),
    (2026, 8),
    (2026, 9),
    (2026, 10),
    (2026, 11),
]


def _day(year: int, month: int, day: int) -> date:
    last = monthrange(year, month)[1]
    return date(year, month, min(day, last))


def _amount(value) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"))


def main() -> None:
    Base.metadata.create_all(engine)
    db = SessionLocal()

    try:
        org = (
            db.query(models.Organization)
            .filter(models.Organization.name.like("%Data Simulasi%"))
            .first()
        )
        if not org:
            org = db.query(models.Organization).order_by(models.Organization.id).first()
        if not org:
            raise RuntimeError("Tidak ada organisasi. Jalankan seed_demo.py dulu.")

        user = (
            db.query(models.User)
            .filter(models.User.email == "demo@profitai.local")
            .first()
        )
        if not user:
            user = db.query(models.User).order_by(models.User.id).first()
        if not user:
            raise RuntimeError("Tidak ada user. Jalankan seed_demo.py dulu.")

        category_map = {
            (c.name, c.tx_type): c.id
            for c in db.query(models.Category)
            .filter(models.Category.organization_id == org.id)
            .all()
        }
        for name, tx_type in [
            ("Penjualan", "income"),
            ("Pendapatan Jasa", "income"),
            ("Operasional", "expense"),
            ("Gaji", "expense"),
            ("Sewa", "expense"),
            ("Transport", "expense"),
            ("Refund Pelanggan", "refund"),
            ("Transfer Antar Akun", "transfer"),
            ("Setoran Modal", "owner_contribution"),
            ("Penarikan Pemilik", "owner_draw"),
            ("Pinjaman Masuk", "loan_received"),
            ("Cicilan Pinjaman", "loan_repayment"),
        ]:
            key = (name, tx_type)
            if key not in category_map:
                category = models.Category(
                    organization_id=org.id, name=name, tx_type=tx_type
                )
                db.add(category)
                db.flush()
                category_map[key] = category.id

        created = 0
        skipped = 0
        for index, (year, month) in enumerate(MONTHS):
            revenue = Decimal("28000000") + Decimal(index % 4) * Decimal("2000000")
            sales = [
                ("Penjualan demo - minggu 1", revenue * Decimal("0.30"), 3),
                ("Penjualan demo - minggu 2", revenue * Decimal("0.25"), 7),
                ("Penjualan demo - minggu 3", revenue * Decimal("0.25"), 10),
                ("Penjualan demo - minggu 4", revenue * Decimal("0.20"), 12),
                ("Pendapatan jasa demo", Decimal("1500000"), 9),
            ]

            rows = [
                ("income", "Penjualan", desc, amount, day)
                for desc, amount, day in sales
            ]
            rows.extend(
                [
                    (
                        "expense",
                        "Operasional",
                        "Pembelian bahan baku demo",
                        revenue * Decimal("0.28"),
                        5,
                    ),
                    (
                        "expense",
                        "Operasional",
                        "Pembelian bahan baku demo 2",
                        revenue * Decimal("0.12"),
                        11,
                    ),
                    ("expense", "Gaji", "Gaji karyawan demo", Decimal("6000000"), 8),
                    ("expense", "Sewa", "Sewa tempat demo", Decimal("3500000"), 2),
                    (
                        "expense",
                        "Operasional",
                        "Listrik dan air demo",
                        Decimal("1200000"),
                        13,
                    ),
                    (
                        "expense",
                        "Transport",
                        "Transportasi demo",
                        Decimal("650000"),
                        6,
                    ),
                    (
                        "expense",
                        "Operasional",
                        "Marketing demo",
                        Decimal("1500000"),
                        9,
                    ),
                ]
            )

            if index % 3 == 0:
                rows.append(
                    (
                        "owner_draw",
                        "Penarikan Pemilik",
                        "Penarikan pemilik demo",
                        Decimal("2000000"),
                        14,
                    )
                )
            if index % 4 == 1:
                rows.append(
                    (
                        "loan_repayment",
                        "Cicilan Pinjaman",
                        "Cicilan pinjaman demo",
                        Decimal("1500000"),
                        14,
                    )
                )
            if index % 5 == 2:
                rows.append(
                    (
                        "refund",
                        "Refund Pelanggan",
                        "Refund pelanggan demo",
                        Decimal("450000"),
                        12,
                    )
                )
            if index == 0:
                rows.append(
                    (
                        "owner_contribution",
                        "Setoran Modal",
                        "Setoran modal awal demo",
                        Decimal("10000000"),
                        1,
                    )
                )
                rows.append(
                    (
                        "loan_received",
                        "Pinjaman Masuk",
                        "Pinjaman bank demo",
                        Decimal("12000000"),
                        2,
                    )
                )
            if index % 2 == 0:
                rows.append(
                    (
                        "transfer",
                        "Transfer Antar Akun",
                        "Transfer antar akun demo",
                        Decimal("500000"),
                        7,
                    )
                )

            for tx_type, category_name, description, amount, day in rows:
                transaction_date = _day(year, month, day)
                amount = _amount(amount)
                exists = (
                    db.query(models.Transaction)
                    .filter_by(
                        organization_id=org.id,
                        transaction_date=transaction_date,
                        description=description,
                        amount=amount,
                        tx_type=tx_type,
                    )
                    .first()
                )
                if exists:
                    skipped += 1
                    continue

                db.add(
                    models.Transaction(
                        organization_id=org.id,
                        transaction_date=transaction_date,
                        description=description,
                        amount=amount,
                        tx_type=tx_type,
                        category_id=category_map.get((category_name, tx_type)),
                        status="posted",
                        created_by=user.id,
                    )
                )
                created += 1

        db.commit()
        print(f"Seed demo 2026 selesai: {created} transaksi dibuat, {skipped} dilewati.")
        print(f"Organisasi: {org.name} (id={org.id})")
        print("Periode: 2025-12 s/d 2026-11")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
