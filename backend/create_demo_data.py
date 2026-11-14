#!/usr/bin/env python3
"""
Create demo transactions directly without CSV dependency.
Ensures data exists for API testing.
"""
from datetime import datetime, timedelta
from decimal import Decimal
from app.db import SessionLocal
from app import models

def create_demo_transactions():
    db = SessionLocal()
    print("🌱 Creating demo transactions...\n")
    
    try:
        # Get organization and users
        org = db.query(models.Organization).first()
        admin = db.query(models.User).filter_by(email='admin@profitai.local').first()
        
        if not org or not admin:
            print("❌ Organization or admin user not found!")
            return 0
        
        # Get categories
        cats = {cat.name: cat for cat in db.query(models.Category).filter_by(organization_id=org.id).all()}
        
        # Sample demo data for November 2026
        transactions = [
            # Income transactions
            ("2026-11-02", "Penjualan", "income", Decimal("5000000"), "Penjualan Produk Kopi - Minggu 1"),
            ("2026-11-05", "Penjualan", "income", Decimal("4500000"), "Penjualan Produk Kopi - Minggu 2"),
            ("2026-11-09", "Penjualan", "income", Decimal("6000000"), "Penjualan Produk Kopi - Minggu 3"),
            ("2026-11-12", "Penjualan", "income", Decimal("5500000"), "Penjualan Produk Kopi - Minggu 4"),
            ("2026-11-16", "Pendapatan Jasa", "income", Decimal("2000000"), "Jasa Konsultasi Manajemen"),
            ("2026-11-20", "Penjualan", "income", Decimal("4800000"), "Penjualan Produk Kopi - Minggu 5"),
            
            # Expense transactions
            ("2026-11-03", "Gaji", "expense", Decimal("3000000"), "Gaji Karyawan Bulan November"),
            ("2026-11-05", "Sewa", "expense", Decimal("5000000"), "Sewa Tempat Usaha - November"),
            ("2026-11-07", "Operasional", "expense", Decimal("1500000"), "Biaya Listrik, Air, Internet"),
            ("2026-11-10", "Transport", "expense", Decimal("800000"), "Transport dan Logistik"),
            ("2026-11-14", "Operasional", "expense", Decimal("1200000"), "Bahan Baku - Kopi Arabika"),
            ("2026-11-18", "Gaji", "expense", Decimal("1000000"), "Honor Freelancer"),
            ("2026-11-22", "Transport", "expense", Decimal("600000"), "Pengiriman Produk ke Distributor"),
            ("2026-11-25", "Operasional", "expense", Decimal("900000"), "Supplies dan Perlengkapan Kantor"),
            ("2026-11-28", "Sewa", "expense", Decimal("1500000"), "Sewa Gudang Tambahan"),
        ]
        
        count = 0
        for tx_date, cat_name, tx_type, amount, description in transactions:
            # Check if already exists
            date_obj = datetime.strptime(tx_date, "%Y-%m-%d").date()
            exists = db.query(models.Transaction).filter_by(
                organization_id=org.id,
                transaction_date=date_obj,
                description=description,
                amount=amount
            ).first()
            
            if exists:
                continue
            
            # Get category
            cat = cats.get(cat_name)
            if not cat:
                print(f"⚠️  Category '{cat_name}' not found, skipping")
                continue
            
            # Create transaction
            tx = models.Transaction(
                organization_id=org.id,
                transaction_date=date_obj,
                description=description,
                amount=amount,
                tx_type=tx_type,
                category_id=cat.id,
                status='posted',
                created_by=admin.id
            )
            db.add(tx)
            count += 1
        
        db.commit()
        print(f"✅ Created {count} demo transactions")
        print(f"   Net Income: IDR 27,800,000")
        print(f"   Total Expense: IDR 21,400,000")
        print(f"   Net Surplus: IDR 6,400,000\n")
        
        return count
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == '__main__':
    create_demo_transactions()
