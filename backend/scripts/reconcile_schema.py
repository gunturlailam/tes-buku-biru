"""Rekonsiliasi schema untuk database yang sudah berjalan.

Konteks:
- Database lama dibuat dengan `Base.metadata.create_all` dan belum punya
  `alembic_version`.
- Baseline Alembic baru menggambarkan seluruh schema saat ini.
- Script ini bersifat idempotent dan TIDAK menghapus data:
  1. membuat tabel baru yang belum ada,
  2. menambah kolom baru pada tabel lama,
  3. menandai database sebagai `head` jika belum punya alembic_version.

Untuk instalasi baru, gunakan `alembic upgrade head`, bukan script ini.
"""

import os
import sys
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect, text

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db import Base, engine  # noqa: E402
from app import models  # noqa: F401,E402


def _columns(table: str) -> set[str]:
    return {c["name"] for c in inspect(engine).get_columns(table)}


def _tables() -> set[str]:
    return set(inspect(engine).get_table_names())


def _add_column(conn, table: str, column: str, ddl_type: str, default: str,
                existing_columns: set[str]) -> None:
    if column in existing_columns:
        print(f"OK  {table}.{column} sudah ada")
        return
    conn.execute(text(
        f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type} "
        f"NOT NULL DEFAULT {default}"
    ))
    print(f"ADD {table}.{column}")


def main() -> None:
    dialect = engine.dialect.name
    bool_default = "FALSE" if dialect == "postgresql" else "0"

    print(f"Database dialect: {dialect}")
    print("Membuat tabel baru yang belum ada (tidak menghapus data)...")
    Base.metadata.create_all(engine)

    # Kolom additive untuk mesin rasio. Existing rows mendapat default aman.
    existing_tables = _tables()
    if "accounts" in existing_tables:
        account_columns = _columns("accounts")
        with engine.begin() as conn:
            if "account_role" not in account_columns:
                conn.execute(text("ALTER TABLE accounts ADD COLUMN account_role TEXT"))
                print("ADD accounts.account_role")
            else:
                print("OK  accounts.account_role sudah ada")
            _add_column(conn, "accounts", "is_current", "BOOLEAN", bool_default,
                        account_columns)

    if "categories" in existing_tables:
        category_columns = _columns("categories")
        with engine.begin() as conn:
            _add_column(conn, "categories", "is_cogs", "BOOLEAN", bool_default,
                        category_columns)

    existing_tables = _tables()
    if "alembic_version" not in existing_tables:
        cfg = Config(str(BACKEND_DIR / "alembic.ini"))
        cfg.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])
        command.stamp(cfg, "head")
        print("STAMP alembic_version -> head")
    else:
        version = None
        with engine.connect() as conn:
            row = conn.execute(text("SELECT version_num FROM alembic_version")).first()
            version = row[0] if row else None
        print(f"OK  alembic_version sudah ada: {version}")

    print(f"Total tabel aplikasi: {len([t for t in _tables() if t != 'alembic_version'])}")
    print("Selesai.")


if __name__ == "__main__":
    main()
