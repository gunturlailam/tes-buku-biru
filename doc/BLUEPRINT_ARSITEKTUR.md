# BLUEPRINT ARSITEKTUR TEKNIS

## BenangMerah CFO

## 1. Prinsip

-   Pisahkan UI, API, domain logic, dan data.
-   Perhitungan finansial dan deteksi dilakukan backend.
-   LLM hanya lapisan narasi.
-   Setiap finding memiliki evidence.
-   Validasi pada batas masuk dan domain logic.
-   Kegagalan layanan AI tidak boleh menggagalkan analisis inti.

## 2. Stack rencana

  Layer          Teknologi rencana                Fungsi
  -------------- -------------------------------- -------------------------------
  Frontend       Next.js, TypeScript, Tailwind    UI dan interaksi
  Charts/Graph   Recharts, React Flow             Visualisasi
  State          Zustand atau React state         State UI
  Backend        FastAPI, Python                  API dan orchestration
  Analysis       Python modules                   Financial engine dan detector
  AI             Gemini API opsional              Narasi berbasis evidence
  Data demo      CSV                              Dataset contoh
  Testing        Pytest dan frontend test tools   Unit/integration/E2E

Versi, lisensi, dan kompatibilitas dependency harus dicatat. Daftar ini
adalah rancangan stack, bukan bukti komponen sudah tersedia.

## 3. Diagram sistem

``` mermaid
flowchart TD
 U[Pengguna] --> FE[Next.js Web App]
 FE --> API[FastAPI]
 API --> VAL[Validation Layer]
 VAL --> ORCH[Analysis Orchestrator]
 ORCH --> FIN[Financial Engine]
 ORCH --> PROC[Procurement Engine]
 PROC --> D1[Double Invoice]
 PROC --> D2[Markup Price]
 PROC --> D3[BEC Indicators]
 PROC --> D4[Arithmetic Check]
 PROC --> D5[Entity Resolution]
 FIN --> RES[Structured Results]
 D1 --> RES
 D2 --> RES
 D3 --> RES
 D4 --> RES
 D5 --> RES
 RES --> ADV[AI Advisor]
 ADV --> LLM[Gemini API Optional]
 ADV --> FB[Template Fallback]
 LLM --> OUT[Validated Output]
 FB --> OUT
 OUT --> API
 API --> FE
```

## 4. Alur request

1.  Frontend mengirim file/payload.
2.  API memeriksa ukuran, format, schema, dan tipe data.
3.  Service membersihkan/menormalkan input.
4.  Orchestrator memanggil modul yang relevan.
5.  Engine menghitung secara deterministik.
6.  Hasil disusun ke schema standar.
7.  Advisor menerima ringkasan terstruktur yang dimasking.
8.  Output AI divalidasi atau diganti fallback.
9.  API mengembalikan hasil.
10. Frontend menampilkan ringkasan dan evidence.

## 5. Struktur folder yang disarankan

``` text
benangmerah-cfo/
├── frontend/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── financial/
│   │   ├── procurement/
│   │   └── advisor/
│   ├── components/
│   ├── lib/
│   ├── services/
│   └── types/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/v1/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── engines/financial/
│   │   ├── engines/procurement/detectors/
│   │   ├── advisor/
│   │   ├── utils/
│   │   └── core/
│   ├── tests/
│   └── requirements.txt
├── data/samples/
├── docs/
├── .env.example
├── .gitignore
└── README.md
```

## 6. Backend components

-   **API layer:** routing, HTTP status, schema, error mapping.
-   **Validation layer:** file, header, tipe, tanggal, nominal, batas
    ukuran.
-   **Financial engine:** account mapping, formula, rasio, tren, rule
    warning.
-   **Procurement engine:** lima detector yang terpisah.
-   **Evidence builder:** menyimpan alasan dan referensi transaksi/kolom
    sumber.
-   **Graph builder:** node/edge hanya dari relasi yang benar-benar ada.
-   **Advisor service:** prompt terstruktur, masking, validasi output,
    fallback.

## 7. Standard finding schema

``` json
{
  "finding_id": "FND-0001",
  "detector": "double_invoice",
  "category": "duplicate_invoice_candidate",
  "severity": "high",
  "transaction_ids": ["TRX-001", "TRX-019"],
  "evidence": [
    {
      "field": "vendor_id",
      "observed_values": ["V-01", "V-01"],
      "explanation": "Kedua transaksi tercatat pada vendor yang sama."
    }
  ],
  "is_confirmed_fraud": false
}
```

Score hanya dipakai jika definisinya terdokumentasi; jangan menyebut
score sebagai probabilitas fraud tanpa kalibrasi. Temuan detektor adalah
indikasi, bukan keputusan final.

## 8. API baseline

  Method   Endpoint                      Tujuan
  -------- ----------------------------- -----------------------------------
  GET      `/api/v1/health`              Status layanan
  GET      `/api/v1/forensics/demo`      Dataset/hasil demo jika tersedia
  POST     `/api/v1/forensics/analyze`   Analisis CSV procurement
  POST     `/api/v1/financial/analyze`   Analisis data keuangan --- usulan
  POST     `/api/v1/advisor/summary`     Narasi hasil --- usulan

Endpoint yang ditandai usulan belum boleh dianggap tersedia sebelum
dibuat dan diuji. Kontrak final harus disepakati Developer 1--4.

## 9. Contoh response konseptual

``` json
{
  "analysis_id": "ANL-2026-0001",
  "status": "completed",
  "dataset_summary": {
    "rows_received": 100,
    "rows_valid": 98,
    "rows_rejected": 2
  },
  "summary": {
    "total_findings": 4,
    "high_risk_findings": 1,
    "potential_exposure": 12500000,
    "currency": "IDR"
  },
  "findings": [],
  "warnings": [
    "Hasil merupakan indikasi dan memerlukan verifikasi manusia."
  ]
}
```

Angka di atas adalah contoh bentuk JSON, bukan hasil proyek.

## 10. Security & privacy

-   API key hanya di environment variable; jangan commit `.env`.
-   Sediakan `.env.example` tanpa secret.
-   Batasi ukuran dan jumlah baris file.
-   Validasi isi file, bukan ekstensi saja.
-   Jangan menjalankan formula/macro/perintah dari file.
-   Escape output untuk mencegah XSS.
-   Cegah CSV formula injection pada ekspor.
-   Masking rekening, email, dan PII pada UI serta payload AI.
-   Jangan tampilkan stack trace ke pengguna.
-   Batasi CORS.
-   Jika tanpa autentikasi, nyatakan demo tidak cocok untuk data
    produksi.
-   Perlakukan prompt injection di file sebagai data tidak tepercaya.
-   Tetapkan retensi dan penghapusan file upload.

## 11. Testing

**Unit:** rumus normal/nol/negatif/missing; tiap detector untuk
true/false/edge/missing field; entity normalization; exposure
anti-double-counting; Advisor fallback.

**Integration:** upload → validation → detector → finding; financial
input → mapping → ratios; result → Advisor/fallback.

**E2E:** run aplikasi, upload sample, tinjau temuan, buka evidence,
lihat graph jika aktif, jalankan Advisor saat API sukses dan gagal.

## 12. Logging

Catat request/analysis ID, waktu proses, jumlah baris, detector yang
berjalan, kategori error, dan status Advisor. Jangan mencatat
rekening/token/rahasia secara utuh.

## 13. Deployment demo

Pisahkan konfigurasi lokal/deploy, uji environment variable, jalankan
smoke test setelah deploy, dan siapkan demo lokal cadangan. Jangan
menyatakan deployment tersedia sebelum URL diuji.

## 14. Batas arsitektur baseline

OCR, ERP/core banking, pembayaran nyata, WhatsApp nyata, multi-tenant
SaaS, SSO, dan RBAC enterprise bukan bagian baseline kecuali benar-benar
diimplementasikan dan diuji.
