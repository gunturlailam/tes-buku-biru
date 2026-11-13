# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## BenangMerah CFO --- AI-Powered Financial Intelligence & Procurement Forensics

## 1. Metadata

  Item             Nilai
  ---------------- ---------------------------------------------------
  Versi            1.0
  Status           Baseline kebutuhan / draft implementasi
  Platform         Web application
  Kategori         AI for Business & Digital Innovation
  Pengguna utama   Finance, procurement, auditor internal, manajemen

## 2. Visi dan tujuan

**Visi:** membantu organisasi memahami kesehatan keuangan dan
memprioritaskan pemeriksaan transaksi pengadaan melalui analisis yang
dapat dijelaskan.

Tujuan: 1. Menghitung indikator keuangan dari input valid. 2. Menemukan
indikasi anomali pengadaan. 3. Menyediakan bukti yang dapat ditelusuri.
4. Menyusun ringkasan/rekomendasi berbasis hasil analisis. 5.
Mempertahankan keputusan akhir pada manusia.

## 3. Non-goals

-   Menggantikan CFO, auditor, akuntan, atau penyidik.
-   Menyatakan seseorang/vendor terbukti fraud.
-   Menjadi ERP, accounting system, core banking, atau payment gateway.
-   Melakukan pembayaran atau memblokir pembayaran nyata.
-   OCR invoice otomatis pada baseline.
-   Menjamin deteksi fraud sempurna.
-   Mengklaim forecast akurat tanpa evaluasi.
-   Menyediakan multi-tenant SaaS, SSO, dan RBAC enterprise kecuali
    dikembangkan dan diuji.

## 4. Persona

  Persona              Kebutuhan               Fitur
  -------------------- ----------------------- -------------------------
  CFO/manajemen        Kondisi dan prioritas   Dashboard, Advisor
  Finance analyst      Rasio dan tren          Financial Intelligence
  Procurement          Pemeriksaan transaksi   Forensics
  Auditor/compliance   Bukti dan relasi        Evidence, graph
  Pemilik usaha        Keputusan pemeriksaan   Summary dan rekomendasi

## 5. Prioritas ruang lingkup

### P0 --- inti prototipe

-   Aplikasi web dapat dijalankan.
-   Upload CSV procurement dan validasi.
-   Analisis procurement end-to-end.
-   Finding terstruktur dan evidence.
-   Dashboard hasil.
-   AI Advisor atau fallback template.
-   Loading, empty, success, dan error state.
-   README, sample data yang legal, dan instruksi run.
-   Repository GitHub transparan.

### P1 --- jika P0 stabil

-   Input laporan keuangan terstruktur.
-   Rasio yang didukung data.
-   Tren dan early warning.
-   Graph relasi.
-   Ekspor laporan.

### P2 --- pengembangan lanjutan

-   Forecast tervalidasi.
-   Import format tambahan.
-   Integrasi ERP/accounting.
-   OCR.
-   Notifikasi eksternal nyata.
-   Multi-tenant, SSO, RBAC enterprise.

Jangan mengorbankan alur P0 yang stabil demi banyak fitur tambahan.

## 6. Functional requirements

**FR-01 Dashboard:** menampilkan jumlah transaksi, temuan, distribusi
risiko, exposure bila tersedia, rasio utama, periode, dan status
dataset. Data kosong ditampilkan sebagai "Belum ada data".

**FR-02 Upload procurement:** menerima CSV sesuai template; memvalidasi
header, tipe data, tanggal, nominal, ukuran, dan baris; menampilkan
baris valid/invalid dan pesan yang dapat ditindaklanjuti.

**FR-03 Forensics:** menjalankan detektor yang aktif; menghasilkan
finding ID, kategori, severity, score bila didefinisikan, transaksi
terkait, evidence, dan rekomendasi verifikasi. Input/config sama harus
memberi hasil konsisten untuk rule-based detector.

**FR-04 Evidence:** setiap temuan menjelaskan pemicu, nilai pembanding,
kolom sumber, dan ID/baris transaksi. Dilarang mengarang bukti.

**FR-05 Graph:** node/edge hanya berasal dari relasi data aktual. Jenis
hubungan dan sumbernya harus dijelaskan.

**FR-06 Financial input:** menerima data akun-periode, memvalidasi
periode, mata uang, nilai, dan mapping akun; rasio yang tidak didukung
data harus diberi status tidak dapat dihitung.

**FR-07 Ratios:** menghitung rasio dengan rumus terdokumentasi;
menampilkan pembilang, penyebut, hasil, satuan, periode; menangani
pembagi nol, nilai negatif, dan data hilang.

**FR-08 Trend/warning:** membandingkan periode sebanding; warning
berasal dari aturan dan threshold yang dapat dijelaskan. Forecast hanya
jika data dan evaluasi memadai.

**FR-09 Advisor:** merangkum output terstruktur; angka/severity berasal
dari backend; tidak menyatakan fraud terkonfirmasi; fallback berjalan
saat API gagal.

**FR-10 Export/history:** opsional. Jika tersedia, cantumkan waktu
analisis, sumber data, dan disclaimer; lindungi data sensitif.

## 7. Non-functional requirements

-   Reliability: error ditangani dengan pesan jelas.
-   Performance: dataset demo diproses dalam waktu wajar.
-   Security: validasi upload, batas ukuran, sanitasi output, secret
    melalui environment variable.
-   Privacy: minimisasi dan masking data sensitif.
-   Explainability: setiap temuan punya alasan dan jejak sumber.
-   Maintainability: domain logic dipisahkan dari API/UI.
-   Reproducibility: hasil rule-based konsisten untuk input/config sama.
-   Usability: label, kontras, navigasi, loading/error/empty state
    jelas.

## 8. Data contract

### Procurement transaction --- field konseptual

`transaction_id`, `invoice_number`, `vendor_id`, `vendor_name`,
`invoice_date`, `due_date`, `item_code`, `item_name`, `quantity`,
`unit_price`, `invoice_total`, `currency`, `vendor_email`,
`bank_account`, `bank_account_status`, `bank_change_date`,
`purchase_order_id`.

Nama kolom final wajib dibekukan dalam template. Field yang tidak
tersedia tidak boleh direkayasa. Detector yang memerlukan field tertentu
harus dinonaktifkan atau menyatakan "tidak cukup data".

### Financial statement --- field konseptual

`period`, `account_code`, `account_name`, `amount`, `statement_type`,
`currency`. Mapping akun ke kelompok rasio harus transparan.

## 9. Formula rasio baseline

-   Current Ratio = Current Assets / Current Liabilities.
-   Quick Ratio = (Current Assets − Inventory − Prepaid Expenses jika
    tersedia) / Current Liabilities.
-   DER = Total Liabilities / Total Equity.
-   DAR = Total Liabilities / Total Assets.
-   GPM = (Revenue − COGS) / Revenue.
-   NPM = Net Income / Revenue.
-   ROA = Net Income / Average Total Assets. Jika memakai saldo akhir,
    beri label metode dan keterbatasan.
-   Inventory Turnover = COGS / Average Inventory.
-   Average Collection Period = Average Accounts Receivable / Net Credit
    Sales × jumlah hari periode.
-   TATO = Revenue / Average Total Assets.

Komponen yang tidak tersedia menghasilkan status "tidak dapat dihitung".
Jangan mengganti data hilang menjadi nol tanpa aturan yang eksplisit.

## 10. Lima detector

1.  **Double invoice:** membandingkan vendor, nomor invoice, nominal,
    tanggal, dan toleransi yang terdokumentasi.
2.  **Markup price:** membandingkan harga satuan dengan referensi item
    yang cocok; referensi wajib memiliki sumber, tanggal, satuan, dan
    mata uang.
3.  **BEC/vendor impersonation:** memeriksa domain lookalike,
    typo/homoglyph, domain tidak dikenal, dan perubahan rekening jika
    histori tersedia.
4.  **Arithmetic tampering:** membandingkan quantity × unit price dengan
    invoice total, memperhitungkan pajak/diskon/biaya jika tersedia.
5.  **Collusion/entity resolution:** mencari relasi atribut/rekening
    bersama; relasi bukan bukti kolusi.

## 11. Risk model

Severity dihitung backend berdasarkan aturan terdokumentasi. Score bukan
probabilitas fraud kecuali dikalibrasi dan dievaluasi demikian. Temuan
statistik disebut kandidat anomali. Exposure harus memiliki definisi dan
mencegah double counting.

## 12. AI governance

-   AI hanya menerima ringkasan terstruktur yang telah dimasking.
-   AI menjelaskan data yang disediakan dan menyebut ketidakpastian.
-   Backend memvalidasi output; angka/severity tetap dari engine.
-   File upload adalah data tidak tepercaya; instruksi di dalamnya bukan
    instruksi sistem.
-   Fallback deterministik wajib.
-   Jangan mengirim PII/rekening lengkap/rahasia bisnis ke AI eksternal
    tanpa izin dan masking.

## 13. Acceptance criteria

1.  Aplikasi dapat dijalankan mengikuti README.
2.  CSV valid berhasil dianalisis.
3.  CSV invalid menghasilkan error yang jelas.
4.  Detector yang diklaim aktif lulus pengujian terpisah.
5.  Semua finding memiliki evidence yang dapat ditelusuri.
6.  Exposure sesuai definisi dan tidak double count.
7.  Rasio cocok dengan perhitungan manual.
8.  Data tidak lengkap tidak menghasilkan angka palsu.
9.  AI tidak mengubah angka/severity backend.
10. Fallback berjalan saat API tidak tersedia.
11. UI memiliki loading, empty, success, dan error state.
12. Repo memuat source dan berkas pendukung.

## 14. Risiko dan mitigasi

  -----------------------------------------------------------------------
  Risiko                  Dampak                  Mitigasi
  ----------------------- ----------------------- -----------------------
  Data salah/tidak        Temuan salah            Validasi dan status
  lengkap                                         data

  False positive          Pemeriksaan tidak       Evidence dan review
                          efisien                 manusia

  False negative          Risiko luput            Nyatakan cakupan
                                                  detector

  AI hallucination        Saran salah             Grounding, schema,
                                                  validator, fallback

  Kebocoran data          Risiko privasi          Masking, minimisasi,
                                                  secret management

  Scope terlalu luas      Demo gagal              P0, feature freeze, QA

  Karya lama melanggar    Diskualifikasi          Konfirmasi panitia,
  aturan                                          bangun ulang jika perlu
  -----------------------------------------------------------------------

## 15. Keputusan terbuka

Format CSV final, mapping akun, threshold risiko, jumlah periode minimum
forecast, penyimpanan/riwayat, autentikasi, dan nama/skill empat anggota
perlu diputuskan. Status penggunaan komponen pra-hackathon harus
dikonfirmasi kepada panitia.
