"""
Tests RBAC — verifikasi role enforcement di backend.
Setiap endpoint yang mutasi data harus menolak role yang tidak berhak.
"""
import pytest
from app import models
from app.security import hash_password
from app.main import DEFAULT_CATEGORIES


@pytest.fixture
def org_with_roles(db_session):
    """Org dengan 4 user: owner, admin, member, viewer."""
    users = {}
    for role in ("owner", "admin", "member", "viewer"):
        email = f"{role}_rbac@profitai.test"
        u = models.User(
            email=email,
            password_hash=hash_password("Password123!"),
            full_name=f"User {role.title()}"
        )
        db_session.add(u); db_session.flush()
        users[role] = u

    org = models.Organization(name="RBAC Test Org")
    db_session.add(org); db_session.flush()

    db_session.add(models.BusinessProfile(organization_id=org.id))

    tokens = {}
    for role, u in users.items():
        db_session.add(models.Membership(organization_id=org.id, user_id=u.id, role=role))
        sess = models.Session(token=f"rbac_token_{role}", user_id=u.id)
        db_session.add(sess)
        tokens[role] = f"rbac_token_{role}"

    cat_map = {}
    for name, t in DEFAULT_CATEGORIES:
        c = models.Category(organization_id=org.id, name=name, tx_type=t)
        db_session.add(c); db_session.flush()
        cat_map[(name, t)] = c.id

    db_session.commit()
    return {
        "org": org,
        "users": users,
        "tokens": tokens,
        "cat_map": cat_map,
        "headers": {
            role: {"Authorization": f"Bearer rbac_token_{role}"}
            for role in ("owner", "admin", "member", "viewer")
        }
    }


TX_PAYLOAD = {
    "transaction_date": "2026-01-15",
    "description": "Test RBAC Transaction",
    "amount": "1000000.00",
    "tx_type": "income",
}


class TestTransactionRBAC:

    def test_owner_can_create_transaction(self, client, org_with_roles):
        resp = client.post("/api/v1/transactions",
                           headers=org_with_roles["headers"]["owner"],
                           json=TX_PAYLOAD)
        assert resp.status_code == 201

    def test_admin_can_create_transaction(self, client, org_with_roles):
        resp = client.post("/api/v1/transactions",
                           headers=org_with_roles["headers"]["admin"],
                           json=TX_PAYLOAD)
        assert resp.status_code == 201

    def test_member_can_create_transaction(self, client, org_with_roles):
        resp = client.post("/api/v1/transactions",
                           headers=org_with_roles["headers"]["member"],
                           json=TX_PAYLOAD)
        assert resp.status_code == 201

    def test_viewer_cannot_create_transaction(self, client, org_with_roles):
        resp = client.post("/api/v1/transactions",
                           headers=org_with_roles["headers"]["viewer"],
                           json=TX_PAYLOAD)
        assert resp.status_code == 403

    def test_viewer_cannot_patch_transaction(self, client, org_with_roles):
        # Owner buat transaksi dulu
        create = client.post("/api/v1/transactions",
                             headers=org_with_roles["headers"]["owner"],
                             json=TX_PAYLOAD)
        tx_id = create.json()["id"]

        resp = client.patch(f"/api/v1/transactions/{tx_id}",
                            headers=org_with_roles["headers"]["viewer"],
                            json={"description": "Hacked"})
        assert resp.status_code == 403

    def test_member_cannot_reverse_transaction(self, client, org_with_roles):
        create = client.post("/api/v1/transactions",
                             headers=org_with_roles["headers"]["owner"],
                             json=TX_PAYLOAD)
        tx_id = create.json()["id"]

        resp = client.post(f"/api/v1/transactions/{tx_id}/reverse",
                           headers=org_with_roles["headers"]["member"])
        assert resp.status_code == 403

    def test_viewer_cannot_reverse_transaction(self, client, org_with_roles):
        create = client.post("/api/v1/transactions",
                             headers=org_with_roles["headers"]["owner"],
                             json=TX_PAYLOAD)
        tx_id = create.json()["id"]

        resp = client.post(f"/api/v1/transactions/{tx_id}/reverse",
                           headers=org_with_roles["headers"]["viewer"])
        assert resp.status_code == 403

    def test_all_roles_can_read_transactions(self, client, org_with_roles):
        for role in ("owner", "admin", "member", "viewer"):
            resp = client.get("/api/v1/transactions?from=2026-01-01&to=2026-01-31",
                              headers=org_with_roles["headers"][role])
            assert resp.status_code == 200, f"Role {role} should be able to read transactions"


class TestCategoryRBAC:

    def test_owner_can_create_category(self, client, org_with_roles):
        resp = client.post("/api/v1/categories",
                           headers=org_with_roles["headers"]["owner"],
                           json={"name": "Kategori Baru", "tx_type": "income"})
        assert resp.status_code == 201

    def test_admin_can_create_category(self, client, org_with_roles):
        resp = client.post("/api/v1/categories",
                           headers=org_with_roles["headers"]["admin"],
                           json={"name": "Kategori Admin", "tx_type": "expense"})
        assert resp.status_code == 201

    def test_member_cannot_create_category(self, client, org_with_roles):
        resp = client.post("/api/v1/categories",
                           headers=org_with_roles["headers"]["member"],
                           json={"name": "Kategori Member", "tx_type": "income"})
        assert resp.status_code == 403

    def test_viewer_cannot_create_category(self, client, org_with_roles):
        resp = client.post("/api/v1/categories",
                           headers=org_with_roles["headers"]["viewer"],
                           json={"name": "Kategori Viewer", "tx_type": "income"})
        assert resp.status_code == 403


class TestMemberManagementRBAC:

    def test_non_owner_cannot_add_member(self, client, org_with_roles):
        org_id = org_with_roles["org"].id
        for role in ("admin", "member", "viewer"):
            resp = client.post(
                f"/api/v1/organizations/{org_id}/members",
                headers=org_with_roles["headers"][role],
                json={"email": "newuser@test.com", "role": "member"}
            )
            assert resp.status_code == 403, f"Role {role} should not be able to add members"

    def test_owner_can_list_members(self, client, org_with_roles):
        org_id = org_with_roles["org"].id
        resp = client.get(f"/api/v1/organizations/{org_id}/members",
                          headers=org_with_roles["headers"]["owner"])
        assert resp.status_code == 200

    def test_non_owner_cannot_delete_member(self, client, org_with_roles):
        org_id = org_with_roles["org"].id
        member_user_id = org_with_roles["users"]["viewer"].id
        for role in ("admin", "member"):
            resp = client.delete(
                f"/api/v1/organizations/{org_id}/members/{member_user_id}",
                headers=org_with_roles["headers"][role]
            )
            assert resp.status_code == 403, f"Role {role} should not be able to delete members"


class TestSuperAdminRBAC:

    def test_regular_user_cannot_access_admin_endpoints(self, client, org_with_roles):
        for role in ("owner", "admin", "member", "viewer"):
            resp = client.get("/api/v1/admin/organizations",
                              headers=org_with_roles["headers"][role])
            assert resp.status_code == 403, f"Role {role} should not access admin endpoints"

    def test_regular_user_cannot_access_admin_users(self, client, org_with_roles):
        resp = client.get("/api/v1/admin/users",
                          headers=org_with_roles["headers"]["owner"])
        assert resp.status_code == 403
