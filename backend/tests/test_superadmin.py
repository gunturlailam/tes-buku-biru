"""Tests untuk Super Admin endpoints."""
import pytest
from app import models
from app.security import hash_password


@pytest.fixture
def superadmin_setup(db_session):
    """Setup superadmin user dan beberapa org untuk ditest."""
    # Superadmin
    sa = models.User(
        email="superadmin@profitai.test",
        password_hash=hash_password("Password123!"),
        full_name="Super Admin",
        is_superadmin=True
    )
    db_session.add(sa); db_session.flush()

    # Org 1
    org1 = models.Organization(name="Org Satu")
    db_session.add(org1); db_session.flush()
    u1 = models.User(email="owner1@test.com", password_hash=hash_password("Pass123!"), full_name="Owner Satu")
    db_session.add(u1); db_session.flush()
    db_session.add(models.Membership(organization_id=org1.id, user_id=u1.id, role="owner"))
    db_session.add(models.BusinessProfile(organization_id=org1.id))

    # Org 2
    org2 = models.Organization(name="Org Dua")
    db_session.add(org2); db_session.flush()
    u2 = models.User(email="owner2@test.com", password_hash=hash_password("Pass123!"), full_name="Owner Dua")
    db_session.add(u2); db_session.flush()
    db_session.add(models.Membership(organization_id=org2.id, user_id=u2.id, role="owner"))
    db_session.add(models.BusinessProfile(organization_id=org2.id))

    # Session superadmin
    sess = models.Session(token="superadmin_test_token", user_id=sa.id)
    # Superadmin tidak perlu org membership untuk admin endpoints
    db_session.add(sess)
    db_session.commit()

    return {
        "superadmin": sa,
        "headers": {"Authorization": "Bearer superadmin_test_token"},
        "org1": org1,
        "org2": org2,
    }


def test_superadmin_can_list_organizations(client, superadmin_setup):
    resp = client.get("/api/v1/admin/organizations",
                      headers=superadmin_setup["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] >= 2


def test_superadmin_can_list_users(client, superadmin_setup):
    resp = client.get("/api/v1/admin/users",
                      headers=superadmin_setup["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert data["total"] >= 1


def test_superadmin_can_get_stats(client, superadmin_setup):
    resp = client.get("/api/v1/admin/stats",
                      headers=superadmin_setup["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert "total_organizations" in data
    assert "total_users" in data
    assert "total_posted_transactions" in data
    assert "generated_at" in data


def test_superadmin_can_toggle_superadmin(client, superadmin_setup, db_session):
    target_user = db_session.query(models.User).filter_by(email="owner1@test.com").first()

    # Set superadmin
    resp = client.patch(
        f"/api/v1/admin/users/{target_user.id}/superadmin",
        headers=superadmin_setup["headers"],
        json={"is_superadmin": True}
    )
    assert resp.status_code == 200
    assert resp.json()["is_superadmin"] is True

    # Unset superadmin
    resp2 = client.patch(
        f"/api/v1/admin/users/{target_user.id}/superadmin",
        headers=superadmin_setup["headers"],
        json={"is_superadmin": False}
    )
    assert resp2.status_code == 200
    assert resp2.json()["is_superadmin"] is False


def test_superadmin_cannot_toggle_self(client, superadmin_setup):
    sa_id = superadmin_setup["superadmin"].id
    resp = client.patch(
        f"/api/v1/admin/users/{sa_id}/superadmin",
        headers=superadmin_setup["headers"],
        json={"is_superadmin": False}
    )
    assert resp.status_code == 400


def test_superadmin_can_suspend_org(client, superadmin_setup):
    org_id = superadmin_setup["org1"].id
    resp = client.patch(
        f"/api/v1/admin/organizations/{org_id}/suspend",
        headers=superadmin_setup["headers"],
        json={"suspend": True, "reason": "Pelanggaran ToS"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_active"] is False
    assert data["suspended_reason"] == "Pelanggaran ToS"


def test_superadmin_can_activate_org(client, superadmin_setup):
    org_id = superadmin_setup["org1"].id
    # Suspend dulu
    client.patch(f"/api/v1/admin/organizations/{org_id}/suspend",
                 headers=superadmin_setup["headers"],
                 json={"suspend": True, "reason": "Test"})
    # Activate
    resp = client.patch(
        f"/api/v1/admin/organizations/{org_id}/suspend",
        headers=superadmin_setup["headers"],
        json={"suspend": False}
    )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is True


def test_suspended_org_user_cannot_access(client, superadmin_setup, db_session):
    """User dari org yang di-suspend tidak bisa akses data."""
    org1 = superadmin_setup["org1"]

    # Buat user + session untuk org1
    from app.main import DEFAULT_CATEGORIES
    for name, t in DEFAULT_CATEGORIES:
        db_session.add(models.Category(organization_id=org1.id, name=name, tx_type=t))
    u = db_session.query(models.User).filter_by(email="owner1@test.com").first()
    sess = models.Session(token="owner1_test_token", user_id=u.id)
    db_session.add(sess)
    db_session.commit()

    owner_headers = {"Authorization": "Bearer owner1_test_token"}

    # Suspend org1
    client.patch(f"/api/v1/admin/organizations/{org1.id}/suspend",
                 headers=superadmin_setup["headers"],
                 json={"suspend": True, "reason": "Test suspend"})

    # User org1 coba akses transactions -> harus 403
    resp = client.get("/api/v1/transactions?from=2026-01-01&to=2026-01-31",
                      headers=owner_headers)
    assert resp.status_code == 403
