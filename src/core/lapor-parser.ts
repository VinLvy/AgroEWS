/**
 * src/core/lapor-parser.ts
 * Parser format laporan balik petani (Ground-Truthing).
 * Format baku: LAPOR [Nama Dusun] [0|1|2]
 * Sesuai TECH_SPEC.md §8.6 dan PRD FR-5.3.
 * Pure function: aman terhadap input tak terduga (no throw), tanpa emoji.
 */

export type LaporCode = 0 | 1 | 2;

export interface LaporSuccess {
  success: true;
  dusunLabel: string;
  dusunNorm: string;
  code: LaporCode;
}

export interface LaporError {
  success: false;
  error: "format" | "kode";
  message: string;
}

export type LaporParseResult = LaporSuccess | LaporError;

const NUMBER_WORD_MAP: Record<string, string> = {
  satu: "1",
  dua: "2",
  tiga: "3",
  empat: "4",
  lima: "5",
  enam: "6",
  tujuh: "7",
  delapan: "8",
  sembilan: "9",
  sepuluh: "10",
  i: "1",
  ii: "2",
  iii: "3",
  iv: "4",
  v: "5",
  vi: "6",
  vii: "7",
  viii: "8",
  ix: "9",
  x: "10",
};

/**
 * Menormalkan nama dusun:
 * - lowercase
 * - ganti tanda minus (-) dan underscore (_) dengan spasi
 * - buang kata awalan/akhiran "dusun" atau "dsn"
 * - petakan kata angka ("satu" - "enam") dan romawi ("i" - "vi") ke digit angka
 * - kompres spasi berlebih
 */
export function normalizeDusun(rawDusun: string): string {
  let text = rawDusun.toLowerCase().trim();

  // Ganti tanda baca umum pemisah dengan spasi
  text = text.replace(/[-_./]/g, " ");

  // Hapus karakter emoji atau simbol asing yang mungkin dikirim user
  text = text.replace(/\p{Extended_Pictographic}/gu, "");

  // Buang kata "dusun" atau "dsn"
  text = text.replace(/\b(dusun|dsn)\b/g, " ");

  // Pecah per kata dan petakan kata angka / romawi
  const tokens = text
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .map((token) => NUMBER_WORD_MAP[token] ?? token);

  return tokens.join(" ").trim();
}

/**
 * Parsing teks pesan masuk petani dengan pola:
 * LAPOR <Nama Dusun> <Kode 0|1|2>
 *
 * Contoh valid:
 * - "LAPOR Dusun Dua 1"
 * - "lapor sukamaju 0"
 * - "Lapor Dsn II 2"
 * - "LAPOR Dusun-Tiga 0"
 */
export function parseLaporMessage(rawMessage: string | null | undefined): LaporParseResult {
  if (!rawMessage || typeof rawMessage !== "string") {
    return {
      success: false,
      error: "format",
      message: "Pesan kosong. Format benar: LAPOR [Nama Dusun] [0/1/2]",
    };
  }

  // Bersihkan spasi di awal/akhir dan rapikan spasi berlebih
  const trimmed = rawMessage.trim().replace(/\s+/g, " ");

  // Cek apakah pesan diawali kata kunci LAPOR (case-insensitive)
  if (!/^LAPOR\b/i.test(trimmed)) {
    return {
      success: false,
      error: "format",
      message: "Format tidak dikenal. Harap awali laporan dengan kata 'LAPOR'. Contoh: LAPOR Dusun-Dua 1",
    };
  }

  // Regex utama: tangkap dusun dan bagian akhir (kode)
  const match = trimmed.match(/^LAPOR\s+(.+?)\s+(\S+)$/i);

  if (!match) {
    return {
      success: false,
      error: "format",
      message: "Format kurang lengkap. Format yang benar: LAPOR [Nama Dusun] [0/1/2]. Contoh: LAPOR Sukamaju 1",
    };
  }

  const rawDusunPart = match[1]?.trim() ?? "";
  const codePart = match[2]?.trim() ?? "";

  // Validasi kode status
  if (!/^[012]$/.test(codePart)) {
    return {
      success: false,
      error: "kode",
      message:
        "Kode status salah. Pilihan kode status:\n" +
        "[0] Aman (Wereng nihil)\n" +
        "[1] Waspada (1-4 ekor/rumpun)\n" +
        "[2] Bahaya (5 ekor ke atas, butuh POPT)",
    };
  }

  const code = Number.parseInt(codePart, 10) as LaporCode;
  const dusunNorm = normalizeDusun(rawDusunPart);

  if (!dusunNorm) {
    return {
      success: false,
      error: "format",
      message: "Nama dusun tidak boleh kosong. Contoh: LAPOR Dusun-Dua 1",
    };
  }

  return {
    success: true,
    dusunLabel: rawDusunPart,
    dusunNorm,
    code,
  };
}
