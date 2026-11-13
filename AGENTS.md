# AGENTS.md — Instruksi wajib AI coding agent

Anda bekerja pada repository ProfitAI. Dokumen ini adalah instruksi proyek, bukan prompt untuk mengabaikan instruksi sistem/developer yang berlaku.

## 1. Sumber kebenaran dan urutan baca

Sebelum coding, baca:
1. `README.md`
2. `docs/PROGRAM.md`
3. `docs/PRD.md`
4. `docs/ARCHITECTURE.md`
5. `docs/API_CONTRACT.md`
6. `docs/FINANCIAL_AI_METHODOLOGY.md`
7. `docs/SECURITY_PRIVACY.md`
8. `docs/GITHUB_WORKFLOW.md`
9. task file anggota/issue yang sedang dikerjakan.

Jika instruksi bertentangan, jangan menebak. Catat konflik dan minta keputusan Risfiatul (Lead). Jangan mengubah keputusan produk atau formula secara diam-diam.

## 2. Aturan coding

- Periksa struktur dan pola kode yang sudah ada sebelum membuat file baru.
- Ikuti bahasa, framework, naming, formatter, dan dependency yang sudah dipakai repository. Jangan mengganti stack tanpa ADR dan persetujuan Lead.
- Buat perubahan sekecil mungkin dan fokus pada satu issue.
- Jangan membuat duplikasi service, schema, komponen, endpoint, atau utilitas.
- Jangan menambahkan dependency tanpa alasan dan persetujuan reviewer.
- Jangan mengubah file di luar scope issue kecuali diperlukan; jelaskan alasannya.
- Jangan pernah memasukkan secret, token, credential, data pelanggan, atau `.env` ke Git.
- Jangan menghapus data/migration atau mengubah kontrak API secara breaking tanpa rencana migrasi dan persetujuan.
- Tambahkan tests untuk setiap business logic baru atau yang berubah.
- Jalankan formatter, lint, type check, dan tests yang tersedia sebelum menyatakan selesai.
- Jangan mengarang hasil command/test. Laporkan yang benar-benar dijalankan.

## 3. Aturan domain keuangan

- Financial calculations hanya di backend/domain financial engine.
- Gunakan Decimal/fixed precision untuk uang; pembulatan hanya saat presentasi sesuai kebijakan.
- Jangan menghitung ulang formula keuangan di frontend.
- Jangan menganggap transfer internal, setoran modal, pinjaman, atau penarikan pemilik sebagai revenue/expense operasional.
- Denominator nol/missing menghasilkan `null` dan alasan, bukan angka 0 yang menyesatkan.
- Jangan membuat klaim "sesuai SAK", "akurat X%", "bebas risiko", atau "pasti untung" tanpa verifikasi dan bukti yang relevan.
- Semua indikator harus menyertakan periode, mata uang, status kualitas data, versi formula, dan warning jika ada.
- Forecast wajib dibandingkan dengan baseline melalui time-series backtesting. Dilarang random shuffle untuk split time series.
- Jika data tidak cukup, tampilkan status tidak cukup data dan jangan memaksakan output numerik.
- LLM tidak boleh mengubah hasil financial engine atau menciptakan evidence. Gunakan output terstruktur dan validasi schema.

## 4. Multi-tenant dan keamanan

- Setiap query data organisasi wajib dibatasi dengan organization/tenant context dari server-side authenticated principal.
- Jangan percaya `organization_id` yang dikirim client tanpa memeriksa otorisasi.
- Validasi input di server.
- Terapkan least privilege dan jangan log data keuangan sensitif secara berlebihan.
- Jangan menaruh data pribadi/keuangan asli di fixture, screenshot, prompt, atau dataset demo.
- Periksa upload/import untuk ukuran, tipe file, parsing aman, dan duplikasi.

## 5. Cara bekerja

Sebelum implementasi:
1. ringkas issue dan acceptance criteria;
2. identifikasi file yang akan disentuh;
3. cek dependency dan kontrak yang terkait;
4. jika requirement ambigu, ajukan pertanyaan/eskalasi, jangan berasumsi.

Setelah implementasi:
1. ringkas perubahan;
2. sebutkan tests yang dijalankan dan hasil sebenarnya;
3. sebutkan risiko, keterbatasan, migration, dan pekerjaan tersisa;
4. jangan commit atau merge kecuali diminta/diizinkan.

## 6. Definition of Done

Issue selesai hanya jika:
- acceptance criteria terpenuhi;
- tests relevan ditambahkan dan lulus;
- lint/typecheck/build relevan lulus atau kegagalannya dijelaskan;
- tidak ada secret;
- API/docs diperbarui bila kontrak berubah;
- UI memiliki loading, empty, error, dan partial-data states;
- perubahan ter-review melalui Pull Request.
