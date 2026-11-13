/**
 * src/core/explain.ts
 * Penerjemah explainability log ke dalam kalimat naratif Bahasa Indonesia.
 * Sesuai TECH_SPEC.md §6.4 dan PRD FR-3.2.
 * Pure function: deterministik, tanpa emoji.
 */

import type { EvaluationResult, Reason } from "./rules";

const MONTH_NAMES_ID: Record<string, string> = {
  "01": "Jan",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "Mei",
  "06": "Jun",
  "07": "Jul",
  "08": "Agu",
  "09": "Sep",
  "10": "Okt",
  "11": "Nov",
  "12": "Des",
};

/**
 * Format tanggal YYYY-MM-DD menjadi "D Mon" (contoh: "14 Nov") atau "D" jika bulan sama.
 */
export function formatShortDate(dateStr: string): string {
  const parts = dateStr.split("-");
  const day = parts[2] ? Number.parseInt(parts[2], 10).toString() : dateStr;
  const month = parts[1] ? (MONTH_NAMES_ID[parts[1]] ?? parts[1]) : "";
  return `${day} ${month}`.trim();
}

/**
 * Menghasilkan ringkasan penjelasan dalam Bahasa Indonesia dari hasil evaluasi aturan.
 */
export function explainEvaluation(result: EvaluationResult): string {
  const { status, reasons, runLength } = result;

  if (status === "red") {
    const datesFormatted = reasons
      .filter((r) => r.rule === "red")
      .map((r) => formatShortDate(r.date))
      .join(", ");

    const avgTemp =
      reasons.length > 0
        ? (reasons.reduce((acc, r) => acc + r.value, 0) / reasons.length).toFixed(1)
        : "27.0";

    return (
      `Suhu rerata ${avgTemp} C dan kelembapan tinggi memenuhi syarat MERAH (BAHAYA) ` +
      `pada ${runLength} hari berturut-turut (${datesFormatted}). Potensi ledakan populasi wereng sangat tinggi.`
    );
  }

  if (status === "amber") {
    const datesFormatted = reasons
      .filter((r) => r.rule === "amber")
      .map((r) => formatShortDate(r.date))
      .join(", ");

    const avgTemp =
      reasons.length > 0
        ? (reasons.reduce((acc, r) => acc + r.value, 0) / reasons.length).toFixed(1)
        : "26.0";

    return (
      `Suhu rerata ${avgTemp} C dan kelembapan memicu status KUNING (WASPADA) ` +
      `pada ${runLength} hari berturut-turut (${datesFormatted}). Kondisi mikroklimat mendukung penetasan telur dan nimfa wereng.`
    );
  }

  // Status Green
  const marginalReasons = reasons.filter((r) => r.rule === "marginal");
  if (marginalReasons.length > 0) {
    const datesFormatted = marginalReasons
      .map((r) => formatShortDate(r.date))
      .join(", ");
    return (
      `Status HIJAU (AMAN) dengan catatan marginal pada (${datesFormatted}). ` +
      `Suhu berada di batas toleransi namun kelembapan cukup tinggi, disarankan pemantauan rutin.`
    );
  }

  return (
    "Status HIJAU (AMAN). Kondisi agroklimat berada di luar zona optimum perkembangan " +
    "wereng batang cokelat. Lanjutkan pengamatan berkala mingguan."
  );
}

/**
 * Mengubah array reasons menjadi daftar butir penjelasan terperinci.
 */
export function explainReasonsList(reasons: Reason[]): string[] {
  return reasons.map((r) => {
    if (r.message) return r.message;
    return `[${r.rule.toUpperCase()}] ${r.date}: ${r.metric} bernilai ${r.value} (ambang: ${r.threshold})`;
  });
}
