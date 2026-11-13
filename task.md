# task.md
## AgroEWS: Execution Checklist untuk Antigravity

Dokumen acuan: `docs/TECH_SPEC.md` (teknis), `docs/PRD_AgroEWS.md` (produk), `docs/Design_System_AgroEWS.md` (UI, versi lama tetap dipakai).
Referensi `§` di bawah menunjuk bagian di TECH_SPEC.md.

---

## START HERE

1. Buat folder `docs/` lalu salin ketiga dokumen acuan ke dalamnya (TECH_SPEC.md, PRD_AgroEWS.md, Design_System_AgroEWS.md).
2. Baca TECH_SPEC.md penuh, terutama §0 (aturan agen) dan §1 (koreksi atas PRD/Design).
3. Kerjakan **hanya satu fase per sesi**. Mulai dari tugas pertama yang belum dicentang (`[ ]`).
4. Setiap tugas selesai: centang, jalankan `pnpm verify`, tulis satu baris di **Status Log** paling bawah.
5. Setelah seluruh tugas satu fase tercentang dan Gate fase lulus: **berhenti dan minta review**. Jangan lanjut fase berikutnya sendiri.
6. Bila menemukan ambiguitas: catat di `docs/OPEN_QUESTIONS.md`, jangan berasumsi.

Catatan desain: gunakan Design System versi lama. Koreksi aksesibilitas di §12.2 TECH_SPEC (border input, aksen non-teks, token `--border-card`, nama ikon Lucide) tetap berlaku karena itu perbaikan bug, bukan perubahan gaya.

Legenda: `[ ]` belum, `[x]` selesai, `[!]` terblokir (tulis alasan di bawahnya).

---

## FASE 0: Fondasi

Tujuan: repo berjalan, CI hijau, skema DB siap. Tanpa fitur bisnis.

- [x] **T0.1** Scaffold Next.js App Router + TypeScript strict (`noUncheckedIndexedAccess`), pnpm, Node 22 (`.nvmrc`, `engines`, `packageManager`). Struktur folder sesuai §3.
- [x] **T0.2** Pasang dependency inti sesuai §2 (Drizzle, drizzle-kit, Zod, Auth.js, argon2, pino, lucide-react, Tailwind, Vitest, Playwright, axe-core, fast-check). Versi stabil terbaru yang kompatibel Node 22. Catat alasan tiap dependency non-standar di `docs/DECISIONS.md`.
- [x] **T0.3** `src/server/env.ts`: validasi seluruh env var dengan Zod, gagal cepat saat boot. Buat `.env.example` lengkap (daftar variabel di §11, plus `DATABASE_URL`, `CRON_SECRET`, `WHATSAPP_*`, `TELEGRAM_*`, `PII_ENC_KEY`, `PII_HMAC_KEY`, `AUTH_SECRET`).
- [x] **T0.4** Skema Drizzle di `src/server/db/schema.ts` dan migrasi SQL sesuai §4 (semua enum, tabel, indeks parsial, `one_active_rule`, `one_open_draft_per_region`).
- [x] **T0.5** Cabut hak UPDATE/DELETE pada `audit_logs` untuk role aplikasi (di migrasi). Tulis test integrasi yang membuktikannya.
- [x] **T0.6** `src/server/db/seed.ts` (§15): rule_version v1 aktif (JSON di §6.1), 1 admin, 1 PPL, 2 region contoh, 1 poktan, kontak dummy fiktif. Script `pnpm db:seed`.
- [x] **T0.7** `src/styles/tokens.css`: semua token warna, tipografi, status dari Design System bagian 2 dan 3, plus koreksi §12.2. Petakan ke Tailwind theme. Font Inter dan JetBrains Mono via `next/font` (self-host, subset Latin).
- [x] **T0.8** Script `pnpm verify` = typecheck + lint + test + build. Tambahkan test anti-emoji (regex `\p{Extended_Pictographic}` memindai `src/`, `tests/fixtures`, seed) yang menggagalkan build.
- [x] **T0.9** CI `.github/workflows/ci.yml`: verify, `pnpm audit --prod`, size-limit placeholder.

**Gate Fase 0:** `pnpm verify` hijau; migrasi naik dan turun bersih; seed berjalan di DB kosong; test anti-emoji aktif.

---

## FASE 1: Inti Logika (tanpa UI)

Tujuan: semua logika murni teruji, ingest dan asesmen berjalan. Dependensi: Fase 0.

### 1A. Logika murni (`src/core`)
- [x] **T1.1** `core/features.ts` (§5.4): rerata harian T dan RH, `rhHoursGe80`, `precipMm`, `isForecast`, moving average 3 hari, `intermittentRain`. Tanggal mengikuti timezone region.
- [x] **T1.2** `core/rules.ts` (§6): `evaluate()` dengan urutan RED, AMBER, GREEN, aturan `longestRun` yang harus beririsan dengan `[today, today+3]`, reason `marginal`. Threshold hanya dari parameter, tanpa hardcode.
- [x] **T1.3** `tests/fixtures/rules.json` + test: 9 fixture golden di §6.5 wajib lulus semua.
- [x] **T1.4** Property-based test (fast-check): idempoten, urutan input tidak berpengaruh, monotonik terhadap kenaikan RH pada zona T optimum.
- [x] **T1.5** `core/explain.ts` (§6.4): ubah `reasons[]` menjadi kalimat Bahasa Indonesia. Snapshot test.
- [x] **T1.6** `core/lapor-parser.ts` (§8.6): regex, normalisasi dusun (kata angka, Romawi, `dsn`/`dusun`), error terklasifikasi. Fuzz test 200 variasi tanpa exception.
- [x] **T1.7** `core/formatter/wrap.ts` + `formatter/whatsapp.ts` + `formatter/telegram.ts` + `formatter/recommendations.ts` (§8.4): lebar maksimum 38, blok kode, ASCII murni, label ganda status, blok KONFIRMASI LAPANGAN dengan kode 0/1/2 (R-7), varian teks fase `masak_susu`/`menjelang_panen`. Snapshot test + test tanpa emoji.
- [x] **T1.8** `core/crypto` di `src/server/crypto`: AES-256-GCM (IV 12 byte acak, `key_id` terversi) dan blind index HMAC-SHA256. Test round-trip dan IV unik.

### 1B. Ingest dan asesmen
- [x] **T1.9** `server/weather/open-meteo.ts` (§5.2): request multi-koordinat chunk 20, timeout 10 detik, 1x retry, validasi respons dengan Zod.
- [x] **T1.10** `server/weather/bmkg.ts` + `failover.ts` (§5.3): urutan Open-Meteo, BMKG, cache; penandaan `is_degraded`; aturan data > 12 jam. Verifikasi dulu format respons BMKG terkini sebelum menulis adapter.
- [x] **T1.11** `POST|GET /api/cron/ingest?slot=` : auth `CRON_SECRET` konstan-waktu, simpan `weather_snapshots` dan `weather_daily`, jalankan `evaluate`, simpan `risk_assessments` dengan explain log.
- [x] **T1.12** Pembuat draf (§7.1): green tanpa draf; amber/red membuat `alert_drafts`; supersede bila status naik; update bila sama; `escalation_due_at` +6 jam untuk red.
- [x] **T1.13** Test integrasi ingest dengan HTTP mock: sukses, timeout 10 detik lalu failover, semua gagal (tanpa asesmen, error terstruktur).
- [x] **T1.14** Benchmark Vitest: `evaluate` untuk 100 region sintetis < 5 detik.
- [x] **T1.15** Test invarian keamanan produk: tidak ada jalur kode yang membuat `broadcasts` tanpa aksi approve oleh pengguna.

**Gate Fase 1:** 9 fixture golden lulus; benchmark < 5 detik; test T1.15 lulus; formatter lulus aturan lebar 38 dan anti-emoji; cakupan `src/core` >= 95 persen.

---

## FASE 2: Dasbor PPL

Tujuan: PPL dapat login, meninjau, dan menyetujui draf. Dependensi: Fase 1.

- [x] **T2.1** Auth.js Credentials + argon2id, sesi JWT 8 jam, lockout 5 gagal (15 menit), rate limit login (§11).
- [x] **T2.2** `server/auth/rbac.ts`: helper `requireRole` dan `requireRegionAccess` (cek `ppl_assignments`). Dipakai di setiap query dan Server Action.
- [x] **T2.3** `server/audit.ts`: tulis `audit_logs` untuk login, approve, hold, edit, ekspor.
- [x] **T2.4** Komponen dasar `components/agro`: `RiskBadge` (warna + ikon + teks + bentuk), `MetricCard`, `StatusIcon`, `FeedTable`. Ikon Lucide: `shield-check`, `triangle-alert`, `shield-alert`, `thermometer`, `droplet`, `cloud-rain`, `user-check`, `send`, `pencil`, `map-pin`. Area sentuh >= 48 x 48 px. `aria-label` metrik dengan helper `speakNumber(id-ID)`.
- [x] **T2.5** `/login` dan layout `(app)` responsif (mobile 1 kolom, tablet 2 kolom, desktop 3 kolom) sesuai Design bagian 6, termasuk `safe-area-inset-bottom` pada sticky bar.
- [x] **T2.6** `/dashboard`: antrean draf (MERAH dulu, lalu umur), penghitung SLA 6 jam. Hanya region milik PPL.
- [x] **T2.7** `/drafts/[id]`: 3 MetricCard, sparkline SVG kustom 3 hari, explainability log, banner `DATA TIDAK MUTAKHIR` bila degraded.
- [x] **T2.8** `VerificationBar` (Design 5.3 + R-5, R-6): dropdown 6 fase, textarea koreksi (maks 1500 karakter, sanitasi, tolak emoji), tombol `Tahan / Batal Siar` (wajib alasan), tombol `Setujui & Siarkan ke {n} Penerima` nonaktif sampai fase dipilih, pratinjau pesan final sebelum konfirmasi.
- [x] **T2.9** Server Action `approveDraft` dan `holdDraft` (§7.3): transaksi, `SELECT ... FOR UPDATE`, idempoten, snapshot `final_text`, aturan fase (`bero` otomatis `suppressed`). Pada tahap ini pembuatan `deliveries` boleh stub; dihubungkan di Fase 3.
- [x] **T2.10** `/api/cron/escalate` (§7.4): eskalasi red > 6 jam ke BPP, kedaluwarsa draf > 48 jam. Uji dengan fake timer.
- [x] **T2.11** Notifier (email via adapter) untuk notifikasi draf baru dan eskalasi.
- [x] **T2.12** Security headers (CSP, HSTS, nosniff, referrer-policy) dan test akses: lintas-region 403/404, tanpa sesi 401/redirect.
- [x] **T2.13** E2E Playwright di viewport 360, 768, 1280: login, buka draf MERAH, pilih fase, edit teks, setujui. Axe-core tanpa pelanggaran serius.
- [x] **T2.14** Lighthouse CI dan `size-limit`: total load < 1.5 MB, JS awal < 150 KB gzip.

**Gate Fase 2:** E2E lulus di 3 viewport; axe bersih; budget terpenuhi; RBAC negatif lulus; audit log tercatat untuk tiap aksi.

---

## FASE 3: Diseminasi

Tujuan: pesan sampai ke petani dan laporan balik masuk. Dependensi: Fase 2.
Blocker eksternal (§17 Q-1): akun Meta, nomor bot, template disetujui. Bila belum ada, kerjakan dengan gateway mock dan Telegram, tandai `[!]` pada tugas yang butuh sandbox nyata.

- [ ] **T3.1** `server/messaging/gateway.ts`: interface `MessagingGateway` (§8.1) dan mock gateway untuk test.
- [ ] **T3.2** `server/messaging/outbox.ts` + `POST /api/jobs/dispatch` (§8.2): `FOR UPDATE SKIP LOCKED`, batch 50, konkurensi 10, retry 30 detik / 2 / 10 / 30 menit maksimal 5 kali lalu `dead`, hormati 429 `Retry-After`, hanya kontak opt-in aktif.
- [ ] **T3.3** Hubungkan `approveDraft` ke pembuatan `deliveries` dan panggilan dispatch segera (`waitUntil`).
- [ ] **T3.4** `messaging/whatsapp.ts` (§8.3): kirim template `agroews_alert_{status}_v1` dengan variabel tanpa newline/tab, tombol quick-reply payload `ALERT:{broadcast_id}`.
- [ ] **T3.5** `/api/webhooks/whatsapp`: handshake GET, verifikasi `X-Hub-Signature-256` konstan-waktu, idempotensi via `inbound_messages`, respons 200 cepat dan proses di `waitUntil`.
- [ ] **T3.6** Handler tombol `ALERT:*`: validasi penerima sah, kirim pesan sesi penuh dari formatter.
- [ ] **T3.7** Handler `LAPOR`: identifikasi kontak lewat blind index, simpan `farmer_reports`, balasan konfirmasi, bantuan saat format salah, rate limit 20 pesan/jam. Handler `STOP`/`BERHENTI` (set `opt_out_at`).
- [ ] **T3.8** Pembaruan status pengiriman dari webhook ke `deliveries` (sent, delivered, read, failed).
- [ ] **T3.9** `messaging/telegram.ts` + `/api/webhooks/telegram` (secret token), `sendMessage` dengan `<pre>`, perintah `/lapor` memakai parser yang sama.
- [ ] **T3.10** `/admin/contacts`: impor CSV (`nama,telepon,poktan,dusun,channel,opt_in_tanggal`), validasi E.164 default +62, tolak baris tanpa opt-in, laporan baris gagal, masking nomor di UI.
- [ ] **T3.11** `/admin/rules`: daftar `rule_versions`, buat versi baru, aktifkan (hanya satu aktif), audit.
- [ ] **T3.12** Test integrasi dengan mock: p95 approve ke sent <= 60 detik untuk 500 penerima; webhook signature salah (401); idempotensi webhook; STOP bekerja; retry sampai `dead`.
- [ ] **T3.13** Uji sandbox Meta satu alur nyata: template, tombol, pesan sesi, LAPOR. (Butuh Q-1.)

**Gate Fase 3:** T3.12 lulus; dengan sandbox: alur nyata end-to-end berhasil; tidak ada PII pada log (uji redaksi).

---

## FASE 4: Ground-Truthing dan BPP

Tujuan: laporan petani tervisualisasi dan ikhtisar koordinator. Dependensi: Fase 3.

- [ ] **T4.1** `/reports` (Design 5.5): feed laporan terbaru per dusun, aksi `Tandai Verifikasi`, `Jadwalkan Kunjungan POPT` untuk kode 2. Polling 30 detik.
- [ ] **T4.2** `/regions/[id]`: riwayat status, snapshot cuaca, daftar penerima (nomor termasker), partisipasi laporan.
- [ ] **T4.3** `/bpp`: ikhtisar per desa. Desktop: peta MapLibre di-lazy-load. Mobile/tablet: daftar + choropleth SVG statis.
- [ ] **T4.4** Agregasi KPI: tingkat partisipasi LAPOR mingguan (KPI 2), kesesuaian status vs laporan (dasar KPI 1).
- [ ] **T4.5** `/admin` Kesehatan Sistem: ingest terakhir, region gagal, kedalaman antrean, dead letters, status template WhatsApp.
- [ ] **T4.6** E2E: laporan masuk tampil <= 30 detik; aksi kunjungan tercatat di audit.

**Gate Fase 4:** semua halaman lolos axe; budget performa tetap terpenuhi; ikhtisar BPP menampilkan semua desa pilot.

---

## FASE 5: Hardening dan Rilis Pilot

Dependensi: Fase 4.

- [ ] **T5.1** Audit keamanan: telusuri tabel OWASP §11 satu per satu, lampirkan bukti (test/konfigurasi) per baris di `docs/SECURITY_AUDIT.md`.
- [ ] **T5.2** Uji beban ingest (100 region) dan dispatch (500 penerima), catat hasil.
- [ ] **T5.3** Job retensi data (default 24 bulan) dan rotasi kunci enkripsi (dukungan `key_id` lama dan baru).
- [ ] **T5.4** Monitor uptime `/api/health`, alarm email (ingest gagal, antrean tertahan, signature webhook gagal beruntun).
- [ ] **T5.5** Backup DB harian dan uji pemulihan satu kali.
- [ ] **T5.6** `docs/RUNBOOK.md`: operasi harian, penanganan dead letter, prosedur bila Open-Meteo atau WhatsApp down, rotasi secret.
- [ ] **T5.7** Dokumen SOP singkat untuk PPL (cara verifikasi, kapan menahan siaran, cara membaca explainability log).

**Gate Fase 5:** seluruh baris OWASP berbukti; uptime monitor aktif; backup terverifikasi; runbook ditinjau.

---

## Aturan Prioritas bila Waktu Terbatas

Urutan wajib bila harus dipangkas untuk demo/lomba: Fase 0, Fase 1, Fase 2, lalu Fase 3 dengan gateway mock + Telegram. Fase 4 dan 5 dapat dipersempit ke T4.1 dan T5.1. Jangan memangkas T1.3, T1.15, T2.9, T3.5 karena itu pengaman inti produk.

---

## Status Log

Format: `YYYY-MM-DD | Task | Hasil | Bukti (nama test/commit)`

| Tanggal | Task | Hasil | Bukti |
| :-- | :-- | :-- | :-- |
| 2026-11-13 | T0.1 - T0.9 (FASE 0) | Selesai | `pnpm verify` PASS (typecheck, lint, 3 test files 7/7 pass, build static 103kB) |
| 2026-11-13 | T1.1 - T1.15 (FASE 1) | Selesai | `pnpm verify` PASS (13 test files 50/50 pass, golden 9/9 pass, benchmark 14.75ms, coverage src/core 98.56%) |
| 2026-11-13 | T2.1 - T2.14 (FASE 2) | Selesai | `pnpm verify` PASS (16 test files 60/60 pass), Playwright E2E 3/3 viewports (360, 768, 1280) pass, axe-core 0 violations, JS awal < 112kB |
| 2026-11-13 | Prototipe UI (Dummy Data First) | Selesai | `pnpm verify` PASS, 13 rute terkompilasi, E2E interaktivitas tombol 3 viewport (Mobile, Tablet, Desktop) lulus 100% |