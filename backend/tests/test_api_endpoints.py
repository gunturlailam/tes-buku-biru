def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_auth_register_and_login(client):
    # Register
    reg_data = {
        "email": "newuser@profitai.test",
        "password": "StrongPassword123!",
        "full_name": "Test User",
        "organization_name": "Toko Baru"
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_data)
    assert reg_resp.status_code == 201
    assert "user_id" in reg_resp.json()

    # Login
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "newuser@profitai.test",
        "password": "StrongPassword123!"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    assert token is not None

    # Get Me
    me_resp = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "newuser@profitai.test"

def test_transactions_crud_and_patch(client, org_a_setup):
    headers = org_a_setup["headers"]
    cat_id = org_a_setup["cat_map"][("Operasional", "expense")]

    # 1. Create Transaction
    create_resp = client.post(
        "/api/v1/transactions",
        headers=headers,
        json={
            "transaction_date": "2026-02-10",
            "description": "Beli Alat Tulis Kantor",
            "amount": "150000.00",
            "tx_type": "expense",
            "category_id": cat_id
        }
    )
    assert create_resp.status_code == 201
    tx = create_resp.json()
    tx_id = tx["id"]
    assert tx["description"] == "Beli Alat Tulis Kantor"

    # 2. Read Transaction
    get_resp = client.get(f"/api/v1/transactions/{tx_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == tx_id

    # 3. Update (PATCH) Transaction
    patch_resp = client.patch(
        f"/api/v1/transactions/{tx_id}",
        headers=headers,
        json={
            "description": "Beli Perlengkapan & ATK Kantor",
            "amount": "175000.00"
        }
    )
    assert patch_resp.status_code == 200
    updated_tx = patch_resp.json()
    assert updated_tx["description"] == "Beli Perlengkapan & ATK Kantor"
    assert updated_tx["amount"] == "175000.00"

    # 4. Reverse Transaction
    rev_resp = client.post(f"/api/v1/transactions/{tx_id}/reverse", headers=headers)
    assert rev_resp.status_code == 201
    assert rev_resp.json()["reversal_of_id"] == tx_id

    # 5. Modifying reversed transaction must fail
    patch_fail = client.patch(
        f"/api/v1/transactions/{tx_id}",
        headers=headers,
        json={"description": "Try edit reversed"}
    )
    assert patch_fail.status_code == 409

    # 6. Check reversals history
    rev_list = client.get("/api/v1/transactions/reversals", headers=headers)
    assert rev_list.status_code == 200
    assert len(rev_list.json()) >= 1

def test_financial_reports_endpoints(client, org_a_setup):
    headers = org_a_setup["headers"]

    # 1. Summary
    resp_sum = client.get("/api/v1/financial/summary?from=2026-01-01&to=2026-12-31", headers=headers)
    assert resp_sum.status_code == 200
    assert "metrics" in resp_sum.json()

    # 2. Profit & Loss
    resp_pl = client.get("/api/v1/financial/profit-loss?from=2026-01-01&to=2026-12-31", headers=headers)
    assert resp_pl.status_code == 200
    assert "items" in resp_pl.json()
    assert "ratios" in resp_pl.json()

    # 3. Cash Flow
    resp_cf = client.get("/api/v1/financial/cash-flow?from=2026-01-01&to=2026-12-31", headers=headers)
    assert resp_cf.status_code == 200
    assert "items" in resp_cf.json()
    assert "breakdown" in resp_cf.json()

    # 4. Financial Health
    resp_fh = client.get("/api/v1/financial/health?from=2026-01-01&to=2026-12-31", headers=headers)
    assert resp_fh.status_code == 200
    assert "signals" in resp_fh.json()

    # 5. Recommendations
    resp_rec = client.get("/api/v1/recommendations?from=2026-01-01&to=2026-12-31", headers=headers)
    assert resp_rec.status_code == 200
    assert "recommendations" in resp_rec.json()

def test_organization_profile_get_and_patch(client, org_a_setup):
    headers = org_a_setup["headers"]
    org_id = org_a_setup["org"].id

    # Get Organization
    get_resp = client.get(f"/api/v1/organizations/{org_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "Bisnis Sukses Org A"

    # Patch Organization
    patch_resp = client.patch(
        f"/api/v1/organizations/{org_id}",
        headers=headers,
        json={"name": "Bisnis Sukses Terpercaya", "industry": "Kuliner Nusantara"}
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["name"] == "Bisnis Sukses Terpercaya"
    assert patch_resp.json()["industry"] == "Kuliner Nusantara"

def test_accounts_crud(client, org_a_setup):
    headers = org_a_setup["headers"]

    # 1. Create account
    create_resp = client.post(
        "/api/v1/accounts",
        headers=headers,
        json={
            "code": "1001",
            "name": "Kas Utama",
            "account_type": "asset",
            "normal_balance": "debit"
        }
    )
    assert create_resp.status_code == 201
    acc_id = create_resp.json()["id"]

    # 2. List accounts
    list_resp = client.get("/api/v1/accounts", headers=headers)
    assert list_resp.status_code == 200
    assert any(a["id"] == acc_id for a in list_resp.json())

    # 3. Patch account
    patch_resp = client.patch(
        f"/api/v1/accounts/{acc_id}",
        headers=headers,
        json={"name": "Kas Operasional Toko"}
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["name"] == "Kas Operasional Toko"

    # 4. Deactivate account
    del_resp = client.delete(f"/api/v1/accounts/{acc_id}", headers=headers)
    assert del_resp.status_code == 200

def test_categories_crud(client, org_a_setup):
    headers = org_a_setup["headers"]

    # 1. Create category
    create_resp = client.post(
        "/api/v1/categories",
        headers=headers,
        json={
            "name": "Biaya Promosi",
            "tx_type": "expense"
        }
    )
    assert create_resp.status_code == 201
    cat_id = create_resp.json()["id"]

    # 2. Patch category
    patch_resp = client.patch(
        f"/api/v1/categories/{cat_id}",
        headers=headers,
        json={"name": "Biaya Marketing Digital"}
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["name"] == "Biaya Marketing Digital"

    # 3. Delete category
    del_resp = client.delete(f"/api/v1/categories/{cat_id}", headers=headers)
    assert del_resp.status_code == 200

def test_members_crud(client, org_a_setup, org_b_setup):
    headers = org_a_setup["headers"]
    org_id = org_a_setup["org"].id
    user_b_email = org_b_setup["user"].email

    # 1. Add member
    add_resp = client.post(
        f"/api/v1/organizations/{org_id}/members",
        headers=headers,
        json={"email": user_b_email, "role": "admin"}
    )
    assert add_resp.status_code == 201
    user_b_id = add_resp.json()["user_id"]

    # 2. List members
    list_resp = client.get(f"/api/v1/organizations/{org_id}/members", headers=headers)
    assert list_resp.status_code == 200
    assert any(m["user_id"] == user_b_id for m in list_resp.json())

    # 3. Update member role
    patch_resp = client.patch(
        f"/api/v1/organizations/{org_id}/members/{user_b_id}",
        headers=headers,
        json={"role": "viewer"}
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["role"] == "viewer"

    # 4. Remove member
    del_resp = client.delete(f"/api/v1/organizations/{org_id}/members/{user_b_id}", headers=headers)
    assert del_resp.status_code == 200

def test_opening_balances_crud(client, org_a_setup):
    headers = org_a_setup["headers"]

    # Create account first
    acc_resp = client.post(
        "/api/v1/accounts",
        headers=headers,
        json={"code": "1002", "name": "Bank BRI", "account_type": "asset"}
    )
    acc_id = acc_resp.json()["id"]

    # Create opening balance
    ob_resp = client.post(
        "/api/v1/opening-balances",
        headers=headers,
        json={"account_id": acc_id, "effective_date": "2026-01-01", "amount": "10000000.00"}
    )
    assert ob_resp.status_code == 201
    ob_id = ob_resp.json()["id"]

    # List opening balances
    ob_list = client.get("/api/v1/opening-balances", headers=headers)
    assert ob_list.status_code == 200
    assert any(item["id"] == ob_id for item in ob_list.json())

    # Patch opening balance
    patch_ob = client.patch(
        f"/api/v1/opening-balances/{ob_id}",
        headers=headers,
        json={"amount": "12000000.00"}
    )
    assert patch_ob.status_code == 200
    assert patch_ob.json()["amount"] == "12000000.00"

def test_forecast_and_audit_events(client, org_a_setup):
    headers = org_a_setup["headers"]

    # Create forecast
    fc_resp = client.post(
        "/api/v1/forecasts/cash-flow",
        headers=headers,
        json={"target": "cash_flow", "horizon": 3, "period_unit": "month"}
    )
    assert fc_resp.status_code == 201
    fc_id = fc_resp.json()["id"]

    # Get forecast
    get_fc = client.get(f"/api/v1/forecasts/{fc_id}", headers=headers)
    assert get_fc.status_code == 200
    assert get_fc.json()["id"] == fc_id

    # List audit events
    audit_resp = client.get("/api/v1/audit-events", headers=headers)
    assert audit_resp.status_code == 200
    assert audit_resp.json()["total"] >= 1
