import io

def test_csv_import_preview_and_confirm(client, org_a_setup):
    headers = org_a_setup["headers"]

    csv_content = """transaction_date,description,amount,type,category
2026-03-01,Penjualan Kopi Batch 1,500000.00,income,Penjualan
2026-03-02,Beli Biji Kopi Arabika,200000.00,expense,Operasional
"""
    # 1. Preview
    files = {"file": ("demo.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    resp_prev = client.post("/api/v1/imports/transactions/preview", headers=headers, files=files)
    assert resp_prev.status_code == 200
    prev_data = resp_prev.json()
    assert prev_data["valid_count"] == 2
    assert prev_data["error_count"] == 0
    assert len(prev_data["rows"]) == 2

    # 2. Confirm
    confirm_payload = {
        "transactions": [
            {
                "transaction_date": r["transaction_date"],
                "description": r["description"],
                "amount": r["amount"],
                "tx_type": r["tx_type"],
                "category_id": r["category_id"]
            }
            for r in prev_data["rows"]
        ]
    }
    resp_conf = client.post("/api/v1/imports/transactions/confirm", headers=headers, json=confirm_payload)
    assert resp_conf.status_code == 201
    assert resp_conf.json()["imported_count"] == 2

    # 3. Preview again with same CSV -> Must detect duplicate
    files_again = {"file": ("demo.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    resp_prev_again = client.post("/api/v1/imports/transactions/preview", headers=headers, files=files_again)
    assert resp_prev_again.status_code == 200
    assert resp_prev_again.json()["duplicate_count"] == 2

def test_csv_import_invalid_header(client, org_a_setup):
    headers = org_a_setup["headers"]
    invalid_csv = "date,desc,nominal\n2026-01-01,Test,1000\n"
    files = {"file": ("bad.csv", io.BytesIO(invalid_csv.encode("utf-8")), "text/csv")}
    resp = client.post("/api/v1/imports/transactions/preview", headers=headers, files=files)
    assert resp.status_code == 422
    assert "Header CSV tidak lengkap" in resp.json()["error"]["message"]

