import crypto from "node:crypto";
import { env } from "../env";

/**
 * Normalisasi nomor telepon ke format E.164 standar sebelum dibuat blind index.
 * Contoh: "08123456789" -> "+628123456789"
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `+62${digits.slice(1)}`;
  }
  if (digits.startsWith("62")) {
    return `+${digits}`;
  }
  if (phone.startsWith("+")) {
    return `+${digits}`;
  }
  return `+62${digits}`;
}

/**
 * Blind index menggunakan HMAC-SHA256 untuk lookup nomor telepon tanpa membocorkan plaintext.
 */
export function generateBlindIndex(value: string): Buffer {
  const hmacKey = Buffer.from(env.PII_HMAC_KEY, "hex");
  if (hmacKey.length !== 32) {
    throw new Error("PII_HMAC_KEY harus tepat 32 bytes (64 karakter hex)");
  }

  const normalized = normalizePhone(value);
  return crypto.createHmac("sha256", hmacKey).update(normalized).digest();
}
