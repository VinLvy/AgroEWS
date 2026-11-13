/**
 * src/core/formatter/wrap.ts
 * Utilitas pembungkusan teks (word-wrap) dengan lebar maksimum 38 karakter.
 * Sesuai TECH_SPEC.md §8.4 dan Design_System_AgroEWS.md §5.4.
 * Pure function: deterministik, tanpa emoji.
 */

export const MAX_LINE_WIDTH = 38;
export const DIVIDER_HEAVY = "=".repeat(MAX_LINE_WIDTH);
export const DIVIDER_LIGHT = "-".repeat(MAX_LINE_WIDTH);

/**
 * Membungkus satu baris teks panjang menjadi beberapa baris dengan lebar maksimal 38 karakter.
 * Baris lanjutan diberikan indentasi 3 spasi.
 */
export function wrapLine(line: string, maxWidth = MAX_LINE_WIDTH, indent = "   "): string[] {
  if (line.length <= maxWidth) {
    return [line];
  }

  const words = line.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine) {
      if (word.length <= maxWidth) {
        currentLine = word;
      } else {
        // Kata tunggal lebih panjang dari maxWidth, potong paksa
        let remaining = word;
        while (remaining.length > maxWidth) {
          lines.push(remaining.slice(0, maxWidth));
          remaining = indent + remaining.slice(maxWidth);
        }
        currentLine = remaining;
      }
    } else {
      const prospective = `${currentLine} ${word}`;
      if (prospective.length <= maxWidth) {
        currentLine = prospective;
      } else {
        lines.push(currentLine);
        // Baris baru dimulai dengan indentasi lanjutan jika bukan baris pertama
        currentLine = `${indent}${word}`;
        if (currentLine.length > maxWidth) {
          lines.push(currentLine.slice(0, maxWidth));
          currentLine = `${indent}${currentLine.slice(maxWidth)}`;
        }
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Membungkus seluruh teks paragraf multi-baris agar tidak ada baris yang melebihi maxWidth.
 */
export function wrapText(text: string, maxWidth = MAX_LINE_WIDTH): string {
  const originalLines = text.split("\n");
  const wrappedLines: string[] = [];

  for (const line of originalLines) {
    // Jika baris adalah pembatas atau baris kosong, biarkan apa adanya
    if (line.trim() === "" || line === DIVIDER_HEAVY || line === DIVIDER_LIGHT) {
      wrappedLines.push(line);
    } else {
      wrappedLines.push(...wrapLine(line, maxWidth));
    }
  }

  return wrappedLines.join("\n");
}
