def test_tenant_isolation_transactions(client, org_a_setup, org_b_setup):
    headers_a = org_a_setup["headers"]
    headers_b = org_b_setup["headers"]

    # 1. Org A creates a transaction
    resp_create = client.post(
        "/api/v1/transactions",
        headers=headers_a,
        json={
            "transaction_date": "2026-01-20",
            "description": "Penjualan Rahasia Org A",
            "amount": "5000000.00",
            "tx_type": "income",
            "category_id": org_a_setup["cat_map"][("Penjualan", "income")]
        }
    )
    assert resp_create.status_code == 201
    tx_a_id = resp_create.json()["id"]

    # 2. Org B tries to read Org A's transaction -> MUST return 404
    resp_get = client.get(f"/api/v1/transactions/{tx_a_id}", headers=headers_b)
    assert resp_get.status_code == 404

    # 3. Org B lists transactions -> MUST NOT see Org A's transaction
    resp_list_b = client.get(
        "/api/v1/transactions?from=2026-01-01&to=2026-01-31",
        headers=headers_b
    )
    assert resp_list_b.status_code == 200
    b_items = resp_list_b.json()["items"]
    assert all(item["id"] != tx_a_id for item in b_items)

    # 4. Org B tries to update (PATCH) Org A's transaction -> MUST return 404
    resp_patch = client.patch(
        f"/api/v1/transactions/{tx_a_id}",
        headers=headers_b,
        json={"description": "Hacked by Org B"}
    )
    assert resp_patch.status_code == 404

    # 5. Org B tries to reverse Org A's transaction -> MUST return 404
    resp_rev = client.post(
        f"/api/v1/transactions/{tx_a_id}/reverse",
        headers=headers_b
    )
    assert resp_rev.status_code == 404

def test_tenant_isolation_organization_profile(client, org_a_setup, org_b_setup):
    headers_a = org_a_setup["headers"]
    org_b_id = org_b_setup["org"].id

    # Org A tries to read Org B profile -> 403 Forbidden
    resp_get = client.get(f"/api/v1/organizations/{org_b_id}", headers=headers_a)
    assert resp_get.status_code == 403

    # Org A tries to modify Org B profile -> 403 Forbidden
    resp_patch = client.patch(
        f"/api/v1/organizations/{org_b_id}",
        headers=headers_a,
        json={"name": "Hacked Org Name"}
    )
    assert resp_patch.status_code == 403

def test_tenant_cannot_use_other_org_category(client, org_a_setup, org_b_setup):
    headers_a = org_a_setup["headers"]
    cat_b_id = org_b_setup["cat_map"][("Penjualan", "income")]

    # Org A tries to create transaction using Org B's category_id -> 422 Unprocessable Entity
    resp = client.post(
        "/api/v1/transactions",
        headers=headers_a,
        json={
            "transaction_date": "2026-01-22",
            "description": "Cross Category Abuse",
            "amount": "1000000.00",
            "tx_type": "income",
            "category_id": cat_b_id
        }
    )
    assert resp.status_code == 422
    assert "Kategori tidak ditemukan" in resp.json()["error"]["message"]

