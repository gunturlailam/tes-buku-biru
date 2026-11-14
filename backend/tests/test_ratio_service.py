from datetime import date
from decimal import Decimal

import pytest

from app import models, ratio_service


def _account(db, org, code, name, account_type, role, is_current, normal="debit"):
    acc = models.Account(
        organization_id=org.id,
        code=code,
        name=name,
        account_type=account_type,
        normal_balance=normal,
        account_role=role,
        is_current=is_current,
    )
    db.add(acc)
    db.flush()
    return acc


def _snapshot(db, org, user, as_of, amounts):
    snap = models.BalanceSnapshot(
        organization_id=org.id,
        as_of_date=as_of,
        status="final",
        created_by=user.id,
    )
    db.add(snap)
    db.flush()
    for account, amount in amounts:
        db.add(models.BalanceSnapshotLine(
            snapshot_id=snap.id,
            account_id=account.id,
            amount=Decimal(str(amount)),
        ))
    db.flush()
    return snap


@pytest.fixture
def ratio_fixture(db_session):
    db = db_session
    user = models.User(
        email="ratio_owner@profitai.test",
        password_hash="x",
        full_name="Ratio Owner",
    )
    db.add(user)
    db.flush()
    org = models.Organization(name="Ratio Test Org")
    db.add(org)
    db.flush()
    db.add(models.Membership(organization_id=org.id, user_id=user.id, role="owner"))
    db.add(models.BusinessProfile(organization_id=org.id, industry="F&B"))

    cash = _account(db, org, "1001", "Kas", "asset", "cash", True)
    ar = _account(db, org, "1101", "Piutang Usaha", "asset", "receivable", True)
    inv = _account(db, org, "1201", "Persediaan", "asset", "inventory", True)
    prepaid = _account(db, org, "1301", "Sewa Dibayar Dimuka", "asset", "prepaid", True)
    fixed = _account(db, org, "1501", "Aset Tetap", "asset", "fixed_asset", False)
    accum = _account(db, org, "1502", "Akumulasi Penyusutan", "asset", "accumulated_depreciation", False, "credit")
    ap = _account(db, org, "2001", "Utang Usaha", "liability", "payable", True, "credit")
    st_loan = _account(db, org, "2101", "Pinjaman Jangka Pendek", "liability", "short_term_loan", True, "credit")
    tax_pay = _account(db, org, "2201", "Utang Pajak", "liability", "tax_payable", True, "credit")
    equity = _account(db, org, "3001", "Ekuitas", "equity", "equity", False, "credit")

    _snapshot(db, org, user, date(2026, 9, 30), [
        (cash, 40_000_000), (ar, 15_000_000), (inv, 20_000_000),
        (prepaid, 4_000_000), (fixed, 100_000_000), (accum, -8_000_000),
        (ap, 20_000_000), (st_loan, 15_000_000), (tax_pay, 4_000_000),
        (equity, 132_000_000),
    ])
    _snapshot(db, org, user, date(2026, 10, 31), [
        (cash, 50_000_000), (ar, 20_000_000), (inv, 30_000_000),
        (prepaid, 5_000_000), (fixed, 100_000_000), (accum, -10_000_000),
        (ap, 25_000_000), (st_loan, 15_000_000), (tax_pay, 5_000_000),
        (equity, 150_000_000),
    ])

    income_cat = models.Category(organization_id=org.id, name="Penjualan", tx_type="income")
    cogs_cat = models.Category(organization_id=org.id, name="HPP", tx_type="expense", is_cogs=True)
    opex_cat = models.Category(organization_id=org.id, name="Operasional", tx_type="expense")
    interest_acc = _account(db, org, "5001", "Beban Bunga", "expense", "interest_expense", False)
    tax_acc = _account(db, org, "5002", "Beban Pajak", "expense", "tax_expense", False)
    interest_cat = models.Category(
        organization_id=org.id, name="Bunga", tx_type="expense", account_id=interest_acc.id
    )
    tax_cat = models.Category(
        organization_id=org.id, name="Pajak", tx_type="expense", account_id=tax_acc.id
    )
    db.add_all([income_cat, cogs_cat, opex_cat, interest_cat, tax_cat])
    db.flush()

    def tx(day, tx_type, amount, category):
        row = models.Transaction(
            organization_id=org.id,
            transaction_date=day,
            description=f"{tx_type} test",
            tx_type=tx_type,
            amount=Decimal(str(amount)),
            category_id=category.id,
            status="posted",
            created_by=user.id,
        )
        db.add(row)

    tx(date(2026, 10, 5), "income", 80_000_000, income_cat)
    tx(date(2026, 10, 6), "expense", 50_000_000, cogs_cat)
    tx(date(2026, 10, 7), "expense", 10_000_000, opex_cat)
    tx(date(2026, 10, 8), "expense", 2_000_000, interest_cat)
    tx(date(2026, 10, 9), "expense", 1_000_000, tax_cat)
    tx(date(2026, 9, 5), "income", 70_000_000, income_cat)
    db.commit()

    return {
        "db": db, "user": user, "org": org,
        "hpp": cogs_cat, "opex": opex_cat,
    }


def _ratio(result, code):
    return next(r for r in result["ratios"] if r["code"] == code)


def test_balance_sheet_totals(ratio_fixture):
    f = ratio_fixture
    result = ratio_service.balance_sheet(f["db"], f["org"].id, date(2026, 10, 31))
    assert result["status"] == "final"
    assert result["totals"]["total_assets"] == "195000000.00"
    assert result["totals"]["total_liabilities"] == "45000000.00"
    assert result["totals"]["total_equity"] == "150000000.00"
    assert result["totals"]["current_assets"] == "105000000.00"
    assert result["totals"]["current_liabilities"] == "45000000.00"
    assert not any("tidak seimbang" in w for w in result["data_quality"]["warnings"])


def test_balance_sheet_unavailable_without_snapshot(ratio_fixture):
    f = ratio_fixture
    result = ratio_service.balance_sheet(f["db"], f["org"].id, date(2025, 1, 1))
    assert result["status"] == "unavailable"
    assert result["assets"] == []
    assert result["totals"]["total_assets"] is None


def test_ratio_inputs_and_computed_values(ratio_fixture):
    f = ratio_fixture
    inputs, meta = ratio_service.build_ratio_inputs(
        f["db"], f["org"].id, date(2026, 10, 1), date(2026, 10, 31)
    )
    assert inputs.revenue == Decimal("80000000")
    assert inputs.cogs == Decimal("50000000")
    assert inputs.operating_expenses == Decimal("10000000")
    assert inputs.interest_expense == Decimal("2000000")
    assert inputs.tax_expense == Decimal("1000000")
    assert inputs.net_profit == Decimal("17000000")
    assert inputs.days == 31
    assert meta["snapshot_id"] is not None
    assert meta["previous_snapshot_id"] is not None

    result = ratio_service.compute_ratio_snapshot(
        f["db"], f["org"].id, date(2026, 10, 1), date(2026, 10, 31),
        industry="F&B", persist=True,
    )
    f["db"].commit()

    cr = _ratio(result, "CR")
    assert cr["status"] == "available"
    assert cr["value"] == "2.3333"
    assert cr["quality"] == "ok"

    assert _ratio(result, "QR")["value"] == "1.5556"
    assert _ratio(result, "CASH_RATIO")["value"] == "1.1111"
    assert _ratio(result, "DER")["value"] == "0.3000"
    assert _ratio(result, "DAR")["value"] == "0.2308"
    assert _ratio(result, "ICR")["value"] == "10.0000"
    assert _ratio(result, "INV_TURN")["value"] == "23.5484"
    assert _ratio(result, "ACP")["value"] == "6.7813"
    assert _ratio(result, "DPO")["value"] == "13.9500"
    assert _ratio(result, "TATO")["value"] == "5.1472"
    assert _ratio(result, "GPM")["value"] == "0.3750"
    assert _ratio(result, "OPM")["value"] == "0.2500"
    assert _ratio(result, "NPM")["value"] == "0.2125"
    assert _ratio(result, "ROA")["value"] == "1.0938"
    assert _ratio(result, "ROE")["value"] == "1.4196"
    assert _ratio(result, "REV_GROWTH")["value"] == "0.1429"
    assert result["data_quality"]["status"] == "usable"

    saved = f["db"].query(models.RatioSnapshot).filter_by(
        organization_id=f["org"].id
    ).one()
    assert saved.data_quality_status == "usable"


def test_threshold_override_is_applied(ratio_fixture):
    f = ratio_fixture
    f["db"].add(models.RatioThreshold(
        organization_id=f["org"].id,
        ratio_code="CR",
        industry="F&B",
        target=Decimal("3"),
        warning=Decimal("2"),
        critical=Decimal("1"),
        direction="higher",
    ))
    f["db"].commit()

    result = ratio_service.compute_ratio_snapshot(
        f["db"], f["org"].id, date(2026, 10, 1), date(2026, 10, 31),
        industry="F&B", persist=False,
    )
    cr = _ratio(result, "CR")
    assert cr["threshold"]["target"] == "3.0000"
    assert cr["band"] == "between_target_warning"


def test_no_snapshot_marks_all_ratios_unavailable(ratio_fixture):
    f = ratio_fixture
    result = ratio_service.compute_ratio_snapshot(
        f["db"], f["org"].id, date(2025, 1, 1), date(2025, 1, 31),
        industry="F&B", persist=False,
    )
    assert result["data_quality"]["status"] == "insufficient"
    assert all(r["status"] == "unavailable" for r in result["ratios"])
    assert result["source"]["snapshot_status"] == "unavailable"


def test_unclassified_cogs_makes_margin_unavailable(ratio_fixture):
    f = ratio_fixture
    f["hpp"].is_cogs = False
    f["db"].commit()

    result = ratio_service.compute_ratio_snapshot(
        f["db"], f["org"].id, date(2026, 10, 1), date(2026, 10, 31),
        industry="F&B", persist=False,
    )
    gpm = _ratio(result, "GPM")
    assert gpm["status"] == "unavailable"
    assert any("Klasifikasi HPP" in w for w in result["data_quality"]["warnings"])
    assert _ratio(result, "NPM")["status"] == "unavailable"
    assert result["data_quality"]["status"] in ("partial", "insufficient")
