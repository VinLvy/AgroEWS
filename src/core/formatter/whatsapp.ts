/**
 * src/core/formatter/whatsapp.ts
 * Formatter pesan sesi WhatsApp (monospace 3 backticks, maks 38 char/line).
 * Sesuai TECH_SPEC.md §8.4 dan Design_System_AgroEWS.md §5.4.
 * Pure function: bebas emoji, menggunakan simbol ASCII.
 */

import { DIVIDER_HEAVY, DIVIDER_LIGHT, wrapLine } from "./wrap";
import { getRecommendationsText, type CropPhase } from "./recommendations";

export interface MessagePayload {
  regionName: string;
  dateStr: string; // contoh: "14 Nov 2026"
  status: "amber" | "red";
  tMean: number;
  rhMean: number;
  runDays: number;
  rainPattern: string; // contoh: "Hujan berselang" atau "Hujan ringan"
  pplName: string;
  cropPhase?: CropPhase;
  customRecommendation?: string;
}

/**
 * Format status risiko menjadi label ganda.
 */
function formatStatusHeader(status: "amber" | "red"): string {
  if (status === "red") {
    return "[STATUS: MERAH - BAHAYA]";
  }
  return "[STATUS: KUNING - WASPADA]";
}

/**
 * Membentuk pesan lengkap sesi WhatsApp.
 */
export function formatWhatsAppSessionMessage(payload: MessagePayload): string {
  const {
    regionName,
    dateStr,
    status,
    tMean,
    rhMean,
    runDays,
    rainPattern,
    pplName,
    cropPhase,
    customRecommendation,
  } = payload;

  const lines: string[] = [];

  // Header identitas
  lines.push("PERINGATAN DINI AGROKLIMAT");
  lines.push("SISTEM MITIGASI HAMA WERENG COKELAT");
  lines.push(`Wilayah : ${regionName}`);
  lines.push(`Tanggal : ${dateStr}`);
  lines.push(DIVIDER_LIGHT);

  // Status ganda
  lines.push(formatStatusHeader(status));
  lines.push(DIVIDER_LIGHT);

  // Parameter Cuaca (BMKG & Open-Meteo)
  lines.push("PARAMETER CUACA (BMKG & Open-Meteo):");
  lines.push(...wrapLine(`- Suhu Rerata : ${tMean.toFixed(1)} C`));
  lines.push(...wrapLine(`- Kelembapan  : ${Math.round(rhMean)}%`));
  lines.push(...wrapLine(`- Rangkaian   : ${runDays} hari beruntun`));
  lines.push(...wrapLine(`- Pola Cuaca  : ${rainPattern}`));
  lines.push(DIVIDER_LIGHT);

  // Rekomendasi Tindakan
  const recs = getRecommendationsText({
    status,
    cropPhase,
    customText: customRecommendation,
  });

  for (const rec of recs) {
    lines.push(...wrapLine(rec));
  }
  lines.push(DIVIDER_LIGHT);

  // Ground-Truthing
  lines.push("KONFIRMASI LAPANGAN:");
  lines.push("Balas pesan ini untuk melapor sawah:");
  lines.push("Ketik: LAPOR [Nama Dusun] [Kode]");
  lines.push("[0] Aman (Wereng nihil)");
  lines.push("[1] Waspada (1-4 ekor/rumpun)");
  lines.push("[2] Bahaya (5 ekor ke atas)");
  lines.push("Contoh: LAPOR Dusun-Dua 1");
  lines.push(DIVIDER_HEAVY);

  // Footer PPL validator
  lines.push(...wrapLine(`Telah divalidasi: ${pplName}`));

  // Seluruh isi pesan dibungkus dalam blok kode backtick untuk monospace di WhatsApp
  return "```\n" + lines.join("\n") + "\n```";
}
