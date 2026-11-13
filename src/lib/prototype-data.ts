/**
 * src/lib/prototype-data.ts
 * Dataset dummy terpusat untuk mode prototipe AgroEWS.
 * Memungkinkan pengujian interaktif antarmuka tanpa dependensi API eksternal.
 * Bebas emoji, mengikuti kamus istilah dan standar token sistem.
 */

export interface PrototypeContact {
  id: string;
  name: string;
  phone: string;
  phoneMasked: string;
  poktan: string;
  dusun: string;
  channel: "whatsapp" | "telegram";
  optInDate: string;
  status: "active" | "opt-out";
}

export interface PrototypeFarmerReport {
  id: string;
  time: string;
  farmerName: string;
  poktan: string;
  dusun: string;
  rawMessage: string;
  code: 0 | 1 | 2;
  statusLabel: string;
  isVerified: boolean;
  isPoptScheduled: boolean;
  poptVisitDate?: string;
  poptNotes?: string;
}

export interface PrototypeWeatherDay {
  day: string;
  date: string;
  tMean: number;
  rhMean: number;
  precipMm: number;
  condition: string;
}

export interface PrototypeRegion {
  id: string;
  name: string;
  code: string;
  level: string;
  status: "red" | "amber" | "green";
  tMean: number;
  rhMean: number;
  precipMm: number;
  poktanCount: number;
  farmerCount: number;
  weatherTrend: PrototypeWeatherDay[];
}

export interface PrototypeRuleVersion {
  version: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  author: string;
  params: {
    tOptimumMin: number;
    tOptimumMax: number;
    rhRedThreshold: number;
    rhAmberThreshold: number;
    redRunDays: number;
    amberRunDays: number;
  };
}

// 1. DATA KONTAK PETANI
export const INITIAL_CONTACTS: PrototypeContact[] = [
  {
    id: "c-001",
    name: "Pak Subur Hartono",
    phone: "+6281234567801",
    phoneMasked: "+62 812-****-7801",
    poktan: "Poktan Makmur",
    dusun: "Dusun II",
    channel: "whatsapp",
    optInDate: "2026-08-10",
    status: "active",
  },
  {
    id: "c-002",
    name: "Pak Syamsul Arifin",
    phone: "+6281234567802",
    phoneMasked: "+62 812-****-7802",
    poktan: "Poktan Sejahtera",
    dusun: "Dusun I",
    channel: "whatsapp",
    optInDate: "2026-08-12",
    status: "active",
  },
  {
    id: "c-003",
    name: "Pak Rahman Hakim",
    phone: "+6281234567803",
    phoneMasked: "+62 812-****-7803",
    poktan: "Poktan Tani Jaya",
    dusun: "Dusun IV",
    channel: "whatsapp",
    optInDate: "2026-08-15",
    status: "active",
  },
  {
    id: "c-004",
    name: "Ibu Maryati",
    phone: "+6281234567804",
    phoneMasked: "+62 812-****-7804",
    poktan: "Poktan Makmur",
    dusun: "Dusun II",
    channel: "telegram",
    optInDate: "2026-08-18",
    status: "active",
  },
  {
    id: "c-005",
    name: "Pak Bambang Sutejo",
    phone: "+6281234567805",
    phoneMasked: "+62 812-****-7805",
    poktan: "Poktan Subur Jaya",
    dusun: "Dusun III",
    channel: "whatsapp",
    optInDate: "2026-09-01",
    status: "active",
  },
  {
    id: "c-006",
    name: "Pak Joko Waluyo",
    phone: "+6281234567806",
    phoneMasked: "+62 812-****-7806",
    poktan: "Poktan Sumber Rejeki",
    dusun: "Dusun I",
    channel: "whatsapp",
    optInDate: "2026-09-05",
    status: "opt-out",
  },
];

// 2. DATA FEED GROUND-TRUTHING (Design 5.5)
export const INITIAL_REPORTS: PrototypeFarmerReport[] = [
  {
    id: "rep-001",
    time: "09:05 WIB",
    farmerName: "Pak Rahman Hakim",
    poktan: "Poktan Tani Jaya",
    dusun: "Dusun IV",
    rawMessage: "LAPOR Dusun-4 2",
    code: 2,
    statusLabel: "Bahaya (>=5 ekor/rumpun)",
    isVerified: false,
    isPoptScheduled: true,
    poptVisitDate: "2026-11-15",
    poptNotes: "Ditemukan koloni nimfa instar 2-3 pada rumpun bawah.",
  },
  {
    id: "rep-002",
    time: "08:32 WIB",
    farmerName: "Pak Syamsul Arifin",
    poktan: "Poktan Sejahtera",
    dusun: "Dusun I",
    rawMessage: "LAPOR Dusun-1 0",
    code: 0,
    statusLabel: "Aman (0 ekor)",
    isVerified: true,
    isPoptScheduled: false,
  },
  {
    id: "rep-003",
    time: "08:14 WIB",
    farmerName: "Pak Subur Hartono",
    poktan: "Poktan Makmur",
    dusun: "Dusun II",
    rawMessage: "LAPOR Dusun-2 1",
    code: 1,
    statusLabel: "Waspada (1-4 ekor/rumpun)",
    isVerified: true,
    isPoptScheduled: false,
  },
  {
    id: "rep-004",
    time: "07:50 WIB",
    farmerName: "Ibu Maryati",
    poktan: "Poktan Makmur",
    dusun: "Dusun II",
    rawMessage: "LAPOR Dusun-2 1",
    code: 1,
    statusLabel: "Waspada (1-4 ekor/rumpun)",
    isVerified: false,
    isPoptScheduled: false,
  },
  {
    id: "rep-005",
    time: "07:22 WIB",
    farmerName: "Pak Bambang Sutejo",
    poktan: "Poktan Subur Jaya",
    dusun: "Dusun III",
    rawMessage: "LAPOR Dusun-3 2",
    code: 2,
    statusLabel: "Bahaya (>=5 ekor/rumpun)",
    isVerified: false,
    isPoptScheduled: false,
  },
];

// 3. DATA DETAIL WILAYAH PILOT
export const PILOT_REGION: PrototypeRegion = {
  id: "22222222-2222-4222-8222-222222222201",
  name: "Nagari Sungai Bangek",
  code: "13.71.05.2001",
  level: "kelurahan",
  status: "red",
  tMean: 27.2,
  rhMean: 86.5,
  precipMm: 3.8,
  poktanCount: 6,
  farmerCount: 142,
  weatherTrend: [
    { day: "Sen", date: "10 Nov", tMean: 26.5, rhMean: 83.2, precipMm: 0.0, condition: "Cerah Berawan" },
    { day: "Sel", date: "11 Nov", tMean: 26.8, rhMean: 84.5, precipMm: 1.2, condition: "Berawan" },
    { day: "Rab", date: "12 Nov", tMean: 27.0, rhMean: 85.0, precipMm: 2.4, condition: "Hujan Ringan" },
    { day: "Kam", date: "13 Nov", tMean: 27.1, rhMean: 85.8, precipMm: 3.5, condition: "Hujan Sedang" },
    { day: "Jum", date: "14 Nov", tMean: 27.2, rhMean: 86.5, precipMm: 3.8, condition: "Hujan Lembap" },
    { day: "Sab", date: "15 Nov", tMean: 27.4, rhMean: 87.0, precipMm: 4.2, condition: "Hujan Sedang (Prediksi)" },
    { day: "Min", date: "16 Nov", tMean: 27.1, rhMean: 86.0, precipMm: 2.1, condition: "Berawan (Prediksi)" },
  ],
};

// 4. DATA KOORDINATOR BPP
export const BPP_SUMMARY = {
  kecamatanName: "Kecamatan Kuranji",
  kabupatenName: "Kota Padang, Sumatera Barat",
  lastEvaluation: "14 November 2026, 06:00 WIB",
  kpi: {
    participationRate: 78.4,
    participationTarget: 60.0,
    accuracyRate: 86.2,
    totalFarmers: 248,
    activePoktan: 12,
    openAlerts: 1,
  },
  villages: [
    {
      id: "vil-01",
      name: "Nagari Sungai Bangek",
      status: "red" as const,
      tMean: 27.2,
      rhMean: 86.5,
      reportsCount: 5,
      severeReportsCount: 2,
      lastDraftStatus: "Menunggu Persetujuan",
    },
    {
      id: "vil-02",
      name: "Kelurahan Balai Gadang",
      status: "amber" as const,
      tMean: 26.6,
      rhMean: 82.3,
      reportsCount: 3,
      severeReportsCount: 0,
      lastDraftStatus: "Disiarkan",
    },
    {
      id: "vil-03",
      name: "Kelurahan Kuranji Timur",
      status: "green" as const,
      tMean: 25.8,
      rhMean: 74.5,
      reportsCount: 2,
      severeReportsCount: 0,
      lastDraftStatus: "Aman (Tanpa Draf)",
    },
    {
      id: "vil-04",
      name: "Kelurahan Gunung Sarik",
      status: "green" as const,
      tMean: 26.0,
      rhMean: 76.1,
      reportsCount: 1,
      severeReportsCount: 0,
      lastDraftStatus: "Aman (Tanpa Draf)",
    },
  ],
};

// 5. DATA ATURAN RISIKO (Rule Engine v1)
export const INITIAL_RULE_VERSIONS: PrototypeRuleVersion[] = [
  {
    version: "v1.0.0",
    title: "Aturan Standar Agroklimat WBC (Baehaki & Balitpa)",
    isActive: true,
    createdAt: "2026-08-01",
    author: "Tim Pakar Proteksi Tanaman",
    params: {
      tOptimumMin: 25.0,
      tOptimumMax: 29.0,
      rhRedThreshold: 85.0,
      rhAmberThreshold: 80.0,
      redRunDays: 3,
      amberRunDays: 2,
    },
  },
  {
    version: "v0.9.2",
    title: "Kalibrasi Pra-Musim Tanam Gadu 2026",
    isActive: false,
    createdAt: "2026-05-15",
    author: "Tim Riset BRIN",
    params: {
      tOptimumMin: 24.5,
      tOptimumMax: 29.5,
      rhRedThreshold: 86.0,
      rhAmberThreshold: 82.0,
      redRunDays: 4,
      amberRunDays: 3,
    },
  },
];
