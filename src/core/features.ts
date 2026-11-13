/**
 * src/core/features.ts
 * Feature engineering biometeorologi untuk deteksi risiko wereng batang cokelat (WBC).
 * Sesuai TECH_SPEC.md §5.4 dan PRD FR-2.1, FR-2.2, FR-2.3.
 * Pure functions: deterministik, tanpa I/O, tanpa dependensi framework.
 */

export interface HourlyReading {
  time: string; // ISO 8601 string atau YYYY-MM-DDTHH:mm
  temperature2m: number;
  relativeHumidity2m: number;
  precipitation?: number;
}

export interface DailyReading {
  date: string; // YYYY-MM-DD
  temperature2mMean?: number | null;
  temperature2mMax?: number | null;
  temperature2mMin?: number | null;
  precipitationSum?: number | null;
}

export interface DailyFeature {
  date: string; // YYYY-MM-DD
  tMean: number;
  tMax: number;
  tMin: number;
  rhMean: number;
  rhHoursGe80: number;
  precipMm: number;
  isForecast: boolean;
  ma3T: number;
  ma3RH: number;
  intermittentRain: boolean;
}

/**
 * Ekstrak tanggal YYYY-MM-DD dari string waktu lokal atau ISO.
 */
function extractLocalDate(timeStr: string): string {
  return timeStr.slice(0, 10);
}

/**
 * Membulatkan angka ke 1 desimal.
 */
export function round1(num: number): number {
  return Math.round(num * 10) / 10;
}

/**
 * Menghitung fitur harian biometeorologi dari pembacaan hourly dan daily.
 *
 * @param hourly Data pembacaan per jam
 * @param daily Data ringkasan harian
 * @param today Tanggal referensi hari ini (format YYYY-MM-DD)
 */
export function calculateDailyFeatures(
  hourly: HourlyReading[],
  daily: DailyReading[],
  today: string
): DailyFeature[] {
  // 1. Kelompokkan data per jam berdasarkan tanggal lokal
  const hourlyByDate = new Map<string, HourlyReading[]>();
  for (const h of hourly) {
    const d = extractLocalDate(h.time);
    const existing = hourlyByDate.get(d) ?? [];
    existing.push(h);
    hourlyByDate.set(d, existing);
  }

  // 2. Petakan daily summary berdasarkan tanggal
  const dailyByDate = new Map<string, DailyReading>();
  for (const d of daily) {
    dailyByDate.set(d.date, d);
  }

  // Gabungkan semua tanggal unik yang ditemukan dan urutkan secara kronologis
  const allDates = Array.from(
    new Set([...hourlyByDate.keys(), ...dailyByDate.keys()])
  ).sort();

  const intermediateFeatures: Omit<
    DailyFeature,
    "ma3T" | "ma3RH" | "intermittentRain"
  >[] = [];

  for (const date of allDates) {
    const hours = hourlyByDate.get(date) ?? [];
    const dSummary = dailyByDate.get(date);

    // Hitung tMean, tMax, tMin
    let tMean: number;
    let tMax: number;
    let tMin: number;

    if (
      dSummary?.temperature2mMean != null &&
      !Number.isNaN(dSummary.temperature2mMean)
    ) {
      tMean = dSummary.temperature2mMean;
      tMax = dSummary.temperature2mMax ?? tMean;
      tMin = dSummary.temperature2mMin ?? tMean;
    } else if (hours.length > 0) {
      const temps = hours.map((h) => h.temperature2m);
      tMean = temps.reduce((acc, v) => acc + v, 0) / temps.length;
      tMax = Math.max(...temps);
      tMin = Math.min(...temps);
    } else {
      tMean = 0;
      tMax = 0;
      tMin = 0;
    }

    // Hitung rhMean dan rhHoursGe80
    let rhMean = 0;
    let rhHoursGe80 = 0;
    if (hours.length > 0) {
      const rhVals = hours.map((h) => h.relativeHumidity2m);
      rhMean = rhVals.reduce((acc, v) => acc + v, 0) / rhVals.length;
      rhHoursGe80 = rhVals.filter((v) => v >= 80).length;
    }

    // Hitung precipMm
    let precipMm = 0;
    if (
      dSummary?.precipitationSum != null &&
      !Number.isNaN(dSummary.precipitationSum)
    ) {
      precipMm = dSummary.precipitationSum;
    } else if (hours.length > 0) {
      precipMm = hours.reduce((acc, h) => acc + (h.precipitation ?? 0), 0);
    }

    const isForecast = date > today;

    intermediateFeatures.push({
      date,
      tMean: round1(tMean),
      tMax: round1(tMax),
      tMin: round1(tMin),
      rhMean: round1(rhMean),
      rhHoursGe80,
      precipMm: round1(precipMm),
      isForecast,
    });
  }

  // 3. Hitung moving average 3 hari dan intermittentRain
  // intermittentRain (FR-2.3): true bila terdapat >= 1 hari hujan ringan (1 sampai 5 mm)
  // dalam 3 hari dan tidak semua 3 hari hujan > 5 mm, dengan tMean 25 sampai 29 pada hari-hari tersebut.
  const result: DailyFeature[] = [];

  for (let i = 0; i < intermediateFeatures.length; i++) {
    const current = intermediateFeatures[i];
    if (!current) continue;

    // Jendela 3 hari: [i - 2, i - 1, i] (atau sebanyak hari yang tersedia)
    const windowStart = Math.max(0, i - 2);
    const windowDays = intermediateFeatures.slice(windowStart, i + 1);

    const ma3T =
      windowDays.reduce((acc, d) => acc + d.tMean, 0) / windowDays.length;
    const ma3RH =
      windowDays.reduce((acc, d) => acc + d.rhMean, 0) / windowDays.length;

    // Cek kondisi intermittentRain
    let intermittentRain = false;
    if (windowDays.length === 3) {
      const hasLightRain = windowDays.some(
        (d) => d.precipMm >= 1 && d.precipMm <= 5
      );
      const allHeavyRain = windowDays.every((d) => d.precipMm > 5);
      const allOptimumTemp = windowDays.every(
        (d) => d.tMean >= 25 && d.tMean <= 29
      );

      intermittentRain = hasLightRain && !allHeavyRain && allOptimumTemp;
    }

    result.push({
      ...current,
      ma3T: round1(ma3T),
      ma3RH: round1(ma3RH),
      intermittentRain,
    });
  }

  return result;
}
