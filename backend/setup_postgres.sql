-- Setup PostgreSQL untuk ProfitAI
-- Jalankan ini di DBeaver sebagai user postgres
-- Connect ke database: postgres

-- 1. Buat user/role
CREATE USER profitai WITH PASSWORD 'profitai_local_2024';

-- 2. Buat database
CREATE DATABASE profitai
    WITH 
    OWNER = profitai
    ENCODING = 'UTF8';

-- 3. Connect ke database profitai, lalu jalankan:
-- (Switch connection di DBeaver ke database profitai)

GRANT ALL PRIVILEGES ON DATABASE profitai TO profitai;
GRANT ALL PRIVILEGES ON SCHEMA public TO profitai;

-- Verify
SELECT datname FROM pg_database WHERE datname = 'profitai';
SELECT usename FROM pg_user WHERE usename = 'profitai';

-- Selesai! Database profitai sudah siap
