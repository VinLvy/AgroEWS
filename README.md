# AgroEWS - Agro-Climatic Early Warning System

Sistem Peringatan Dini Agroklimat untuk mitigasi risiko ledakan hama Wereng Batang Cokelat (*Nilaparvata lugens*) berbasis indikator biometeorologi dan verifikasi lapangan terdesentralisasi (*ground-truthing*) oleh Petugas Penyuluh Lapangan (PPL) dan Koordinator Balai Penyuluhan Pertanian (BPP).

---

## 1. Persyaratan Sistem (Prerequisites)

- **Node.js**: Versi `>= 22.0.0`
- **Package Manager**: `pnpm` (versi `>= 9.0.0`)
- **Sistem Operasi**: Linux, macOS, atau Windows

---

## 2. Instalasi & Konfigurasi Lingkungan

1. **Klon Repositori:**
   ```bash
   git clone <URL_REPOSITORI>
   cd AgroEWS
   ```

2. **Pasang Dependensi:**
   ```bash
   pnpm install
   ```

3. **Siapkan Berkas Lingkungan (`.env`):**
   Salin berkas contoh `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   *Catatan: Konfigurasi default `.env.example` sudah berisi kunci simulasi yang siap dijalankan secara langsung.*

---

## 3. Cara Menjalankan Aplikasi

### A. Mode Pengembangan (Development)
Jalankan server pengembangan lokal:
```bash
pnpm dev
```
Buka peramban di [http://localhost:3000](http://localhost:3000). Halaman awal akan otomatis mengarahkan ke halaman `/login`.

### B. Mode Produksi (Build & Start)
Untuk menguji performa bundle dan kompilasi produksi:
```bash
pnpm build
pnpm start
```

---

## 4. Akun Uji Coba Default & Diferensiasi Peran (Role Switching)

Halaman login (`/login`) menyediakan tombol **1-Klik Demo Cepat** untuk berganti peran tanpa mengetik:

| Peran Pengguna | Email | Kata Sandi | Halaman Utama & Cakupan Wewenang |
| :--- | :--- | :--- | :--- |
| **Petugas Lapangan (PPL)** | `ppl.kuranji@pertanian.go.id` | `Pertanian2026!` | Diarahkan ke `/dashboard`. Fokus pada draf lapangan desa binaan (Nagari Sungai Bangek), verifikasi umpan balik dusun, data kontak lokal, dan simulator diseminasi petani. |
| **Koordinator BPP** | `koordinator.bpp@pertanian.go.id` | `Pertanian2026!` | Diarahkan ke `/bpp`. Fokus supervisi eksekutif tingkat kecamatan (4 desa pilot), peta zonasi visual SVG, pemantauan SLA draf, simulasi instruksi massal, dan manajemen parameter aturan biometeorologi (`/admin/rules`). |

---

## 5. Panduan Fitur & Diferensiasi Halaman Antar Peran

Aplikasi dilengkapi dengan bilah navigasi atas responsif untuk berpindah halaman secara langsung:

- **/login**: Formulir masuk akun dengan proteksi *lockout* (5 kali gagal percobaan) dan pembatasan laju (*rate limiting*).
- **/dashboard**: Antrean draf peringatan dini agroklimat milik wilayah binaan PPL dengan indikator batas waktu SLA (6 jam).
- **/drafts/[id]**: Layar peninjauan draf peringatan dini yang memuat 3 *MetricCard* (Suhu, Kelembapan RH, Curah Hujan), grafik garis mini (*sparkline* SVG), narasi penjelasan model cuaca, pemilihan fase pertanaman padi, penyunting teks rekomendasi, pratinjau pesan, dan tombol persetujuan siaran (*approve* / *hold*).
- **/reports**: Feed umpan balik laporan petani per dusun (*ground-truthing*), filter status gejala, tombol verifikasi laporan, dialog penjadwalan kunjungan POPT untuk gejala berat (Kode 2), dan tombol simulasi laporan masuk baru.
- **/bpp**: Dasbor pimpinan BPP dengan 4 kartu metrik KPI, peta visual zonasi desa pilot (*SVG choropleth interaktif*), tombol ekspor rekapitulasi CSV, dan dialog penyiaran instruksi pengendalian serentak.
- **/regions/[id]**: Profil agroklimat wilayah pilot (Nagari Sungai Bangek), grafik tren cuaca 7 hari, tombol pembaruan data cuaca, dan daftar petani terdaftar dengan tombol buka/tutup sensor privasi nomor HP (PII).
- **/admin/contacts**: Manajemen kontak penerima siaran, status opt-in, tombol pengiriman pesan uji (*ping*), dialog pendaftaran kontak baru berformat E.164 (+62), serta editor impor data CSV massal.
- **/admin/rules**: Konfigurasi parameter model biometeorologi aktif (v1.0.0 Baehaki & Balitpa), simulator geser (*slider*) interaktif untuk evaluasi instan suhu dan RH, serta dialog pembuatan draf versi aturan baru.
- **/simulator**: Bingkai ponsel pintar virtual untuk demonstrasi penerimaan pesan di sisi petani (tersedia mode WhatsApp dan Telegram), tombol pilihan cepat rekomendasi lengkap, dan pintasan simulasi balasan seperti `LAPOR Dusun-2 2`, `LAPOR Dusun-1 0`, `STOP` (*opt-out*), dan `BANTUAN`.

---

## 6. Perintah Pengujian & Verifikasi Kualitas

Sistem dilengkapi suite pengujian otomatis lengkap:

- **Verifikasi Lengkap (CI Pipeline):**
  ```bash
  pnpm verify
  ```
  *Mengeksekusi typecheck (`tsc --noEmit`), linting (`next lint`), seluruh test suite (`vitest run`), dan kompilasi build produksi (`next build`).*

- **Pengujian Logika Inti & Anti-Emoji:**
  ```bash
  pnpm test
  ```
  *Menjalankan 17 file pengujian unit dan integrasi (65 skenario pengujian: aturan risiko cuaca, ingest failover, autentikasi argon2, parser laporan, formatter 38 karakter, kriptografi PII, serta audit anti-emoji `\p{Extended_Pictographic}`).*

- **Pengujian Antarmuka End-to-End (E2E Playwright):**
  ```bash
  pnpm test:e2e
  ```
  *Menguji alur peninjauan draf, audit aksesibilitas axe-core (0 pelanggaran), serta interaksi tombol seluruh halaman prototipe pada 3 ukuran layar: Mobile (360px), Tablet (768px), dan Desktop (1280px).*

---

## 7. Arsitektur & Standar Kepatuhan

- **Framework**: Next.js 15 (App Router) + TypeScript Strict (`noUncheckedIndexedAccess`).
- **Styling & Aksesibilitas**: Tailwind CSS, token desain agroklimat kontras tinggi, area sentuh interaktif minimum 48x48 px, dan label pembaca layar (*screen reader*).
- **Kebijakan Nol Emoji**: Kepatuhan penuh terhadap larangan emoji Unicode pada kode, tampilan, log, dan pesan diseminasi demi kompatibilitas transmisi seluler dan ponsel fitur petani.
