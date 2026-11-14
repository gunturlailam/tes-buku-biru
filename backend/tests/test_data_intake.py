from decimal import Decimal

from app import models


def _add_account(db_session, org_id, code, name, account_type, role=None):
    account = models.Account(
        organization_id=org_id,
        code=code,
        name=name,
        account_type=account_type,
        normal_balance="debit" if account_type in ("asset", "expense") else "credit",
        account_role=role,
        is_active=True,
    )
    db_session.add(account)
    db_session.flush()
    return account


def test_balance_sheet_upsert_period_close_and_reopen(client, db_session, org_a_setup):
    org = org_a_setup["org"]
    cash = _add_account(db_session, org.id, "1001", "Kas", "asset", "cash")
    inventory = _add_account(db_session, org.id, "1002", "Persediaan", "asset", "inventory")
    payable = _add_account(db_session, org.id, "2001", "Utang Usaha", "liability", "payable")
    equity = _add_account(db_session, org.id, "3001", "Modal", "equity", "equity")
    db_session.commit()

    headers = org_a_setup["headers"]
    period_res = client.post(
        "/api/v1/accounting-periods",
        json={"period_from": "2026-01-01", "period_to": "2026-01-31"},
        headers=headers,
    )
    assert period_res.status_code == 201
    period_id = period_res.json()["id"]

    payload = {
        "as_of_date": "2026-01-31",
        "status": "final",
        "notes": "Neraca awal",
        "lines": [
            {"account_id": cash.id, "amount": "1000.00"},
            {"account_id": inventory.id, "amount": "500.00"},
            {"account_id": payable.id, "amount": "300.00"},
            {"account_id": equity.id, "amount": "1200.00"},
        ],
    }
    res = client.post("/api/v1/balance-sheets", json=payload, headers=headers)
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["is_balanced"] is True
    assert body["totals"]["total_assets"] == "1500.00"
    assert body["period_id"] == period_id

    # Upsert idempotent pada tanggal yang sama.
    payload["notes"] = "Neraca final"
    res2 = client.post("/api/v1/balance-sheets", json=payload, headers=headers)
    assert res2.status_code == 201
    assert res2.json()["id"] == body["id"]
    assert res2.json()["notes"] == "Neraca final"

    closed = client.post(f"/api/v1/accounting-periods/{period_id}/close", headers=headers)
    assert closed.status_code == 200
    assert closed.json()["status"] == "closed"

    blocked = client.post("/api/v1/balance-sheets", json=payload, headers=headers)
    assert blocked.status_code == 409

    reopened = client.post(f"/api/v1/accounting-periods/{period_id}/reopen", headers=headers)
    assert reopened.status_code == 200
    assert reopened.json()["status"] == "open"

    patched = client.patch(
        f"/api/v1/balance-sheets/{body['id']}",
        json={"notes": "Setelah reopen"},
        headers=headers,
    )
    assert patched.status_code == 200
    assert patched.json()["notes"] == "Setelah reopen"


def test_master_data_crud_and_inventory_movement(client, db_session, org_a_setup):
    org = org_a_setup["org"]
    headers = org_a_setup["headers"]

    ar = client.post(
        "/api/v1/receivables",
        json={
            "customer_name": "Pelanggan A",
            "invoice_number": "INV-001",
            "invoice_date": "2026-01-01",
            "due_date": "2026-01-31",
            "amount": "1000.00",
            "paid_amount": "250.00",
        },
        headers=headers,
    )
    assert ar.status_code == 201, ar.text
    assert ar.json()["status"] == "partial"
    assert ar.json()["outstanding_amount"] == "750.00"

    ar_patch = client.patch(
        f"/api/v1/receivables/{ar.json()['id']}",
        json={"paid_amount": "1000.00"},
        headers=headers,
    )
    assert ar_patch.status_code == 200
    assert ar_patch.json()["status"] == "paid"

    ap = client.post(
        "/api/v1/payables",
        json={
            "supplier_name": "Supplier A",
            "bill_number": "BILL-001",
            "bill_date": "2026-01-01",
            "due_date": "2026-01-31",
            "amount": "500.00",
        },
        headers=headers,
    )
    assert ap.status_code == 201, ap.text
    assert ap.json()["status"] == "open"

    item = client.post(
        "/api/v1/inventory-items",
        json={
            "sku": "KOPI-001",
            "name": "Kopi Arabika",
            "unit": "kg",
            "cost_price": "50000.00",
            "quantity_on_hand": "10",
            "reorder_point": "3",
        },
        headers=headers,
    )
    assert item.status_code == 201, item.text
    item_id = item.json()["id"]

    moved = client.post(
        f"/api/v1/inventory-items/{item_id}/movements",
        json={
            "movement_date": "2026-01-02",
            "movement_type": "out",
            "quantity": "2",
            "reference": "Pemakaian produksi",
        },
        headers=headers,
    )
    assert moved.status_code == 201, moved.text
    assert Decimal(moved.json()["item"]["quantity_on_hand"]) == Decimal("8")

    too_much = client.post(
        f"/api/v1/inventory-items/{item_id}/movements",
        json={
            "movement_date": "2026-01-03",
            "movement_type": "out",
            "quantity": "100",
        },
        headers=headers,
    )
    assert too_much.status_code == 422

    asset = client.post(
        "/api/v1/fixed-assets",
        json={
            "name": "Mesin Espresso",
            "asset_category": "Peralatan",
            "acquisition_date": "2026-01-01",
            "acquisition_cost": "10000.00",
            "accumulated_depreciation": "1000.00",
            "useful_life_months": 60,
            "salvage_value": "500.00",
        },
        headers=headers,
    )
    assert asset.status_code == 201, asset.text
    assert asset.json()["book_value"] == "9000.00"

    loan = client.post(
        "/api/v1/loans",
        json={
            "lender": "Bank A",
            "loan_type": "term_loan",
            "principal": "20000.00",
            "interest_rate": "12.5",
            "term_months": 24,
            "start_date": "2026-01-01",
            "outstanding_principal": "18000.00",
            "monthly_installment": "1000.00",
        },
        headers=headers,
    )
    assert loan.status_code == 201, loan.text
    assert loan.json()["outstanding_principal"] == "18000.00"


def test_master_data_is_tenant_scoped(client, org_a_setup, org_b_setup):
    headers_a = org_a_setup["headers"]
    headers_b = org_b_setup["headers"]

    created = client.post(
        "/api/v1/inventory-items",
        json={"sku": "ONLY-A", "name": "Barang A", "quantity_on_hand": "1"},
        headers=headers_a,
    )
    assert created.status_code == 201
    item_id = created.json()["id"]

    forbidden = client.patch(
        f"/api/v1/inventory-items/{item_id}",
        json={"name": "Dicoba Ubah"},
        headers=headers_b,
    )
    assert forbidden.status_code == 404

    own_list = client.get("/api/v1/inventory-items", headers=headers_b)
    assert own_list.status_code == 200
    assert own_list.json() == []


def test_csv_preview_confirm_requires_batch_and_blocks_duplicates(client, org_a_setup):
    headers = org_a_setup["headers"]
    csv_body = (
        "transaction_date,description,amount,type,category\n"
        "2026-02-01,Kopi pagi,25000,income,Penjualan\n"
        "tanggal-salah,Kopi malam,10000,income,Penjualan\n"
    )
    preview = client.post(
        "/api/v1/imports/transactions/preview",
        files={"file": ("transaksi.csv", csv_body, "text/csv")},
        headers=headers,
    )
    assert preview.status_code == 200, preview.text
    body = preview.json()
    assert body["batch_id"] > 0
    assert body["valid_count"] == 1
    assert body["error_count"] == 1

    confirmed = client.post(
        "/api/v1/imports/transactions/confirm",
        json={"batch_id": body["batch_id"]},
        headers=headers,
    )
    assert confirmed.status_code == 201, confirmed.text
    assert confirmed.json()["imported_count"] == 1

    again = client.post(
        "/api/v1/imports/transactions/confirm",
        json={"batch_id": body["batch_id"]},
        headers=headers,
    )
    assert again.status_code == 409

    preview_again = client.post(
        "/api/v1/imports/transactions/preview",
        files={"file": ("transaksi.csv", csv_body, "text/csv")},
        headers=headers,
    )
    assert preview_again.status_code == 200
    assert preview_again.json()["duplicate_count"] == 1

    # Batch yang seluruh barisnya duplikat tidak boleh mengimpor ulang.
    confirm_duplicate = client.post(
        "/api/v1/imports/transactions/confirm",
        json={"batch_id": preview_again.json()["batch_id"]},
        headers=headers,
    )
    assert confirm_duplicate.status_code == 422


def test_csv_preview_rejects_empty_and_non_csv(client, org_a_setup):
    headers = org_a_setup["headers"]

    non_csv = client.post(
        "/api/v1/imports/transactions/preview",
        files={"file": ("transaksi.txt", "a,b\n1,2", "text/plain")},
        headers=headers,
    )
    assert non_csv.status_code == 400

    empty = client.post(
        "/api/v1/imports/transactions/preview",
        files={"file": ("transaksi.csv", "", "text/csv")},
        headers=headers,
    )
    assert empty.status_code == 422
