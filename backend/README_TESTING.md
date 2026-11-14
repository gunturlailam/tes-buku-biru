# Backend Testing

**Status terakhir:** 2026-11-14

Dokumen ini menggantikan klaim status sebelumnya. Isinya hanya yang benar-benar
dijalankan dan diverifikasi.

## Prasyarat

```bash
cd backend
..\venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Menjalankan test backend

```bash
cd backend
..\venv\Scripts\python.exe -m pytest tests -q
```

Hasil terakhir:

```text
27 passed, 3 warnings in 11.83s
```

Warning yang tersisa berasal dari deprecation `on_event` FastAPI/Starlette dan
`httpx` di TestClient; bukan kegagalan test.

Test yang tersedia:

- `tests/test_transactions.py`
  - reversal tidak menghasilkan efek negatif;
  - forecast mengabaikan baris reversal;
  - create → list → update → reverse → summary;
  - filter `tx_type`, `category_id`, `search`;
  - tenant isolation.
- `tests/test_ratio_engine.py`
  - 16 rasio dengan hitungan manual;
  - threshold/band;
  - input hilang → `unavailable`;
  - denominator nol tidak menjadi 0;
  - ekuitas negatif → DER/ROE tidak bermakna;
  - saldo awal hilang → rata-rata memakai saldo akhir + `partial`;
  - annualisasi `INV_TURN`, `TATO`, `ROA`, `ROE`;
  - validasi field input.
- `tests/test_ratio_service.py`
  - mapping DB → `RatioInputs`;
  - snapshot persist/upsert;
  - balance sheet dan `unavailable` + alasan;
  - threshold efektif dan validasi role/urutan.
- `tests/test_ratios_api.py`
  - auth dan validasi tanggal;
  - endpoint ratios/neraca/threshold/explain;
  - tenant isolation.
- `tests/test_ratio_narrative.py`
  - fallback tanpa API key;
  - sanitasi payload;
  - validasi output LLM;
  - tidak ada kegagalan saat LLM tidak tersedia.

Test memakai SQLite sementara (`test_profitai.db`) dan **tidak** menyentuh
database PostgreSQL aplikasi.

## Menjalankan backend

```bash
cd backend
..\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Alembic

Baseline saat ini:
`migrations/versions/15249a199165_baseline_schema_with_ratio_cfo.py`.

Baseline lama yang rusak disimpan di
`migrations/legacy/64b8ce576449_create_profitai_all_17_tables.py.bak`.

```bash
cd backend
..\venv\Scripts\python.exe -m alembic upgrade head
..\venv\Scripts\python.exe -m alembic check
```

Database PostgreSQL demo yang sudah berisi data direkonsiliasi secara aditif:

```bash
cd backend
..\venv\Scripts\python.exe scripts\reconcile_schema.py
```

Script tersebut menambah kolom/tabel yang belum ada, tidak menghapus data, lalu
melakukan `alembic stamp` ke head. Jangan jalankan tanpa backup pada database
produksi.

## Data demo

Database PostgreSQL berisi:

- data historis 2024 (dari `seed_demo.py` / CSV demo);
- 161 transaksi demo 2025-12 s/d 2026-11 (dari `seed_demo_2026.py`);
- 13 balance snapshot dan data pendukung rasio (dari
  `seed_balance_sheet_2026.py`);
- total 273 transaksi, 1 organisasi, 1 user demo.

Seed idempotent:

```bash
cd backend
..\venv\Scripts\python.exe seed_demo_2026.py
..\venv\Scripts\python.exe seed_balance_sheet_2026.py
```

Kredensial demo:

- Email: `demo@profitai.local`
- Password: `Demo12345!`

## Status frontend (terkait kontrak backend)

```bash
cd frontend
npm run lint
npm run typecheck
npm run test:ci
npm run build
```

Hasil terakhir: lint tanpa error/warning, typecheck lulus, build lulus,
41 test frontend lulus (6 suite).

## Batasan yang masih terbuka

- Halaman `/ratios` sudah terhubung ke API. Halaman detail rasio, form neraca,
  tutup/buka periode, tren, aging, proyeksi, dan UI threshold belum ada.
- Endpoint `GET /ratios` menyimpan `ratio_snapshots` sebagai cache/audit. Nilai
  tetap dihitung ulang setiap request.
- `INV_TURN`, `TATO`, `ROA`, dan `ROE` disetahunkan (`365 / hari`), sehingga
  periode pendek bisa fluktuatif dan selalu diberi warning.
- Bulan berjalan (November MTD) dapat berstatus `partial` karena
  `REV_GROWTH` tidak punya pembanding pendapatan yang cukup.
- `net_profit` formal tetap `unavailable` untuk organisasi yang klasifikasi
  HPP-nya belum lengkap. Organisasi demo sudah dikonfigurasi.
- LLM bersifat opsional dan memakai adapter OpenAI-compatible. DeepSeek belum
  diimplementasikan. Tanpa API key, narasi fallback tetap berfungsi.
