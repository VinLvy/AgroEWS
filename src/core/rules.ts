/**
 * src/core/rules.ts
 * Mesin Aturan Heuristik Risiko Wereng Batang Cokelat (WBC).
 * Sesuai TECH_SPEC.md §6 dan PRD FR-3.1, FR-3.2, Resolusi R-4, Asumsi A-03.
 * Pure functions: deterministik, tanpa I/O, tanpa hardcode ambang batas.
 */

import type { DailyFeature } from "./features";
export type { DailyFeature };

export interface Thresholds {
  window: {
    pastDays: number;
    forecastDays: number;
  };
  green: {
    tBelow: number;
    tAbove: number;
    rhBelow: number;
  };
  amber: {
    tMin: number;
    tMax: number;
    rhMin: number;
    minConsecutiveDays: number;
    rainMinMm: number;
    rainMaxMm: number;
    requireRain: boolean;
  };
  red: {
    tMin: number;
    tMax: number;
    rhGt: number;
    minConsecutiveDays: number;
  };
}

export type RiskStatus = "green" | "amber" | "red";

export interface Reason {
  rule: "red" | "amber" | "green" | "marginal";
  date: string;
  metric: string;
  value: number;
  threshold: number | string;
  passed: boolean;
  message?: string;
}

export interface EvaluationResult {
  status: RiskStatus;
  reasons: Reason[];
  runLength: number;
  evaluatedDates: string[];
}

/**
 * Memeriksa apakah suatu hari memenuhi kriteria hari MERAH (Suhu optimum & RH tinggi).
 */
export function isRedDay(d: DailyFeature, t: Thresholds["red"]): boolean {
  return d.tMean >= t.tMin && d.tMean <= t.tMax && d.rhMean > t.rhGt;
}

/**
 * Memeriksa apakah suatu hari memenuhi kriteria hari KUNING (Waspada).
 * Menutup celah R-4 (mencakup RH > 80 jika suhu tidak memenuhi MERAH atau belum membentuk rangkaian).
 */
export function isAmberDay(d: DailyFeature, t: Thresholds["amber"]): boolean {
  const tempOk = d.tMean >= t.tMin && d.tMean <= t.tMax;
  const rhOk = d.rhMean >= t.rhMin;

  if (t.requireRain) {
    const rainOk = d.precipMm >= t.rainMinMm && d.precipMm <= t.rainMaxMm;
    return tempOk && rhOk && rainOk;
  }

  return tempOk && rhOk;
}

/**
 * Memeriksa apakah suatu hari berada pada zona marginal (Asumsi A-03):
 * RH >= 70% dan Suhu di zona marginal (22 <= T < 24 atau 29 < T <= 32).
 */
export function isMarginalDay(
  d: DailyFeature,
  tGreen: Thresholds["green"],
  tAmber: Thresholds["amber"]
): boolean {
  const rhMarginal = d.rhMean >= tAmber.rhMin;
  const tempLowerMarginal = d.tMean >= tGreen.tBelow && d.tMean < tAmber.tMin;
  const tempUpperMarginal = d.tMean > tAmber.tMax && d.tMean <= tGreen.tAbove;

  return rhMarginal && (tempLowerMarginal || tempUpperMarginal);
}

/**
 * Mencari rangkaian hari berurutan terpanjang yang memenuhi predikat
 * DAN beririsan dengan jendela relevan [today, today + forecastDays].
 * Rangkaian yang murni berada di masa lalu (< today) diabaikan.
 */
function findLongestIntersectingRun(
  days: DailyFeature[],
  predicate: (d: DailyFeature) => boolean,
  today: string,
  endDate: string
): { maxRun: number; runDays: DailyFeature[] } {
  let currentRun: DailyFeature[] = [];
  let maxRun = 0;
  let bestRunDays: DailyFeature[] = [];

  for (const d of days) {
    if (predicate(d)) {
      currentRun.push(d);
    } else {
      if (currentRun.length > 0) {
        // Cek apakah rangkaian ini beririsan dengan [today, endDate]
        const intersects = currentRun.some(
          (item) => item.date >= today && item.date <= endDate
        );
        if (intersects && currentRun.length > maxRun) {
          maxRun = currentRun.length;
          bestRunDays = [...currentRun];
        }
        currentRun = [];
      }
    }
  }

  // Cek jika rangkaian berakhir di akhir array
  if (currentRun.length > 0) {
    const intersects = currentRun.some(
      (item) => item.date >= today && item.date <= endDate
    );
    if (intersects && currentRun.length > maxRun) {
      maxRun = currentRun.length;
      bestRunDays = [...currentRun];
    }
  }

  return { maxRun, runDays: bestRunDays };
}

/**
 * Menghitung tanggal YYYY-MM-DD ditambah / dikurang N hari secara deterministik.
 */
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Evaluasi Risiko Agroklimat WBC.
 * Urutan evaluasi wajib:
 * 1. Bila longestRun(redDay) >= red.minConsecutiveDays => RED
 * 2. Else bila longestRun(amberDay) >= amber.minConsecutiveDays => AMBER
 * 3. Else => GREEN (dengan deteksi reason marginal jika relevan)
 */
export function evaluate(
  days: DailyFeature[],
  t: Thresholds,
  today: string
): EvaluationResult {
  // 1. Urutkan days secara kronologis berdasarkan tanggal
  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));

  // 2. Filter hari yang masuk dalam jendela W = [today - pastDays, today + forecastDays]
  const startDate = addDays(today, -t.window.pastDays);
  const endDate = addDays(today, t.window.forecastDays);

  const windowDays = sortedDays.filter(
    (d) => d.date >= startDate && d.date <= endDate
  );

  const evaluatedDates = windowDays.map((d) => d.date);
  const reasons: Reason[] = [];

  // 3. Evaluasi status MERAH
  const redRun = findLongestIntersectingRun(
    windowDays,
    (d) => isRedDay(d, t.red),
    today,
    endDate
  );

  if (redRun.maxRun >= t.red.minConsecutiveDays) {
    for (const d of redRun.runDays) {
      reasons.push({
        rule: "red",
        date: d.date,
        metric: "T & RH",
        value: d.tMean,
        threshold: `${t.red.tMin}-${t.red.tMax} C & RH > ${t.red.rhGt}%`,
        passed: true,
        message: `Suhu ${d.tMean} C dan RH ${d.rhMean}% memenuhi ambang ledakan wereng status MERAH`,
      });
    }

    return {
      status: "red",
      reasons,
      runLength: redRun.maxRun,
      evaluatedDates,
    };
  }

  // 4. Evaluasi status KUNING
  const amberRun = findLongestIntersectingRun(
    windowDays,
    (d) => isAmberDay(d, t.amber),
    today,
    endDate
  );

  if (amberRun.maxRun >= t.amber.minConsecutiveDays) {
    for (const d of amberRun.runDays) {
      reasons.push({
        rule: "amber",
        date: d.date,
        metric: "T & RH",
        value: d.tMean,
        threshold: `${t.amber.tMin}-${t.amber.tMax} C & RH >= ${t.amber.rhMin}%`,
        passed: true,
        message: `Suhu ${d.tMean} C dan RH ${d.rhMean}% mendukung perkembangan nimfa status KUNING`,
      });
    }

    return {
      status: "amber",
      reasons,
      runLength: amberRun.maxRun,
      evaluatedDates,
    };
  }

  // 5. Status HIJAU (Aman)
  // Cek apakah terdapat hari marginal pada jendela [today, endDate]
  const marginalDays = windowDays.filter(
    (d) =>
      d.date >= today &&
      d.date <= endDate &&
      isMarginalDay(d, t.green, t.amber)
  );

  if (marginalDays.length > 0) {
    for (const d of marginalDays) {
      reasons.push({
        rule: "marginal",
        date: d.date,
        metric: "T & RH",
        value: d.tMean,
        threshold: `Zona marginal (T 22-24 atau 29-32 C dengan RH >= ${t.amber.rhMin}%)`,
        passed: true,
        message: `Kondisi marginal terdeteksi pada ${d.date} (Suhu ${d.tMean} C, RH ${d.rhMean}%)`,
      });
    }
  } else {
    reasons.push({
      rule: "green",
      date: today,
      metric: "T & RH",
      value: windowDays[0]?.tMean ?? 0,
      threshold: `T < ${t.green.tBelow} C / T > ${t.green.tAbove} C / RH < ${t.green.rhBelow}%`,
      passed: true,
      message: "Kondisi agroklimat berada di luar zona optimum perkembangan wereng batang cokelat",
    });
  }

  return {
    status: "green",
    reasons,
    runLength: 0,
    evaluatedDates,
  };
}
