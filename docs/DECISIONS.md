# DECISIONS.md
# Catatan Keputusan Teknis & Dependensi - AgroEWS

Dokumen ini mencatat alasan pemilihan dependensi dan keputusan arsitektur sesuai `TECH_SPEC.md §2`.

---

## 1. Stack Inti & Runtime

### Node.js 22 LTS & pnpm
- **Alasan:** Runtime LTS terbaru dengan performa V8 mutakhir, fitur built-in modern (`AbortSignal.timeout`, `crypto` stabil), dan efisiensi penyimpanan pnpm (hard-link store).
- **Pengaturan:** Dipin di `.nvmrc` dan `engines` pada `package.json`.

### TypeScript Strict Mode (`noUncheckedIndexedAccess: true`)
- **Alasan:** Mencegah bug runtime akibat akses array/objek yang tidak pasti (mengembalikan `T | undefined`), menjaga integritas biometeorologi dan parsing data cuaca.

### Next.js App Router (RSC + Server Actions)
- **Alasan:** Monolitik modern dengan Server Components untuk menjaga footprint JavaScript ke browser tetap minimal (< 150 KB gzip), mendukung Server Actions terisolasi untuk transaksi verifikasi PPL tanpa endpoint REST publik rentan.

---

## 2. Basis Data & ORM

### PostgreSQL + Drizzle ORM (`drizzle-orm`, `drizzle-kit`, `postgres`)
- **Alasan:**
  - Drizzle menyediakan type-safety SQL murni tanpa overhead query engine berat (seperti Prisma engine binary).
  - Sangat cepat untuk serverless environment.
  - Driver `postgres` (porsager/postgres) terbukti handal, ringan, dan mendukung transaksi `SELECT ... FOR UPDATE` untuk verifikasi draf.

---

## 3. Keamanan, Autentikasi & Validasi

### Zod
- **Alasan:** Validasi skema runtime di seluruh boundary (env vars, payload webhook, input server action, response API cuaca). Fail-fast saat boot jika env tidak lengkap.

### Argon2id (`argon2`)
- **Alasan:** Algoritma hashing pemenang Password Hashing Competition (PHC), standar tertinggi melawan serangan GPU/ASIC brute-force, sesuai rekomendasi OWASP §11 (A07).

### Auth.js / NextAuth (`next-auth@beta`, `@auth/core`)
- **Alasan:** Mendukung autentikasi Credentials dengan sesi JWT berumur pendek (8 jam) dan logout yang membersihkan state sesi secara aman.

---

## 4. UI, Desain & Styling

### Tailwind CSS (`tailwindcss`, `postcss`, `autoprefixer`)
- **Alasan:** Zero-runtime CSS, ukuran output minimal dengan CSS purging, memetakan token dari `src/styles/tokens.css`.

### Lucide React (`lucide-react`)
- **Alasan:** Ikon vektor SVG standar dengan `strokeWidth={2}`. Mendukung Zero-Emoji Policy tanpa overhead icon font.

### Hindari Library Berat (Recharts, Chart.js)
- **Alasan:** Anggaran bandwidth ketat (< 1.5 MB total load di jaringan 3G/HSPA). Visualisasi grafik menggunakan inline SVG kustom / sparkline.

---

## 5. Pengujian & Mutu

### Vitest
- **Alasan:** Test runner berbasis ESM super cepat, kompatibel dengan Vite dan TypeScript, cocok untuk pengujian deterministik `src/core`.

### Fast-Check (`fast-check`)
- **Alasan:** Property-based testing untuk rule engine (idempotensi, invarian urutan, monotonic behavior terhadap kelembapan).

### Playwright (`@playwright/test`) & Axe-Core (`axe-core`)
- **Alasan:** E2E testing multi-viewport (360px, 768px, 1280px) dan pengujian otomatis aksesibilitas WCAG 2.1 AA.
