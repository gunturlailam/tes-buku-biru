# PRODUCT REQUIREMENTS DOCUMENT (PRD) — ProfitAI

**Versi:** 1.0  
**Status:** Baseline MVP untuk persetujuan tim  
**Product Lead:** Risfiatul  
**Target:** Web-first MVP; arsitektur API-ready untuk klien lain bila diputuskan kemudian.

## 1. Ringkasan produk

ProfitAI mengubah data transaksi dan saldo usaha menjadi laporan, indikator kesehatan keuangan, forecast yang tervalidasi, dan rekomendasi yang dapat dijelaskan.

## 2. Problem statement

Pemilik usaha kesulitan memperoleh gambaran keuangan yang konsisten karena pencatatan tersebar, klasifikasi tidak konsisten, pencampuran transaksi pribadi/usaha, dan minimnya analisis ke depan. Produk harus membantu pengguna memahami data yang tersedia tanpa menyembunyikan kekurangan datanya.

## 3. Goals

- Satu sumber data transaksi usaha.
- Perhitungan inti konsisten di backend.
- Dashboard dengan periode dan kualitas data jelas.
- Sinyal risiko transparan dan dapat dikonfigurasi.
- Forecast hanya jika data dan evaluasi mendukung.
- Rekomendasi memiliki evidence dan batasan.
- Web mengonsumsi satu API terpusat.

## 4. Non-goals MVP

Lihat `PROGRAM.md`. Secara khusus: pajak otomatis, audit, credit scoring, integrasi bank, multi-currency kompleks, akuntansi korporasi penuh, dan chatbot bebas.

## 5. Persona dan kebutuhan

### Owner UMKM
Ingin mengetahui pemasukan, pengeluaran, laba, kas, dan tindakan yang perlu diperhatikan tanpa harus membaca spreadsheet rumit.

### Admin keuangan
Ingin memasukkan/mengimpor transaksi, mengoreksi kategori, memfilter periode, dan menelusuri sumber angka.

### Team/organization admin
Ingin mengelola anggota dan akses data usaha.

## 6. User journeys MVP

1. Sign up/login → membuat/memilih organisasi.
2. Mengisi profil usaha (nama, industri, basis pencatatan, periode).
3. Menambahkan transaksi atau mengimpor CSV.
4. Melihat preview import dan menyelesaikan error sebelum konfirmasi.
5. Melihat daftar transaksi dan mengoreksi kategori.
6. Membuka dashboard dan memilih periode.
7. Membuka detail KPI untuk melihat definisi dan sumber.
8. Melihat risk signal dan rekomendasi jika data cukup.

## 7. Functional requirements

### FR-01 Authentication & organization
- Pengguna dapat login/logout.
- Pengguna hanya dapat mengakses organisasi yang menjadi anggotanya.
- Role minimal: owner/admin dan member/viewer (finalisasi permission di implementasi).
- Setiap data bisnis terhubung ke organization_id.

Acceptance:
- user dari organisasi A tidak dapat membaca/mengubah data organisasi B;
- akses diuji di backend, bukan hanya disembunyikan di UI.

### FR-02 Business profile
- Nama usaha wajib.
- Industri dan basis pencatatan dapat dipilih.
- Currency default IDR untuk MVP.
- Zona waktu dan awal periode fiskal dapat dikonfigurasi.
- Perubahan profil dicatat jika memengaruhi perhitungan.

### FR-03 Transaction management
- Create, read, update, dan reversal/void dengan audit trail.
- Field minimum: tanggal, deskripsi, nominal, tipe, kategori, akun/metode pembayaran bila tersedia.
- Tipe harus membedakan income, expense, transfer, owner contribution/draw, loan, refund, receivable/payable sesuai model domain.
- Filter tanggal, tipe, kategori, pencarian.
- Validasi nominal, tanggal, kategori, dan organisasi.

Acceptance:
- transaksi transfer internal tidak menggandakan pendapatan/beban;
- setoran modal dan pinjaman tidak masuk revenue;
- koreksi tidak menghilangkan jejak transaksi.

### FR-04 CSV import
- Upload file, parse preview, map kolom, validasi, tampilkan error per baris, deteksi duplikasi, konfirmasi import.
- Jangan menyimpan transaksi final sebelum user mengonfirmasi preview.
- Batasi ukuran dan tipe file; parsing dilakukan aman.

Acceptance:
- file invalid ditolak dengan pesan yang dapat ditindaklanjuti;
- import yang sama tidak membuat duplikasi tanpa peringatan;
- user dapat mengunduh/meninjau error report bila diimplementasikan.

### FR-05 Financial summary
- Menampilkan revenue, expense, gross/net profit jika data memadai, cash in/out, net cash flow.
- Setiap KPI memiliki definisi, periode, currency, formula version, data-quality state.
- Periode perbandingan harus setara.

Acceptance:
- angka cocok dengan test fixture independen;
- denominator nol menghasilkan unavailable/null dengan alasan;
- transaksi yang dikecualikan dijelaskan.

### FR-06 Reports
- MVP: ringkasan laba rugi sederhana dan ringkasan arus kas berbasis transaksi tercatat.
- Laporan posisi keuangan hanya bila saldo akun dan komponen yang diperlukan tersedia.
- Jangan mengklaim kepatuhan SAK EMKM otomatis.

### FR-07 Financial health signals
- Menampilkan status normal/attention/critical/insufficient.
- Menampilkan indikator pemicu, nilai, periode, ambang, dan penjelasan.
- Ambang configurable dan berversi.
- Jika data tidak cukup, tampilkan insufficient, bukan normal.

### FR-08 Forecast
- MVP prioritas cash flow; revenue forecast kandidat kedua.
- Baseline wajib; walk-forward validation; MAE/WAPE/Bias minimum.
- Forecast hanya tampil jika melewati release gate metodologi.
- Menampilkan horizon, model version, training window, dan limitations.
- Tidak ada klaim akurasi tanpa hasil backtest.

### FR-09 Recommendations
- Rule-based recommendation lebih dulu.
- Setiap rekomendasi memiliki trigger metric, evidence, action, assumptions, limitations, priority.
- LLM opsional hanya untuk merangkum evidence dalam Bahasa Indonesia.
- Output LLM divalidasi; jika gagal, tampilkan rule-based text.

### FR-10 UX states
Setiap halaman memiliki loading, empty, error, success, dan partial-data state sesuai kebutuhan. Jangan menyembunyikan warning data.

## 8. Non-functional requirements

- Security: authentication, authorization, tenant isolation, input validation, secrets management.
- Reliability: errors ditangani; operasi import idempotent atau memiliki duplicate guard.
- Performance: paginated transaction list; query agregasi efisien; target angka performa ditentukan setelah baseline profiling.
- Maintainability: modular domain services, tests, migrations, API docs.
- Accessibility: label form, keyboard navigation, contrast yang memadai.
- Explainability: angka dapat ditelusuri ke sumber, formula version, dan periode.
- Privacy: minimisasi data, pembatasan akses, kebijakan retensi dan penghapusan yang jelas.

## 9. MVP priority

**P0 — wajib**
- Organization/auth dasar
- Transaction CRUD
- Kategori dan filter
- Financial engine dasar
- Dashboard ringkasan
- Data quality warnings
- Tests dan tenant isolation

**P1 — setelah P0 stabil**
- CSV import
- Risk signals
- Rule-based recommendations
- Report export

**P2 — hanya jika waktu dan validasi cukup**
- Forecasting produksi
- LLM explanation
- Mobile client
- Integrasi pihak ketiga

## 10. Analytics / product success metrics

Ukur:
- activation: pengguna berhasil membuat organisasi dan mencatat transaksi;
- time-to-first-insight;
- persentase transaksi terkategorisasi;
- jumlah error import/duplikasi;
- penggunaan dashboard/report;
- rekomendasi yang dibuka/ditandai selesai (bukan bukti dampak finansial);
- forecast error pada data uji jika forecast dirilis.

Jangan mengukur keberhasilan dengan jumlah token, jumlah chatbot response, atau klaim akurasi yang tidak tervalidasi.

## 11. Dependencies and assumptions

- Stack yang sudah ada di repository dipertahankan sampai diperiksa.
- Backend adalah sumber kebenaran perhitungan.
- Database relational direkomendasikan; PostgreSQL dapat digunakan jika memang sudah dipilih.
- Web-first karena komposisi tugas frontend saat ini dua anggota dan belum ada keputusan eksplisit mobile.
- Integrasi bank dan sumber eksternal belum menjadi asumsi MVP.

## 12. Open decisions

Dicatat di `DECISIONS.md` dan ADR:
- framework/version aktual backend dan frontend;
- model role/permission;
- basis kas vs akrual dan cakupan laporan;
- chart of accounts/kategori default;
- format CSV;
- definisi baseline dan risk threshold;
- apakah mobile termasuk MVP atau fase berikutnya.

## 13. Release acceptance

MVP dapat didemokan bila:
- alur transaksi end-to-end berfungsi;
- perhitungan inti cocok dengan fixtures;
- isolasi organisasi diuji;
- dashboard menunjukkan periode, currency, dan data quality;
- tidak ada angka AI yang dibuat-buat;
- fitur yang belum valid dinonaktifkan atau diberi label belum tersedia;
- dokumentasi setup dan demo dataset tersedia.
