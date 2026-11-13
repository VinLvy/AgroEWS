/**
 * src/components/agro/speak-number.ts
 * Helper konversi angka ke kata Bahasa Indonesia untuk pembaca layar (screen reader aria-label).
 * Sesuai TECH_SPEC.md §12.3 dan Design_System_AgroEWS.md §1.
 */

const DIGIT_WORDS: Record<string, string> = {
  "0": "nol",
  "1": "satu",
  "2": "dua",
  "3": "tiga",
  "4": "empat",
  "5": "lima",
  "6": "enam",
  "7": "tujuh",
  "8": "delapan",
  "9": "sembilan",
};

/**
 * Mengonversi angka 0-99 ke kata Bahasa Indonesia.
 */
function smallNumberToWords(n: number): string {
  if (n < 0 || n > 99) return n.toString();
  if (n <= 9) return DIGIT_WORDS[n.toString()] ?? n.toString();
  if (n === 10) return "sepuluh";
  if (n === 11) return "sebelas";
  if (n <= 19) return `${DIGIT_WORDS[(n - 10).toString()]} belas`;

  const tens = Math.floor(n / 10);
  const ones = n % 10;
  if (ones === 0) return `${DIGIT_WORDS[tens.toString()]} puluh`;
  return `${DIGIT_WORDS[tens.toString()]} puluh ${DIGIT_WORDS[ones.toString()]}`;
}

/**
 * Mengonversi angka desimal ke narasi suara Indonesia beserta satuan.
 * Contoh: speakNumber(27.4, "derajat celsius") -> "dua puluh tujuh koma empat derajat celsius"
 */
export function speakNumber(value: number, unit?: string): string {
  const parts = value.toFixed(1).split(".");
  const integerPart = Number.parseInt(parts[0] ?? "0", 10);
  const decimalPart = parts[1] ?? "";

  const intWord = smallNumberToWords(integerPart);
  const decWord = decimalPart && decimalPart !== "0"
    ? `koma ${DIGIT_WORDS[decimalPart] ?? decimalPart}`
    : "";

  const fullText = `${intWord} ${decWord}`.trim();
  return unit ? `${fullText} ${unit}`.trim() : fullText;
}
