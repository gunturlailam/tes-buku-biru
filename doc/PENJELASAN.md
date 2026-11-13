# PENJELASAN PROYEK

## BenangMerah CFO --- AI-Powered Financial Intelligence & Procurement Forensics

## 1. Ringkasan eksekutif

BenangMerah CFO adalah platform intelijen keuangan yang dirancang untuk
membantu tim keuangan, manajemen, procurement, dan auditor internal
memahami kondisi keuangan sekaligus memprioritaskan pemeriksaan
transaksi pengadaan. Sistem menggabungkan analisis kesehatan keuangan,
pemeriksaan forensik pengadaan, dan AI Strategic Advisor yang
menjelaskan hasil berdasarkan bukti.

**Positioning:** BenangMerah CFO membantu perusahaan memahami kondisi
keuangan sekaligus mengidentifikasi indikasi penyimpangan pengadaan
melalui analisis berbasis data dan bukti.

Produk ini adalah alat bantu keputusan, bukan pengganti CFO, auditor,
akuntan, atau penyidik. Temuan merupakan indikasi yang perlu
diverifikasi manusia, bukan putusan bahwa seseorang/vendor melakukan
fraud.

## 2. Masalah yang disasar

1.  **Visibilitas kesehatan keuangan terbatas:** data laporan keuangan
    perlu dikonsolidasikan, rasio dihitung, tren dibandingkan, dan
    risiko dipahami.
2.  **Risiko penyimpangan pengadaan:** duplikasi invoice, harga tidak
    wajar, vendor impersonation, ketidaksesuaian hitung, dan relasi
    entitas dapat luput dari pemeriksaan manual.
3.  **Informasi terpisah:** temuan keuangan dan pengadaan sering
    ditinjau dalam proses berbeda sehingga manajemen sulit mendapat
    gambaran menyeluruh.

## 3. Solusi: tiga modul utama

### A. Financial Health Intelligence

Mengolah data laporan keuangan untuk: - Rasio likuiditas: Current Ratio,
Quick Ratio. - Rasio solvabilitas: Debt to Equity Ratio (DER), Debt to
Asset Ratio (DAR). - Rasio profitabilitas: Gross Profit Margin (GPM),
Net Profit Margin (NPM), Return on Assets (ROA). - Rasio aktivitas:
Inventory Turnover, Average Collection Period, Total Asset Turnover
(TATO). - Tren antarperiode dan early warning berbasis aturan. -
Forecast hanya jika data historis memadai dan evaluasinya layak.

Setiap rasio harus menampilkan periode, satuan, rumus, komponen
pembilang/penyebut, dan status kelengkapan data.

### B. Procurement Forensics

Menganalisis transaksi pengadaan melalui lima detektor: 1. Double
invoice. 2. Markup harga terhadap referensi. 3. Indikator BEC/vendor
impersonation. 4. Ketidaksesuaian aritmetika invoice. 5. Indikasi
keterkaitan entitas/kolusi, misalnya rekening bank bersama.

Setiap temuan harus menyertakan alasan, transaksi terkait, bukti sumber,
tingkat risiko, dan saran verifikasi. Anomali bukan bukti final fraud.

### C. AI Strategic Advisor

Menggabungkan hasil dua modul menjadi: - Executive summary. - Financial
insight. - Procurement insight. - Cross-module insight jika ada dasar
data. - Prioritas pemeriksaan dan rekomendasi tindak lanjut.

AI hanya menjelaskan hasil terstruktur. AI tidak menghitung ulang angka,
mengubah severity, menetapkan fraud, atau mengarang bukti. Jika API AI
gagal/tidak tersedia, sistem memakai template fallback deterministik.

## 4. Pengguna sasaran

  Pengguna                      Kebutuhan
  ----------------------------- -------------------------------------------------
  CFO/manajemen                 Ringkasan kondisi keuangan dan prioritas risiko
  Finance analyst               Rasio, tren, formula, dan validasi
  Procurement                   Pemeriksaan transaksi/vendor
  Auditor internal/compliance   Evidence, relasi, dan jejak transaksi
  Pemilik usaha                 Gambaran risiko dan langkah pemeriksaan

Persona ini tidak berarti autentikasi multi-role sudah tersedia. Fitur
akses pengguna hanya boleh diklaim jika benar-benar dibangun dan diuji.

## 5. Alur kerja sistem

1.  Pengguna membuka dashboard.
2.  Pengguna memasukkan data keuangan dan/atau mengunggah CSV pengadaan.
3.  Sistem memvalidasi format, kolom, tipe data, tanggal, nominal, dan
    kelengkapan.
4.  Financial Engine menghitung rasio/tren/warning; Procurement Engine
    menjalankan detektor.
5.  Sistem menghasilkan temuan terstruktur beserta evidence.
6.  AI Advisor menyusun narasi dari ringkasan yang sudah divalidasi.
7.  Pengguna meninjau bukti dan memutuskan tindak lanjut.
8.  Ekspor laporan dapat dilakukan jika fitur ekspor telah dibangun.

## 6. Keunggulan dan diferensiasi

-   Satu platform menggabungkan financial health dan procurement
    forensics.
-   Temuan disertai evidence, bukan hanya label risiko.
-   AI dipisahkan dari mesin perhitungan dan deteksi.
-   Cross-module insight membantu melihat keterkaitan, tetapi korelasi
    tidak boleh disebut sebab-akibat tanpa bukti.
-   Human-in-the-loop menjaga keputusan akhir pada manusia.

## 7. Contoh penggunaan

**Analisis keuangan:** pengguna memasukkan neraca dan laba rugi beberapa
periode. Sistem memvalidasi akun, menghitung rasio yang didukung data,
menampilkan tren, dan memberi peringatan berbasis aturan.

**Pemeriksaan pengadaan:** pengguna mengunggah CSV. Sistem memeriksa
duplikasi, harga, email/rekening vendor, hitungan invoice, dan relasi
entitas. Pengguna membuka temuan untuk memeriksa transaksi sumber.

**Ringkasan manajemen:** Advisor merangkum rasio yang berubah dan temuan
pengadaan prioritas dengan menyebut periode serta ID bukti. Sistem tidak
mengklaim kausalitas yang belum terbukti.

## 8. Batasan yang wajib dinyatakan

-   Kualitas hasil bergantung pada kelengkapan dan kebenaran data.
-   Detektor hanya mengenali pola yang tercakup dalam aturan/fitur.
-   Data sintetis cocok untuk demo dan uji teknis, bukan bukti performa
    produksi.
-   Precision/recall/F1 pada dataset sintetis tidak boleh digeneralisasi
    ke transaksi nyata.
-   Anomali statistik adalah kandidat pemeriksaan, bukan konfirmasi
    fraud.
-   OCR invoice, integrasi ERP/core banking, payment hold nyata,
    WhatsApp nyata, dan SaaS multi-tenant bukan bagian baseline kecuali
    benar-benar dibuat dan diuji.
-   Forecast dengan data sedikit harus dinonaktifkan atau diberi label
    indikatif.
-   Jangan mengirim data rahasia/PII ke layanan AI eksternal tanpa izin,
    masking, dan kontrol.

## 9. Metrik keberhasilan

-   Keberhasilan pemrosesan file valid.
-   Kejelasan error untuk file invalid.
-   Waktu analisis dataset demo.
-   Jumlah temuan dengan evidence yang dapat ditelusuri.
-   Kesesuaian rumus rasio dengan perhitungan manual.
-   Keberhasilan alur end-to-end.
-   Ketersediaan fallback saat API AI gagal.
-   Kemudahan pengguna memahami alasan temuan.

Jika mengukur precision/recall/F1, sebutkan ukuran dataset, komposisi
label, metode pembagian data, dan keterbatasannya.

## 10. Alur demo yang disarankan

1.  Masalah dan pengguna sasaran.
2.  Dashboard overview.
3.  Input data keuangan dan rasio yang benar-benar dihitung.
4.  Upload CSV procurement.
5.  Temuan, evidence, dan filter.
6.  Graph relasi jika berfungsi.
7.  AI Advisor dan sumber bukti.
8.  Fallback/error handling.
9.  Dampak, batasan, dan keputusan manusia.

## 11. Prinsip produk

Evidence first; deterministic core; explainable; human-in-the-loop;
privacy-aware; reproducible; honest claims.
