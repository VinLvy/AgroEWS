# AGENT_RULES.md
# Aturan Kerja & Standar Kualitas Kode - AgroEWS

Aturan ini bersifat MUTLAK dan harus dipatuhi oleh AI Agent pada setiap pembuatan atau modifikasi kode.

---

## 1. Kebijakan Desain & Aksesibilitas (Dari `Design_System_AgroEWS.md`)
1. **ZERO-EMOJI POLICY:** DILARANG KERAS menggunakan karakter emoji Unicode (seperti simbol tanaman, peringatan, cuaca, centang grafis, dll) di dalam kode UI, komentar kode, string log, maupun template pesan WhatsApp.
   - Untuk Web UI: Wajib menggunakan ikon vektor dari `lucide-react` (`strokeWidth={2}`).
   - Untuk Template WhatsApp: Wajib menggunakan simbol ASCII/tipografi struktural (`[STATUS: MERAH]`, `---`, `[0]`, `[>]`).
2. **NO COLOR-ONLY STATUS:** Setiap indikator status risiko (HIJAU/KUNING/MERAH) wajib menampilkan kombinasi: Warna + Ikon SVG + Teks Eksplisit (`[AMAN]`, `[WASPADA]`, `[BAHAYA]`).
3. **FIELD TOUCH TARGETS:** Semua elemen interaktif (`<button>`, `<a>`, `<select>`) wajib memiliki ukuran minimal `min-h-[48px] min-w-[48px]` pada tampilan mobile/tablet.
4. **HIGH-GLARE BORDERS:** Kartu data tidak boleh hanya mengandalkan `box-shadow`. Wajib gunakan border tegas (`border-[1.5px] border-[#CBD5E1]` atau token `--border-strong`).
5. **SCREEN READER READY:** Semua angka metrik cuaca wajib memiliki `aria-label` lengkap beserta satuannya (contoh: `aria-label="Suhu rata-rata 27,4 derajat celsius"`).

## 2. Standar Kode & Arsitektur
1. **TypeScript Strict Mode:** Dilarang menggunakan tipe `any`. Semua parameter fungsi, props komponen, dan response API wajib memiliki `interface` atau `type` eksplisit.
2. **Modularitas:** Maksimal **200 baris kode per file komponen**. Jika melebihi 200 baris, pecah menjadi sub-komponen.
3. **Separation of Concerns:**
   - Logika perhitungan biometeorologi dan *Rule Engine* HARUS berada di `src/lib/rule-engine/` sebagai *pure functions* (tanpa ketergantungan ke React atau database).
   - Template pesan WhatsApp dan parser `LAPOR` HARUS berada di `src/lib/messaging/`.
4. **Error Handling Wajib:** Semua panggilan eksternal (Open-Meteo API, BMKG API, Database) wajib dibungkus `try/catch` dengan mekanisme fallback/logging yang jelas. Dilarang membiarkan *unhandled promise rejection*.

## 3. Alur Kerja & Verifikasi Wajib
1. **Baca Konteks:** Sebelum menulis kode untuk suatu task, baca `TECH_SPEC.md` dan bagian relevan dari `PRD_AgroEWS.md`.
2. **Satu Task Per Sesi:** Kerjakan hanya 1 task dari `TASKS.md` hingga tuntas sebelum berpindah ke task berikutnya.
3. **Wajib Verifikasi Terminal:** Sebelum menyatakan sebuah task selesai, Anda WAJIB menjalankan perintah verifikasi dan memastikan tidak ada error:
   - `npm run typecheck` (atau `npx tsc --noEmit`)
   - `npm run test` (untuk modul logic/API)
   - `npm run lint`
4. Jika terjadi error saat verifikasi, perbaiki sendiri hingga seluruh test dan typecheck berstatus PASS.