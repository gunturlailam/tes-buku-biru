import csv
import hashlib
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
from app.db import SessionLocal, engine, Base
from app import models
from app.security import hash_password

# Ensure all 17 tables exist
Base.metadata.create_all(engine)

def seed_all():
    db = SessionLocal()
    print("🌱 Memulai seeding database komprehensif ProfitAI...\n")

    try:
        # 1. ORGANISASI & PROFIL
        org = db.query(models.Organization).filter_by(name="Kopi Nusantara Maju (Data Simulasi)").first()
        if not org:
            org = models.Organization(name="Kopi Nusantara Maju (Data Simulasi)")
            db.add(org)
            db.flush()
            print(f"✅ Organisasi dibuat: '{org.name}' (ID: {org.id})")
        else:
            print(f"ℹ️ Organisasi sudah ada: '{org.name}' (ID: {org.id})")

        profile = db.query(models.BusinessProfile).filter_by(organization_id=org.id).first()
        if not profile:
            profile = models.BusinessProfile(
                organization_id=org.id,
                industry="F&B / Kuliner",
                currency="IDR",
                timezone="Asia/Jakarta",
                accounting_basis="cash",
                fiscal_start_month=1
            )
            db.add(profile)
            db.flush()
            print("✅ Profil Bisnis diset: Industri F&B, Currency IDR, Timezone Asia/Jakarta")

        # 2. USERS & ROLES
        users_config = [
            {
                "email": "demo@profitai.local",
                "password": "Demo12345!",
                "full_name": "Demo Account (Owner)",
                "role": "owner",
                "desc": "Akses penuh pemilik usaha & laporan"
            },
            {
                "email": "owner@profitai.local",
                "password": "Owner12345!",
                "full_name": "Budi Santoso (Owner)",
                "role": "owner",
                "desc": "Pemilik usaha, kontrol profil & otorisasi tim"
            },
            {
                "email": "admin@profitai.local",
                "password": "Admin12345!",
                "full_name": "Siti Rahma (Admin Keuangan)",
                "role": "admin",
                "desc": "Admin operasional, CRUD transaksi & import CSV"
            },
            {
                "email": "member@profitai.local",
                "password": "Member12345!",
                "full_name": "Ahmad Fauzi (Staf Kasir)",
                "role": "member",
                "desc": "Staf input transaksi harian & kasir"
            },
            {
                "email": "viewer@profitai.local",
                "password": "Viewer12345!",
                "full_name": "Dewi Lestari (Investor/Viewer)",
                "role": "viewer",
                "desc": "Akses baca laporan & dashboard KPI saja"
            }
        ]

        seeded_users = {}
        for uc in users_config:
            u = db.query(models.User).filter_by(email=uc["email"]).first()
            if not u:
                u = models.User(
                    email=uc["email"],
                    password_hash=hash_password(uc["password"]),
                    full_name=uc["full_name"]
                )
                db.add(u)
                db.flush()
                # Create membership
                db.add(models.Membership(organization_id=org.id, user_id=u.id, role=uc["role"]))
                db.flush()
                print(f"👤 User dibuat: {uc['email']} [{uc['role']}] - {uc['full_name']}")
            else:
                m = db.query(models.Membership).filter_by(organization_id=org.id, user_id=u.id).first()
                if not m:
                    db.add(models.Membership(organization_id=org.id, user_id=u.id, role=uc["role"]))
                    db.flush()
                print(f"ℹ️ User sudah ada: {uc['email']} [{uc['role']}]")
            seeded_users[uc["role"]] = u

        # 3. CHART OF ACCOUNTS (COA)
        accounts_data = [
            ("1001", "Kas Operasional", "asset", "debit"),
            ("1002", "Bank BCA Operasional", "asset", "debit"),
            ("1003", "Piutang Dagang", "asset", "debit"),
            ("1004", "Persediaan Bahan Baku", "asset", "debit"),
            ("2001", "Utang Usaha / Vendor", "liability", "credit"),
            ("2002", "Pinjaman Bank / Modal Kerja", "liability", "credit"),
            ("3001", "Modal Disetor Pemilik", "equity", "credit"),
            ("3002", "Prive / Penarikan Pemilik", "equity", "debit"),
            ("4001", "Pendapatan Penjualan Produk", "revenue", "credit"),
            ("4002", "Pendapatan Jasa Layanan", "revenue", "credit"),
            ("5001", "Beban Pokok Penjualan (HPP/COGS)", "expense", "debit"),
            ("5002", "Beban Gaji & Upah Staf", "expense", "debit"),
            ("5003", "Beban Sewa Tempat Usaha", "expense", "debit"),
            ("5004", "Beban Operasional & Listrik", "expense", "debit"),
        ]

        accounts_map = {}
        for code, name, acc_type, normal_bal in accounts_data:
            acc = db.query(models.Account).filter_by(organization_id=org.id, code=code).first()
            if not acc:
                acc = models.Account(
                    organization_id=org.id,
                    code=code,
                    name=name,
                    account_type=acc_type,
                    normal_balance=normal_bal,
                    is_active=True
                )
                db.add(acc)
                db.flush()
            accounts_map[code] = acc

        print(f"✅ {len(accounts_map)} Akun Chart of Accounts (COA) siap.")

        # 4. KATEGORI TRANSAKSI
        categories_def = [
            ("Penjualan", "income", "4001"),
            ("Pendapatan Jasa", "income", "4002"),
            ("Operasional", "expense", "5004"),
            ("Gaji", "expense", "5002"),
            ("Sewa", "expense", "5003"),
            ("Transport", "expense", "5004"),
            ("Refund Pelanggan", "refund", "4001"),
            ("Transfer Antar Akun", "transfer", "1001"),
            ("Setoran Modal", "owner_contribution", "3001"),
            ("Penarikan Pemilik", "owner_draw", "3002"),
            ("Pinjaman Masuk", "loan_received", "2002"),
            ("Cicilan Pinjaman", "loan_repayment", "2002"),
        ]

        cat_map = {}
        for name, tx_t, coa_code in categories_def:
            cat = db.query(models.Category).filter_by(organization_id=org.id, name=name, tx_type=tx_t).first()
            acc = accounts_map.get(coa_code)
            if not cat:
                cat = models.Category(
                    organization_id=org.id,
                    name=name,
                    tx_type=tx_t,
                    account_id=acc.id if acc else None
                )
                db.add(cat)
                db.flush()
            cat_map[(name, tx_t)] = cat.id

        print("✅ 12 Kategori standar terhubung ke akun COA.")

        # 5. OPENING BALANCES
        if accounts_map.get("1001") and accounts_map.get("1002") and accounts_map.get("3001"):
            existing_ob = db.query(models.OpeningBalance).filter_by(organization_id=org.id).first()
            if not existing_ob:
                db.add(models.OpeningBalance(
                    organization_id=org.id,
                    account_id=accounts_map["1001"].id,
                    effective_date=date(2024, 1, 1),
                    amount=Decimal("15000000.00"),
                    created_by=seeded_users["owner"].id
                ))
                db.add(models.OpeningBalance(
                    organization_id=org.id,
                    account_id=accounts_map["1002"].id,
                    effective_date=date(2024, 1, 1),
                    amount=Decimal("35000000.00"),
                    created_by=seeded_users["owner"].id
                ))
                db.add(models.OpeningBalance(
                    organization_id=org.id,
                    account_id=accounts_map["3001"].id,
                    effective_date=date(2024, 1, 1),
                    amount=Decimal("50000000.00"),
                    created_by=seeded_users["owner"].id
                ))
                db.flush()
                print("✅ Saldo awal (Opening Balances) kas & modal disetor tersimpan.")

        # 6. TRANSAKSI DARI CSV DEMO DATASET
        csv_files = [
            ('transactions_healthy_business.csv', 'Healthy Business'),
            ('transactions_cash_problem.csv', 'Cash Problem'),
            ('transactions_mixed_signals.csv', 'Mixed Signals')
        ]
        base_path = Path(__file__).parent.parent / 'data' / 'demo'

        total_tx = 0
        admin_user = seeded_users["admin"]

        for filename, label in csv_files:
            csv_path = base_path / filename
            if not csv_path.exists():
                continue

            with open(csv_path, 'r', encoding='utf-8') as f:
                content = f.read()
                file_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()

            # Create or get import batch
            batch = db.query(models.ImportBatch).filter_by(organization_id=org.id, filename=filename).first()
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

            reader = csv.DictReader(content.splitlines())
            rows_added = 0
            for row in reader:
                tx_date = datetime.strptime(row['transaction_date'], '%Y-%m-%d').date()
                amount = Decimal(row['amount'])
                tx_type = row['type']
                desc = row['description']
                csv_cat = row.get('category', '').lower()

                # Check duplicate
                exists = db.query(models.Transaction).filter_by(
                    organization_id=org.id,
                    transaction_date=tx_date,
                    description=desc,
                    amount=amount
                ).first()
                if exists:
                    continue

                category_id = None
                if tx_type == 'income':
                    category_id = cat_map.get(('Penjualan', 'income'))
                elif tx_type == 'expense':
                    if 'cogs' in csv_cat or 'bahan' in desc.lower():
                        category_id = cat_map.get(('Operasional', 'expense'))
                    elif 'gaji' in desc.lower():
                        category_id = cat_map.get(('Gaji', 'expense'))
                    elif 'sewa' in desc.lower():
                        category_id = cat_map.get(('Sewa', 'expense'))
                    else:
                        category_id = cat_map.get(('Operasional', 'expense'))

                tx = models.Transaction(
                    organization_id=org.id,
                    transaction_date=tx_date,
                    description=desc,
                    amount=amount,
                    tx_type=tx_type,
                    category_id=category_id,
                    status='posted',
                    created_by=admin_user.id
                )
                db.add(tx)
                rows_added += 1

            batch.total_rows += rows_added
            batch.valid_rows += rows_added
            total_tx += rows_added
            print(f"📦 {label:20s}: {rows_added} transaksi diimpor ke batch #{batch.id}")

        # 7. RISK RULE VERSIONS
        rules_def = [
            ("RULE-CF-01", "1.0.0", "Defisit Arus Kas Bersih", {"critical": "0.00"}),
            ("RULE-MRG-01", "1.0.0", "Ambang Batas Margin Surplus Operasional", {"attention": "10.00", "critical": "0.00"}),
            ("RULE-DQ-01", "1.0.0", "Kelengkapan Kategorisasi Data Transaksi", {"attention": 1}),
            ("RULE-SAV-01", "1.0.0", "Alokasi Dana Cadangan Likuiditas Usaha", {"target_months": 3})
        ]
        for r_code, ver, desc_r, cfg in rules_def:
            if not db.query(models.RiskRuleVersion).filter_by(rule_code=r_code).first():
                db.add(models.RiskRuleVersion(
                    rule_code=r_code,
                    version=ver,
                    description=desc_r,
                    threshold_config=cfg,
                    is_active=True
                ))
        print("✅ Risk rule versions terkonfigurasi.")

        # 8. AUDIT EVENTS
        db.add(models.AuditEvent(
            organization_id=org.id,
            user_id=seeded_users["owner"].id,
            action="ORGANIZATION_INITIALIZED",
            entity_type="organization",
            entity_id=org.id,
            payload={"source": "seed_demo.py", "users_count": len(users_config)},
            ip_address="127.0.0.1"
        ))

        db.commit()
        print(f"\n🎉 SEEDING SELESAI SEMPURNA!")
        print("=" * 60)
        print("Kredensial User yang Dapat Digunakan untuk Login Demo:")
        print("-" * 60)
        for uc in users_config:
            print(f"• Email   : {uc['email']:<26} Password: {uc['password']}")
            print(f"  Role    : {uc['role'].upper():<10} Info: {uc['desc']}")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"❌ Terjadi kesalahan saat seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_all()
