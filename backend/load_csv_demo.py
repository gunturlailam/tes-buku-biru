import csv
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from app.db import SessionLocal
from app import models

def load_csv_to_db(csv_file, org_id, user_id, category_map):
    """Load CSV transactions into database"""
    db = SessionLocal()
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                # Parse data
                tx_date = datetime.strptime(row['transaction_date'], '%Y-%m-%d').date()
                amount = Decimal(row['amount'])
                tx_type = row['type']
                
                # Find category - map CSV category to our categories
                category_id = None
                csv_category = row.get('category', '').lower()
                if tx_type == 'income':
                    category_id = category_map.get(('Penjualan', 'income'))
                elif tx_type == 'expense':
                    if 'cogs' in csv_category or 'bahan' in row['description'].lower():
                        category_id = category_map.get(('Operasional', 'expense'))
                    elif 'gaji' in row['description'].lower():
                        category_id = category_map.get(('Gaji', 'expense'))
                    elif 'sewa' in row['description'].lower():
                        category_id = category_map.get(('Sewa', 'expense'))
                    else:
                        category_id = category_map.get(('Operasional', 'expense'))
                
                # Create transaction
                tx = models.Transaction(
                    organization_id=org_id,
                    transaction_date=tx_date,
                    description=row['description'],
                    amount=amount,
                    tx_type=tx_type,
                    category_id=category_id,
                    status='posted',
                    created_by=user_id
                )
                db.add(tx)
                count += 1
            
            db.commit()
            return count
    finally:
        db.close()

def main():
    db = SessionLocal()
    
    # Get demo user
    user = db.query(models.User).filter_by(email='demo@profitai.local').first()
    if not user:
        print("❌ User demo tidak ditemukan! Run seed_demo.py dulu.")
        db.close()
        return
    
    # Get organization
    membership = db.query(models.Membership).filter_by(user_id=user.id).first()
    if not membership:
        print("❌ Organization tidak ditemukan!")
        db.close()
        return
    
    org_id = membership.organization_id
    
    # Build category map
    categories = db.query(models.Category).filter_by(organization_id=org_id).all()
    category_map = {(c.name, c.tx_type): c.id for c in categories}
    
    db.close()
    
    # CSV files to load
    base_path = Path(__file__).parent.parent / 'data' / 'demo'
    csv_files = [
        ('transactions_healthy_business.csv', 'Healthy Business'),
        ('transactions_cash_problem.csv', 'Cash Problem'),
        ('transactions_mixed_signals.csv', 'Mixed Signals')
    ]
    
    print(f"🔄 Loading CSV demo data untuk org_id={org_id}, user_id={user.id}\n")
    
    total = 0
    for filename, label in csv_files:
        csv_path = base_path / filename
        if csv_path.exists():
            count = load_csv_to_db(csv_path, org_id, user.id, category_map)
            print(f"✅ {label:20s} : {count:3d} transaksi")
            total += count
        else:
            print(f"⚠️  {label:20s} : File tidak ditemukan")
    
    print(f"\n🎉 Total {total} transaksi berhasil dimuat!\n")
    print("Test dengan:")
    print("  http://localhost:8000/api/v1/financial/summary?from=2024-01-01&to=2024-12-31")

if __name__ == '__main__':
    main()
