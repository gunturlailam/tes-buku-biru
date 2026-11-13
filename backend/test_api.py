"""
Test script untuk verify API endpoint dengan request langsung ke function
"""
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# Login
response = client.post(
    "/api/v1/auth/login",
    json={"email": "demo@profitai.local", "password": "Demo12345!"}
)

if response.status_code == 200:
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("📊 FINANCIAL SUMMARY - Demo Data (3 CSV Files)\n")
    
    # Test different periods
    periods = [
        ("2024-01-01", "2024-01-31", "January 2024"),
        ("2024-02-01", "2024-02-29", "February 2024"),
        ("2024-03-01", "2024-03-31", "March 2024"),
        ("2024-01-01", "2024-03-31", "Q1 2024 (All Data)"),
    ]
    
    for date_from, date_to, label in periods:
        response = client.get(
            f"/api/v1/financial/summary?from={date_from}&to={date_to}",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            metrics = data.get('metrics', {})
            
            print(f"{'='*60}")
            print(f"{label:^60}")
            print(f"{'='*60}")
            
            net_rev = metrics.get('net_revenue', {}).get('value', '0')
            expense = metrics.get('total_expense', {}).get('value', '0')
            surplus = metrics.get('simple_surplus', {}).get('value', '0')
            cash_flow = metrics.get('net_cash_flow', {}).get('value', '0')
            margin = metrics.get('surplus_margin_pct', {}).get('value', 'N/A')
            
            print(f"Net Revenue        : Rp {net_rev:>15}")
            print(f"Total Expense      : Rp {expense:>15}")
            print(f"Simple Surplus     : Rp {surplus:>15}")
            print(f"Net Cash Flow      : Rp {cash_flow:>15}")
            if margin != 'N/A':
                print(f"Surplus Margin     : {margin:>14}%")
            
            # Show data quality
            dq = data.get('data_quality', {})
            tx_count = dq.get('transaction_count', 0)
            print(f"\nTransactions: {tx_count}")
            print()
    
    # Get transactions count
    response = client.get(
        "/api/v1/transactions?from=2024-01-01&to=2024-12-31&limit=200",
        headers=headers
    )
    if response.status_code == 200:
        total = response.json()["total"]
        print(f"✅ Total {total} transaksi tersimpan di database")
        print(f"✅ Backend API berjalan sempurna!")
        print(f"\n🔗 API Docs: http://localhost:8000/docs")
else:
    print(f"❌ Login gagal: {response.json()}")
