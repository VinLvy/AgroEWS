/**
 * src/core/formatter/telegram.ts
 * Formatter pesan siaran Telegram menggunakan HTML <pre> untuk font monospace.
 * Sesuai TECH_SPEC.md §8.5.
 * Pure function: bebas emoji, menggunakan simbol ASCII.
 */

import { formatWhatsAppSessionMessage, type MessagePayload } from "./whatsapp";

/**
 * Format pesan siaran untuk Telegram.
 * Menggunakan konten yang sama persis dengan WhatsApp namun dibungkus tag HTML <pre>.
 */
export function formatTelegramMessage(payload: MessagePayload): string {
  // Ambil pesan terformat tanpa backtick ```
  const rawMessage = formatWhatsAppSessionMessage(payload);
  const cleanBody = rawMessage.replace(/^```\n/, "").replace(/\n```$/, "");

  // Ganti instruksi balasan untuk mendukung perintah /lapor Telegram
  const telegramBody = cleanBody.replace(
    "Ketik: LAPOR [Nama Dusun] [Kode]",
    "Kirim: /lapor [Nama Dusun] [Kode]"
  );

  return `<pre>${telegramBody}</pre>`;
}
