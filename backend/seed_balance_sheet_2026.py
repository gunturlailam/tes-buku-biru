"""Seed akun, neraca, dan data pendukung rasio untuk demo 2026 (idempotent).

Tidak menghapus transaksi. Script ini hanya:
- menambah/memperbarui chart of accounts,
- menautkan kategori ke akun dan menandai HPP,
- membuat snapshot neraca bulanan,
- membuat master AR/AP/persediaan/aset tetap/pinjaman,
- menghitung ratio snapshot Oktober & November.

Jalankan setelah `seed_demo_2026.py`:
    ..\\venv\\Scripts\\python.exe seed_balance_sheet_2026.py
"""

from calendar import monthrange
from datetime import date
from decimal import Decimal

from app import models, ratio_service
from app.db import Base, SessionLocal, engine


MONTH_ENDS = [
    (2025, 11), (2025, 12),
    (2026, 1), (2026, 2), (2026, 3), (2026, 4), (2026, 5),
    (2026, 6), (2026, 7), (2026, 8), (2026, 9), (2026, 10),
]


def D(value) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"))


def month_end(year: int, month: int) -> date:
    return date(year, month, monthrange(year, month)[1])


def ensure_account(db, org_id, code, name, account_type, role, is_current,
                   normal_balance="debit"):
    acc = (
        db.query(models.Account)
        .filter_by(organization_id=org_id, code=code)
        .first()
    )
    if acc is None:
        acc = models.Account(
            organization_id=org_id,
            code=code,
            name=name,
            account_type=account_type,
            normal_balance=normal_balance,
            account_role=role,
            is_current=is_current,
            is_active=True,
        )
        db.add(acc)
        db.flush()
        return acc
    acc.name = name
    acc.account_type = account_type
    acc.normal_balance = normal_balance
    acc.account_role = role
    acc.is_current = is_current
    acc.is_active = True
    return acc


def ensure_category(db, org_id, name, tx_type, account, is_cogs=False):
    cat = (
        db.query(models.Category)
        .filter_by(organization_id=org_id, name=name, tx_type=tx_type)
        .first()
    )
    if cat is None:
        cat = models.Category(
            organization_id=org_id,
            name=name,
            tx_type=tx_type,
            account_id=account.id if account is not None else None,
            is_cogs=is_cogs,
        )
        db.add(cat)
        db.flush()
        return cat
    cat.account_id = account.id if account is not None else None
    cat.is_cogs = is_cogs
    return cat


def snapshot_values(index) -> dict:
    """Neraca demo yang tumbuh dan selalu seimbang (aset = liabilitas + ekuitas)."""
    idx = D(index)
    cash = D(25_000_000) + D(4_000_000) * idx
    bank = D(12_000_000) + D(1_000_000) * idx
    receivables = D(10_000_000) + D(500_000) * idx
    inventory = D(16_000_000) + D(600_000) * idx
    prepaid = D(3_000_000) if idx >= 6 else D(2_000_000)
    fixed = D(80_000_000)
    accumulated = -(D(6_000_000) + D(400_000) * idx)
    payable = D(14_000_000) + D(400_000) * idx
    short_loan = D(10_000_000) - D(200_000) * idx
    tax_payable = D(1_000_000) + D(100_000) * idx
    long_loan = D(25_000_000)

    assets = cash + bank + receivables + inventory + prepaid + fixed + accumulated
    liabilities = payable + short_loan + tax_payable + long_loan
    equity = assets - liabilities

    return {
        "cash": cash,
        "bank": bank,
        "receivables": receivables,
        "inventory": inventory,
        "prepaid": prepaid,
        "fixed": fixed,
        "accumulated": accumulated,
        "payable": payable,
        "short_loan": short_loan,
        "tax_payable": tax_payable,
        "long_loan": long_loan,
        "equity": equity,
    }


def ensure_snapshot(db, org, user, period, as_of, values, accounts):
    snap = (
        db.query(models.BalanceSnapshot)
        .filter_by(organization_id=org.id, as_of_date=as_of)
        .first()
    )
    mapping = [
        ("cash", accounts["cash"]),
        ("bank", accounts["bank"]),
        ("receivables", accounts["receivable"]),
        ("inventory", accounts["inventory"]),
        ("prepaid", accounts["prepaid"]),
        ("fixed", accounts["fixed"]),
        ("accumulated", accounts["accumulated"]),
        ("payable", accounts["payable"]),
        ("short_loan", accounts["short_loan"]),
        ("tax_payable", accounts["tax_payable"]),
        ("long_loan", accounts["long_loan"]),
        ("equity", accounts["equity"]),
    ]
    if snap is not None:
        # Hanya perbarui snapshot demo milik script ini; snapshot manual dibiarkan.
        if not (snap.notes or "").startswith("Seed demo accrual-lite"):
            return snap, False
        snap.period_id = period.id if period else snap.period_id
        snap.status = "final"
        existing = {
            line.account_id: line
            for line in db.query(models.BalanceSnapshotLine)
            .filter_by(snapshot_id=snap.id)
            .all()
        }
        for key, account in mapping:
            line = existing.get(account.id)
            if line is None:
                db.add(models.BalanceSnapshotLine(
                    snapshot_id=snap.id,
                    account_id=account.id,
                    amount=values[key],
                ))
            else:
                line.amount = values[key]
        db.flush()
        return snap, False

    snap = models.BalanceSnapshot(
        organization_id=org.id,
        period_id=period.id if period else None,
        as_of_date=as_of,
        status="final",
        notes="Seed demo accrual-lite. Angka ilustratif, bukan audit.",
        created_by=user.id,
    )
    db.add(snap)
    db.flush()

    for key, account in mapping:
        db.add(models.BalanceSnapshotLine(
            snapshot_id=snap.id,
            account_id=account.id,
            amount=values[key],
        ))
    db.flush()
    return snap, True


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

        accounts = {
            "cash": ensure_account(db, org.id, "1001", "Kas", "asset", "cash", True),
            "bank": ensure_account(db, org.id, "1002", "Bank", "asset", "cash", True),
            "receivable": ensure_account(db, org.id, "1101", "Piutang Usaha", "asset", "receivable", True),
            "inventory": ensure_account(db, org.id, "1201", "Persediaan", "asset", "inventory", True),
            "prepaid": ensure_account(db, org.id, "1301", "Sewa Dibayar Dimuka", "asset", "prepaid", True),
            "fixed": ensure_account(db, org.id, "1501", "Aset Tetap", "asset", "fixed_asset", False),
            "accumulated": ensure_account(
                db, org.id, "1502", "Akumulasi Penyusutan", "asset",
                "accumulated_depreciation", False, "credit",
            ),
            "payable": ensure_account(
                db, org.id, "2001", "Utang Usaha", "liability", "payable", True, "credit",
            ),
            "short_loan": ensure_account(
                db, org.id, "2101", "Pinjaman Jangka Pendek", "liability",
                "short_term_loan", True, "credit",
            ),
            "tax_payable": ensure_account(
                db, org.id, "2201", "Utang Pajak", "liability", "tax_payable", True, "credit",
            ),
            "long_loan": ensure_account(
                db, org.id, "2301", "Pinjaman Jangka Panjang", "liability",
                "long_term_loan", False, "credit",
            ),
            "equity": ensure_account(
                db, org.id, "3001", "Modal dan Laba Ditahan", "equity",
                "equity", False, "credit",
            ),
        }

        revenue = ensure_account(db, org.id, "4001", "Penjualan", "revenue", "revenue", False, "credit")
        service_revenue = ensure_account(db, org.id, "4002", "Pendapatan Jasa", "revenue", "revenue", False, "credit")
        refund = ensure_account(db, org.id, "4003", "Retur dan Refund", "revenue", "revenue", False, "debit")
        cogs = ensure_account(db, org.id, "5001", "Harga Pokok Penjualan", "expense", "cogs", False)
        salary = ensure_account(db, org.id, "5002", "Beban Gaji", "expense", "operating_expense", False)
        rent = ensure_account(db, org.id, "5003", "Beban Sewa", "expense", "operating_expense", False)
        opex = ensure_account(db, org.id, "5004", "Beban Operasional", "expense", "operating_expense", False)
        transport = ensure_account(db, org.id, "5005", "Beban Transport", "expense", "operating_expense", False)
        interest = ensure_account(db, org.id, "5006", "Beban Bunga", "expense", "interest_expense", False)
        tax = ensure_account(db, org.id, "5007", "Beban Pajak", "expense", "tax_expense", False)

        ensure_category(db, org.id, "Penjualan", "income", revenue)
        ensure_category(db, org.id, "Pendapatan Jasa", "income", service_revenue)
        ensure_category(db, org.id, "Refund Pelanggan", "refund", refund)
        hpp_cat = ensure_category(db, org.id, "HPP", "expense", cogs, is_cogs=True)
        ensure_category(db, org.id, "Gaji", "expense", salary)
        ensure_category(db, org.id, "Sewa", "expense", rent)
        ensure_category(db, org.id, "Operasional", "expense", opex)
        ensure_category(db, org.id, "Transport", "expense", transport)
        interest_cat = ensure_category(db, org.id, "Beban Bunga", "expense", interest)
        ensure_category(db, org.id, "Beban Pajak", "expense", tax)

        # Koreksi klasifikasi demo: pembelian bahan baku adalah HPP, bukan opex.
        updated = (
            db.query(models.Transaction)
            .filter(
                models.Transaction.organization_id == org.id,
                models.Transaction.description.like("Pembelian bahan baku demo%"),
            )
            .update({models.Transaction.category_id: hpp_cat.id},
                    synchronize_session=False)
        )

        # Beban bunga demo agar ICR punya input nyata (bukan nol).
        interest_created = 0
        existing_interest = {
            (tx.transaction_date.year, tx.transaction_date.month): tx
            for tx in db.query(models.Transaction)
            .filter(
                models.Transaction.organization_id == org.id,
                models.Transaction.description == "Beban bunga pinjaman demo",
            )
            .all()
        }
        for month in range(1, 12):
            tx_date = date(2026, month, 14)
            tx = existing_interest.get((2026, month))
            if tx is None:
                db.add(models.Transaction(
                    organization_id=org.id,
                    transaction_date=tx_date,
                    description="Beban bunga pinjaman demo",
                    amount=D(200_000),
                    tx_type="expense",
                    category_id=interest_cat.id,
                    status="posted",
                    created_by=user.id,
                ))
                interest_created += 1
            else:
                # Jaga agar beban bunga demo tidak berada di tanggal masa depan.
                tx.transaction_date = tx_date

        periods = {}
        for year, month in MONTH_ENDS:
            start = date(year, month, 1)
            end = month_end(year, month)
            period = (
                db.query(models.AccountingPeriod)
                .filter_by(organization_id=org.id, period_from=start, period_to=end)
                .first()
            )
            if period is None:
                period = models.AccountingPeriod(
                    organization_id=org.id,
                    period_from=start,
                    period_to=end,
                    status="open",
                )
                db.add(period)
                db.flush()
            periods[(year, month)] = period

        created_snapshots = 0
        for index, (year, month) in enumerate(MONTH_ENDS):
            period = periods[(year, month)]
            _, created = ensure_snapshot(
                db, org, user, period, month_end(year, month),
                snapshot_values(index), accounts,
            )
            created_snapshots += 1 if created else 0

        # Snapshot MTD November 2026 (per tanggal demo).
        nov_period = (
            db.query(models.AccountingPeriod)
            .filter_by(
                organization_id=org.id,
                period_from=date(2026, 11, 1),
                period_to=date(2026, 11, 30),
            )
            .first()
        )
        if nov_period is None:
            nov_period = models.AccountingPeriod(
                organization_id=org.id,
                period_from=date(2026, 11, 1),
                period_to=date(2026, 11, 30),
                status="open",
            )
            db.add(nov_period)
            db.flush()
        _, created = ensure_snapshot(
            db, org, user, nov_period, date(2026, 11, 14),
            snapshot_values(11.5), accounts,
        )
        created_snapshots += 1 if created else 0

        # Master data pendukung (idempotent berdasarkan nama/nomor).
        for label, amount, paid, inv_date, due in [
            ("Kafe Senja", 8_000_000, 3_000_000, date(2026, 10, 3), date(2026, 11, 2)),
            ("Katering Pagi", 6_000_000, 0, date(2026, 10, 12), date(2026, 11, 11)),
            ("Kantor Bumi", 5_500_000, 5_500_000, date(2026, 9, 20), date(2026, 10, 20)),
        ]:
            exists = (
                db.query(models.Receivable)
                .filter_by(organization_id=org.id, customer_name=label, amount=D(amount))
                .first()
            )
            if exists is None:
                db.add(models.Receivable(
                    organization_id=org.id,
                    customer_name=label,
                    invoice_number=f"INV-{label[:3].upper()}-{inv_date:%m%y}",
                    invoice_date=inv_date,
                    due_date=due,
                    amount=D(amount),
                    paid_amount=D(paid),
                    status="paid" if paid >= amount else ("partial" if paid else "open"),
                ))

        for label, amount, paid, bill_date, due in [
            ("Supplier Biji Kopi", 7_500_000, 2_500_000, date(2026, 10, 2), date(2026, 11, 1)),
            ("Supplier Susu", 3_200_000, 0, date(2026, 10, 15), date(2026, 11, 14)),
            ("Supplier Kemasan", 2_800_000, 2_800_000, date(2026, 9, 25), date(2026, 10, 25)),
        ]:
            exists = (
                db.query(models.Payable)
                .filter_by(organization_id=org.id, supplier_name=label, amount=D(amount))
                .first()
            )
            if exists is None:
                db.add(models.Payable(
                    organization_id=org.id,
                    supplier_name=label,
                    bill_number=f"BILL-{label[:3].upper()}-{bill_date:%m%y}",
                    bill_date=bill_date,
                    due_date=due,
                    amount=D(amount),
                    paid_amount=D(paid),
                    status="paid" if paid >= amount else ("partial" if paid else "open"),
                ))

        inventory_rows = [
            ("KOPI-01", "Biji Kopi Arabika", "kg", 150_000, 80, 20),
            ("SUSU-01", "Susu UHT", "liter", 20_000, 100, 30),
            ("GULA-01", "Gula Aren", "kg", 15_000, 50, 15),
            ("CUP-01", "Cup 12 oz", "pcs", 1_000, 3_000, 1_000),
            ("SIRUP-01", "Sirup Vanila", "botol", 50_000, 50, 10),
            ("SNACK-01", "Snack Kemasan", "pcs", 10_000, 100, 30),
        ]
        items = {}
        for sku, name, unit, cost, qty, reorder in inventory_rows:
            item = (
                db.query(models.InventoryItem)
                .filter_by(organization_id=org.id, sku=sku)
                .first()
            )
            if item is None:
                item = models.InventoryItem(
                    organization_id=org.id, sku=sku, name=name, unit=unit,
                    cost_price=D(cost), quantity_on_hand=D(qty),
                    reorder_point=D(reorder), is_active=True,
                )
                db.add(item)
                db.flush()
                db.add(models.InventoryMovement(
                    organization_id=org.id, item_id=item.id,
                    movement_date=date(2026, 10, 30),
                    movement_type="in", quantity=D(qty),
                    unit_cost=D(cost), reference="Saldo awal demo",
                ))
            items[sku] = item

        for name, category, cost, accum, months in [
            ("Peralatan Coffee Shop", "peralatan", 80_000_000, 10_000_000, 60),
            ("Renovasi Interior", "bangunan", 25_000_000, 4_000_000, 120),
        ]:
            exists = (
                db.query(models.FixedAsset)
                .filter_by(organization_id=org.id, name=name)
                .first()
            )
            if exists is None:
                db.add(models.FixedAsset(
                    organization_id=org.id, name=name, asset_category=category,
                    acquisition_date=date(2025, 6, 1),
                    acquisition_cost=D(cost),
                    accumulated_depreciation=D(accum),
                    useful_life_months=months,
                    salvage_value=D(0), status="active",
                ))

        for lender, loan_type, principal, rate, term, start, outstanding in [
            ("Bank Mitra", "short_term", 10_000_000, 0.12, 12, date(2026, 1, 1), 8_000_000),
            ("Bank Nusantara", "term_loan", 25_000_000, 0.10, 36, date(2025, 6, 1), 25_000_000),
        ]:
            exists = (
                db.query(models.Loan)
                .filter_by(organization_id=org.id, lender=lender, principal=D(principal))
                .first()
            )
            if exists is None:
                db.add(models.Loan(
                    organization_id=org.id, lender=lender, loan_type=loan_type,
                    principal=D(principal), interest_rate=D(rate),
                    term_months=term, start_date=start,
                    outstanding_principal=D(outstanding),
                    monthly_installment=D(0), status="active",
                ))

        db.commit()

        profile = db.query(models.BusinessProfile).filter_by(organization_id=org.id).first()
        industry = profile.industry if profile else None
        oct_result = ratio_service.compute_ratio_snapshot(
            db, org.id, date(2026, 10, 1), date(2026, 10, 31),
            industry=industry, persist=True,
        )
        nov_result = ratio_service.compute_ratio_snapshot(
            db, org.id, date(2026, 11, 1), date(2026, 11, 14),
            as_of=date(2026, 11, 14), industry=industry, persist=True,
        )
        db.commit()

        print(f"Seed neraca selesai untuk {org.name} (id={org.id}).")
        print(f"Snapshot baru: {created_snapshots}; transaksi HPP dikoreksi: {updated}; "
              f"beban bunga baru: {interest_created}")
        print(f"Rasio Oktober: {oct_result['data_quality']['status']}, "
              f"CR={next(r['value'] for r in oct_result['ratios'] if r['code'] == 'CR')}")
        print(f"Rasio November MTD: {nov_result['data_quality']['status']}, "
              f"CR={next(r['value'] for r in nov_result['ratios'] if r['code'] == 'CR')}")
        print(f"Master: {len(items)} item persediaan, 3 piutang, 3 utang, 2 aset tetap, 2 pinjaman.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
