# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## AgroEWS: Sistem Peringatan Dini Agroklimat Terbuka untuk Mitigasi Wereng Batang Cokelat (*Nilaparvata lugens*)

- **Nama Produk:** AgroEWS (*Agro-Climatic Early Warning System*)
- **Inisiator:** Tim AgriSense Mandiri (Universitas Andalas)
- **Kompetisi:** LKTI Agricompetition FP-USU 2026 (Subtema TEKDIG - Inovasi Teknologi dan Digitalisasi Pertanian)
- **Status Dokumen:** Version 1.0 (Final Draft)
- **Target Platform:** Cloud Serverless Backend, Web Dashboard PPL (Responsive Web), Chatbot Gateway (WhatsApp Business API / Telegram)

---

## 1. Executive Summary & Problem Definition

### 1.1 Latar Belakang & Masalah
Wereng Batang Cokelat (*Nilaparvata lugens* Stål / WBC) merupakan hama tanaman padi paling destruktif di Indonesia yang mampu memicu gagal panen total (*hopperburn* / puso) dan bertindak sebagai vektor virus kerdil hampa dan kerdil rumput.
Selama ini, sistem penanganan wereng di tingkat petani mengalami tiga kelemahan struktural:
1. **Respons Reaktif & Keterlambatan Deteksi:** Petani baru bertindak setelah melihat koloni nimfa masif di pangkal rumpun padi. Pada fase ini, jendela intervensi pencegahan telah terlewat.
2. **Kepanikan Kimiawi & Resurgensi:** Deteksi yang terlambat memicu penyemprotan insektisida kimia spektrum luas (seperti sintetik piretroid) secara berulang dan serampangan. Hal ini memusnahkan musuh alami (*Lycosa pseudoannulata*, *Cyrtorhinus lividipennis*) dan justru mempercepat resistensi hama.
3. **Keterbatasan Solusi IoT Eksisting:** Solusi *smart farming* eksisting berbasis stasiun sensor mikroklimat fisik di sawah (*field-level IoT*) membutuhkan biaya instalasi tinggi (Rp 3–8 juta/petak), rentan rusak akibat lumpur dan korosi, serta rawan pencurian.

### 1.2 Visi Produk
Mewujudkan sistem peringatan dini agroklimat presisi berskala desa/kecamatan dengan **nol perangkat keras di lahan (*zero hardware at field level*)**, berbasis mesin aturan transparan (*explainable rule-based*), terintegrasi dengan verifikasi penyuluh (*human-in-the-loop*), dan terdiseminasi langsung ke komunitas petani melalui aplikasi pesan instan yang telah mereka gunakan sehari-hari.

### 1.3 Empat Pilar Nilai Inti (Core Value Proposition)
1. **Zero Hardware at Field Level:** Tidak membebani petani dengan biaya pembelian atau pemeliharaan alat sensor fisik di sawah. Memanfaatkan data cuaca terbuka BMKG, satelit ERA5-Land ECMWF, dan Open-Meteo API.
2. **Explainable Rule-Based Engine:** Menolak pendekatan *black-box* AI murni. Logika ambang batas risiko didasarkan pada parameter bioekologi literatur ilmiah yang dapat divalidasi oleh akademisi dan penyuluh.
3. **Human-in-the-Loop Verification:** PPL (Penyuluh Pertanian Lapangan) dan POPT bertindak sebagai filter kontekstual untuk memastikan peringatan hanya dirilis apabila tanaman berada pada fase rentan (vegetatif akhir – bunting).
4. **Community-Driven Dissemination & Ground-Truthing:** Peringatan disebarkan ke grup WhatsApp kelompok tani disertai panduan kultur teknis ramah lingkungan dan mekanisme pelaporan balik lapangan (*crowdsourced ground-truthing*).

---

## 2. User Personas & Stakeholder Analysis

| Persona | Peran & Tanggung Jawab | Kebutuhan Utama | Hambatan / Pain Points |
| :--- | :--- | :--- | :--- |
| **Petani Penggarap (Pak Tani)** | Mengelola budidaya sawah, memantau tanaman harian, mengendalikan hama. | Informasi dini yang mudah dipahami, tidak perlu instal aplikasi baru, anjuran praktis hemat biaya. | Terbiasa menyemprot kimia preventif, literasi digital terbatas, kapasitas memori smartphone rendah. |
| **Penyuluh Pertanian (PPL / POPT)** | Membina kelompok tani, memvalidasi kondisi serangan hama, mengawal kebijakan PHT. | Dasbor ringkas yang menyajikan data cuaca olahan, draf anjuran yang dapat diedit, kontrol siaran pesan. | Beban wilayah binaan luas, waktu inspeksi fisik terbatas, validasi manual memakan waktu. |
| **Koordinator Balai Penyuluhan (BPP)** | Memantau agregat serangan di tingkat kecamatan, mengalokasikan bantuan agens hayati. | Peta sebaran risiko per desa, riwayat laporan peringatan, laporan partisipasi petani. | Ketiadaan rekapitulasi data terpadu antardesa. |
| **Dinas Pertanian / Akademisi** | Regulator kebijakan ketahanan pangan, kalibrasi model biometeorologi. | Akses log data ground-truthing, histori anomali cuaca, evaluasi dampak efisiensi usahatani. | Ketiadaan sinkronisasi antara data cuaca makro dengan respon riil lapangan. |

---

## 3. Scope & System Architecture (Five-Layer Architecture)

```
[Layer 1: Data Ingestion Layer]
   ├── Open-Meteo REST API (Hourly/Daily Forecast & Historical)
   ├── BMKG Open Weather API (Kecamatan Level)
   └── ERA5-Land Reanalysis (ECMWF Fallback Archive)
            │
            ▼
[Layer 2: Feature Engineering Layer]
   ├── Suhu Rerata 24 Jam (T_mean)
   ├── Kelembapan Relatif Rerata 24 Jam (RH_mean)
   └── Indeks Hari Hujan Berselang (Intermittent Rain Sequence 3 Hari)
            │
            ▼
[Layer 3: Heuristic Rule-Based Engine]
   ├── Evaluasi Ambang Batas Bioekologis WBC
   └── Klasifikasi Status: HIJAU (Aman) | KUNING (Waspada) | MERAH (Bahaya)
            │
            ▼
[Layer 4: Human-in-the-Loop Verification Layer]
   ├── PPL Web Dashboard (Notification & Queue)
   ├── Contextual Filter: Fase Tanaman (Bero / Vegetatif / Bunting / Masak)
   └── SLA Action: Setujui & Siarkan | Modifikasi | Tahan
            │
            ▼
[Layer 5: Community Dissemination & Feedback Loop]
   ├── WhatsApp Business API / Telegram Bot Engine
   ├── Siaran Pesan Edukasi PHT ke Grup Poktan
   └── Crowdsourced Ground-Truthing: Format Respon Balik Petani (0/1/2)
```

---

## 4. Functional Requirements (FR)

### 4.1 Modul Akuisisi Data Cuaca (Layer 1 - Data Ingestion)
- **FR-1.1:** Sistem wajib mengeksekusi penarikan data cuaca secara otomatis via cron job setiap hari pada pukul **05.00 WIB** dan **17.00 WIB**.
- **FR-1.2:** Endpoint data wajib mencakup koordinat geospasial (lintang dan bujur) tingkat kecamatan target.
- **FR-1.3:** Variabel cuaca yang diambil meliputi:
  - Suhu udara 2 meter (`temperature_2m_mean`, `temperature_2m_max`, `temperature_2m_min`)
  - Kelembapan relatif 2 meter (`relative_humidity_2m` resolusi per jam)
  - Curah hujan harian (`precipitation_sum`)
  - Prakiraan cuaca 3 hari ke depan (*forecast 72 hours*)
- **FR-1.4:** Sistem wajib menyediakan mekanisme *failover*: jika API utama (Open-Meteo) tidak merespons dalam 10 detik, sistem beralih ke *cached mirror* atau API sekunder BMKG.

### 4.2 Modul Agregasi Biometeorologi (Layer 2 - Feature Engineering)
- **FR-2.1:** Sistem menghitung rata-rata bergerak (*moving average*) 3 harian untuk suhu dan kelembapan relatif.
- **FR-2.2:** Sistem menghitung durasi jam kumulatif di mana $RH \ge 80\%$ dalam rentang 24 jam.
- **FR-2.3:** Sistem mendeteksi sekuens pola hujan berselang (*intermittent rain pattern*): hari hujan ringan (1–5 mm) yang diselingi suhu optimal ($25\text{--}29^\circ\text{C}$).

### 4.3 Mesin Aturan Risiko (Layer 3 - Explainable Rule Engine)
- **FR-3.1:** Sistem mengklasifikasikan risiko serangan wereng ke dalam 3 tingkatan status:
  - **Status HIJAU (Aman):**
    - Kondisi: Suhu $< 22^\circ\text{C}$ atau $> 32^\circ\text{C}$; ATAU $RH < 70\%$.
    - Rekomendasi Baku: Pemantauan mingguan normal, pertahankan tinggi air standar, larangan keras semprot insektisida preventif.
  - **Status KUNING (Waspada):**
    - Kondisi: Suhu $24\text{--}29^\circ\text{C}$ DAN $RH\ 70\text{--}80\%$ selama 2 hari berturut-turut; curah hujan $1\text{--}5\text{ mm/hari}$.
    - Rekomendasi Baku: Tingkatkan pengamatan pangkal batang, lakukan pengeringan sawah berkala (*intermittent irrigation*) 2–3 hari, bersihkan gulma pematang.
  - **Status MERAH (Bahaya):**
    - Kondisi: Suhu $25\text{--}29^\circ\text{C}$ DAN $RH > 80\%$ selama $\ge 3$ hari berturut-turut; pola hujan berselang terik.
    - Rekomendasi Baku: Pengamatan intensif serempak pada pangkal batang; jika populasi $> 5\text{ ekor/rumpun}$ fase vegetatif aplikasikan *Beauveria bassiana* atau lapor POPT; hindari insektisida piretroid sintetis.
- **FR-3.2:** Setiap keputusan status wajib disertai penjelasan (*explainability log*): alasan cuaca pemicu status tersebut muncul.

### 4.4 Modul Verifikasi PPL (Layer 4 - Human-in-the-Loop)
- **FR-4.1:** Apabila status menghasilkan tingkat **KUNING** atau **MERAH**, sistem tidak boleh melakukan siaran langsung ke petani, melainkan membuat *Draft Alert* di dasbor PPL.
- **FR-4.2:** PPL menerima notifikasi draf verifikasi melalui web/pesan instan.
- **FR-4.3:** Dasbor PPL menyediakan pilihan konfirmasi fase tanam di wilayah terkait:
  - Bero / Olah Tanah $\rightarrow$ Siaran diredam (*suppressed*).
  - Vegetatif Awal / Vegetatif Akhir / Bunting $\rightarrow$ Siaran disetujui (*active threat*).
  - Masak Susu / Menjelang Panen $\rightarrow$ Anjuran disesuaikan tanpa pengeringan ekstrem.
- **FR-4.4 (Escalation SLA):** Jika PPL tidak memberikan respon dalam waktu **6 jam** untuk status MERAH, sistem mengirim eskalasi notifikasi ke Koordinator BPP.

### 4.5 Modul Diseminasi & Umpan Balik (Layer 5 - WhatsApp/Telegram Engine)
- **FR-5.1:** Pesan yang disetujui PPL dikirimkan secara otomatis ke grup WhatsApp kelompok tani terdaftar di desa bersangkutan.
- **FR-5.2:** Format pesan menggunakan tipografi terstruktur, bebas emotikon grafis yang membingungkan, dan menonjolkan rekomendasi tindakan kultur teknis.
- **FR-5.3 (Ground-Truthing Protocol):** Di bagian bawah pesan, petani diberikan instruksi format konfirmasi:
  `Ketik: LAPOR [Nama Dusun] [Kode Status]`
  - `0`: Bersih / Aman (Wereng nihil)
  - `1`: Waspada (Wereng $< 5$ ekor/rumpun)
  - `2`: Bahaya (Wereng $\ge 5$ ekor/rumpun, butuh POPT)
- **FR-5.4:** Sistem mencatat seluruh balasan petani ke dalam basis data untuk keperluan validasi lapangan dan pemetaan spasial.

---

## 5. Non-Functional Requirements (NFR)

| Kategori | Parameter | Spesifikasi |
| :--- | :--- | :--- |
| **Kinerja & Latensi** | Waktu Eksekusi Mesin Aturan | $< 5$ detik untuk 100 kecamatan target. |
| | Latensi Pengiriman Pesan | Pesan terkirim ke WhatsApp Poktan dalam kurun $\le 60$ detik setelah persetujuan PPL. |
| **Ketersediaan (Availability)** | Uptime Server | $\ge 99.5\%$ selama masa musim tanam (4 bulan siklus tanam). |
| **Aksesibilitas & Bandwidth** | Dasbor Web PPL | Berbobot ringan ($< 1.5\text{ MB}$ total page load), responsif pada jaringan 3G/HSPA pedesaan. |
| | Kebutuhan Perangkat Petani | Nol instalasi aplikasi khusus; hanya membutuhkan WhatsApp versi standar. |
| **Keamanan & Privasi Data** | Perlindungan Nomor Petani | Database nomor WhatsApp terenkripsi (AES-256), nama kontak tidak dipublikasikan ke pihak luar. |
| | Integritas Akses | Autentikasi berbasis peran (*Role-Based Access Control* / RBAC): Petani (Read & Reply), PPL (Review & Edit), BPP/Admin (Full Access). |

---

## 6. User Stories & Acceptance Criteria

### User Story 1: PPL Melakukan Verifikasi Peringatan Bahaya
- **Sebagai** Penyuluh Pertanian Lapangan (PPL),
- **Saya ingin** melihat ringkasan cuaca pemicu dan draf anjuran sebelum pesan disiarkan,
- **Agar** peringatan yang diterima petani relevan dengan umur tanaman di sawah dan tidak memicu kepanikan.
- **Acceptance Criteria:**
  1. Muncul notifikasi "Perlu Verifikasi: Status MERAH Kecamatan X".
  2. PPL dapat melihat grafik suhu 3 hari, kelembapan harian, dan prakiraan hujan.
  3. PPL dapat mengubah teks anjuran jika ada pestisida nabati lokal yang ingin ditambahkan.
  4. Menekan tombol `[Setujui & Siarkan]` memicu pengiriman pesan dalam $< 30$ detik.

### User Story 2: Petani Menerima Peringatan & Melakukan Respon Budidaya
- **Sebagai** Petani anggota kelompok tani,
- **Saya ingin** menerima panduan langkah nyata yang jelas saat cuaca mendukung ledakan wereng,
- **Agar** saya tahu kapan harus mengeringkan petakan sawah sebelum telur wereng menetas.
- **Acceptance Criteria:**
  1. Pesan masuk ke grup WhatsApp dengan kartu status berwarna/berteks jelas.
  2. Pesan mencantumkan instruksi kultur teknis konkret (contoh: "Keringkan sawah 3 hari, jangan disemprot racun kimia dulu").
  3. Petani memahami cara melapor balik dengan mengetik format singkat `LAPOR Sukamaju 1`.

---

## 7. Implementation Roadmap & Milestones (18 Bulan)

```
[Fase 1: Bulan 1-6] ──> Pengembangan Konektor API & Mesin Heuristik
                        • Uji coba sandbox data BMKG & Open-Meteo
                        • Integrasi bot WhatsApp sandbox
                        • Uji coba terbatas pada 2 Kelompok Tani percontohan

[Fase 2: Bulan 7-12] ─> Validasi Lapangan & Integrasi Portal PPL
                        • Peluncuran Web Dashboard Verifikasi PPL
                        • Implementasi di 10 desa sentra padi (Pilot Project)
                        • Sosialisasi SOP Respon Pengamatan Lapangan

[Fase 3: Bulan 13-18] ─> Evaluasi Dampak, Kalibrasi & Replikasi
                        • Kalibrasi ambang batas berbasis data lampu perangkap
                        • Audit efisiensi biaya usahatani
                        • Replikasi antarkabupaten bersama Dinas Pertanian Provinsi
```

---

## 8. Success Metrics & Key Performance Indicators (KPIs)

1. **Rasio Validitas Peringatan (Warning Accuracy):** $\ge 75\%$ kesesuaian antara status cuaca kondusif dengan kemunculan wereng di lapangan berdasarkan konfirmasi POPT.
2. **Tingkat Partisipasi Respon Balik Petani:** $\ge 50\%$ kelompok tani binaan mengirimkan laporan balik mingguan melalui format `LAPOR`.
3. **Pengurangan Aplikasi Insektisida Preventif:** Penurunan frekuensi semprot terjadwal dari rata-rata $6\text{--}8\text{ kali}$ menjadi $2\text{--}3\text{ kali}$ per musim tanam ($\ge 40\%$ reduksi).
4. **Efisiensi Finansial Usahatani:** Penurunan total pengeluaran pengendalian hama sebesar $50\text{--}60\%$ per hektar.
