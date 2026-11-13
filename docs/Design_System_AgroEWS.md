# DESIGN SYSTEM SPECIFICATION
## AgroEWS: Antarmuka Web Dasbor Verifikasi PPL & Format Pesan Komunitas Petani

- **Nama Sistem Desain:** AgroEWS Field Design System (FDS)
- **Versi:** 1.0.0
- **Kategori Desain:** Responsive Web Application (Dasbor PPL) & Text-Based Community Messaging Interface (Bot WhatsApp/Telegram)
- **Standar Kepatuhan:** WCAG 2.1 Level AA, Zero Emoji Policy, Clean Vector SVG Iconography

---

## 1. Filosofi & Prinsip Desain

1. **Utamakan Keterbacaan Lapangan (*High-Glare Outdoor Legibility*):**
   Dasbor PPL dan format pesan petani sering kali diakses di bawah terik sinar matahari langsung di pematang sawah. Kontras warna tinggi, hierarki visual tegas, dan batas antar-kartu yang kontras menjadi keharusan.
2. **Kebijakan Nol Emoji (*Zero-Emoji Policy*):**
   Sesuai standar antarmuka profesional dan integritas sistem ilmiah:
   - **Dilarang keras** menggunakan karakter emoji Unicode (misal: 🌾, ⚠️, 🚨, 📱, 🧑‍🌾, 🐛) di seluruh elemen UI web, tombol, badge, maupun draf template pesan WhatsApp. Karakter emoji merender secara tidak konsisten antartipe smartphone petani dan mengurangi kredibilitas rekomendasi ilmiah.
   - Gunakan **ikon vektor SVG standar (Lucide / Feather Icons)** pada aplikasi web, dan gunakan **simbol tipografi struktural** (seperti `[PERINGATAN]`, `---`, `*PHT Mandiri*`, `[>]`) pada template teks WhatsApp.
3. **Pembeda Status Berbasis Multimodal (*Color + Label Redundancy*):**
   Status risiko tidak boleh hanya dibedakan oleh warna saja (demi kepatuhan aksesibilitas buta warna), melainkan wajib selalu dipasangkan dengan teks status eksplisit (`[AMAN]`, `[WASPADA]`, `[BAHAYA]`) dan bentuk geometris pengenal.
4. **Sentuhan Ramah Jari Kasar (*Field Touch Targets*):**
   Semua tombol interaktif pada perangkat mobile/tablet memiliki ukuran area sentuh minimal **$48 \times 48\text{ px}$** dengan jarak pemisah (*spacing*) yang cukup untuk mencegah salah sentuh saat petugas memegang perangkat di lapangan.

---

## 2. Palet Warna & Desain Token (*Color Tokens*)

### 2.1 Palet Utama (Brand & Surface)

| Nama Token | Hex Code | Deskripsi Penggunaan |
| :--- | :--- | :--- |
| `--agri-primary-900` | `#064E3B` | Header bar, teks kontras tertinggi, aksen brand utama |
| `--agri-primary-700` | `#047857` | Tombol aksi utama (*primary button*), tautan aktif |
| `--agri-primary-500` | `#10B981` | Aksen sekunder, garis progres aktif |
| `--agri-primary-50` | `#ECFDF5` | Latar belakang card aktif, highlight area agroklimat |
| `--surface-canvas` | `#F8FAFC` | Background utama aplikasi web |
| `--surface-card` | `#FFFFFF` | Background panel data, modal, dan kartu metrik |
| `--border-subtle` | `#E2E8F0` | Garis batas kartu, pemisah tabel |
| `--border-strong` | `#94A3B8` | Border input form, batas kartu yang membutuhkan penegasan |
| `--text-primary` | `#0F172A` | Teks judul, label utama, angka metrik (kontras 14:1) |
| `--text-secondary` | `#475569` | Teks paragraf pendukung, label penjelasan (kontras 7:1) |
| `--text-muted` | `#64748B` | Timestamp, caption penjelas, unit satuan |

### 2.2 Token Status Risiko (Agro-Risk Severity Tokens)

Sistem menggunakan 3 tingkatan status risiko agroklimat:

```css
/* Status HIJAU - Risiko Rendah (Mikroklimat Kurang Kondusif) */
--status-green-bg: #F0FDF4;
--status-green-border: #BBF7D0;
--status-green-text: #166534;
--status-green-accent: #22C55E;

/* Status KUNING - Risiko Waspada (Mendukung Perkembangan Nimfa) */
--status-amber-bg: #FFFBEB;
--status-amber-border: #FDE68A;
--status-amber-text: #92400E;
--status-amber-accent: #F59E0B;

/* Status MERAH - Risiko Bahaya (Suhu & RH Optimum Outbreak) */
--status-red-bg: #FEF2F2;
--status-red-border: #FECACA;
--status-red-text: #991B1B;
--status-red-accent: #EF4444;
```

---

## 3. Tipografi & Skala Teks (*Typography Scale*)

- **Font Family Utama (Web):** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Font Family Monospace (Data & Format Pesan):** `'JetBrains Mono', 'Fira Code', 'Courier New', monospace`

### Skala Hierarki Tipografi

| Skala Tingkat | Ukuran (px / rem) | Berat (Weight) | Line Height | Penggunaan |
| :--- | :--- | :--- | :--- | :--- |
| **Display Header** | `24px` (`1.5rem`) | 700 (Bold) | `32px` | Judul Halaman Dasbor PPL |
| **Section Header** | `18px` (`1.125rem`) | 600 (Semi-bold) | `26px` | Judul Kartu Widget & Nama Kecamatan |
| **Card Header** | `15px` (`0.9375rem`) | 600 (Semi-bold) | `22px` | Sub-seksi data metrik |
| **Metric Value** | `28px` (`1.75rem`) | 700 (Bold) | `34px` | Angka Suhu, RH%, Curah Hujan |
| **Body Regular** | `14px` (`0.875rem`) | 400 (Regular) | `20px` | Teks penjelasan, paragraf anjuran |
| **Body Bold** | `14px` (`0.875rem`) | 600 (Semi-bold) | `20px` | Label form, status terverifikasi |
| **Caption / Meta** | `12px` (`0.75rem`) | 500 (Medium) | `16px` | Timestamp, koordinat, data sumber |
| **Code / Bot Raw** | `13px` (`0.8125rem`) | 400 (Monospace) | `18px` | Format pesan raw WhatsApp & kode verifikasi |

---

## 4. Sistem Ikonografi Vektor (*Clean Vector Icons*)

Sesuai dengan ketentuan **Zero-Emoji Policy**, semua ikon dibuat dengan format **SVG 24x24 viewBox** berbasis pustaka vektor modern (Lucide Style) dengan `stroke-width="2"`, `stroke-linecap="round"`, dan `stroke-linejoin="round"`.

### Matriks Pemetaan Ikon Standar

| Nama Token Ikon | Representasi Visual | Makna Fungsional |
| :--- | :--- | :--- |
| `icon-shield-safe` | Lingkaran / perisai dengan tanda centang | Status Hijau / Kondisi Lahan Aman |
| `icon-alert-triangle` | Segitiga peringatan dengan tanda seru | Status Kuning / Waspada Cuaca Lembap |
| `icon-shield-hazard` | Perisai dengan tanda seru tegas | Status Merah / Ancaman Ledakan Nimfa |
| `icon-thermometer` | Tabung termometer vertikal | Indikator Suhu Udara Rata-Rata |
| `icon-droplet` | Tetesan air tunggal | Indikator Kelembapan Relatif (RH) |
| `icon-cloud-rain` | Awan dengan garis tetesan hujan miring | Indikator Hari Hujan & Curah Hujan |
| `icon-user-check` | Siluet petugas dengan centang kecil | Indikator Persetujuan Petugas PPL |
| `icon-send-broadcast` | Sudut panah pengiriman pesan (paper plane) | Tombol Aksi "Setujui & Siarkan" |
| `icon-edit-pencil` | Siluet pensil miring minimalis | Tombol Aksi "Koreksi Rekomendasi" |
| `icon-map-pin` | Penanda koordinat geografis | Titik Wilayah Kecamatan / Desa Binaan |

---

## 5. Spesifikasi Komponen Inti Antarmuka (*Core Components*)

### 5.1 Komponen 1: Lencana Status Risiko (*Risk Status Pill / Badge*)

Komponen visual untuk menunjukkan derajat risiko di dasbor maupun kartu ringkasan.

```html
<!-- Status MERAH - Bahaya -->
<span class="agro-badge agro-badge--danger">
  <svg class="agro-icon" viewBox="0 0 24 24" width="14" height="14">
    <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" fill="none" stroke-width="2"/>
  </svg>
  STATUS: MERAH (BAHAYA)
</span>
```

**Aturan CSS Komponen:**
- Padding: `4px 10px`
- Border-radius: `9999px` (Pill shape)
- Font-size: `12px` (Uppercase, Letter-spacing `0.05em`, Font-weight `700`)
- Gap ikon ke teks: `6px`

---

### 5.2 Komponen 2: Kartu Metrik Agroklimat (*Bioclimatic Metric Card*)

Menyajikan parameter cuaca yang diproses oleh mesin heuristik.

```
+-------------------------------------------------------+
| [icon-thermometer] SUHU UDARA 24 JAM                  |
| 27.4 °C                    Rentang: 24.1 - 29.8 °C    |
| [Status: Mendukung Pertumbuhan WBC (24 - 29 °C)]      |
+-------------------------------------------------------+
| [icon-droplet] KELEMBAPAN RELATIF (RH)                |
| 84.5 %                     Durasi RH >= 80%: 16 Jam   |
| [Status: Sangat Lembap / Kritis Inkubasi Telur]       |
+-------------------------------------------------------+
| [icon-cloud-rain] POLA HUJAN 3 HARI                   |
| 3.2 mm / hari              Sekuens: Hujan Berselang   |
| [Status: Membentuk Mikroklimat Kanopi Lembap]         |
+-------------------------------------------------------+
```

---

### 5.3 Komponen 3: Bilah Verifikasi PPL (*Human-in-the-Loop Verification Action Bar*)

Panel interaktif bagi PPL/POPT untuk meninjau dan mengeksekusi peringatan.

- **Struktur Elemen:**
  1. **Selektor Validasi Fase Tanam:** Dropdown pilihan (`[Pilih: Vegetatif Awal | Bunting | Masak Susu | Bero]`).
  2. **Area Koreksi Anjuran Teks:** Kotak input teks multiline yang dapat diedit oleh PPL untuk menyisipkan pesan kearifan lokal (misal: penambahan jadwal kumpul poktan).
  3. **Tombol Penolakan (*Secondary Destructive*):** `[Tahan / Batal Siar]` (Background putih, border `#94A3B8`, text `#475569`).
  4. **Tombol Persetujuan (*Primary Action*):** `[Setujui & Siarkan ke 8 Poktan]` (Background `#047857`, border none, text `#FFFFFF`, icon `icon-send-broadcast`).

---

### 5.4 Komponen 4: Standar Format Template Pesan Komunitas (WhatsApp Template)

Untuk mematuhi **Zero-Emoji Policy**, pesan WhatsApp disusun dengan struktur teks monospace yang rapi, lugas, dan memiliki pembatas visual yang seragam:

```text
========================================
SISTEM PERINGATAN DINI AGROKLIMAT (AGROEWS)
Balai Penyuluhan Pertanian (BPP) Kec. Kuranji
========================================

WILAYAH   : Nagari Sungai Bangek, Kel. Balai Gadang
TANGGAL   : 14 November 2026, 07:00 WIB
STATUS    : [STATUS: MERAH - BAHAYA SERANGAN WERENG]

----------------------------------------
PARAMETER CUACA TERPANTAU (BMKG & ERA5)
----------------------------------------
- Suhu Rerata 3 Hari   : 26.8 C (Optimum Wereng)
- Kelembapan (RH)      : 86% (Sangat Lembap)
- Pola Cuaca           : Hujan Ringan Berselang Terik

KESIMPULAN BIOLOGIS:
Kondisi cuaca 3 hari ke depan sangat kondusif
mempercepat penetasan telur wereng (masa inkubasi 
kritis 5-7 hari ke depan).

----------------------------------------
REKOMENDASI TINDAKAN PETANI (PHT MANDIRI)
----------------------------------------
1. SEGERA lakukan pengeringan petak sawah berkala
   (intermittent) selama 2-3 hari untuk menurunkan 
   kelembapan pangkal batang rumpun padi.
2. Lakukan inspeksi visual serempak pada pangkal rumpun.
3. JANGAN melakukan penyemprotan insektisida kimiawi 
   secara preventif agar musuh alami (laba-laba 
   serigala & kepik mirid) tetap terjaga.
4. Apabila ditemukan nimfa > 5 ekor/rumpun pada 
   fase vegetatif, segera laporkan ke PPL pendamping 
   untuk aplikasi agens hayati Beauveria bassiana.

----------------------------------------
KONFIRMASI LAPANGAN (GROUND-TRUTHING)
----------------------------------------
Bantu kami memetakan kondisi sawah Anda dengan 
membalas pesan ini memakai format:

Ketik: LAPOR [Dusun/Poktan] [Angka Status]
Pilihan angka:
[0] = Bersih / Wereng Nihil
[1] = Ditemukan Sedikit (1-4 ekor/rumpun)
[2] = Serangan Padat (>= 5 ekor/rumpun)

Contoh: LAPOR Dusun-Dua 1

Telah divalidasi oleh: PPL Wilayah Binaan Kuranji
========================================
```

---

### 5.5 Komponen 5: Tabel Umpan Balik Petani (*Ground-Truthing Feedback Feed*)

Tampilan rekapitulasi data yang masuk dari laporan balik petani pada Dasbor PPL:

| Jam | Nama Petani / Poktan | Dusun / Petak | Input Laporan | Status Terhitung | Aksi Petugas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `08:14` | Pak Subur (Poktan Makmur) | Dusun II | `LAPOR Dusun-2 1` | `[Waspada (1-4)]` | Tandai Verifikasi |
| `08:32` | Pak Syamsul (Poktan Sejahtera)| Dusun I | `LAPOR Dusun-1 0` | `[Aman (0)]` | Tandai Verifikasi |
| `09:05` | Pak Rahman (Poktan Tani Jaya) | Dusun IV | `LAPOR Dusun-4 2` | `[Bahaya (>=5)]` | **Jadwalkan Kunjungan POPT** |

---

## 6. Layout & Breakpoint Responsif

Sistem antarmuka web Dasbor PPL dirancang responsif dengan 3 ukuran breakpoint utama:

```
[Mobile View: 360px - 480px]
  └── Tampilan bertumpuk (single-column stack).
  └── Kartu metrik berjejer vertikal.
  └── Bilah verifikasi diletakkan sebagai sticky bottom bar agar mudah dijangkau satu tangan.

[Tablet View: 768px - 1024px]
  └── Digunakan pada tablet operasional PPL di lapangan.
  └── Tampilan 2 kolom: Kolom kiri (Peta Zonasi & Data Cuaca), Kolom kanan (Draf Rekomendasi & Feed Laporan Petani).

[Desktop View: 1280px+]
  └── Digunakan oleh Koordinator BPP dan Tim Analis.
  └── Tampilan 3 kolom: Navigasi & Daftar Kecamatan (Kiri), Panel Data & Verifikasi (Tengah), Log Pelaporan Ground-Truthing Realtime (Kanan).
```

---

## 7. Panduan Aksesibilitas (*Accessibility Checklist*)

1. **Rasio Kontras Teks (Color Contrast):**
   - Teks utama (`--text-primary: #0F172A`) di atas canvas putih menghasilkan rasio **$14.2:1$** (melebihi standar WCAG AAA $7:1$).
   - Teks badge merah (`--status-red-text: #991B1B`) di atas latar `--status-red-bg: #FEF2F2` menghasilkan rasio **$6.8:1$** (melebihi standar WCAG AA $4.5:1$).
2. **Kesesuaian Layar Lapangan (*Glare Resistance*):**
   - Batas setiap card menggunakan border tegas (`1.5px solid #CBD5E1`) alih-alih hanya mengandalkan *box-shadow* tipis yang sering kali tidak terlihat saat berada di luar ruangan.
3. **Penyampaian Informasi Nir-Grafis:**
   - Seluruh data tabel dan ringkasan metrik dapat dibaca oleh pembaca layar (*screen reader*) dengan atribut `aria-label` yang menyertakan satuan metrik (misal: `aria-label="Suhu rata-rata dua puluh tujuh koma empat derajat celsius"`).
