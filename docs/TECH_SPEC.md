# TECH_SPEC.md
## AgroEWS: Technical Specification (Implementation Blueprint)

- **Versi:** 1.0.0
- **Sumber kebenaran:** `PRD_AgroEWS.md` (perilaku produk) dan `Design_System_AgroEWS.md` (UI). Dokumen ini adalah turunan teknis. Bila ada konflik, urutan prioritas: Bagian 1 (Spec Resolutions) > PRD > Design System.
- **Target eksekusi:** Antigravity (agent-driven build). Baca Bagian 0 sebelum menulis kode.

---

## 0. Agent Operating Rules

1. Kerjakan per fase (Bagian 16). Jangan mulai fase berikutnya sebelum `pnpm verify` hijau pada fase berjalan.
2. `pnpm verify` = `typecheck` + `lint` + `test` + `build`. Wajib lulus sebelum menyatakan fase selesai.
3. Semua konstanta ambang risiko berasal dari tabel `rule_versions`. Dilarang hardcode angka ambang di kode aplikasi selain seed default.
4. Dilarang emoji Unicode di UI, template pesan, log yang tampil ke user, dan seed data. Tambahkan lint rule/test regex yang menggagalkan build bila ditemukan (lihat Bagian 14).
5. Dilarang menambah dependency berat tanpa alasan tertulis di `docs/DECISIONS.md` (budget bundle ketat, Bagian 13).
6. Semua secret hanya dari environment variable. Jangan pernah commit `.env*` kecuali `.env.example`.
7. Bila menemukan ambiguitas yang tidak dicakup spec ini, berhenti dan catat di `docs/OPEN_QUESTIONS.md`, jangan berasumsi diam-diam.
8. Tidak ada klaim "selesai" tanpa bukti: output test, screenshot Playwright, atau log.

---

## 1. Spec Resolutions (Koreksi atas PRD dan Design System)

Bagian ini menyelesaikan celah dan konflik yang ditemukan saat analisis. Ini mengikat.

| ID | Temuan | Resolusi |
| :-- | :-- | :-- |
| R-1 | PRD FR-5.1 mengasumsikan bot mengirim ke grup WhatsApp poktan. WhatsApp Cloud API Groups API hanya untuk Official Business Account, maksimal 8 peserta per grup, dan tidak ada endpoint tambah peserta (hanya invite link). Tidak layak untuk grup poktan 20 sampai 50 anggota. | Diseminasi utama memakai **fan-out 1:1** ke kontak terdaftar (ketua poktan dan petani opt-in) lewat template WhatsApp. **Telegram** (channel/grup tanpa batas 8 peserta) menjadi kanal paralel opsional. Semua lewat abstraksi `MessagingGateway` (Bagian 9). |
| R-2 | Bot tidak dapat membaca balasan `LAPOR` dari dalam grup WhatsApp via Cloud API. | Ground-truthing masuk lewat **chat 1:1 ke nomor bot**. Pesan siaran menginstruksikan "balas pesan ini". Di Telegram, perintah `/lapor` dapat dipakai di grup (privacy mode off). |
| R-3 | Parameter template WhatsApp tidak boleh berisi newline. Pesan monospace multi-baris dari Design System 5.4 tidak bisa dikirim sebagai variabel template. | Pola 2 langkah: (1) kirim template utilitas pendek dengan tombol quick-reply "Baca rekomendasi"; (2) saat tombol ditekan, webhook membuka jendela layanan 24 jam dan sistem mengirim pesan penuh format Design System 5.4 sebagai pesan sesi (free-form). |
| R-4 | Ambang risiko PRD FR-3.1 memiliki celah: contoh T=24.5 C dan RH=85% tidak masuk MERAH (butuh T>=25) dan tidak masuk KUNING (butuh RH 70-80), sehingga jatuh ke HIJAU. Itu salah secara biologis. | Gunakan definisi di Bagian 6 (KUNING = T 24-29 dan RH >= 70, bukan hanya 70-80). Semua ambang dapat diubah lewat `rule_versions`. Ditandai **perlu validasi akademisi** (A-01 sampai A-03). |
| R-5 | Design System mencantumkan 4 opsi fase tanam, PRD FR-4.3 mencantumkan 6. | Gunakan 6 nilai enum PRD: `bero`, `vegetatif_awal`, `vegetatif_akhir`, `bunting`, `masak_susu`, `menjelang_panen`. |
| R-6 | Design System mem-hardcode label tombol "Setujui & Siarkan ke 8 Poktan". | Jumlah penerima dinamis: `Setujui & Siarkan ke {n} Penerima`. |
| R-7 | Semantik kode `1` berbeda: PRD "< 5 ekor", Design "1-4 ekor". | Gunakan: `0` = nihil, `1` = 1-4 ekor/rumpun, `2` = >= 5 ekor/rumpun. |
| R-8 | Cron PRD "05.00 dan 17.00 WIB". Platform serverless umumnya menjadwalkan dalam UTC. | 05:00 WIB = `0 22 * * *` UTC (hari sebelumnya). 17:00 WIB = `0 10 * * *` UTC. Wilayah di WITA/WIT memakai `timezone` per region untuk perhitungan tanggal lokal, bukan untuk jadwal cron. |
| R-9 | Token Design System yang gagal WCAG 1.4.11 (kontras elemen non-teks minimal 3:1 terhadap latar putih). | Lihat Bagian 12.2 (koreksi token). |

### Asumsi yang perlu validasi domain (blocker kalibrasi, bukan blocker build)

- **A-01:** Ambang KUNING dan MERAH berasal dari PRD, belum divalidasi lapangan.
- **A-02:** "Hari kondusif" dihitung dari rerata harian RH dan T. Durasi jam RH >= 80% disimpan sebagai fitur pendukung, belum menjadi penentu.
- **A-03:** Zona marginal (T 22-24 atau 29-32 dengan RH >= 70) diklasifikasikan HIJAU dengan catatan `marginal` di explainability log.

---

## 2. Stack Teknologi

| Lapisan | Pilihan | Catatan |
| :-- | :-- | :-- |
| Runtime | Node.js 22 LTS | Pin di `.nvmrc` dan `engines`. |
| Bahasa | TypeScript (strict, `noUncheckedIndexedAccess`) | |
| Package manager | pnpm | Pin versi via `packageManager`. |
| Framework | Next.js App Router (RSC + Server Actions) | Satu monolit. Versi stabil terbaru yang kompatibel Node 22. |
| Hosting | Serverless, region Singapura | Latensi terdekat ke Indonesia. |
| Database | PostgreSQL (Neon atau Supabase) | Hanya sebagai Postgres, tanpa vendor lock pada fitur proprietari. |
| ORM/Migrasi | Drizzle ORM + drizzle-kit | Migrasi SQL ter-commit. |
| Validasi | Zod | Semua boundary: env, request, webhook, server action. |
| Auth | Auth.js (Credentials, hash argon2id, sesi JWT berumur pendek) | Opsi setara diperbolehkan bila memenuhi Bagian 11. |
| Styling | Tailwind CSS + CSS variables dari token Design System | |
| Ikon | `lucide-react` (impor per-ikon) | Kebijakan nol emoji. |
| Font | Inter dan JetBrains Mono, self-host via `next/font` | Subset Latin, `display: swap`. |
| Grafik | Inline SVG kustom (sparkline/bar) atau uPlot | Dilarang Recharts/Chart.js (terlalu berat untuk budget 1.5 MB). |
| Peta (BPP desktop) | MapLibre GL, di-lazy-load hanya viewport >= 1280px | Mobile/tablet memakai daftar + choropleth SVG statis. |
| Testing | Vitest (unit/integrasi), Playwright (E2E), axe-core (a11y) | |
| Logging | pino (JSON terstruktur) | PII wajib di-redact. |
| Email notifikasi | Resend atau SMTP generik via adapter `Notifier` | |

Semua dependency: gunakan versi stabil terbaru yang kompatibel Node 22 saat scaffolding, kunci lewat lockfile, aktifkan `pnpm audit` di CI.

---

## 3. Struktur Repositori

```
agroews/
├── .github/workflows/ci.yml
├── docs/
│   ├── TECH_SPEC.md
│   ├── DECISIONS.md
│   └── OPEN_QUESTIONS.md
├── drizzle/                      # migrasi SQL
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (app)/
│   │   │   ├── dashboard/        # antrean draf PPL
│   │   │   ├── drafts/[id]/      # verifikasi
│   │   │   ├── reports/          # feed ground-truthing
│   │   │   ├── regions/[id]/
│   │   │   ├── bpp/              # ikhtisar koordinator
│   │   │   └── admin/{users,regions,contacts,rules}/
│   │   └── api/
│   │       ├── cron/{ingest,escalate}/route.ts
│   │       ├── jobs/dispatch/route.ts
│   │       ├── webhooks/{whatsapp,telegram}/route.ts
│   │       └── health/route.ts
│   ├── core/                     # logika murni, tanpa I/O
│   │   ├── features.ts           # feature engineering
│   │   ├── rules.ts              # rule engine
│   │   ├── explain.ts
│   │   ├── formatter/{whatsapp.ts,telegram.ts,wrap.ts}
│   │   └── lapor-parser.ts
│   ├── server/
│   │   ├── db/{schema.ts,client.ts,seed.ts}
│   │   ├── weather/{open-meteo.ts,bmkg.ts,failover.ts}
│   │   ├── messaging/{gateway.ts,whatsapp.ts,telegram.ts,outbox.ts}
│   │   ├── crypto/{aes.ts,blind-index.ts}
│   │   ├── auth/{config.ts,rbac.ts}
│   │   ├── audit.ts
│   │   └── env.ts                # validasi env dengan Zod
│   ├── components/{ui,agro}/     # Badge, MetricCard, VerificationBar, dst.
│   └── styles/tokens.css
├── tests/{unit,integration,e2e,fixtures}/
├── .env.example
└── package.json
```

Prinsip: `src/core` adalah fungsi murni (tanpa DB, tanpa fetch), 100% dapat diuji deterministik.

---

## 4. Model Data (PostgreSQL)

Semua tabel: `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`. Gunakan `timestamptz` di mana-mana.

```sql
CREATE TYPE user_role AS ENUM ('ppl','bpp_coordinator','admin');
CREATE TYPE risk_status AS ENUM ('green','amber','red');
CREATE TYPE crop_phase AS ENUM ('bero','vegetatif_awal','vegetatif_akhir','bunting','masak_susu','menjelang_panen');
CREATE TYPE draft_status AS ENUM ('pending','approved','held','suppressed','expired','superseded');
CREATE TYPE channel AS ENUM ('whatsapp','telegram');
CREATE TYPE delivery_state AS ENUM ('queued','sending','sent','delivered','read','failed','dead');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email citext UNIQUE NOT NULL,
  password_hash text NOT NULL,            -- argon2id
  role user_role NOT NULL,
  phone_enc bytea, phone_hash bytea,      -- untuk notifikasi PPL
  is_active boolean NOT NULL DEFAULT true,
  failed_logins int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL CHECK (level IN ('kecamatan','desa')),
  code text UNIQUE NOT NULL,              -- kode Kemendagri
  name text NOT NULL,
  parent_id uuid REFERENCES regions(id),
  lat numeric(9,6) NOT NULL, lng numeric(9,6) NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Jakarta',
  bmkg_adm4 text,                         -- kode wilayah BMKG (fallback)
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE ppl_assignments (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  region_id uuid REFERENCES regions(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, region_id)
);

CREATE TABLE poktan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  region_id uuid NOT NULL REFERENCES regions(id)
);

CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poktan_id uuid NOT NULL REFERENCES poktan(id),
  name_enc bytea NOT NULL,
  phone_enc bytea,                        -- AES-256-GCM
  phone_hash bytea,                       -- HMAC-SHA256 blind index (lookup webhook)
  channel channel NOT NULL,
  telegram_chat_id_enc bytea,
  dusun_label text,
  is_leader boolean NOT NULL DEFAULT false,
  opt_in_at timestamptz,                  -- WAJIB non-null untuk dikirimi
  opt_in_source text,
  opt_out_at timestamptz,
  UNIQUE (phone_hash, channel)
);

CREATE TABLE rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version int UNIQUE NOT NULL,
  thresholds jsonb NOT NULL,
  note text, created_by uuid REFERENCES users(id),
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_active_rule ON rule_versions (is_active) WHERE is_active;

CREATE TABLE weather_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL REFERENCES regions(id),
  run_slot text NOT NULL CHECK (run_slot IN ('0500','1700','manual')),
  source text NOT NULL,                   -- open-meteo | bmkg | cache
  is_degraded boolean NOT NULL DEFAULT false,
  latency_ms int, fetched_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL
);

CREATE TABLE weather_daily (
  region_id uuid REFERENCES regions(id),
  local_date date NOT NULL,
  t_mean numeric(4,1), t_max numeric(4,1), t_min numeric(4,1),
  rh_mean numeric(4,1), rh_hours_ge80 smallint,
  precip_mm numeric(5,1),
  is_forecast boolean NOT NULL,
  snapshot_id uuid REFERENCES weather_snapshots(id),
  PRIMARY KEY (region_id, local_date)
);

CREATE TABLE risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL REFERENCES regions(id),
  assessed_for_date date NOT NULL,
  status risk_status NOT NULL,
  rule_version_id uuid NOT NULL REFERENCES rule_versions(id),
  snapshot_id uuid REFERENCES weather_snapshots(id),
  features jsonb NOT NULL,
  explain jsonb NOT NULL,                 -- explainability log (FR-3.2)
  is_degraded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (region_id, assessed_for_date, snapshot_id)
);

CREATE TABLE alert_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES risk_assessments(id),
  region_id uuid NOT NULL REFERENCES regions(id),
  status draft_status NOT NULL DEFAULT 'pending',
  crop_phase crop_phase,
  recommended_text text NOT NULL,         -- baku dari mesin
  edited_text text,                       -- koreksi PPL
  reviewer_id uuid REFERENCES users(id),
  reviewed_at timestamptz,
  escalation_due_at timestamptz,          -- now()+6h bila status red
  escalated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Maksimal satu draf aktif per wilayah
CREATE UNIQUE INDEX one_open_draft_per_region
  ON alert_drafts (region_id) WHERE status = 'pending';

CREATE TABLE broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid NOT NULL REFERENCES alert_drafts(id),
  final_text text NOT NULL,               -- snapshot teks yang disetujui
  approved_by uuid NOT NULL REFERENCES users(id),
  approved_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL REFERENCES broadcasts(id),
  contact_id uuid NOT NULL REFERENCES contacts(id),
  channel channel NOT NULL,
  stage text NOT NULL DEFAULT 'template',  -- template | session
  state delivery_state NOT NULL DEFAULT 'queued',
  provider_msg_id text,
  attempts smallint NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  UNIQUE (broadcast_id, contact_id, stage)
);
CREATE INDEX deliveries_due ON deliveries (next_attempt_at) WHERE state IN ('queued','failed');

CREATE TABLE inbound_messages (
  provider_msg_id text PRIMARY KEY,        -- idempotensi webhook
  channel channel NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed boolean NOT NULL DEFAULT false
);

CREATE TABLE farmer_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id),
  region_id uuid NOT NULL REFERENCES regions(id),
  dusun_label text NOT NULL,
  dusun_norm text NOT NULL,
  code smallint NOT NULL CHECK (code IN (0,1,2)),
  raw_text text NOT NULL,
  provider_msg_id text UNIQUE,
  received_at timestamptz NOT NULL DEFAULT now(),
  verified_by uuid REFERENCES users(id), verified_at timestamptz,
  visit_requested boolean NOT NULL DEFAULT false
);

CREATE TABLE audit_logs (                  -- append-only
  id bigserial PRIMARY KEY,
  actor_id uuid, action text NOT NULL,
  entity text NOT NULL, entity_id text,
  diff jsonb, ip inet, at timestamptz NOT NULL DEFAULT now()
);
-- Cabut UPDATE/DELETE pada audit_logs dari role aplikasi.
```

Aturan akses data: PPL hanya melihat region di `ppl_assignments` (enforce di query layer, bukan hanya UI). BPP melihat seluruh kecamatan dalam yurisdiksinya. Admin penuh.

---

## 5. Pipeline Ingest (Layer 1 dan 2)

### 5.1 Jadwal

| Job | Cron (UTC) | Setara WIB |
| :-- | :-- | :-- |
| `ingest` slot 0500 | `0 22 * * *` | 05:00 |
| `ingest` slot 1700 | `0 10 * * *` | 17:00 |
| `escalate` | `*/5 * * * *` | tiap 5 menit |
| `dispatch` (penyapu cadangan) | `* * * * *` | tiap menit |

Catatan platform: tier gratis sebagian penyedia membatasi cron maksimal sekali per hari. Bila terkena batas, gunakan scheduler eksternal (GitHub Actions `schedule`, atau pg_cron + HTTP) yang memanggil endpoint dengan header `Authorization: Bearer ${CRON_SECRET}`.

Semua endpoint `/api/cron/*` dan `/api/jobs/*` wajib memverifikasi `Authorization: Bearer ${CRON_SECRET}` dengan perbandingan konstan-waktu. Tanpa itu, 401.

### 5.2 Open-Meteo (utama)

Satu request dapat memuat banyak koordinat. Bagi wilayah aktif menjadi chunk 20.

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat1,lat2,...}&longitude={lng1,lng2,...}
  &hourly=temperature_2m,relative_humidity_2m,precipitation
  &daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum
  &timezone=auto
  &past_days=2&forecast_days=4
```

- Timeout keras 10 detik: `AbortSignal.timeout(10_000)`. Retry 1x dengan backoff 500 ms pada 5xx/network error.
- `timezone=auto` agar tanggal harian mengikuti zona lokal koordinat; simpan `local_date` hasil respons.
- Data ERA5-Land (archive API) dipakai **hanya** untuk backfill dan kalibrasi Fase 3, bukan real-time (ada jeda beberapa hari).
- Atribusi sumber data wajib tampil di footer dasbor dan pesan (`BMKG & Open-Meteo`). Penggunaan komersial atau volume tinggi dapat memerlukan langganan berbayar: catat di `DECISIONS.md`.

### 5.3 Failover (FR-1.4)

Urutan: Open-Meteo (10 s) lalu BMKG adm4 (forecast 3-jam, agregasi ke harian, verifikasi format respons terkini dan batas laju sebelum implementasi) lalu snapshot terakhir dari DB.

- Hasil dari BMKG atau cache menandai `weather_snapshots.is_degraded = true` dan `risk_assessments.is_degraded = true`.
- Snapshot cache berumur > 12 jam: asesmen tetap dibuat tetapi banner "DATA TIDAK MUTAKHIR" tampil di draf dan tombol setujui menampilkan konfirmasi tambahan.
- Kegagalan seluruh sumber untuk suatu region: catat error terstruktur, jangan buat asesmen, tampilkan di panel kesehatan admin.

### 5.4 Feature Engineering (`src/core/features.ts`)

Fungsi murni: `(hourly[], daily[], tz) -> DailyFeature[]`.

Per hari lokal:
- `tMean`: rerata `temperature_2m_mean` (fallback: rerata hourly).
- `rhMean`: rerata hourly `relative_humidity_2m` hari tersebut.
- `rhHoursGe80`: jumlah jam dengan RH >= 80 dalam 24 jam.
- `precipMm`: `precipitation_sum`.
- `isForecast`: tanggal > hari ini lokal.
- `ma3T`, `ma3RH`: rata-rata bergerak 3 hari (FR-2.1) pada jendela yang berakhir di hari tersebut.
- `intermittentRain`: true bila terdapat >= 1 hari hujan ringan (1 sampai 5 mm) dalam 3 hari dan tidak semua 3 hari hujan > 5 mm, dengan `tMean` 25 sampai 29 pada hari-hari tersebut (FR-2.3).

Pembulatan: simpan 1 desimal, hitung dengan presisi penuh.

---

## 6. Rule Engine (`src/core/rules.ts`)

Fungsi murni, deterministik, tanpa efek samping:

```ts
evaluate(days: DailyFeature[], t: Thresholds, today: string): {
  status: 'green' | 'amber' | 'red';
  reasons: Reason[];           // untuk explainability log
}
```

### 6.1 Threshold default (seed `rule_versions` v1)

```json
{
  "window": { "pastDays": 2, "forecastDays": 3 },
  "green": { "tBelow": 22, "tAbove": 32, "rhBelow": 70 },
  "amber": { "tMin": 24, "tMax": 29, "rhMin": 70, "minConsecutiveDays": 2,
             "rainMinMm": 1, "rainMaxMm": 5, "requireRain": false },
  "red":   { "tMin": 25, "tMax": 29, "rhGt": 80, "minConsecutiveDays": 3 }
}
```

### 6.2 Definisi

- `redDay(d)` = `tMin <= d.tMean <= tMax` dan `d.rhMean > rhGt`.
- `amberDay(d)` = `amber.tMin <= d.tMean <= amber.tMax` dan `d.rhMean >= amber.rhMin` (mencakup RH > 80 yang tidak membentuk rangkaian MERAH, menutup celah R-4). Bila `requireRain` true, tambahkan syarat `rainMinMm <= precip <= rainMaxMm`.
- `greenDay(d)` = `d.tMean < tBelow` atau `d.tMean > tAbove` atau `d.rhMean < rhBelow`.
- Jendela evaluasi `W = [today-2, today+3]` (6 hari).
- `longestRun(pred)` = rangkaian hari berurutan terpanjang yang memenuhi `pred` dan **beririsan dengan `[today, today+3]`** (rangkaian murni di masa lalu diabaikan).

### 6.3 Keputusan (urutan wajib)

1. Bila `longestRun(redDay) >= red.minConsecutiveDays` maka `red`.
2. Else bila `longestRun(amberDay) >= amber.minConsecutiveDays` maka `amber`.
3. Else `green`. Bila ada hari di `[today, today+3]` dengan RH >= 70 dan T di zona marginal (22-24 atau 29-32), tambahkan reason `marginal` (A-03).

### 6.4 Explainability log (FR-3.2)

`reasons[]` berisi objek `{ rule, date, metric, value, threshold, passed }` untuk setiap hari yang dievaluasi. Renderer `explain.ts` mengubahnya menjadi kalimat Bahasa Indonesia, contoh:
"Suhu rerata 26.8 C dan RH 86% memenuhi syarat MERAH pada 3 hari berturut-turut (14, 15, 16 Nov)."

### 6.5 Golden test fixtures (wajib, `tests/fixtures/rules.json`)

`today = D`. Notasi: (T, RH).

| # | Rangkaian D-2..D+3 | Status diharapkan | Alasan |
| :-- | :-- | :-- | :-- |
| 1 | (26.8,86) x 6 | red | Run merah >= 3 |
| 2 | D..D+1 (26.8,86), lainnya (20,60) | amber | Run kuning 2, merah hanya 2 |
| 3 | hanya D (26,86), lainnya (20,60) | green | Run kuning 1 |
| 4 | (33,90) x 6 | green | T > 32 |
| 5 | (23,85) x 6 | green + reason marginal | A-03 |
| 6 | (24.5,85) x 6 | amber | T < 25 bukan merah, tapi amberDay (celah R-4 tertutup) |
| 7 | (27,65) x 6 | green | RH < 70 |
| 8 | D..D+1 (27,75), lainnya (20,60) | amber | Run kuning 2 |
| 9 | D-2..D-1 (27,85), lainnya (20,60) | green | Run hanya masa lalu, tidak beririsan |

Tambahkan property-based test (fast-check): `evaluate` idempoten, urutan input harian tidak mengubah hasil bila diurutkan, dan monotonik terhadap kenaikan RH pada zona T optimum.

---

## 7. Alur Draf dan Verifikasi PPL (Layer 4)

### 7.1 Pembuatan draf

Setelah asesmen disimpan:
- `green`: tidak ada draf. Catat saja.
- `amber`/`red`: buat `alert_drafts` status `pending` dengan `recommended_text` dari template baku per status (Bagian 8.4). Bila sudah ada draf `pending` untuk region yang sama: bila status baru lebih tinggi, tandai draf lama `superseded` dan buat baru; bila sama, perbarui `assessment_id` draf yang ada tanpa membuat duplikat.
- Bila `red`: set `escalation_due_at = now() + interval '6 hours'` (FR-4.4).
- Kirim notifikasi ke PPL terkait (`Notifier`: email + template WhatsApp ke nomor PPL). Notifikasi hanya ringkasan dan tautan, tanpa data sensitif.
- Sistem tidak pernah menyiarkan otomatis (FR-4.1). Tidak ada kode jalur yang membuat `broadcasts` tanpa aksi PPL. Tambahkan test yang menjamin ini.

### 7.2 Aturan fase tanam (FR-4.3)

| `crop_phase` | Efek |
| :-- | :-- |
| `bero` | Draf otomatis `suppressed`, siaran dilarang. |
| `vegetatif_awal`, `vegetatif_akhir`, `bunting` | Boleh disetujui, teks baku penuh. |
| `masak_susu`, `menjelang_panen` | Boleh disetujui, gunakan varian teks tanpa anjuran pengeringan ekstrem (poin 1 diganti anjuran pengaturan air moderat dan inspeksi). |

Pilihan fase wajib dipilih sebelum tombol setujui aktif.

### 7.3 Aksi

Semua aksi adalah Server Action dengan: cek sesi, cek RBAC, cek kepemilikan region, validasi Zod, transaksi DB, tulis `audit_logs`.

- `approveDraft({ draftId, cropPhase, editedText? })`: dalam satu transaksi: lock baris draf (`SELECT ... FOR UPDATE`), pastikan masih `pending`, set `approved`, buat `broadcasts` dengan `final_text` (snapshot), buat baris `deliveries` untuk semua kontak aktif beropt-in, lalu panggil dispatch segera (`waitUntil`) agar target <= 60 detik (NFR) dan tombol <= 30 detik (US-1).
- `holdDraft({ draftId, reason })`: status `held`, wajib alasan.
- `editedText`: maksimal 1500 karakter, sanitasi (hapus karakter kontrol, tolak emoji, normalisasi newline), tampilkan pratinjau pesan final sebelum konfirmasi.
- Idempotensi: aksi ganda pada draf yang sama mengembalikan hasil pertama, tidak mengirim ulang.

### 7.4 Eskalasi

Job `escalate` mengambil draf `pending` dengan `escalation_due_at <= now()` dan `escalated_at IS NULL`, lalu: set `escalated_at`, notifikasi seluruh `bpp_coordinator` yang menaungi region, tulis audit. Draf tetap `pending` (BPP dapat menyetujui atas nama sistem bila perannya mengizinkan, tercatat di audit).

Draf `pending` lebih dari 48 jam: `expired`.

---

## 8. Diseminasi (Layer 5)

### 8.1 Abstraksi gateway

```ts
interface MessagingGateway {
  channel: 'whatsapp' | 'telegram';
  sendAlertIntro(c: ContactDTO, b: BroadcastDTO): Promise<SendResult>;   // tahap 'template'
  sendSession(c: ContactDTO, text: string): Promise<SendResult>;         // tahap 'session'
  parseWebhook(req: Request): Promise<InboundEvent[]>;                   // sudah terverifikasi
}
```

Menambah kanal baru tidak boleh mengubah kode `core/` maupun Server Action.

### 8.2 Outbox dan dispatcher

- Pengiriman memakai pola outbox: tabel `deliveries` adalah antrean.
- `POST /api/jobs/dispatch`: ambil batch (50) dengan `SELECT ... FOR UPDATE SKIP LOCKED` pada `state IN ('queued','failed') AND next_attempt_at <= now()`, tandai `sending`, kirim dengan konkurensi 10, perbarui status.
- Retry: eksponensial 30 s, 2 m, 10 m, 30 m, maksimal 5 percobaan lalu `dead` dan tampil di panel admin.
- Hormati batas laju penyedia (HTTP 429): tunda sesuai `Retry-After`.
- Hanya kontak dengan `opt_in_at IS NOT NULL AND opt_out_at IS NULL`.

### 8.3 WhatsApp Cloud API

**Template utilitas (didaftarkan ke Meta, bahasa `id`).** Siapkan tiga template per status, nama: `agroews_alert_amber_v1`, `agroews_alert_red_v1`. Isi body (tanpa emoji, tanpa newline di variabel):

```
Peringatan dini agroklimat dari {{1}}. Wilayah {{2}}, tanggal {{3}}. Status {{4}}. Tindakan utama: {{5}}. Ketuk tombol di bawah untuk membaca rekomendasi lengkap dan cara melapor.
```

- Variabel: `{{1}}` nama BPP, `{{2}}` wilayah, `{{3}}` tanggal, `{{4}}` `KUNING (WASPADA)` atau `MERAH (BAHAYA)`, `{{5}}` satu kalimat tindakan utama (<= 140 karakter, tanpa newline, tanpa tab, tanpa 4 spasi berturut-turut).
- Tombol quick-reply: label `Baca rekomendasi`, payload `ALERT:{broadcast_id}`.
- Template butuh persetujuan Meta (lead time beberapa jam sampai hari). Ajukan di Fase 1.

**Tahap sesi.** Saat webhook menerima `button` dengan payload `ALERT:*`: validasi bahwa kontak adalah penerima broadcast tsb, buat baris `deliveries` tahap `session`, kirim pesan penuh dari `formatter/whatsapp.ts` (<= 4096 karakter). Pesan sesi gratis dari sisi kebijakan template selama jendela 24 jam terbuka.

**Webhook `POST /api/webhooks/whatsapp`:**
1. Verifikasi `X-Hub-Signature-256` (HMAC-SHA256 atas raw body dengan App Secret, `timingSafeEqual`). Gagal: 401, tanpa memproses.
2. Idempotensi: `INSERT INTO inbound_messages ... ON CONFLICT DO NOTHING`; lewati bila sudah ada.
3. Respons 200 secepatnya, proses lanjutan di `waitUntil`.
4. Tangani: teks `LAPOR ...`, tombol `ALERT:*`, `STOP`/`BERHENTI` (set `opt_out_at`, balas konfirmasi), status pengiriman (`sent/delivered/read/failed`) untuk memperbarui `deliveries`.

`GET /api/webhooks/whatsapp` menangani handshake `hub.verify_token`.

Pengenalan kontak pengirim: hitung `HMAC(phone)` lalu cari `contacts.phone_hash`. Nomor tak dikenal: balas bantuan singkat dan jangan simpan data.

### 8.4 Template teks baku (`src/core/formatter`)

Pesan sesi mengikuti Design System 5.4 secara literal, dengan aturan teknis:

- Lebar maksimum **38 karakter** per baris (hard wrap kata, indentasi lanjutan 3 spasi) agar tidak patah di layar ponsel. Pembatas `=` dan `-` panjang 38.
- Bungkus seluruh pesan dalam blok kode tiga backtick agar WhatsApp merender monospace.
- ASCII murni untuk simbol: `26.8 C`, bukan simbol derajat. Tanpa emoji.
- Header `STATUS` memakai label ganda: `[STATUS: MERAH - BAHAYA]` atau `[STATUS: KUNING - WASPADA]`.
- Footer: `Telah divalidasi oleh: {nama PPL}`.
- Bagian KONFIRMASI LAPANGAN selalu ada, dengan kode 0/1/2 sesuai R-7 dan contoh `LAPOR Dusun-Dua 1`.
- Teks `edited_text` PPL menggantikan blok "REKOMENDASI TINDAKAN" bila ada, tetapi blok PARAMETER CUACA dan KONFIRMASI LAPANGAN tetap dihasilkan sistem.

Template baku rekomendasi per status disimpan sebagai konstanta ber-versi di `core/formatter/recommendations.ts`:
- `amber`: pengamatan pangkal batang, pengeringan berkala 2-3 hari, bersihkan gulma pematang, larangan semprot preventif.
- `red`: pengamatan intensif serempak, pengeringan berkala, larangan insektisida preventif (musuh alami), ambang > 5 ekor/rumpun fase vegetatif maka lapor PPL/POPT dan aplikasi agens hayati *Beauveria bassiana*.

### 8.5 Telegram (kanal paralel)

- Webhook `POST /api/webhooks/telegram` dengan header `X-Telegram-Bot-Api-Secret-Token` terverifikasi.
- Kirim ke `chat_id` grup/channel poktan via `sendMessage` memakai `parse_mode=HTML` dan `<pre>` untuk monospace. Satu pesan penuh, tanpa tahap template.
- Perintah `/lapor [Dusun] [0|1|2]` diparse oleh parser yang sama dengan WhatsApp.

### 8.6 Parser LAPOR (`core/lapor-parser.ts`)

- Regex setelah normalisasi (trim, kompres spasi, uppercase kata kunci): `^LAPOR\s+(.+?)\s+([012])$` (case-insensitive).
- Normalisasi dusun: huruf kecil, ganti `-` dan `_` jadi spasi, ubah angka kata (`satu, dua, tiga, empat, lima, enam`) jadi digit, buang kata `dusun`/`dsn`. Contoh: `Dusun-Dua`, `dusun 2`, `DSN II` semuanya menjadi `2`. Angka Romawi I-VI dipetakan.
- Hasil: `{ dusunLabel, dusunNorm, code }` atau error terklasifikasi (`format`, `kode`).
- Format salah: balas bantuan sesi dengan contoh benar. Tidak pernah menolak diam-diam.
- Kode 2 dari kontak: buat `farmer_reports` dan tandai sebagai kandidat "Jadwalkan Kunjungan POPT" di feed.
- Satu kontak boleh melapor ulang; semua tersimpan, tampilan feed memakai yang terbaru per dusun.
- Rate limit: 20 pesan masuk per kontak per jam; sisanya diabaikan dengan balasan satu kali.
- Balasan konfirmasi: "Laporan diterima. Dusun {x}, status {kode}. Terima kasih." (tanpa emoji).

Fuzz test wajib: 200 variasi input (spasi ganda, huruf besar/kecil, karakter unicode, emoji dari pengguna) tidak boleh melempar exception.

---

## 9. Antarmuka Web

Sumber visual: `Design_System_AgroEWS.md`, dengan koreksi Bagian 12. Halaman dan peran:

| Rute | Peran | Isi |
| :-- | :-- | :-- |
| `/login` | semua | Email + kata sandi, penguncian setelah 5 gagal (15 menit). |
| `/dashboard` | ppl, bpp | Antrean draf berurut: MERAH dulu, lalu umur draf. Penghitung waktu SLA 6 jam. |
| `/drafts/[id]` | ppl, bpp | MetricCard x3 (suhu, RH, hujan), sparkline 3 hari, explainability log, VerificationBar. |
| `/reports` | ppl, bpp | Feed ground-truthing (Design 5.5), aksi "Tandai Verifikasi" dan "Jadwalkan Kunjungan POPT". |
| `/regions/[id]` | ppl, bpp | Riwayat status, snapshot cuaca, penerima, partisipasi laporan. |
| `/bpp` | bpp, admin | Ikhtisar per desa (peta di desktop, daftar di mobile), partisipasi mingguan, KPI. |
| `/admin/*` | admin | Pengguna, wilayah, kontak (impor CSV), rule versions, kesehatan job, dead letters. |

Layout responsif sesuai Design Bagian 6 (mobile 1 kolom dengan sticky bottom bar verifikasi, tablet 2 kolom, desktop 3 kolom). Sticky bar wajib memakai `padding-bottom: env(safe-area-inset-bottom)`.

Data fetching: Server Components default; client component hanya untuk VerificationBar, dropdown, dan interaksi feed. Revalidasi feed laporan lewat polling ringan 30 detik (bukan WebSocket) untuk menjaga ringan di 3G.

Impor kontak CSV: kolom `nama,telepon,poktan,dusun,channel,opt_in_tanggal`. Validasi nomor ke format E.164 (default +62), tolak baris tanpa `opt_in_tanggal`, laporkan baris gagal.

---

## 10. API Internal ringkas

| Endpoint | Metode | Auth | Fungsi |
| :-- | :-- | :-- | :-- |
| `/api/cron/ingest?slot=0500\|1700` | POST/GET | CRON_SECRET | Ingest + asesmen + pembuatan draf |
| `/api/cron/escalate` | POST/GET | CRON_SECRET | Eskalasi SLA dan kedaluwarsa draf |
| `/api/jobs/dispatch` | POST | CRON_SECRET | Proses outbox |
| `/api/webhooks/whatsapp` | GET/POST | Signature | Inbound WA |
| `/api/webhooks/telegram` | POST | Secret token | Inbound Telegram |
| `/api/health` | GET | publik | `{ db, lastIngestAt, queueDepth }` tanpa data sensitif |

Mutasi dari UI hanya melalui Server Action (bukan REST publik).

---

## 11. Keamanan (Pemetaan OWASP Top 10) dan Privasi

| OWASP | Risiko di sistem ini | Kontrol wajib |
| :-- | :-- | :-- |
| A01 Broken Access Control | PPL membaca/menyetujui draf region lain; IDOR pada `/drafts/[id]` | Cek `ppl_assignments` di setiap query dan action; test negatif per peran. |
| A02 Cryptographic Failures | Nomor telepon petani | AES-256-GCM (IV acak 12 byte per nilai, `key_id` terversi), blind index HMAC-SHA256 untuk pencarian. Kunci dari env, rotasi didukung. TLS wajib. |
| A03 Injection | SQL, template, perintah | Drizzle parameterized, Zod di semua input, tanpa `eval`/string SQL mentah. Output React ter-escape. |
| A04 Insecure Design | Siaran tanpa verifikasi | Invarian "tidak ada broadcast tanpa approval" diuji otomatis (Bagian 7.1). |
| A05 Security Misconfiguration | Header, CORS | CSP ketat, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, CORS ditutup untuk API internal. Env divalidasi saat boot. |
| A06 Vulnerable Components | Dependency | `pnpm audit` di CI, Dependabot/Renovate, lockfile terkunci. |
| A07 Identification and Auth Failures | Brute force | argon2id, lockout, rate limit login, sesi pendek (8 jam), logout menghapus sesi. |
| A08 Software and Data Integrity | Webhook palsu, cron palsu | Verifikasi HMAC webhook (konstan-waktu), CRON_SECRET, idempotensi inbound. |
| A09 Logging and Monitoring Failures | Tidak ada jejak aksi PPL | `audit_logs` append-only untuk approve/hold/edit/login/ekspor; alarm pada ingest gagal dan dead letter. |
| A10 SSRF | Fetch ke API cuaca | Host sumber cuaca di-allowlist, tidak ada URL dari input user, timeout wajib. |

Tambahan:
- **Rate limit:** login, webhook (per IP), aksi admin.
- **Log:** pino dengan redaksi `phone*`, `name*`, `token*`, `authorization`.
- **Privasi:** nomor petani tidak ditampilkan penuh di UI (maskir `+62 812-****-3456`) kecuali admin; ekspor data dicatat di audit.
- **Opt-in/opt-out:** wajib, dengan `STOP` instan. Retensi `farmer_reports` dan `inbound_messages` dikonfigurasi (default 24 bulan), job penghapusan terjadwal.
- **Rahasia:** `WHATSAPP_APP_SECRET`, `WHATSAPP_ACCESS_TOKEN`, `TELEGRAM_BOT_TOKEN`, `PII_ENC_KEY`, `PII_HMAC_KEY`, `AUTH_SECRET`, `CRON_SECRET`, `DATABASE_URL`. Tidak pernah dikirim ke klien (tanpa prefix `NEXT_PUBLIC_`).

---

## 12. Implementasi Design System

### 12.1 Token

Implementasikan Design System Bagian 2 dan 3 apa adanya sebagai CSS variables di `src/styles/tokens.css`, dipetakan ke Tailwind theme. Komponen wajib: `RiskBadge`, `MetricCard`, `VerificationBar`, `FeedTable`, `StatusIcon`.

### 12.2 Koreksi token (mengikat)

Hasil audit kontras terhadap latar putih:

| Item | Masalah | Koreksi |
| :-- | :-- | :-- |
| `--border-strong #94A3B8` untuk border input | Sekitar 2.6:1, gagal 3:1 (WCAG 1.4.11) | Border input memakai `#64748B` (sekitar 4.8:1), tebal 1.5px. `#94A3B8` hanya untuk dekoratif. |
| `--agri-primary-500 #10B981`, `--status-green-accent #22C55E`, `--status-amber-accent #F59E0B` | Sekitar 2.1 sampai 2.5:1 | Jangan dipakai sebagai satu-satunya pembawa makna (ikon, garis progres, outline status). Pakai token `-text` (`#166534`, `#92400E`, `#991B1B`) untuk ikon dan outline berarti. Aksen hanya untuk dekorasi besar. |
| Border kartu | Dokumen menyebut `#CBD5E1` (kontras sekitar 1.5:1) sementara token `--border-subtle` `#E2E8F0` | Definisikan `--border-card: #94A3B8` tebal 1.5px untuk kartu (selaras tujuan anti-silau). |
| `--text-muted #64748B` | Lolos AA (sekitar 4.8:1) tetapi lemah di luar ruangan | Dilarang untuk informasi penting. Hanya timestamp/caption. |
| Klaim kontras `text-primary` 14.2:1 | Nilai sebenarnya sekitar 17.9:1 | Perbaiki angka di dokumentasi. Tidak ada dampak kode. |
| SVG badge contoh (path lingkaran) | Tidak sesuai ikon `shield-hazard` | Pakai ikon Lucide: `shield-check` (hijau), `triangle-alert` (kuning), `shield-alert` (merah). Lainnya: `thermometer`, `droplet`, `cloud-rain`, `user-check`, `send`, `pencil`, `map-pin`. |

### 12.3 Aturan UI

- Status selalu: warna + ikon + teks (`[AMAN]`, `[WASPADA]`, `[BAHAYA]`) + bentuk. Test komponen memverifikasi ketiganya hadir.
- Area sentuh interaktif minimal 48 x 48 px dengan jarak antar-target minimal 8 px.
- `aria-label` pada metrik menyertakan satuan dalam kata (contoh: "Suhu rata-rata dua puluh tujuh koma empat derajat celsius"). Buat helper `speakNumber(id-ID)`.
- Teks UI Bahasa Indonesia. Tanggal format `14 November 2026, 07:00 WIB` memakai zona region.
- Fokus keyboard terlihat (outline 2px kontras tinggi). Dukung `prefers-reduced-motion`.
- Nol emoji (Bagian 14).

---

## 13. Performa dan Anggaran

| Metrik | Target | Cara uji |
| :-- | :-- | :-- |
| Total page load dasbor PPL | < 1.5 MB (transfer, kompresi aktif) | Lighthouse CI + `size-limit` di CI |
| JS awal per halaman | < 150 KB gzip | `size-limit` |
| LCP pada 3G/HSPA (Slow 4G throttling) | < 4 detik | Lighthouse throttled |
| Eksekusi mesin aturan, 100 kecamatan | < 5 detik (tanpa jaringan) | Benchmark Vitest dengan 100 region sintetis |
| Siaran: persetujuan ke pesan terkirim | <= 60 detik (95 persentil) | Uji integrasi dengan gateway mock + metrik `approved_at` ke `sent` |
| Ketersediaan | >= 99.5 persen musim tanam | Monitor `/api/health` dari pemantau eksternal |

Aturan: font self-host subset, gambar tidak digunakan selain SVG, tidak ada library UI pihak ketiga besar, MapLibre hanya dimuat dinamis di desktop.

---

## 14. Pengujian dan Kualitas

1. **Unit (`core/`):** rule engine (fixtures 6.5), features, parser LAPOR, formatter (snapshot pesan, lebar <= 38, tanpa emoji, ASCII untuk simbol), crypto (round-trip, IV unik).
2. **Integrasi:** ingest dengan HTTP mock (sukses, timeout 10 s lalu failover BMKG, semua gagal), alur draf ke approve ke outbox ke webhook status, idempotensi webhook, RBAC negatif, eskalasi 6 jam (fake timer).
3. **E2E (Playwright, viewport 360, 768, 1280):** login, tinjau draf MERAH, pilih fase, edit teks, setujui, lihat status pengiriman; feed laporan dan tandai verifikasi.
4. **A11y:** axe-core tanpa pelanggaran serius pada semua halaman utama.
5. **Anti-emoji:** test yang memindai `src/`, `tests/fixtures`, hasil formatter, dan seed dengan regex Unicode `\p{Extended_Pictographic}` lalu gagal bila cocok.
6. **Keamanan:** test signature webhook salah (401), cron tanpa secret (401), akses lintas-region (403/404).
7. **CI (`ci.yml`):** typecheck, lint, test, build, `pnpm audit --prod`, Lighthouse CI, size-limit.

Cakupan minimum: `src/core` 95 persen baris dan cabang.

---

## 15. Observabilitas dan Operasi

- Log JSON terstruktur dengan `requestId`, `regionId`, `jobId`.
- Metrik inti (tabel `job_runs` atau layanan metrik): sukses ingest per slot, jumlah region degraded, kedalaman antrean outbox, p95 latensi persetujuan ke terkirim, jumlah `dead`, tingkat opt-out, tingkat partisipasi LAPOR mingguan (KPI 2).
- Panel admin "Kesehatan Sistem": ingest terakhir, region gagal, dead letters, status template WhatsApp.
- Peringatan operasional (email ke admin): ingest slot gagal total, antrean > 200 tertunda > 5 menit, webhook signature gagal beruntun.
- Backup DB harian dan uji pemulihan per kuartal.
- Seed: `pnpm db:seed` membuat rule_version v1, 1 admin, 2 region contoh, 1 PPL, 1 poktan dengan kontak dummy (nomor fiktif `+62 8xx` reserved), tanpa data nyata.

---

## 16. Fase Implementasi dan Acceptance Criteria

### Fase 0: Fondasi
- Scaffold repo, Node 22, TS strict, lint, Vitest, Playwright, CI, `env.ts`, token CSS, skema DB + migrasi + seed.
- **Selesai bila:** `pnpm verify` hijau, migrasi naik-turun bersih, `.env.example` lengkap.

### Fase 1: Inti (tanpa UI)
- `core/features`, `core/rules`, `core/explain`, `core/lapor-parser`, `core/formatter`.
- Ingest Open-Meteo + failover + penyimpanan snapshot/daily.
- Pembuatan asesmen dan draf, kebijakan supersede.
- **Selesai bila:** semua fixture 6.5 lulus, benchmark 100 region < 5 s, test "tidak ada broadcast tanpa approval" lulus, formatter lulus aturan anti-emoji dan lebar 38.

### Fase 2: Dasbor PPL
- Auth + RBAC, `/dashboard`, `/drafts/[id]`, VerificationBar, audit log, eskalasi.
- **Selesai bila:** E2E alur approve lulus di 3 viewport, axe bersih, budget 1.5 MB terpenuhi, RBAC negatif lulus.

### Fase 3: Diseminasi
- Gateway WhatsApp (template + sesi + webhook) dan Telegram, outbox, retry, opt-in/opt-out, impor kontak.
- **Selesai bila:** dengan gateway mock: p95 approve ke sent <= 60 s pada 500 penerima, idempotensi webhook terbukti, STOP bekerja; dengan sandbox Meta: satu alur nyata template ke tombol ke pesan sesi ke LAPOR berhasil.

### Fase 4: Ground-truthing dan BPP
- `/reports`, `/bpp`, `/regions/[id]`, KPI partisipasi, kesehatan sistem.
- **Selesai bila:** laporan masuk tampil <= 30 detik, aksi Jadwalkan Kunjungan tercatat, ikhtisar BPP memuat per-desa.

### Fase 5: Hardening dan rilis pilot
- Audit keamanan Bagian 11, uji beban, dokumentasi operasional (`RUNBOOK.md`), rotasi kunci, pelatihan SOP PPL.
- **Selesai bila:** seluruh daftar OWASP bertanda terpenuhi dengan bukti, uptime monitor aktif, backup terverifikasi.

---

## 17. Keputusan Terbuka untuk Pemilik Produk (blocker eksternal)

| ID | Item | Dampak |
| :-- | :-- | :-- |
| Q-1 | Akun WhatsApp Business Platform + verifikasi bisnis Meta + nomor khusus bot + persetujuan template | Tanpa ini Fase 3 hanya dapat diuji dengan mock dan Telegram |
| Q-2 | Biaya per pesan template (volume x jumlah penerima) dan kategori template (utilitas vs pemasaran) | Anggaran operasional per musim tanam |
| Q-3 | Validasi ambang A-01 sampai A-03 oleh akademisi/POPT | Akurasi peringatan (KPI 1) |
| Q-4 | Daftar kode wilayah, koordinat desa/kecamatan pilot, dan `bmkg_adm4` | Seed wilayah nyata |
| Q-5 | Kebijakan opt-in petani (formulir, lisan dicatat PPL) dan retensi data | Kepatuhan UU PDP |
| Q-6 | Lisensi penggunaan Open-Meteo untuk skala produksi | Biaya dan risiko batas laju |

---

## 18. Prompt Pembuka untuk Antigravity

Tempel ini sebagai instruksi awal agen:

```
Baca docs/TECH_SPEC.md secara penuh. Itu sumber kebenaran teknis.
Mulai dari Fase 0. Hasilkan rencana implementasi untuk Fase 0 dan tunggu
konfirmasi sebelum mengeksekusi. Setelah tiap fase: jalankan `pnpm verify`,
lampirkan output test sebagai bukti, dan berhenti untuk review sebelum
fase berikutnya. Patuhi Bagian 0 dan Bagian 1 tanpa pengecualian.
Jangan menambah dependency di luar Bagian 2 tanpa mencatat di docs/DECISIONS.md.
```