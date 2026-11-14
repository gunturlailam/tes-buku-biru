from datetime import date
from decimal import Decimal
from types import SimpleNamespace

from app.financial_engine import calculate_cash_flow_forecast, summarize


def _tx(day, amount, tx_type="income", status="posted", reversal_of_id=None,
        category_id=1):
    return SimpleNamespace(
        transaction_date=day,
        amount=Decimal(amount),
        tx_type=tx_type,
        status=status,
        reversal_of_id=reversal_of_id,
        category_id=category_id,
    )


def test_reversed_transaction_has_zero_net_effect():
    """Transaksi asli + baris reversal tidak boleh menghasilkan angka negatif."""
    transactions = [
        _tx(date(2026, 1, 5), "1000000", status="reversed"),
        _tx(date(2026, 1, 5), "1000000", reversal_of_id=1),
        _tx(date(2026, 1, 10), "500"),
    ]

    result = summarize(transactions, date(2026, 1, 1), date(2026, 1, 31))

    assert result["metrics"]["net_revenue"]["value"] == "500.00"
    assert result["metrics"]["cash_in"]["value"] == "500.00"
    assert result["data_quality"]["transaction_count"] == 1


def test_forecast_ignores_reversal_rows():
    transactions = [
        _tx(date(2026, 1, 5), "1000000", status="reversed"),
        _tx(date(2026, 1, 5), "1000000", reversal_of_id=1),
        _tx(date(2026, 1, 10), "500"),
        _tx(date(2026, 2, 10), "700"),
    ]

    result = calculate_cash_flow_forecast(transactions, horizon=1)

    assert result["status"] == "available"
    assert result["predictions"][0]["predicted_value"] == "600.00"


def test_create_update_reverse_transaction_flow(client, org_a_setup):
    headers = org_a_setup["headers"]
    income_category = org_a_setup["cat_map"][("Penjualan", "income")]

    created = client.post(
        "/api/v1/transactions",
        headers=headers,
        json={
            "transaction_date": "2026-11-05",
            "description": "Penjualan demo test",
            "amount": "1000.00",
            "tx_type": "income",
            "category_id": income_category,
        },
    )
    assert created.status_code == 201, created.text
    tx_id = created.json()["id"]

    listed = client.get(
        "/api/v1/transactions",
        headers=headers,
        params={"from": "2026-11-01", "to": "2026-11-30"},
    )
    assert listed.status_code == 200
    assert listed.json()["total"] == 1

    updated = client.patch(
        f"/api/v1/transactions/{tx_id}",
        headers=headers,
        json={"amount": "2000.00", "description": "Penjualan demo test (edit)"},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["amount"] == "2000.00"

    reversed_response = client.post(
        f"/api/v1/transactions/{tx_id}/reverse", headers=headers
    )
    assert reversed_response.status_code == 201, reversed_response.text

    # Hanya transaksi asli yang tampil (status reversed), bukan baris reversal.
    listed_after = client.get(
        "/api/v1/transactions",
        headers=headers,
        params={"from": "2026-11-01", "to": "2026-11-30"},
    )
    items = listed_after.json()["items"]
    assert len(items) == 1
    assert items[0]["status"] == "reversed"
    assert items[0]["reversal_of_id"] is None

    summary = client.get(
        "/api/v1/financial/summary",
        headers=headers,
        params={"from": "2026-11-01", "to": "2026-11-30"},
    )
    assert summary.status_code == 200, summary.text
    assert summary.json()["metrics"]["net_revenue"]["value"] == "0.00"


def test_list_transactions_filters(client, org_a_setup):
    headers = org_a_setup["headers"]
    income_category = org_a_setup["cat_map"][("Penjualan", "income")]
    expense_category = org_a_setup["cat_map"][("Operasional", "expense")]

    for payload in [
        {
            "transaction_date": "2026-11-01",
            "description": "Penjualan kopi",
            "amount": "1000.00",
            "tx_type": "income",
            "category_id": income_category,
        },
        {
            "transaction_date": "2026-11-02",
            "description": "Bayar listrik",
            "amount": "250.00",
            "tx_type": "expense",
            "category_id": expense_category,
        },
    ]:
        response = client.post("/api/v1/transactions", headers=headers, json=payload)
        assert response.status_code == 201, response.text

    expense_only = client.get(
        "/api/v1/transactions",
        headers=headers,
        params={"from": "2026-11-01", "to": "2026-11-30", "tx_type": "expense"},
    )
    assert expense_only.status_code == 200
    assert expense_only.json()["total"] == 1
    assert expense_only.json()["items"][0]["description"] == "Bayar listrik"

    by_category = client.get(
        "/api/v1/transactions",
        headers=headers,
        params={
            "from": "2026-11-01",
            "to": "2026-11-30",
            "category_id": income_category,
        },
    )
    assert by_category.status_code == 200
    assert by_category.json()["total"] == 1
    assert by_category.json()["items"][0]["description"] == "Penjualan kopi"

    by_search = client.get(
        "/api/v1/transactions",
        headers=headers,
        params={"from": "2026-11-01", "to": "2026-11-30", "search": "listrik"},
    )
    assert by_search.status_code == 200
    assert by_search.json()["total"] == 1
    assert by_search.json()["items"][0]["description"] == "Bayar listrik"


def test_tenant_cannot_read_other_tenant_transaction(
    client, org_a_setup, org_b_setup
):
    headers_a = org_a_setup["headers"]
    headers_b = org_b_setup["headers"]
    category = org_a_setup["cat_map"][("Penjualan", "income")]

    created = client.post(
        "/api/v1/transactions",
        headers=headers_a,
        json={
            "transaction_date": "2026-11-05",
            "description": "Rahasia tenant A",
            "amount": "1000.00",
            "tx_type": "income",
            "category_id": category,
        },
    )
    tx_id = created.json()["id"]

    response = client.get(f"/api/v1/transactions/{tx_id}", headers=headers_b)
    assert response.status_code == 404
