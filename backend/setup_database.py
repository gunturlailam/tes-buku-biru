"""
Complete database setup script
1. Test connection
2. Create tables
3. Seed demo data
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("🚀 ProfitAI Database Setup")
print("=" * 60)

# STEP 1: Test connection
print("\n[1/3] Testing PostgreSQL connection...")
try:
    from sqlalchemy import create_engine, text
    engine = create_engine(os.environ["DATABASE_URL"])
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        version = result.fetchone()[0].split(',')[0]
        print(f"✅ Connected: {version}")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    print("\n⚠️  Troubleshooting:")
    print("   1. Pastikan PostgreSQL service running")
    print("   2. Jalankan setup_postgres.sql di DBeaver:")
    print("      - Create user profitai")
    print("      - Create database profitai")
    print("   3. Check .env DATABASE_URL")
    sys.exit(1)

# STEP 2: Create tables
print("\n[2/3] Creating database tables...")
try:
    from app.db import Base
    from app import models  # Import semua models
    
    Base.metadata.create_all(engine)
    
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    print(f"✅ Created {len(tables)} tables:")
    for table in sorted(tables)[:5]:
        print(f"   - {table}")
    if len(tables) > 5:
        print(f"   ... and {len(tables)-5} more tables")
    
except Exception as e:
    print(f"❌ Table creation failed: {e}")
    sys.exit(1)

# STEP 3: Seed demo data
print("\n[3/3] Loading demo data...")
try:
    from app.db import SessionLocal
    from app import models
    from app.security import hash_password
    from app.main import DEFAULT_CATEGORIES
    
    db = SessionLocal()
    
    # Check if data already exists
    existing_user = db.query(models.User).filter_by(email="demo@profitai.local").first()
    
    if existing_user:
        print("⚠️  Demo data already exists. Skipping seed.")
        print(f"   User: demo@profitai.local")
    else:
        # Create demo user
        user = models.User(
            email="demo@profitai.local",
            password_hash=hash_password("Demo12345!"),
            full_name="Demo Owner"
        )
        db.add(user)
        db.flush()
        
        # Create organization
        org = models.Organization(name="Warung Kopi Maju (Data Simulasi)")
        db.add(org)
        db.flush()
        
        # Add membership
        db.add(models.Membership(organization_id=org.id, user_id=user.id, role="owner"))
        
        # Add business profile
        db.add(models.BusinessProfile(organization_id=org.id, industry="F&B"))
        
        # Add categories
        for name, tx_type in DEFAULT_CATEGORIES:
            db.add(models.Category(organization_id=org.id, name=name, tx_type=tx_type))
        
        db.commit()
        
        print("✅ Demo data loaded:")
        print(f"   Email: demo@profitai.local")
        print(f"   Password: Demo12345!")
        print(f"   Organization: {org.name}")
        print(f"   Categories: {len(DEFAULT_CATEGORIES)}")
    
    db.close()
    
except Exception as e:
    print(f"❌ Seed failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 60)
print("🎉 Database setup COMPLETE!")
print("=" * 60)
print("\n📝 Next steps:")
print("   1. Start backend: uvicorn app.main:app --reload")
print("   2. Test API: http://localhost:8000/docs")
print("   3. Login: demo@profitai.local / Demo12345!")
print()
