# FITUR, INPUT, PROSES, DAN OUTPUT

## Spesifikasi operasional BenangMerah CFO

Nama kolom berikut adalah kontrak konseptual sampai template final
dibekukan. Jangan jalankan detector jika field wajibnya tidak tersedia.

## 1. Executive Dashboard

**Tujuan:** gambaran cepat status keuangan dan procurement.

**Input:** hasil financial analysis, hasil forensics, periode, metadata
dataset.

**Proses:** agregasi jumlah transaksi, jumlah temuan, distribusi risiko,
exposure sesuai aturan, dan rasio yang tersedia.

**Output:** total transaksi, temuan per kategori/level, exposure
indikatif, rasio utama, periode analisis, status data.

**Validasi:** jangan tampilkan angka nol untuk data yang belum ada;
tampilkan "Belum tersedia".

## 2. Financial Data Management

**Input:** periode, jenis laporan, kode/nama akun, nominal, mata uang,
mapping akun.

**Proses:** validasi format, tipe angka, akun wajib, duplikasi, periode,
dan mapping.

**Output:** status validasi, akun diterima/ditolak, peringatan data
hilang/duplikat, dataset siap hitung.

## 3. Financial Ratios

  -----------------------------------------------------------------------
  Rasio                   Input minimum           Output
  ----------------------- ----------------------- -----------------------
  Current Ratio           Current Assets, Current Kali (x)
                          Liabilities             

  Quick Ratio             Current Assets,         Kali (x)
                          Inventory, Prepaid      
                          Expenses bila ada,      
                          Current Liabilities     

  DER                     Total Liabilities,      Kali (x)
                          Total Equity            

  DAR                     Total Liabilities,      Persentase
                          Total Assets            

  GPM                     Revenue, COGS           Persentase

  NPM                     Net Income, Revenue     Persentase

  ROA                     Net Income, Average     Persentase
                          Total Assets atau       
                          metode alternatif       
                          berlabel                

  Inventory Turnover      COGS, Average Inventory Kali (x)

  Average Collection      Average AR, Net Credit  Hari
  Period                  Sales, jumlah hari      
                          periode                 

  TATO                    Revenue, Average Total  Kali (x)
                          Assets atau metode      
                          alternatif berlabel     
  -----------------------------------------------------------------------

**Output tiap rasio:** nilai, satuan, periode, pembilang, penyebut,
rumus, status valid/tidak cukup data/pembagi nol/perlu review, catatan
interpretasi.

## 4. Financial Trend

**Input:** minimal dua periode sebanding dengan mapping akun konsisten.

**Proses:** hitung perubahan absolut/persentase dan bandingkan tren.

**Output:** grafik/tabel per periode, perubahan, dan catatan bila
periode atau klasifikasi tidak sebanding.

## 5. Early Warning

**Input:** rasio/tren tervalidasi dan threshold yang dikonfigurasi.

**Proses:** jalankan aturan yang terdokumentasi.

**Output:** peringatan, aturan pemicu, nilai aktual, pembanding, dan
langkah pemeriksaan.

**Catatan:** threshold bukan standar universal; tampilkan konfigurasi
dan konteks.

## 6. Forecast / Predictive Analytics

**Input:** data historis memadai, interval konsisten, variabel target,
metode, parameter.

**Proses:** validasi jumlah titik, missing value, tren; evaluasi error
pada data uji dan bandingkan baseline.

**Output:** proyeksi, rentang ketidakpastian jika tersedia, metode,
periode, metrik evaluasi, asumsi, disclaimer.

**Aturan:** bila data sedikit/evaluasi buruk, nonaktifkan forecast.
Jangan menyajikan angka tunggal sebagai kepastian.

## 7. Procurement CSV Upload

**Input konseptual:**

``` csv
transaction_id,invoice_number,vendor_id,vendor_name,invoice_date,item_code,item_name,quantity,unit_price,invoice_total,currency,vendor_email,bank_account,purchase_order_id
TRX-001,INV-001,V-01,Vendor A,2026-11-01,ITM-01,Laptop,2,10000000,20000000,IDR,finance@vendor-a.example,XXXX-1234,PO-001
```

**Proses:** periksa ekstensi/ukuran/encoding/header; parse; validasi
tanggal, nominal, ID, mata uang dan nilai kosong; pisahkan baris
valid/invalid; cegah CSV formula injection pada ekspor.

**Output:** jumlah total/valid/invalid, error per baris/kolom, dataset
bersih.

## 8. Double Invoice Detector

**Input:** vendor ID, invoice number dan/atau kombinasi atribut,
nominal, tanggal.

**Proses:** bandingkan transaksi dalam vendor yang sama menggunakan key
dan toleransi tanggal/nominal terdokumentasi.

**Output:** transaksi berpasangan, vendor, nomor invoice, selisih
nominal/tanggal, alasan match, konfigurasi toleransi, severity.

**Batasan:** revisi invoice, credit note, atau pembayaran bertahap dapat
tampak mirip; perlu verifikasi.

## 9. Markup Price Detector

**Input:** item code/name yang dapat dipetakan, unit price, referensi
harga dengan sumber/tanggal/satuan/mata uang.

**Proses:** cocokkan item dan bandingkan harga; metode statistik
tambahan harus diberi label kandidat anomali.

**Output:** harga transaksi, harga referensi, selisih/rasio markup,
sumber referensi, alasan flag.

**Batasan:** spesifikasi, kualitas, lokasi, pajak, volume, dan waktu
memengaruhi harga.

## 10. BEC / Vendor Impersonation Detector

**Input:** email vendor, domain resmi yang diketahui, histori
rekening/perubahan rekening bila tersedia.

**Proses:** cek typo/domain lookalike, homoglyph, subdomain trick,
domain tak dikenal, email gratis, dan perubahan rekening.

**Output:** indikator yang memicu, domain pembanding, status
rekening/perubahan, evidence, saran verifikasi independen.

**Batasan:** domain mirip/rekening baru bukan bukti serangan.

## 11. Arithmetic Tampering Detector

**Input:** quantity, unit price, invoice total; pajak/diskon/biaya lain
bila memengaruhi total.

**Proses:** hitung quantity × unit price, terapkan komponen penyesuaian
yang diketahui, bandingkan dengan invoice total memakai toleransi
pembulatan.

**Output:** nilai hitung, penyesuaian, total tercatat, selisih,
toleransi, status match/mismatch/tidak cukup data.

**Batasan:** tanpa data pajak/diskon/biaya, selisih tidak boleh langsung
disebut manipulasi.

## 12. Collusion / Entity Resolution

**Input:** vendor ID/nama, rekening, email, alamat, atau identifier lain
yang tersedia dan sah.

**Proses:** normalisasi, pencocokan entitas, pengelompokan, pencarian
atribut bersama, dan pencatatan alasan match.

**Output:** entitas, relasi, atribut sama/mirip, kelompok, dan
disclaimer bahwa relasi bukan bukti kolusi.

## 13. Intelligence Graph

**Input:** entitas dan relasi dari data aktual.

**Proses:** membangun node/edge; setiap edge menyimpan jenis relasi dan
referensi field sumber.

**Output:** graph vendor/transaksi/rekening, edge berlabel, detail node,
sumber relasi.

**Validasi:** jangan membuat edge yang tidak memiliki dasar data.

## 14. AI Strategic Advisor

**Input:** ringkasan rasio, warning, finding dan evidence yang
dimasking, metadata periode/dataset.

**Proses:** backend membentuk payload terstruktur; LLM diminta merangkum
data yang disediakan; backend memvalidasi output; fallback digunakan
bila API gagal.

**Output:** executive summary, financial insight, procurement insight,
cross-module insight jika didukung bukti, prioritas pemeriksaan,
rekomendasi, referensi ID finding/rasio.

**Larangan:** AI tidak boleh menetapkan fraud, mengubah score/severity,
mengarang nominal, atau menyatakan sebab-akibat tanpa bukti.

## 15. Export report (opsional)

**Input:** hasil analisis terpilih.

**Output:** waktu analisis, sumber/periode, ringkasan, temuan/evidence,
parameter, keterbatasan, disclaimer, masking data sensitif.

## 16. Format standard finding

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
  "is_confirmed_fraud": false,
  "recommended_action": "Verifikasi invoice, PO, bukti penerimaan, dan status pembayaran."
}
```

Contoh di atas hanya ilustrasi schema, bukan hasil analisis nyata. Score
hanya ditambahkan jika definisi dan kalibrasinya jelas.

## 17. Checklist implementasi

  Fitur               Status awal   Bukti verifikasi
  ------------------- ------------- ---------------------------
  Dashboard           Belum         Screenshot dan uji data
  Upload/validation   Belum         CSV valid dan invalid
  Lima detector       Belum         Unit test per detector
  Financial ratios    Belum         Hitung manual pembanding
  Trend/warning       Belum         Dataset multi-periode
  Forecast            Belum         Evaluasi dan error metric
  Advisor/fallback    Belum         API sukses dan gagal
  Graph               Belum         Validasi node/edge
  End-to-end          Belum         Demo runbook
