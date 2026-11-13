/**
 * src/core/formatter/recommendations.ts
 * Template baku rekomendasi tindakan PHT per status risiko dan fase tanam.
 * Sesuai TECH_SPEC.md §7.2, §8.4 dan PRD FR-3.1, FR-4.3.
 * Pure function: bebas emoji, menggunakan simbol ASCII.
 */

export type CropPhase =
  | "bero"
  | "vegetatif_awal"
  | "vegetatif_akhir"
  | "bunting"
  | "masak_susu"
  | "menjelang_panen";

export interface RecommendationOptions {
  status: "amber" | "red";
  cropPhase?: CropPhase;
  customText?: string;
}

/**
 * Menghasilkan teks rekomendasi kultur teknis terstruktur.
 */
export function getRecommendationsText(options: RecommendationOptions): string[] {
  const { status, cropPhase, customText } = options;

  // Jika PPL memberikan koreksi teks kustom, gunakan teks PPL
  if (customText && customText.trim().length > 0) {
    return [customText.trim()];
  }

  const isLatePhase = cropPhase === "masak_susu" || cropPhase === "menjelang_panen";

  if (status === "amber") {
    const dryingStep = isLatePhase
      ? "1. Atur pengairan macak-macak secara berselang, hindari genangan air tinggi."
      : "1. Lakukan pengeringan berkala (intermittent irrigation) petakan sawah 2-3 hari.";

    return [
      "REKOMENDASI TINDAKAN:",
      dryingStep,
      "2. Tingkatkan pemantauan pangkal batang padi secara intensif pada pagi hari.",
      "3. Bersihkan gulma di pematang sawah yang menjadi inang alternatif hama.",
      "4. DILARANG KERAS menyemprot insektisida kimia preventif (jaga musuh alami).",
    ];
  }

  // Status RED
  const dryingStep = isLatePhase
    ? "2. Pertahankan kondisi sawah macak-macak dan hindari penggenangan air berlebih."
    : "2. Keringkan petakan sawah 3-4 hari untuk menekan kelembapan mikro rumpun padi.";

  return [
    "REKOMENDASI TINDAKAN DARURAT:",
    "1. Lakukan pengamatan serempak pada pangkal batang padi seluruh anggota poktan.",
    dryingStep,
    "3. Jika populasi wereng >= 5 ekor/rumpun pada fase vegetatif, segera laporkan ke POPT dan aplikasikan agens hayati Beauveria bassiana.",
    "4. JANGAN gunakan insektisida piretroid sintetis yang memicu resurgensi hama.",
  ];
}
