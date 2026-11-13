# ProfitAI

**Complete Financial Intelligence — analysis, forecasting, and explainable recommendations.**

ProfitAI adalah platform financial intelligence yang membantu pemilik usaha memahami kondisi keuangan berdasarkan data transaksi dan saldo yang mereka catat. Produk mengubah data menjadi laporan, indikator, estimasi, dan rekomendasi yang dapat ditelusuri.

> Prinsip produk: angka keuangan dihitung secara deterministik; AI menjelaskan bukti yang tersedia dan tidak boleh mengarang angka, transaksi, atau kepastian.

## Mulai di sini

1. Baca [`docs/PROGRAM.md`](docs/PROGRAM.md) untuk memahami produk dan tujuan.
2. Baca [`docs/PRD.md`](docs/PRD.md) untuk ruang lingkup dan acceptance criteria.
3. Baca [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) dan [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) sebelum mengubah arsitektur/API.
4. Baca [`docs/FINANCIAL_AI_METHODOLOGY.md`](docs/FINANCIAL_AI_METHODOLOGY.md) sebelum mengimplementasikan formula, risiko, forecasting, atau AI.
5. Baca [`docs/TEAM_WORKFLOW.md`](docs/TEAM_WORKFLOW.md), [`docs/GITHUB_WORKFLOW.md`](docs/GITHUB_WORKFLOW.md), dan file tugas masing-masing di `docs/tasks/`.
6. AI coding agent wajib mengikuti [`AGENTS.md`](AGENTS.md).

## Repository

```text
profitai/
├── backend/                  # API, domain logic, database, tests
├── frontend/                 # UI web dan integrasi API
├── docs/                     # sumber kebenaran proyek
├── .github/                  # template issue/PR
├── AGENTS.md
├── README.md
├── CONTRIBUTING.md
├── .env.example
└── docker-compose.yml        # sesuaikan setelah stack dikunci
```

Struktur ini adalah target logical. Jangan memindahkan atau menimpa kode yang sudah ada sebelum memeriksa struktur aktual repository.

## Status produk

Dokumen ini mendefinisikan rancangan dan rencana MVP, bukan bukti bahwa fitur sudah selesai. Tandai fitur selesai hanya setelah acceptance criteria dan tests terpenuhi.

## Konvensi

- Bahasa produk awal: Bahasa Indonesia.
- Mata uang MVP: IDR, kecuali tim memutuskan dukungan multi-currency secara eksplisit.
- Zona waktu tampilan: `Asia/Jakarta` sebagai default konfigurasi; simpan timestamp teknis secara konsisten (UTC direkomendasikan).
- Semua nilai uang menggunakan decimal/fixed precision, bukan floating point biner.
- Semua data usaha harus terisolasi berdasarkan organisasi/tenant.
