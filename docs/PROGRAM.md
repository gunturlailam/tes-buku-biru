# PROGRAM — Penjelasan Program ProfitAI

## 1. Identitas

**Nama:** ProfitAI  
**Kategori:** Financial Technology / Business Intelligence / AI for Business  
**Arah produk:** Complete Financial Intelligence — analysis, forecasting, and explainable recommendations.

ProfitAI adalah platform yang mengolah data keuangan usaha menjadi informasi yang lebih mudah dipahami dan digunakan untuk mengambil keputusan. Pengguna memasukkan atau mengimpor transaksi dan saldo, kemudian sistem melakukan validasi, pengelompokan, perhitungan, analisis tren, estimasi, dan rekomendasi.

## 2. Masalah yang ingin diselesaikan

Banyak pemilik usaha mencatat pemasukan dan pengeluaran secara tersebar atau hanya melihat saldo kas. Akibatnya:
- sulit mengetahui laba dan margin dengan konsisten;
- uang pribadi dan usaha dapat tercampur;
- arus kas masa depan sulit diperkirakan;
- piutang, utang, dan biaya tidak selalu dipantau;
- keputusan sering dibuat tanpa indikator dan bukti yang terstruktur.

ProfitAI membantu mengurangi masalah tersebut dengan menyediakan satu alur data dan insight yang dapat ditelusuri. Produk tidak menggantikan akuntan atau menjamin keputusan bisnis benar.

## 3. Pengguna sasaran

### MVP
- pemilik/pengelola UMKM;
- staf administrasi/keuangan usaha kecil;
- satu organisasi usaha dengan satu atau beberapa pengguna yang memiliki role.

### Pengembangan berikutnya
- usaha menengah;
- konsultan/pendamping UMKM;
- perusahaan dengan kebutuhan analitik lebih kompleks.

Jangan menganggap kebutuhan, chart of accounts, atau ambang risiko semua industri sama. Segmentasi industri harus menjadi konteks analisis.

## 4. Cara kerja produk

```text
Input / Import transaksi & saldo
            |
            v
Validasi, deduplikasi, kategorisasi
            |
            v
Data keuangan terstruktur
            |
            v
Financial Engine (deterministic)
            |
            +------> Laporan & KPI
            |
            +------> Financial Health Signals
            |
            +------> Forecasting (jika data cukup)
            |
            v
Recommendation Engine berbasis evidence
            |
            v
AI explanation (opsional, dibatasi schema)
            |
            v
Dashboard, laporan, dan tindakan pengguna
```

## 5. Pilar produk

1. **Financial Data Management** — transaksi, kategori, akun, import, validasi.
2. **Financial Reporting** — ringkasan pemasukan/pengeluaran, laba rugi sederhana, arus kas, dan laporan lain sesuai kelengkapan data.
3. **Financial Intelligence** — margin, tren, rasio, dan sinyal kondisi keuangan.
4. **Forecasting** — prediksi arus kas/pendapatan setelah lolos evaluasi.
5. **AI Recommendations** — saran berbasis indikator dan evidence.
6. **Explainability & Trust** — sumber angka, periode, asumsi, peringatan, dan kualitas data.

## 6. Ruang lingkup MVP

MVP harus menyelesaikan satu alur ujung-ke-ujung:
1. pengguna masuk ke organisasi;
2. pengguna memasukkan transaksi usaha;
3. pengguna melihat dan mengoreksi transaksi;
4. backend menghitung ringkasan keuangan;
5. dashboard menampilkan angka dan tren dengan periode jelas;
6. sistem menampilkan kualitas data dan sinyal risiko dasar;
7. sistem menampilkan rekomendasi berbasis aturan yang dapat dijelaskan.

Forecast numerik dan LLM hanya diaktifkan jika kualitas serta jumlah data dan evaluasinya memadai. Untuk demo, gunakan dataset sintetis yang diberi label sebagai data simulasi.

## 7. Bukan tujuan MVP

- menggantikan software akuntansi/ERP penuh;
- otomatisasi pajak atau klaim kepatuhan pajak;
- audit atau opini akuntan publik;
- credit scoring untuk keputusan pinjaman;
- rekomendasi investasi;
- prediksi semua indikator keuangan;
- integrasi bank terbuka sebelum keamanan, izin, dan rekonsiliasi dirancang;
- chatbot bebas yang dapat menjawab tanpa evidence.

## 8. Prinsip diferensiasi

- AI berbasis data usaha pengguna, bukan jawaban generik.
- Formula deterministik dan dapat diuji.
- Forecast dibandingkan baseline, tidak hanya dipamerkan.
- Rekomendasi menyebut indikator pemicu dan tindakan yang realistis.
- Sistem jujur saat data belum cukup.

## 9. Definisi keberhasilan MVP

MVP dianggap berhasil bila pengguna dapat memasukkan data, memperoleh perhitungan konsisten, memahami kondisi dan keterbatasan datanya, serta menerima setidaknya satu insight/rekomendasi yang bisa ditelusuri ke indikator nyata. Keberhasilan tidak diukur dari banyaknya fitur AI atau klaim akurasi tanpa validasi.

## 10. Terminologi

- **Transaction:** catatan peristiwa keuangan.
- **Financial Engine:** service deterministik untuk menghitung metrik/laporan.
- **Data quality:** kelengkapan, konsistensi, dan keterlacakan data.
- **Risk signal:** indikator yang perlu ditinjau, bukan rating kredit.
- **Forecast:** estimasi nilai masa depan beserta keterbatasan.
- **Recommendation:** tindakan yang disarankan berdasarkan evidence.
- **Tenant/Organization:** ruang data satu entitas usaha.
