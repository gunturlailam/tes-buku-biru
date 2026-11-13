# Contributing to ProfitAI

## Sebelum mulai
- Baca `AGENTS.md` dan dokumen terkait.
- Ambil issue yang sudah memiliki owner.
- Pastikan tidak ada orang lain sedang mengerjakan file/area yang sama.
- Sinkronkan branch dengan `main`.

## Branch
Gunakan format:
- `feat/<issue>-short-description`
- `fix/<issue>-short-description`
- `docs/<issue>-short-description`
- `test/<issue>-short-description`
- `chore/<issue>-short-description`

Contoh: `feat/24-transaction-crud`.

## Commit
Gunakan Conventional Commits:
- `feat: add transaction creation`
- `fix: handle zero revenue denominator`
- `docs: clarify forecast evaluation`
- `test: cover cash runway edge cases`
- `refactor: extract financial calculation service`

## Pull Request
- Satu PR fokus pada satu issue atau satu perubahan kohesif.
- Isi template PR.
- Sertakan screenshot untuk perubahan UI.
- Sertakan migration/API impact bila ada.
- Sertakan tests dan hasil yang benar-benar dijalankan.
- Minimal satu reviewer selain author.
- Author tidak boleh approve PR sendiri.
- Jangan merge jika CI gagal atau ada unresolved review.

## Konflik
Jika dua orang perlu mengubah file/kontrak yang sama, sepakati owner file dan urutan perubahan di issue/Discord/WhatsApp tim. Jangan menyelesaikan konflik dengan menimpa perubahan orang lain.
