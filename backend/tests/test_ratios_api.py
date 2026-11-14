from datetime import date
from decimal import Decimal

from app import models


def _add_account(db, org, code, name, account_type, role, current, normal="debit"):
    acc = models.Account(
        organization_id=org.id,
        code=code,
        name=name,
        account_type=account_type,
        normal_balance=normal,
        account_role=role,
        is_current=current,
    )
    db.add(acc)
    db.flush()
    return acc


def _add_snapshot(db, org, user, as_of, lines):
    snap = models.BalanceSnapshot(
        organization_id=org.id, as_of_date=as_of, status="final", created_by=user.id
    )
    db.add(snap)
    db.flush()
    for account, amount in lines:
        db.add(models.BalanceSnapshotLine(
            snapshot_id=snap.id, account_id=account.id, amount=Decimal(str(amount))
        ))
    db.flush()
    return snap


def _seed_balance_sheet(db, setup):
    org, user = setup["org"], setup["user"]
    cash = _add_account(db, org, "1001", "Kas", "asset", "cash", True)
    ar = _add_account(db, org, "1101", "Piutang Usaha", "asset", "receivable", True)
    inv = _add_account(db, org, "1201", "Persediaan", "asset", "inventory", True)
    prepaid = _add_account(db, org, "1301", "Sewa Dibayar Dimuka", "asset", "prepaid", True)
    ap = _add_account(db, org, "2001", "Utang Usaha", "liability", "payable", True, "credit")
    loan = _add_account(db, org, "2101", "Pinjaman Jangka Pendek", "liability", "short_term_loan", True, "credit")
    tax = _add_account(db, org, "2201", "Utang Pajak", "liability", "tax_payable", True, "credit")
    equity = _add_account(db, org, "3001", "Ekuitas", "equity", "equity", False, "credit")
    fixed = _add_account(db, org, "1501", "Aset Tetap", "asset", "fixed_asset", False)

    _add_snapshot(db, org, user, date(2026, 9, 30), [
        (cash, 40_000_000), (ar, 15_000_000), (inv, 20_000_000),
        (prepaid, 4_000_000), (fixed, 100_000_000), (ap, 20_000_000),
        (loan, 15_000_000), (tax, 4_000_000), (equity, 140_000_000),
    ])
    _add_snapshot(db, org, user, date(2026, 10, 31), [
        (cash, 50_000_000), (ar, 20_000_000), (inv, 30_000_000),
        (prepaid, 5_000_000), (fixed, 100_000_000), (ap, 25_000_000),
        (loan, 15_000_000), (tax, 5_000_000), (equity, 160_000_000),
    ])
    db.commit()


def _seed_october_transactions(db, setup):
    org, user = setup["org"], setup["user"]
    income_id = setup["cat_map"][("Penjualan", "income")]
    hpp_id = setup["cat_map"][("Operasional", "expense")]
    opex_id = setup["cat_map"][("Gaji", "expense")]
    hpp = db.get(models.Category, hpp_id)
    hpp.is_cogs = True
    db.flush()

    for day, tx_type, amount, cat_id, desc in [
        (5, "income", 80_000_000, income_id, "Penjualan Oktober"),
        (6, "expense", 50_000_000, hpp_id, "HPP Oktober"),
        (7, "expense", 10_000_000, opex_id, "Gaji Oktober"),
        (5, "income", 70_000_000, income_id, "Penjualan September"),
    ]:
        month = 9 if "September" in desc else 10
        db.add(models.Transaction(
            organization_id=org.id,
            transaction_date=date(2026, month, day),
            description=desc,
            amount=Decimal(str(amount)),
            tx_type=tx_type,
            category_id=cat_id,
            status="posted",
            created_by=user.id,
        ))
    db.commit()


def test_balance_sheet_and_ratios_unavailable_before_snapshot(client, org_a_setup):
    headers = org_a_setup["headers"]
    bs = client.get("/api/v1/balance-sheet?as_of=2026-10-31", headers=headers)
    assert bs.status_code == 200
    assert bs.json()["status"] == "unavailable"

    res = client.get("/api/v1/ratios?from=2026-10-01&to=2026-10-31", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert len(body["ratios"]) == 16
    assert body["data_quality"]["status"] == "insufficient"
    assert all(r["status"] == "unavailable" for r in body["ratios"])


def test_ratios_endpoint_returns_deterministic_values(client, db_session, org_a_setup):
    _seed_balance_sheet(db_session, org_a_setup)
    _seed_october_transactions(db_session, org_a_setup)

    res = client.get(
        "/api/v1/ratios?from=2026-10-01&to=2026-10-31&as_of=2026-10-31",
        headers=org_a_setup["headers"],
    )
    assert res.status_code == 200
    body = res.json()
    by_code = {r["code"]: r for r in body["ratios"]}
    assert by_code["CR"]["status"] == "available"
    assert by_code["CR"]["value"] == "2.3333"
    assert by_code["CR"]["narrative"]["source"] == "fallback"
    assert by_code["CR"]["narrative"]["explanation"]
    assert by_code["GPM"]["value"] == "0.3750"
    assert by_code["NPM"]["value"] == "0.2500"
    assert body["formula_version"] == "1.1.0"
    assert body["source"]["snapshot_id"] is not None

    bs = client.get(
        "/api/v1/balance-sheet?as_of=2026-10-31",
        headers=org_a_setup["headers"],
    )
    assert bs.status_code == 200
    assert bs.json()["totals"]["total_assets"] == "205000000.00"

    explain = client.post(
        "/api/v1/ratios/CR/explain?from=2026-10-01&to=2026-10-31&as_of=2026-10-31",
        headers=org_a_setup["headers"],
    )
    assert explain.status_code == 200
    body = explain.json()
    assert body["ratio_code"] == "CR"
    assert body["source"] in ("fallback", "llm")
    assert body["explanation"]
    assert body["value"] == "2.3333"


def test_ratio_endpoints_validate_dates(client, org_a_setup):
    headers = org_a_setup["headers"]

    reversed_range = client.get(
        "/api/v1/ratios?from=2026-10-31&to=2026-10-01", headers=headers
    )
    assert reversed_range.status_code == 422

    snapshot_before_period = client.get(
        "/api/v1/ratios?from=2026-10-01&to=2026-10-31&as_of=2026-09-30",
        headers=headers,
    )
    assert snapshot_before_period.status_code == 422

    explain_before_period = client.post(
        "/api/v1/ratios/CR/explain?from=2026-10-01&to=2026-10-31&as_of=2026-09-30",
        headers=headers,
    )
    assert explain_before_period.status_code == 422

    unknown = client.post(
        "/api/v1/ratios/NOT_A_RATIO/explain?from=2026-10-01&to=2026-10-31",
        headers=headers,
    )
    assert unknown.status_code == 404


def test_ratio_threshold_endpoints(client, db_session, org_a_setup):
    headers = org_a_setup["headers"]

    res = client.get("/api/v1/ratios/thresholds", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert len(body["thresholds"]) == 16
    cr = next(t for t in body["thresholds"] if t["ratio_code"] == "CR")
    assert cr["target"] == "1.50"

    res = client.patch(
        "/api/v1/ratios/thresholds/CR",
        headers=headers,
        json={"target": "3", "warning": "2", "critical": "1", "direction": "higher"},
    )
    assert res.status_code == 200
    assert res.json()["target"] == "3.0000"

    res = client.get("/api/v1/ratios/thresholds", headers=headers)
    cr = next(t for t in res.json()["thresholds"] if t["ratio_code"] == "CR")
    assert cr["target"] == "3.00"

    bad = client.patch(
        "/api/v1/ratios/thresholds/CR",
        headers=headers,
        json={"target": "1", "warning": "2", "critical": "3", "direction": "higher"},
    )
    assert bad.status_code == 422

    unknown = client.patch(
        "/api/v1/ratios/thresholds/NOT_A_RATIO",
        headers=headers,
        json={"target": "1", "warning": "2", "critical": "3", "direction": "higher"},
    )
    assert unknown.status_code == 404


def test_ratio_threshold_requires_owner_or_admin(client, db_session, org_a_setup):
    membership = db_session.query(models.Membership).filter_by(
        user_id=org_a_setup["user"].id, organization_id=org_a_setup["org"].id
    ).one()
    membership.role = "member"
    db_session.commit()

    res = client.patch(
        "/api/v1/ratios/thresholds/CR",
        headers=org_a_setup["headers"],
        json={"target": "3", "warning": "2", "critical": "1", "direction": "higher"},
    )
    assert res.status_code == 403
