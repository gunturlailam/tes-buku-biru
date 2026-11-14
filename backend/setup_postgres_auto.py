"""
Automatic PostgreSQL setup - Create database and user
No need for DBeaver!
"""
import sys
from sqlalchemy import create_engine, text

print("=" * 60)
print("🚀 PostgreSQL Auto Setup untuk ProfitAI")
print("=" * 60)

# Get postgres superuser credentials
print("\n📝 Masukkan kredensial PostgreSQL superuser:")
print("   (Default user: postgres)")
print()

postgres_user = input("Username [postgres]: ").strip() or "postgres"
postgres_password = input("Password: ").strip()

if not postgres_password:
    print("❌ Password tidak boleh kosong!")
    sys.exit(1)

postgres_host = input("Host [localhost]: ").strip() or "localhost"
postgres_port = input("Port [5432]: ").strip() or "5432"

print(f"\n🔗 Connecting to PostgreSQL as {postgres_user}@{postgres_host}:{postgres_port}...")

# Connect to postgres database (default)
try:
    admin_url = f"postgresql+psycopg://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/postgres"
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    
    with admin_engine.connect() as conn:
        # Test connection
        result = conn.execute(text("SELECT version();"))
        version = result.fetchone()[0].split(',')[0]
        print(f"✅ Connected: {version}\n")
        
        # Check if user exists
        result = conn.execute(text("SELECT 1 FROM pg_user WHERE usename = 'profitai'"))
        user_exists = result.fetchone() is not None
        
        if user_exists:
            print("⚠️  User 'profitai' sudah ada. Skip create user.")
        else:
            print("📝 Creating user 'profitai'...")
            conn.execute(text("CREATE USER profitai WITH PASSWORD 'profitai_local_2024'"))
            print("✅ User 'profitai' created")
        
        # Check if database exists
        result = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = 'profitai'"))
        db_exists = result.fetchone() is not None
        
        if db_exists:
            print("⚠️  Database 'profitai' sudah ada. Skip create database.")
        else:
            print("📝 Creating database 'profitai'...")
            conn.execute(text("CREATE DATABASE profitai WITH OWNER = profitai ENCODING = 'UTF8'"))
            print("✅ Database 'profitai' created")
        
        # Grant privileges
        print("📝 Granting privileges...")
        conn.execute(text("GRANT ALL PRIVILEGES ON DATABASE profitai TO profitai"))
        print("✅ Privileges granted")
        
except Exception as e:
    print(f"\n❌ Setup gagal: {e}")
    print("\nTroubleshooting:")
    print("1. Pastikan PostgreSQL service running")
    print("2. Check username/password benar")
    print("3. User harus punya privilege untuk CREATE USER/DATABASE")
    sys.exit(1)

# Now connect to profitai database to grant schema privileges
try:
    print("\n📝 Setting up schema privileges...")
    profitai_url = f"postgresql+psycopg://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/profitai"
    profitai_engine = create_engine(profitai_url, isolation_level="AUTOCOMMIT")
    
    with profitai_engine.connect() as conn:
        conn.execute(text("GRANT ALL PRIVILEGES ON SCHEMA public TO profitai"))
        conn.execute(text("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO profitai"))
        conn.execute(text("GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO profitai"))
        print("✅ Schema privileges granted")
        
except Exception as e:
    print(f"⚠️  Warning: Could not set schema privileges: {e}")
    print("   (This is OK, will be set when tables are created)")

print("\n" + "=" * 60)
print("🎉 PostgreSQL setup COMPLETE!")
print("=" * 60)
print("\n✅ Created:")
print(f"   Database: profitai")
print(f"   User: profitai")
print(f"   Password: profitai_local_2024")
print(f"\n📝 Connection string:")
print(f"   postgresql+psycopg://profitai:profitai_local_2024@{postgres_host}:{postgres_port}/profitai")
print("\n⏭️  Next step:")
print("   python setup_database.py")
print()
