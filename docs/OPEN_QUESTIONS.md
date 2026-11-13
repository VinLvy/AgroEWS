# OPEN_QUESTIONS.md

## Status & Pertanyaan Terbuka

### Q-1: Konten `TECH_SPEC.md` Kosong (0 bytes)
- **Kondisi:** File `TECH_SPEC.md` di root maupun `docs/TECH_SPEC.md` masih berukuran 0 bytes.
- **Dampak:** Seluruh task di `task.md` merujuk ke bab-bab spesifik di `TECH_SPEC.md` (misal: §2 daftar dependency inti, §3 struktur folder, §4 skema Drizzle & migrasi SQL, §6.1 JSON rule v1, §6.5 9 golden fixtures, §8 format pesan, §11 environment variables, §12.2 penyesuaian token). Tanpa dokumen ini, spesifikasi teknis tidak dapat dipenuhi secara presisi.
- **Tindakan yang Dibutuhkan:** Masukkan / tempelkan isi dokumen `TECH_SPEC.md`.

### Q-2: Klarifikasi Target Eksekusi ("proceed fase 1" vs FASE 0)
- **Kondisi:** Permintaan pengguna adalah "proceed fase 1", sementara di `task.md` urutan fase dimulai dari **FASE 0: Fondasi** (T0.1 s/d T0.9) dan **FASE 1: Inti Logika** memiliki prasyarat eksplisit: `Dependensi: Fase 0`. Saat ini repo belum memiliki `package.json`, konfigurasi TypeScript, atau dependensi apa pun.
- **Pertanyaan:** Apakah kita mulai dari **FASE 0 (Fondasi)** terlebih dahulu sesuai aturan pengerjaan `task.md` ("Mulai dari tugas pertama yang belum dicentang [ ]"), atau ada arahan lain?
