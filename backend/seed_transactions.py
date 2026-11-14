#!/usr/bin/env python3
"""
Dedicated script to load demo transactions from CSV files.
Handles path issues and provides detailed logging.
"""
import csv
import hashlib
from datetime import datetime
from decimal import Decimal
from pathlib import Path

from app.db import SessionLocal, engine, Base
from app import models

def seed_transactions():
    db = SessionLocal()
    print("🌱 Loading transactions from CSV files...\n")
    
    try:
        # Get organization
        org = db.query(models.Organization).first()
        if not org:
            print("❌ No organization found. Run seed_demo.py first!")
            return
        
        # Get admin user
        admin_user = db.query(models.User).filter_by(email='admin@profitai.local').first()
        if not admin_user:
            print("❌ Admin user not found. Run seed_demo.py first!")
            return
        
        # Get category map
        cat_map = {}
        for cat in db.query(models.Category).filter_by(organization_id=org.id).all():
            key = (cat.name, cat.tx_type)
            cat_map[key] = cat.id
        
        print(f"Categories available: {len(cat_map)}")
        
        # Define CSV files
        csv_files = [
            ('transactions_healthy_business.csv', 'Healthy Business'),
            ('transactions_cash_problem.csv', 'Cash Problem'),
            ('transactions_mixed_signals.csv', 'Mixed Signals')
        ]
        
        # Use absolute path
        base_path = Path(__file__).parent.parent / 'data' / 'demo'
        print(f"Looking for CSV files in: {base_path.absolute()}\n")
        
        total_tx = 0
        
        for filename, label in csv_files:
            csv_path = base_path / filename
            
            if not csv_path.exists():
                print(f"⚠️  {label}: File not found at {csv_path}")
                continue
            
            print(f"📂 Processing {label} ({filename})...")
            
            with open(csv_path, 'r', encoding='utf-8') as f:
                content = f.read()
                file_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
            
            # Create batch
            batch = db.query(models.ImportBatch).filter_by(
                organization_id=org.id,
                filename=filename
            ).first()
            
            if not batch:
                batch = models.ImportBatch(
                    organization_id=org.id,
                    filename=filename,
                    file_hash=file_hash,
                    source="csv",
                    status="confirmed",
                    total_rows=0,
                    valid_rows=0,
                    duplicate_rows=0,
                    error_rows=0,
                    created_by=admin_user.id
                )
                db.add(batch)
                db.flush()
                print(f"  ✅ Created batch #{batch.id}")
            else:
                print(f"  ℹ️  Using existing batch #{batch.id}")
            
            # Parse and load CSV
            reader = csv.DictReader(content.splitlines())
            rows_added = 0
            duplicate_count = 0
            error_count = 0
            
            for row_num, row in enumerate(reader, start=1):
                try:
                    tx_date = datetime.strptime(row['transaction_date'], '%Y-%m-%d').date()
                    amount = Decimal(row['amount'])
                    tx_type = row['type'].lower()
                    description = row['description']
                    category_name = row.get('category', '').strip()
                    
                    # Check for duplicate
                    exists = db.query(models.Transaction).filter_by(
                        organization_id=org.id,
                        transaction_date=tx_date,
                        description=description,
                        amount=amount
                    ).first()
                    
                    if exists:
                        duplicate_count += 1
                        continue
                    
                    # Determine category
                    category_id = None
                    if tx_type == 'income':
                        category_id = cat_map.get(('Penjualan', 'income'))
                    elif tx_type == 'expense':
                        desc_lower = description.lower()
                        if 'gaji' in desc_lower or 'payroll' in desc_lower:
                            category_id = cat_map.get(('Gaji', 'expense'))
                        elif 'sewa' in desc_lower or 'rent' in desc_lower:
                            category_id = cat_map.get(('Sewa', 'expense'))
                        elif 'transport' in desc_lower or 'bahan' in desc_lower:
                            category_id = cat_map.get(('Transport', 'expense'))
                        else:
                            category_id = cat_map.get(('Operasional', 'expense'))
                    else:
                        category_id = cat_map.get(('Operasional', 'expense'))
                    
                    # Create transaction
                    tx = models.Transaction(
                        organization_id=org.id,
                        transaction_date=tx_date,
                        description=description,
                        amount=amount,
                        tx_type=tx_type,
                        category_id=category_id,
                        status='posted',
                        created_by=admin_user.id
                    )
                    db.add(tx)
                    rows_added += 1
                    
                except Exception as e:
                    print(f"  ❌ Row {row_num} error: {e}")
                    error_count += 1
                    continue
            
            # Commit batch
            batch.total_rows = rows_added + duplicate_count
            batch.valid_rows = rows_added
            batch.duplicate_rows = duplicate_count
            batch.error_rows = error_count
            db.add(batch)
            db.flush()
            
            total_tx += rows_added
            print(f"  ✅ Loaded {rows_added} transactions (duplicates: {duplicate_count}, errors: {error_count})\n")
        
        db.commit()
        print(f"🎉 TRANSACTION SEEDING COMPLETE!")
        print(f"Total transactions loaded: {total_tx}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == '__main__':
    seed_transactions()
