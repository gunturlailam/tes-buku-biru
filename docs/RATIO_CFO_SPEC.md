# Ratio CFO Engine — Spesifikasi Implementasi

**Status:** M0–M3 selesai; M4 halaman utama selesai; narasi AI + fallback selesai (bagian M6); M5 predictive belum  
**Pemilik produk:** Risfiatul  
**Pemilik teknis:** Guntur (backend), Ronal & Hanif (frontend)  
**Versi:** 1.1  
**Tanggal:** 2026-11-14

---

## 1. Tujuan

Meningkatkan ProfitAI dari **CFO virtual berbasis kas** menjadi **CFO virtual berbasis rasio**:

1. **Descriptive** — menjelaskan rasio keuangan dalam bahasa manusia.
2. **Predictive** — memproyeksikan tren rasio, piutang, persediaan, dan solvabilitas.
3. **Prescriptive** — memberi tindakan konkret berbasis ambang rasio.

Prinsip utama:

> Angka dihitung deterministik di backend. AI hanya menarasikan fakta terstruktur. Tidak ada angka yang dibuat-buat.

---

## 2. Posisi Produk

| Tahap | Fokus | Status |
|---|---|---|
| **Sekarang** | CFO virtual berbasis kas: arus kas, surplus, margin surplus, kualitas data | M0 selesai (stabil) |
| **Tahap ini** | Ratio CFO: likuiditas, solvabilitas, aktivitas, profitabilitas, narasi + fallback | M0–M3 selesai; M4 halaman utama selesai; M5 predictive belum |
| **Nanti** | Double-entry penuh, pajak, integrasi bank, mobile | Di luar scope |

### Status Implementasi per 2026-11-14

**M0 — Stabilisasi fondasi: selesai dan terverifikasi.**

- Kontrak transaksi frontend/backend diselaraskan (`transaction_date`, `PATCH`,
  reversal tanpa hard delete).
- Bug agregasi reversal diperbaiki di summary, profit/loss, cash flow, dan
  forecast; ada regression test.
- Filter `tx_type`, `category_id`, `search` ditambahkan di API dan UI.
- Dashboard tidak lagi memakai tren/health/aktivitas hardcoded; data diambil
  dari financial engine dan health API.
- Reports tab arus kas memakai API nyata; settings dan forgot-password tidak
  lagi menampilkan simulasi palsu.
- Data demo 2025-12 s/d 2026-11 ditambahkan (161 transaksi) tanpa menghapus data
  2024.
- Gate M0 saat itu: pytest 5 passed; Jest 31 passed; ESLint 0 error/warning;
  `tsc` dan `next build` lulus. Gate terkini ada di §13.

**M2 — Ratio engine inti: selesai (pure functions + test).**

- `backend/app/ratio_engine.py` menghitung 16 rasio dengan `Decimal`.
- Input hilang/denominator nol/ekuitas negatif menghasilkan `unavailable` +
  alasan, bukan angka 0.
- Rata-rata tanpa saldo awal memakai saldo akhir dan ditandai `partial`.
- `INV_TURN`, `TATO`, `ROA`, dan `ROE` disetahunkan dengan `365 / hari` agar
  sebanding dengan threshold tahunan. Formula version dinaikkan ke `1.1.0`.
- Test engine, service, API, dan narasi lulus.

**M1 — Data model accrual-lite: selesai dan terpasang di PostgreSQL.**

- Tabel baru: `accounting_periods`, `balance_snapshots`,
  `balance_snapshot_lines`, `receivables`, `payables`, `inventory_items`,
  `inventory_movements`, `fixed_assets`, `loans`, `ratio_thresholds`,
  `ratio_snapshots`.
- Kolom baru: `accounts.account_role`, `accounts.is_current`,
  `categories.is_cogs`.
- Baseline Alembic baru `15249a199165_baseline_schema_with_ratio_cfo.py`
  menggantikan baseline lama yang rusak. Database lama direkonsiliasi dengan
  `backend/scripts/reconcile_schema.py` (additive, tanpa hapus data) lalu
  di-stamp ke head.
- Seed demo: 13 snapshot neraca, 24 transaksi HPP dikoreksi, 11 beban bunga,
  6 item persediaan, 3 piutang, 3 utang, 2 aset tetap, 2 pinjaman.

**M3 — API rasio: selesai.**

- `GET /api/v1/ratios` menghitung 16 rasio dan menyimpan `ratio_snapshots`.
- `GET /api/v1/balance-sheet` mengembalikan neraca atau `unavailable` + alasan.
- `GET /api/v1/ratios/thresholds` dan
  `PATCH /api/v1/ratios/thresholds/{ratio_code}` (owner/admin, validasi urutan).
- `POST /api/v1/ratios/{ratio_code}/explain` memakai LLM opsional dengan
  payload tersanitasi; fallback rule-based selalu tersedia.

**M4 — UI rasio: selesai untuk halaman utama.**

- `/ratios` menampilkan ringkasan, 16 rasio per kategori, band, threshold,
  narasi rule-based, tombol “Jelaskan”, panel neraca, dan state loading/error/
  empty/partial/unavailable.
- Selector periode: bulan lalu, MTD, QTD, YTD. Refresh memakai React Query.
- Belum ada halaman detail `/ratios/[code]`, form input neraca, tutup periode,
  dan UI threshold. Itu masuk M4 lanjutan/M5.

**M5 predictive dan rule preskriptif terpisah — belum dimulai.** Belum ada
tren rasio, AR aging, inventory aging, proyeksi utang, dan `ratio_insights`.
Narasi preskriptif per rasio sudah tersedia sebagai teks fallback, tetapi belum
disimpan sebagai rekomendasi yang bisa ditindaklanjuti.

Non-goals tahap ini:

- Klaim kepatuhan SAK/PSAK.
- Perhitungan pajak otomatis.
- Credit scoring.
- Integrasi bank.
- Chatbot bebas.

---

## 3. Prinsip Teknis Wajib

1. **Deterministik:** semua rasio dihitung di `ratio_engine.py`, bukan di frontend/LLM.
2. **Decimal:** uang dan rasio memakai `Decimal`; pembulatan hanya saat presentasi.
3. **Tidak ada angka palsu:** input tidak lengkap → `value: null`, `status: "unavailable"`, `reason` jelas.
4. **Bisa diaudit:** setiap respons menyimpan input, formula version, periode,
   dan snapshot; `ratio_snapshots` menyimpan hasil per periode.
5. **AI tidak menghitung:** LLM hanya menerima kode/nama/kategori rasio, band,
   arah threshold, dan kualitas data.
6. **Tenant-safe:** semua query dibatasi `organization_id` dari sesi server.
7. **Role-safe:** ubah threshold hanya untuk `owner`/`admin`; guard untuk tutup
   periode/master data belum berlaku karena endpoint-nya belum ada.
8. **Test-first untuk formula:** setiap rasio punya kasus hitungan manual di
   test engine.

---

## 4. Model Data (Accrual-lite)

### 4.1 Tabel baru

| Tabel | Fungsi | Kolom kunci |
|---|---|---|
| `accounting_periods` | Periode bulanan, status buka/tutup | `organization_id`, `period_from`, `period_to`, `status`, `closed_at`, `closed_by` |
| `balance_snapshots` | Header neraca per periode | `organization_id`, `period_id`, `as_of_date`, `status`, `created_by` |
| `balance_snapshot_lines` | Baris neraca per akun | `snapshot_id`, `account_id`, `amount` |
| `receivables` | Piutang usaha | `customer_name`, `invoice_number`, `invoice_date`, `due_date`, `amount`, `paid_amount`, `status` |
| `payables` | Utang usaha | `supplier_name`, `bill_number`, `bill_date`, `due_date`, `amount`, `paid_amount`, `status` |
| `inventory_items` | Master persediaan | `sku`, `name`, `unit`, `cost_price`, `quantity_on_hand`, `reorder_point` |
| `inventory_movements` | Mutasi persediaan | `item_id`, `movement_date`, `movement_type`, `quantity`, `unit_cost`, `reference` |
| `fixed_assets` | Aset tetap | `name`, `asset_category`, `acquisition_date`, `acquisition_cost`, `useful_life_months`, `salvage_value`, `accumulated_depreciation` |
| `loans` | Pinjaman | `lender`, `principal`, `interest_rate`, `term_months`, `start_date`, `outstanding_principal`, `monthly_installment` |
| `ratio_thresholds` | Ambang per organisasi/industri | `organization_id`, `ratio_code`, `industry`, `target`, `warning`, `critical`, `direction` |
| `ratio_snapshots` | Hasil 16 rasio per periode (JSON) | `organization_id`, `period_from`, `period_to`, `as_of_date`, `formula_version`, `data_quality_status`, `ratios`, `warnings` |
| `ratio_insights` | Sinyal & rekomendasi rasio — **belum dibuat** | `ratio_code`, `level`, `title`, `explanation`, `recommendation`, `evidence`, `rule_version` |

### 4.2 Perluasan tabel lama

`accounts`:

- `account_role`: `cash`, `receivable`, `inventory`, `prepaid`, `fixed_asset`, `accumulated_depreciation`, `payable`, `short_term_loan`, `long_term_loan`, `tax_payable`, `equity`, `revenue`, `cogs`, `operating_expense`, `interest_expense`, `tax_expense`, `other`.
- `is_current`: boolean.
- `is_contra`: **belum ditambahkan**; akumulasi penyusutan saat ini disimpan sebagai baris aset bernilai negatif dengan role `accumulated_depreciation`.

`categories`:

- `is_cogs`: boolean.
- `account_id` disarankan untuk kategori income/expense; kategori bunga/pajak memakainya untuk memisahkan komponen opex.

`transactions`:

- `account_id` belum diwajibkan; klasifikasi HPP memakai `categories.is_cogs`.
- Tetap mendukung reversal.

`forecast_runs`:

- `ratio_code` nullable; `target` dapat berisi `cash_flow` atau `ratio:CR`.

### 4.3 Invariant

1. `total_assets = total_liabilities + total_equity` pada snapshot final.
2. Periode `closed` tidak boleh menerima transaksi baru tanpa reopen resmi.
3. Rasio tidak dihitung dari periode `open` kecuali diberi label `preview`.
4. `receivables.paid_amount <= receivables.amount`.
5. `inventory.quantity_on_hand >= 0`.
6. `loans.outstanding_principal >= 0`.

---

## 5. Definisi Rasio

`RATIO_FORMULA_VERSION = "1.1.0"`

| Kode | Nama | Kategori | Formula | Input wajib |
|---|---|---|---|---|
| `CR` | Current Ratio | Likuiditas | aset lancar ÷ utang lancar | cash, AR, inventory, prepaid, AP, short-term loan, tax payable |
| `QR` | Quick Ratio | Likuiditas | (aset lancar − persediaan − prepaid) ÷ utang lancar | sama, tanpa inventory/prepaid |
| `CASH_RATIO` | Cash Ratio | Likuiditas | kas & setara kas ÷ utang lancar | cash, current liabilities |
| `DER` | Debt to Equity | Solvabilitas | total utang ÷ total ekuitas | liabilities, equity |
| `DAR` | Debt to Asset | Solvabilitas | total utang ÷ total aset | liabilities, assets |
| `ICR` | Interest Coverage | Solvabilitas | EBIT ÷ beban bunga | EBIT, interest expense |
| `INV_TURN` | Inventory Turnover | Aktivitas | (HPP ÷ rata-rata persediaan) × (365 ÷ hari) | COGS, beginning/ending inventory |
| `ACP` | Average Collection Period | Aktivitas | (rata-rata piutang ÷ pendapatan) × hari | AR, revenue, days |
| `DPO` | Days Payable Outstanding | Aktivitas | (rata-rata utang ÷ HPP) × hari | AP, COGS, days |
| `TATO` | Total Asset Turnover | Aktivitas | (pendapatan ÷ rata-rata total aset) × (365 ÷ hari) | revenue, assets |
| `GPM` | Gross Profit Margin | Profitabilitas | laba kotor ÷ pendapatan | revenue, COGS |
| `OPM` | Operating Margin | Profitabilitas | laba operasi ÷ pendapatan | revenue, operating expense |
| `NPM` | Net Profit Margin | Profitabilitas | laba bersih ÷ pendapatan | revenue, net profit |
| `ROA` | Return on Assets | Profitabilitas | (laba bersih ÷ rata-rata total aset) × (365 ÷ hari) | net profit, assets |
| `ROE` | Return on Equity | Profitabilitas | (laba bersih ÷ rata-rata ekuitas) × (365 ÷ hari) | net profit, equity |
| `REV_GROWTH` | Revenue Growth | Pertumbuhan | (pendapatan kini − sebelumnya) ÷ sebelumnya | revenue current/prior |

Aturan:

- Denominator `0` atau `null` → `value: null`, `status: "unavailable"`, `reason`.
- Ekuitas negatif → `DER`/`ROE` `unavailable` dengan alasan “Ekuitas negatif; rasio tidak bermakna”.
- Rata-rata `(awal + akhir) / 2`; jika awal tidak ada → pakai akhir, tandai `quality: "partial"`.
- Hari default 30 untuk bulanan, 90 untuk kuartal, 365 untuk tahunan.
- **Annualisasi:** `INV_TURN`, `TATO`, `ROA`, dan `ROE` mengalikan hasil periode
  dengan `365 ÷ hari`. Tujuannya agar sebanding dengan threshold tahunan.
  `GPM`, `OPM`, dan `NPM` adalah margin periode dan tidak disetahunkan.
  Konsekuensinya, nilai periode pendek bisa fluktuatif; API menambahkan warning
  eksplisit saat `hari < 365`.

### 5.1 Bentuk response rasio

```json
{
  "period": {"from": "2026-10-01", "to": "2026-10-31"},
  "as_of": "2026-10-31",
  "currency": "IDR",
  "formula_version": "1.1.0",
  "snapshot_id": 1,
  "data_quality": {
    "status": "usable",
    "warnings": [
      "INV_TURN, TATO, ROA, dan ROE disetahunkan dari periode 31 hari; nilai periode pendek dapat fluktuatif."
    ]
  },
  "source": {
    "snapshot_id": 12,
    "as_of": "2026-10-31",
    "previous_snapshot_id": 11,
    "previous_as_of": "2026-09-30",
    "snapshot_status": "final",
    "transaction_count": 14,
    "warnings": []
  },
  "ratios": [
    {
      "code": "CR",
      "name": "Current Ratio",
      "category": "liquidity",
      "value": "4.7032",
      "display": "4.70x",
      "status": "available",
      "quality": "ok",
      "inputs": {"current_assets": "133100000.00", "current_liabilities": "28300000.00"},
      "threshold": {
        "target": "1.5000",
        "warning": "1.2000",
        "critical": "1.0000",
        "direction": "higher"
      },
      "band": "above_target",
      "interpretation": "Nilai rasio memenuhi target.",
      "unit": "x",
      "narrative": {
        "explanation": "Current ratio membandingkan aset lancar dengan utang lancar. Nilai saat ini di atas target. Pertahankan buffer kas dan hindari menambah utang jangka pendek tanpa kebutuhan operasional.",
        "action": "Pertahankan buffer kas dan hindari menambah utang jangka pendek tanpa kebutuhan operasional.",
        "source": "fallback",
        "llm_enabled": false,
        "quality": "ok",
        "disclaimer": "Narasi ini bersifat informatif, bukan saran keuangan, pajak, atau hukum. Angka rasio dihitung oleh engine deterministik, bukan oleh model bahasa."
      }
    }
  ]
}
```

`snapshot_id` di level atas adalah ID baris `ratio_snapshots` yang di-upsert.
`source.snapshot_id` adalah ID `balance_snapshots` yang dipakai sebagai input.

Frontend **tidak boleh** menghitung ulang nilai; hanya menampilkan.

---

## 6. Ambang & Interpretasi

Ambang disimpan di `ratio_thresholds`, dapat di-override per organisasi/industri.

Contoh default UMKM:

| Rasio | Target | Warning | Critical |
|---|---:|---:|---:|
| CR | 1.50 | 1.20 | 1.00 |
| QR | 1.00 | 0.80 | 0.60 |
| DER | 1.00 | 1.50 | 2.00 |
| DAR | 0.50 | 0.65 | 0.80 |
| ICR | 3.00 | 1.50 | 1.00 |
| INV_TURN | 6x/tahun | 3x | 1x |
| ACP | 30 hari | 60 hari | 90 hari |
| TATO | 1.00 | 0.50 | 0.25 |
| GPM | 30% | 20% | 10% |
| NPM | 10% | 5% | 0% |
| ROA | 5% | 2% | 0% |

Band interpretasi: `above_target`, `between_target_warning`,
`between_warning_critical`, `below_critical`, `not_configured`,
`insufficient`. `not_configured` berarti rasio tersedia tetapi belum punya
ambang default; UI tidak boleh mengarang target.

---

## 7. Arsitektur Backend

```text
backend/app/
├── models.py                 # tabel M1
├── schemas.py                # schema request/response
├── ratio_engine.py           # registry + formula + validasi input (pure)
├── ratio_service.py          # rakit input dari DB, threshold, simpan snapshot
├── ratio_narrative.py        # narasi deterministik + orkestrasi LLM
├── llm_adapter.py            # LLM opsional + validasi output
├── main.py                   # endpoint
└── tests/
    ├── test_ratio_engine.py
    ├── test_ratio_service.py
    ├── test_ratios_api.py
    └── test_ratio_narrative.py

backend/scripts/
└── reconcile_schema.py       # patch aditif DB lama + alembic stamp
```

Belum ada (rencana M5): `ratio_rules.py`, `ratio_forecast.py`, dan fixture
`tests/fixtures/ratio_cases/`.

`ratio_engine.py`:

- `RATIO_META`: metadata setiap rasio.
- `compute_ratios(inputs, from, to, as_of, thresholds) -> dict`.
- `RatioInputs`: neraca, laba-rugi, saldo awal, hari, threshold.
- Tidak ada akses DB di engine; `ratio_service.py` yang merakit input.

---

## 8. API Contract

### 8.1 Sudah diimplementasikan

| Method | Path | Fungsi | Akses |
|---|---|---|---|
| GET | `/api/v1/balance-sheet?as_of=` | Neraca terakhir pada/sebelum tanggal; `status: unavailable` + alasan jika tidak ada | anggota org |
| GET | `/api/v1/ratios?from=&to=&as_of=` | 16 rasio + threshold + band + narasi; menyimpan snapshot | anggota org |
| GET | `/api/v1/ratios/thresholds` | Threshold efektif per organisasi/industri | anggota org |
| PATCH | `/api/v1/ratios/thresholds/{ratio_code}` | Override target/warning/critical/direction | owner/admin |
| POST | `/api/v1/ratios/{ratio_code}/explain?from=&to=&as_of=` | Narasi LLM opsional; fallback selalu tersedia | anggota org |

Detail perilaku:

- `from` dan `to` wajib; `from > to` → `422`.
- `as_of` opsional. Default `to`. `as_of < from` → `422`.
- `GET /ratios` meng-upsert `ratio_snapshots` dengan kunci
  `(organization_id, period_from, period_to, formula_version)`.
- `PATCH` memvalidasi urutan: `higher` → `critical <= warning <= target`;
  `lower` → `target <= warning <= critical`. Nilai persen disimpan desimal
  (`0.30` = 30%).
- `explain` mengirim hanya kode/nama/kategori rasio, band, arah, dan kualitas
  data. Tidak ada nominal/PII. Jika LLM gagal, respons tetap `200` dengan
  `source: fallback`. Validasi tanggal sama dengan `GET /ratios`.

### 8.2 Direncanakan (belum ada)

| Method | Path | Fungsi |
|---|---|---|
| GET | `/api/v1/periods` | Daftar periode |
| POST | `/api/v1/periods/{period}/close` | Tutup periode |
| POST | `/api/v1/periods/{period}/reopen` | Buka kembali (owner) |
| GET | `/api/v1/ratios/{code}?from=&to=` | Detail satu rasio |
| GET | `/api/v1/ratios/trend?codes=CR,QR&periods=12` | Tren rasio |
| GET | `/api/v1/ratios/forecast?codes=&horizon=3` | Forecast rasio |
| GET | `/api/v1/receivables/aging` | Aging piutang |
| GET | `/api/v1/inventory/aging` | Dead stock |
| GET | `/api/v1/loans/projection` | Proyeksi DER/DAR |
| GET | `/api/v1/ratio-insights?from=&to=` | Sinyal & rekomendasi |

Aturan respons:

- Selalu ada `period`, `currency`, `data_quality`, `formula_version`.
- Error envelope tetap: `error.code`, `error.message`, `request_id`.
- Tidak ada stack trace/SQL.

---

## 9. Predictive Analytics

1. **Tren rasio**
   - Minimal 8 periode.
   - Walk-forward, bukan random split.
   - Baseline naive; gate: MAE model ≤ 1.05 × naive dan bias wajar.
   - Jika gagal → `status: "gate_failed"`, forecast tidak ditampilkan sebagai angka pasti.

2. **AR aging**
   - Bucket: 0–30, 31–60, 61–90, >90 hari.
   - Prediksi keterlambatan berdasarkan histori pembayaran per pelanggan.
   - Output: probabilitas keterlambatan + eksposur, bukan kepastian.

3. **Inventory dead stock**
   - Hari sejak mutasi terakhir, turnover, quantity vs reorder point.
   - Output: daftar item berisiko + nilai persediaan tertahan.

4. **Proyeksi solvabilitas**
   - Jadwal angsuran pinjaman + asumsi pendapatan.
   - Proyeksi DER/DAR per bulan.
   - Skenario: baseline, pesimis, optimis.

Semua forecast wajib menampilkan `limitations` dan `model_version`.

---

## 10. Prescriptive Rules

Setiap rule:

```json
{
  "rule_id": "RULE-CR-01",
  "ratio_code": "CR",
  "level": "critical",
  "condition": "CR < 1.00",
  "title": "Likuiditas jangka pendek kritis",
  "evidence": ["CR 0.85x di bawah ambang kritis 1.00x"],
  "actions": ["Percepat penagihan piutang", "Negosiasikan ulang jatuh tempo utang"],
  "assumptions": ["Data piutang dan utang tercatat lengkap"],
  "limitations": ["Tidak memperhitungkan fasilitas kredit yang belum dicairkan"],
  "rule_version": "1.0.0"
}
```

Rule awal:

- `CR < critical` → likuiditas kritis.
- `QR < warning` → ketergantungan persediaan tinggi.
- `DER > warning` → risiko solvabilitas.
- `ICR < warning` → beban bunga berat.
- `ACP > warning` → penagihan melambat.
- `INV_TURN < warning` → dead stock.
- `NPM < warning` → margin tipis.
- `TATO < warning` → aset tidak produktif.

Setiap rekomendasi harus bisa ditelusuri ke `ratio_snapshot` + `rule_version`.

---

## 11. AI Narrative Rules

Implementasi saat ini: `backend/app/llm_adapter.py` + `ratio_narrative.py`.
Provider aktif adalah OpenAI-compatible adapter; DeepSeek belum diimplementasikan
dan tetap menjadi opsi riset.

Input LLM hanya field whitelist berikut:

```json
{
  "ratio_code": "CR",
  "ratio_name": "Current Ratio",
  "category": "liquidity",
  "band": "between_target_warning",
  "direction": "higher",
  "quality": "partial"
}
```

Dilarang mengirim:

- nominal absolut;
- nama bisnis/pelanggan;
- email/telepon;
- daftar transaksi.

Sanitasi menghapus semua digit dari nilai field dan membatasi panjang tiap field
80 karakter.

Output LLM adalah teks penjelasan biasa (bukan JSON). Validasi:

- minimal 20 karakter, maksimal 1200 karakter;
- tidak mengandung nominal besar (pola 4+ digit), kata “pasti”/“garansi”,
  saran pajak/hukum, atau rekomendasi investasi spesifik;
- output yang gagal validasi tidak diteruskan; fallback dipakai.

Fallback: template per `ratio_code` + `band` di `ratio_narrative.py`. Jika LLM
gagal/timeout/tidak aktif, respons tetap `200`, `source: "fallback"`, dan
`privacy_note` menjelaskan penyebabnya. `narrative` pada `GET /ratios` selalu
rule-based karena tidak memanggil LLM; LLM hanya dipanggil lewat endpoint
`explain`.

---

## 12. UI/UX

### 12.1 Sudah diimplementasikan

- `/ratios` — ringkasan 4 kartu, 16 rasio dikelompokkan per kategori
  (Likuiditas, Solvabilitas, Aktivitas, Profitabilitas, Pertumbuhan), selector
  periode (bulan lalu/MTD/QTD/YTD), tombol refresh, panel neraca, narasi
  rule-based, tombol “Jelaskan” ke endpoint AI.
- Komponen: `RatioCard`, `RatioSummary`, `BalanceSheetPanel`,
  `DataQualityBadge`.
- State: loading skeleton, empty, error + retry, partial-data warning,
  `unavailable` + alasan, dan `band: not_configured` tanpa target palsu.
- Navigasi “Rasio CFO” di sidebar.
- Frontend tidak menghitung ulang formula; hanya memformat nilai dari API.

### 12.2 Belum diimplementasikan

- `/ratios/[code]` — detail, formula, input, tren, interpretasi.
- `/balance-sheet` — input & tutup periode.
- `/receivables`, `/inventory`, `/assets`, `/loans` — master data minimal.
- `RatioTrendChart`, sparkline, toast, dan UI pengaturan threshold.
- `PeriodSelector` berbasis daftar periode tersedia (saat ini tab tetap).

State wajib: loading, empty, error, partial, locked period. Untuk periode
terkunci belum ada karena endpoint tutup/buka periode belum dibuat.

Aturan:

- Jangan tampilkan angka jika `status = unavailable`.
- Tampilkan alasan dan cara melengkapi data.
- Jangan recalculate di frontend.

---

## 13. Testing

### 13.1 Backend — sudah ada

- `tests/test_ratio_engine.py`: hitungan manual 16 rasio, threshold/band,
  denominator nol, input hilang, ekuitas negatif, saldo awal parsial,
  annualisasi, dan field input tak dikenal.
- `tests/test_ratio_service.py`: mapping DB → input, snapshot persist/upsert,
  balance sheet, threshold efektif, role PATCH.
- `tests/test_ratios_api.py`: auth, validasi tanggal, endpoint ratios/neraca/
  threshold/explain, tenant isolation.
- `tests/test_ratio_narrative.py`: fallback tanpa API key, sanitasi payload,
  validasi output, dan tidak ada kegagalan saat LLM tidak tersedia.

Hasil terakhir: **27 passed** (SQLite sementara; tidak menyentuh PostgreSQL
aplikasi).

### 13.2 Frontend — sudah ada

- `RatioCard` available/unavailable.
- `ratio-format` untuk persen, hari, multiplier, threshold, dan band.
- Test suite lama tetap lulus.

Hasil terakhir: **41 passed / 6 suite**, ESLint 0 warning, `tsc --noEmit` lulus,
`next build` lulus.

### 13.3 Belum ada

- Fixture hitungan manual di `tests/fixtures/ratio_cases/` (saat ini hitungan
  manual ditulis langsung di test).
- Contract snapshot OpenAPI.
- Tenant isolation untuk seluruh endpoint baru di PostgreSQL nyata (unit test
  memakai SQLite).
- E2E: login → tambah transaksi → tutup periode → lihat rasio → detail →
  explain → rekomendasi. Endpoint tutup periode dan halaman detail belum ada.

CI gate:

```bash
cd backend
..\venv\Scripts\python.exe -m pytest tests -q

cd ..\frontend
npm run lint
npm run typecheck
npm test -- --ci --runInBand
npm run build
```

---

## 14. Migrasi & Rollout

Status aktual:

1. Baseline lama yang rusak dipindahkan ke
   `backend/migrations/legacy/64b8ce576449_create_profitai_all_17_tables.py.bak`.
2. Baseline baru: `backend/migrations/versions/15249a199165_baseline_schema_with_ratio_cfo.py`.
3. Database kosong: `alembic upgrade head` membuat 30 tabel aplikasi dan
   `alembic check` bersih.
4. Database PostgreSQL demo yang sudah berisi data direkonsiliasi dengan
   `backend/scripts/reconcile_schema.py`:
   - menambah `accounts.account_role`, `accounts.is_current`,
     `categories.is_cogs`;
   - membuat 11 tabel baru secara idempotent;
   - tidak menghapus data;
   - stamp `alembic_version = 15249a199165`.
5. Backfill yang sudah dilakukan hanya untuk organisasi demo lewat
   `backend/seed_balance_sheet_2026.py`. Mapping `account_id` untuk seluruh
   transaksi lama belum lengkap; rasio menandai input yang hilang sebagai
   `unavailable` alih-alih menebak.
6. Feature flag `RATIO_ENGINE_ENABLED` **belum** diimplementasikan. Rute tetap
   aktif; penyembunyian UI belum diperlukan karena halaman sudah berfungsi.

Perintah verifikasi:

```bash
cd backend
..\venv\Scripts\python.exe -m alembic upgrade head
..\venv\Scripts\python.exe -m alembic check
..\venv\Scripts\python.exe scripts\reconcile_schema.py
```

Jangan menjalankan `reconcile_schema.py` tanpa backup pada database produksi.

---

## 15. Keamanan & Audit

Sudah:

- Semua endpoint rasio/neraca dibatasi `organization_id` dari principal server,
  bukan dari client.
- `PATCH /ratios/thresholds/{ratio_code}` wajib owner/admin.
- Audit `RATIO_THRESHOLD_UPDATED` ditulis saat threshold diubah.
- Payload LLM disanitasi; nominal/PII tidak dikirim.
- Session login, logout, dan revoke sudah ada di auth.

Belum:

- Endpoint tutup/buka periode dan master data (piutang, persediaan, aset,
  pinjaman) belum ada, sehingga guard owner/admin untuk aksi tersebut belum
  berlaku.
- Audit `RATIO_EXPLAINED` belum ditulis.
- Rate limit login belum diverifikasi dalam scope ini.
- Feature flag rasio belum ada.

Jangan log nominal/PII di luar audit yang disetujui.

---

## 16. Data Demo

Status aktual di PostgreSQL demo:

- 273 transaksi total; 161 transaksi periode 2025-12 s/d 2026-11 dari
  `seed_demo_2026.py`, data 2024 lama tetap dipertahankan.
- 13 balance snapshot bulanan dari `seed_balance_sheet_2026.py`.
- 6 item persediaan, 3 piutang, 3 utang, 2 aset tetap, 2 pinjaman.
- 24 transaksi diklasifikasikan ulang sebagai HPP dan 11 transaksi beban bunga
  ditambahkan untuk demo rasio.
- Hanya skenario sehat. Skenario kritis terpisah belum dibuat.
- Threshold default sudah cukup; belum ada override industri khusus.

Seed idempotent:

```bash
cd backend
..\venv\Scripts\python.exe seed_demo_2026.py
..\venv\Scripts\python.exe seed_balance_sheet_2026.py
```

Demo 7 menit yang **benar-benar bisa dilakukan sekarang**:

1. Login.
2. Dashboard kas dan surplus operasional.
3. Tambah transaksi → daftar transaksi berubah.
4. Buka “Rasio CFO” → pilih bulan lalu/MTD.
5. Tunjukkan band, threshold, warning kualitas data, dan `unavailable` + alasan.
6. Buka panel neraca dan rincian akun.
7. Klik “Jelaskan” pada satu rasio → narasi AI/fallback.
8. Slide roadmap: tren, aging, forecast, rekomendasi tersimpan.

Tutup periode, detail rasio, tren, dan rekomendasi tersimpan belum ada di UI,
jadi jangan menjanjikannya sebagai demo live.

---

## 17. Milestone & Acceptance

| Milestone | Deliverable | Acceptance | Status |
|---|---|---|---|
| **M0 Fondasi** | DB konsisten, CRUD jalan, build/test hijau, data 2026 | Demo flow dasar lulus | **Selesai** |
| **M1 Data model** | Tabel baru + migration + seed | Neraca seimbang | **Selesai** (demo org) |
| **M2 Ratio engine** | 16 rasio + test hitungan manual | Semua unit test lulus | **Selesai** |
| **M3 API** | Endpoint rasio/neraca/threshold/explain | Contract test lulus | **Selesai** |
| **M4 UI** | Halaman rasio + detail + tutup periode | Demo rasio jalan | **Sebagian**: `/ratios` selesai; detail/tutup periode belum |
| **M5 Predictive** | Tren, AR aging, inventory, debt | Gate forecast benar | **Belum** |
| **M6 Prescriptive + AI** | Rule + narasi + fallback | AI tidak mengubah angka | **Sebagian**: narasi + fallback selesai; rule tersimpan belum |
| **M7 Hardening** | Security, CI, docs, demo | Release checklist lulus | **Sebagian**: test/lint/build/docs; CI & E2E belum |

Estimasi: 24 hari kerja (1 orang) atau 10–14 hari (2–3 orang paralel).

---

## 18. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Beban input data terlalu besar untuk UMKM | Wizard saldo awal, default kategori, import CSV |
| Rasio tidak bermakna karena data tidak lengkap | `unavailable` + alasan + panduan lengkapi |
| Threshold berbeda per industri | Tabel threshold + override organisasi |
| Negative equity | Rasio ditandai tidak bermakna |
| LLM tidak tersedia | Fallback template; provider adapter; endpoint tetap 200 |
| AI mengarang angka | Sanitasi input + validasi output + fallback; angka tetap dari engine |
| Waktu habis | Rilis bertahap; M0–M4 dulu; M5 ditunda |
| Migration merusak data | Backup + uji upgrade + rekonsiliasi aditif + stamp |

---

## 19. Keputusan Terbuka

1. Ambang default per industri (retail, F&B, jasa) — **belum diputuskan**;
   saat ini memakai default UMKM generik.
2. Apakah rasio hanya boleh dihitung setelah tutup periode — **belum
   diputuskan**. Implementasi saat ini menghitung preview dari data berjalan
   dan menandai kualitas data; endpoint tutup periode belum ada.
3. Apakah user boleh override nilai neraca manual — **belum diputuskan**. Saat
   ini neraca berasal dari snapshot yang di-seed/API, belum ada form UI.
4. Provider LLM — **diputuskan sementara**: adapter OpenAI-compatible aktif
   secara opsional; DeepSeek tetap opsi riset, belum diimplementasikan.
5. Target demo — **diputuskan**: M0–M4 untuk demo inti; M5 predictive ditunda.
6. Owner tiap milestone — belum berubah dari tabel di atas.

---

## 20. Definition of Done

- Semua acceptance milestone terpenuhi.
- Test backend & frontend lulus.
- Build & lint hijau.
- Tidak ada angka hardcoded di UI.
- Setiap rasio bisa ditelusuri ke input + formula version.
- AI hanya narasi; fallback terbukti.
- Dokumentasi status jujur + known limitations.
- Demo script diuji oleh anggota tim lain.
