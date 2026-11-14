import os, pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db import Base, get_db
from app.main import app, DEFAULT_CATEGORIES
from app import models
from app.security import hash_password

# Tabel test dibuat oleh fixture setup_test_db. Jangan biarkan startup app
# menyentuh database aplikasi (PostgreSQL) saat test berjalan.
app.router.on_startup.clear()

TEST_DATABASE_URL = "sqlite:///./test_profitai.db"

engine_test = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

@pytest.fixture(scope="function", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine_test)
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)
    if os.path.exists("./test_profitai.db"):
        try:
            os.remove("./test_profitai.db")
        except Exception:
            pass

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def org_a_setup(db_session):
    # Setup Org A with User A
    user_a = models.User(
        email="owner_a@profitai.test",
        password_hash=hash_password("Password123!"),
        full_name="Owner Org A"
    )
    db_session.add(user_a)
    db_session.flush()

    org_a = models.Organization(name="Bisnis Sukses Org A")
    db_session.add(org_a)
    db_session.flush()

    mem_a = models.Membership(organization_id=org_a.id, user_id=user_a.id, role="owner")
    db_session.add(mem_a)

    prof_a = models.BusinessProfile(organization_id=org_a.id, industry="F&B")
    db_session.add(prof_a)

    cat_map = {}
    for name, t in DEFAULT_CATEGORIES:
        c = models.Category(organization_id=org_a.id, name=name, tx_type=t)
        db_session.add(c)
        db_session.flush()
        cat_map[(name, t)] = c.id

    sess_a = models.Session(token="token_org_a_valid_123", user_id=user_a.id)
    db_session.add(sess_a)

    db_session.commit()
    return {
        "user": user_a,
        "org": org_a,
        "token": sess_a.token,
        "headers": {"Authorization": f"Bearer {sess_a.token}"},
        "cat_map": cat_map
    }

@pytest.fixture
def org_b_setup(db_session):
    # Setup Org B with User B (different tenant)
    user_b = models.User(
        email="owner_b@profitai.test",
        password_hash=hash_password("Password456!"),
        full_name="Owner Org B"
    )
    db_session.add(user_b)
    db_session.flush()

    org_b = models.Organization(name="Usaha Maju Org B")
    db_session.add(org_b)
    db_session.flush()

    mem_b = models.Membership(organization_id=org_b.id, user_id=user_b.id, role="owner")
    db_session.add(mem_b)

    prof_b = models.BusinessProfile(organization_id=org_b.id, industry="Retail")
    db_session.add(prof_b)

    cat_map = {}
    for name, t in DEFAULT_CATEGORIES:
        c = models.Category(organization_id=org_b.id, name=name, tx_type=t)
        db_session.add(c)
        db_session.flush()
        cat_map[(name, t)] = c.id

    sess_b = models.Session(token="token_org_b_valid_456", user_id=user_b.id)
    db_session.add(sess_b)

    db_session.commit()
    return {
        "user": user_b,
        "org": org_b,
        "token": sess_b.token,
        "headers": {"Authorization": f"Bearer {sess_b.token}"},
        "cat_map": cat_map
    }
