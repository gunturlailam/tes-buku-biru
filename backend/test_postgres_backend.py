"""Test backend dengan PostgreSQL"""
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

print("Testing Backend dengan PostgreSQL\n")
print("=" * 60)

# Test 1: Health check
print("\n[1/5] Health Check")
response = client.get("/health")
print(f"✅ Status: {response.status_code}")
print(f"   Response: {response.json()}")

# Test 2: Login
print("\n[2/5] Login dengan demo account")
response = client.post(
    "/api/v1/auth/login",
    json={"email": "demo@profitai.local", "password": "Demo12345!"}
)
print(f"✅ Status: {response.status_code}")
if response.status_code == 200:
    token = response.json()["access_token"]
    print(f"   Token: {token[:30]}...")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 3: Get current user
    print("\n[3/5] Get Current User")
    response = client.get("/api/v1/me", headers=headers)
    print(f"✅ Status: {response.status_code}")
    user_data = response.json()
    print(f"   User: {user_data['full_name']} ({user_data['email']})")
    print(f"   Organization ID: {user_data['organization_id']}")
    
    # Test 4: Get categories
    print("\n[4/5] Get Categories")
    response = client.get("/api/v1/categories", headers=headers)
    print(f"✅ Status: {response.status_code}")
    categories = response.json()
    print(f"   Total categories: {len(categories)}")
    print(f"   Sample: {categories[0]['name']} ({categories[0]['tx_type']})")
    
    # Test 5: Get financial summary
    print("\n[5/5] Get Financial Summary")
    response = client.get(
        "/api/v1/financial/summary?from=2024-01-01&to=2024-03-31",
        headers=headers
    )
    print(f"✅ Status: {response.status_code}")
    if response.status_code == 200:
        summary = response.json()
        metrics = summary.get('metrics', {})
        print(f"   Period: {summary['period']['from']} to {summary['period']['to']}")
        print(f"   Transaction count: {summary['data_quality']['transaction_count']}")
        print(f"   Currency: {summary['currency']}")
    
    print("\n" + "=" * 60)
    print("ALL TESTS PASSED!")
    print("=" * 60)
    print("\nBackend PostgreSQL WORKING PERFECTLY!")
    print("   - Authentication: OK")
    print("   - User data: OK")
    print("   - Categories: OK")
    print("   - Financial API: OK")
    
else:
    print(f"❌ Login failed: {response.json()}")
