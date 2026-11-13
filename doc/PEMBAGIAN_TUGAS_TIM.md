# PEMBAGIAN KERJA TIM --- 4 DEVELOPER

## BenangMerah CFO

## 1. Dasar pembagian

Pembagian menggunakan empat area kepemilikan. Nama dan skill aktual
belum diberikan, sehingga Developer 1--4 adalah placeholder. Sesuaikan
penempatan dengan kompetensi anggota. Setiap modul punya satu owner,
tetapi integrasi dan QA menjadi tanggung jawab bersama.

## 2. Struktur tim

  -----------------------------------------------------------------------
  Anggota                 Peran                   Fokus
  ----------------------- ----------------------- -----------------------
  Developer 1             Frontend & UX           Dashboard, halaman
                                                  modul, integrasi API di
                                                  UI

  Developer 2             Backend & Integration   FastAPI, schema,
                          Lead                    upload, validasi,
                                                  orchestration

  Developer 3             Financial Intelligence  Mapping akun, rasio,
                          Engineer                tren, warning, forecast
                                                  bila layak

  Developer 4             Procurement Forensics & Lima detector,
                          AI Engineer             evidence, graph,
                                                  Advisor/fallback
  -----------------------------------------------------------------------

## 3. Tugas rinci

### Developer 1 --- Frontend & UX

**Tugas** - Menyiapkan layout, navigasi, dan design system. - Membuat
dashboard overview. - Membuat halaman Financial Intelligence. - Membuat
halaman Procurement: upload, tabel, filter, detail evidence. - Membuat
graph view jika data graph tersedia. - Membuat AI Advisor view. -
Mengintegrasikan API dan menangani loading/error/empty state. -
Memastikan angka berasal dari response backend, bukan hardcode.

**Deliverables:** UI runnable, komponen reusable, API client/types,
tampilan responsif, screenshot demo, daftar bug UI.

**Bukan owner:** rumus keuangan, severity, atau algoritma deteksi.

### Developer 2 --- Backend & Integration Lead

**Tugas** - Menyiapkan FastAPI dan konfigurasi. - Menentukan kontrak
request/response bersama tim. - Membuat endpoint health dan endpoint
analisis. - Membuat upload handling, validasi CSV, error handling, dan
batas ukuran. - Membuat orchestrator untuk memanggil Financial dan
Procurement Engine. - Menyediakan Pydantic schema. - Mengatur CORS dan
environment config. - Mengintegrasikan Advisor dan hasil modul. -
Menjaga branch utama selalu dapat dijalankan.

**Deliverables:** API berjalan, OpenAPI/Swagger, kontrak JSON, integrasi
frontend-backend, `.env.example`, instruksi run, smoke test.

### Developer 3 --- Financial Intelligence Engineer

**Tugas** - Menentukan data dictionary dan mapping akun. - Membuat
validasi data keuangan. - Mengimplementasikan rasio yang didukung
data. - Menangani pembagi nol, nilai negatif, akun hilang, dan periode
tidak sebanding. - Membuat tren antarperiode. - Membuat early warning
berbasis aturan/threshold terdokumentasi. - Mengembangkan forecast hanya
jika data dan waktu memadai. - Menulis unit test dan contoh hitung
manual. - Mengirim output sesuai schema backend.

**Deliverables:** Financial Engine Python, formula/mapping, test cases,
response terstruktur, daftar keterbatasan.

**Prioritas:** akurasi formula lebih penting daripada banyaknya rasio
atau model forecast.

### Developer 4 --- Procurement Forensics & AI Engineer

**Tugas** - Menetapkan schema procurement bersama Developer 2. - Membuat
double invoice detector. - Membuat markup price detector. - Membuat
BEC/vendor impersonation indicators. - Membuat arithmetic check. -
Membuat entity resolution/collusion indicators. - Menyusun evidence yang
dapat ditelusuri. - Menyediakan graph node/edge jika cukup waktu. -
Membuat AI Advisor dengan grounding dan fallback. - Menulis unit test
detector/evidence/fallback.

**Deliverables:** detector terpisah, standard finding schema, evidence,
graph data jika aktif, Advisor output/fallback, dataset uji dan
keterbatasan.

**Batasan:** gunakan istilah indikasi/kandidat anomali/perlu verifikasi,
bukan fraud terbukti.

## 4. RACI ringkas

R = mengerjakan; A = pemilik hasil; C = dimintai masukan; I =
diinformasikan.

  Pekerjaan                 Dev 1   Dev 2   Dev 3   Dev 4
  ----------------------- ------- ------- ------- -------
  UI/UX                       A/R       C       C       C
  API/schema                    C     A/R       C       C
  CSV upload/validation         I     A/R       C       C
  Financial engine              C       C     A/R       I
  Procurement detectors         I       C       I     A/R
  Evidence/graph                C       C       I     A/R
  AI Advisor/fallback           C       C       C     A/R
  Integrasi end-to-end          R     A/R       R       R
  QA seluruh sistem             R     A/R       R       R
  Demo/presentasi               R       R       R       R
  GitHub/riwayat kerja          R       A       R       R

## 5. Kontrak koordinasi

1.  Developer 2 membuat schema API awal.
2.  Developer 3 dan 4 menyelaraskan output modul dengan schema.
3.  Developer 1 membuat UI berdasarkan response contract.
4.  Semua perubahan schema diumumkan dan dicatat.
5.  Gunakan sample data bersama sejak awal.
6.  Setiap modul menyediakan stub/mock output agar integrasi tidak
    menunggu seluruh engine selesai.

Contoh interface konseptual:

``` python
def analyze_financial(payload) -> dict:
    return {}

def analyze_procurement(rows) -> dict:
    return {}

def build_advisor_summary(analysis_result) -> dict:
    return {}
```

## 6. Milestone 24 jam

Waktu dihitung dari waktu resmi dimulainya periode coding. Ikuti rundown
panitia; pembagian berikut adalah alokasi internal, bukan jadwal resmi.

  ------------------------------------------------------------------------
  Tahap                                      Alokasi Target
  --------------------- ---------------------------- ---------------------
  Kickoff & compliance                      0--1 jam Konfirmasi aturan,
                                                     scope, repo, PIC,
                                                     data contract

  Skeleton & kontrak                        1--3 jam Frontend/backend
                                                     hidup, sample,
                                                     endpoint awal

  Core implementation                      3--10 jam Upload, validasi,
                                                     detector inti, UI
                                                     hasil

  Financial & Advisor                     10--15 jam Rasio valid,
                                                     ringkasan, fallback

  Integrasi & graph                       15--19 jam Alur end-to-end,
                                                     graph jika stabil

  QA & hardening                          19--22 jam Uji demo, error
                                                     handling, security
                                                     dasar

  Freeze & submission                     22--24 jam Feature freeze,
                                                     README, GitHub,
                                                     rehearsal
  ------------------------------------------------------------------------

Jika fitur tidak stabil, kurangi scope. Jangan menambahkan fitur baru
setelah batas 24 jam.

## 7. Prioritas saat waktu terbatas

1.  Aplikasi dapat dijalankan.
2.  CSV upload dan validasi.
3.  Procurement analysis end-to-end dengan evidence.
4.  UI hasil jelas.
5.  Advisor dan fallback.
6.  Financial ratios yang benar.
7.  Graph dan visualisasi tambahan.
8.  Forecast/ekspor bila semua prioritas sebelumnya stabil.

Jika mengklaim lima detector, kelimanya harus aktif dan diuji. Jika
hanya sebagian selesai, nyatakan secara eksplisit.

## 8. Git workflow

-   Satu repository tim; `main` harus stabil.
-   Branch: `feat/frontend`, `feat/api`, `feat/financial`,
    `feat/forensics`.
-   Commit kecil dengan pesan deskriptif.
-   Review sebelum merge.
-   Jangan commit `.env`, API key, PII, atau rahasia.
-   Catat sumber dan lisensi library/dataset.
-   Jangan memalsukan timestamp/riwayat pengerjaan.
-   Push source dan berkas pendukung; serahkan link sebelum presentasi.

## 9. Definition of Done

Fitur selesai bila implementasi dapat dijalankan, input/output sesuai
kontrak, validasi/error handling tersedia, test berhasil, UI tidak
memalsukan data, dokumentasi diperbarui, dan klaim sesuai kenyataan.

## 10. Checklist sebelum presentasi

-   [ ] Konfirmasi tertulis panitia tentang penggunaan komponen
    pra-hackathon.
-   [ ] Repo GitHub dapat diakses dan seluruh source/berkas pendukung
    di-push.
-   [ ] Link repo diserahkan sebelum presentasi.
-   [ ] Aplikasi dapat dijalankan dari kondisi bersih.
-   [ ] Dataset demo dan lisensi dicatat.
-   [ ] Setiap anggota memahami kontribusi dan modul.
-   [ ] Demo tidak bergantung pada API eksternal tanpa fallback.
-   [ ] Evidence dapat dibuka dan ditelusuri.
-   [ ] Rasio diuji dengan perhitungan manual.
-   [ ] Metrik menyebut dataset dan batasannya.
-   [ ] Fitur simulasi tidak disebut integrasi nyata.
-   [ ] Feature freeze dipatuhi.

## 11. Data anggota yang harus diisi

  Posisi        Nama      Skill utama   PIC final
  ------------- --------- ------------- ----------------------------
  Developer 1   \[Isi\]   \[Isi\]       Frontend & UX
  Developer 2   \[Isi\]   \[Isi\]       Backend & Integration
  Developer 3   \[Isi\]   \[Isi\]       Financial Intelligence
  Developer 4   \[Isi\]   \[Isi\]       Procurement Forensics & AI

Peran dapat disesuaikan dengan skill aktual, tetapi setiap area harus
tetap memiliki satu pemilik utama.
