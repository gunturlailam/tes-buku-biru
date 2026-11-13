"""
Create all tables in PostgreSQL database
Run this after database 'profitai' is created
"""
import os
from dotenv import load_dotenv
from app.db import Base, engine
from app import models  # Import all models

load_dotenv()

print("🗄️  Creating PostgreSQL tables...\n")
print(f"Database: {os.environ['DATABASE_URL'].split('@')[1]}\n")

try:
    # Create all tables defined in models
    Base.metadata.create_all(engine)
    
    # List all created tables
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    print(f"✅ Successfully created {len(tables)} tables:\n")
    for i, table in enumerate(sorted(tables), 1):
        print(f"   {i:2d}. {table}")
    
    print(f"\n🎉 Database setup complete!")
    print(f"   Total: {len(tables)} tables")
    
except Exception as e:
    print(f"❌ Error creating tables:")
    print(f"   {e}")
    print("\nTroubleshooting:")
    print("1. Pastikan PostgreSQL running")
    print("2. Database 'profitai' sudah dibuat")
    print("3. Check .env DATABASE_URL benar")
    print("4. Run: python test_postgres.py dulu")
