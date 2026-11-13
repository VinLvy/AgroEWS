import { describe, expect, it } from "vitest";
import { decryptField, encryptField } from "@/server/crypto/aes";
import { generateBlindIndex, normalizePhone } from "@/server/crypto/blind-index";

describe("T1.8 / Crypto Module: AES-256-GCM & HMAC-SHA256 Blind Index", () => {
  it("melakukan enkripsi dan dekripsi round-trip dengan benar", () => {
    const secretText = "+6281234567890";
    const encrypted = encryptField(secretText);
    expect(Buffer.isBuffer(encrypted)).toBe(true);
    expect(encrypted.length).toBeGreaterThan(secretText.length);

    const decrypted = decryptField(encrypted);
    expect(decrypted).toBe(secretText);
  });

  it("menghasilkan IV unik untuk setiap enkripsi teks yang sama", () => {
    const text = "+6281299998888";
    const enc1 = encryptField(text);
    const enc2 = encryptField(text);

    // Byte 1 sampai keyIdLen adalah keyId, setelahnya 12 byte adalah IV
    expect(enc1.equals(enc2)).toBe(false);

    expect(decryptField(enc1)).toBe(text);
    expect(decryptField(enc2)).toBe(text);
  });

  it("menghasilkan blind index HMAC-SHA256 yang deterministik", () => {
    const phoneRaw1 = "0812-3456-7890";
    const phoneRaw2 = "+62 812 3456 7890";

    const hash1 = generateBlindIndex(phoneRaw1);
    const hash2 = generateBlindIndex(phoneRaw2);

    expect(Buffer.isBuffer(hash1)).toBe(true);
    expect(hash1.length).toBe(32); // SHA-256 menghasilkan 32 byte
    expect(hash1.equals(hash2)).toBe(true);
  });

  it("menormalisasi nomor telepon ke format E.164 (+62)", () => {
    expect(normalizePhone("08123456789")).toBe("+628123456789");
    expect(normalizePhone("628123456789")).toBe("+628123456789");
    expect(normalizePhone("+628123456789")).toBe("+628123456789");
  });
});
