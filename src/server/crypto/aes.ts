import crypto from "node:crypto";
import { env } from "../env";

/**
 * Enkripsi teks menggunakan AES-256-GCM.
 * Format buffer hasil:
 * [1 byte keyIdLen] [keyId bytes] [12 bytes IV] [16 bytes AuthTag] [Ciphertext]
 */
export function encryptField(plainText: string, keyId = env.PII_ENC_KEY_ID): Buffer {
  const keyBuffer = Buffer.from(env.PII_ENC_KEY, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error("PII_ENC_KEY harus tepat 32 bytes (64 karakter hex)");
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);
  
  const keyIdBuf = Buffer.from(keyId, "utf8");
  if (keyIdBuf.length > 255) {
    throw new Error("keyId terlalu panjang, maksimal 255 byte");
  }

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  const keyIdLenBuf = Buffer.alloc(1);
  keyIdLenBuf.writeUInt8(keyIdBuf.length, 0);

  return Buffer.concat([keyIdLenBuf, keyIdBuf, iv, tag, encrypted]);
}

/**
 * Dekripsi buffer terenkripsi AES-256-GCM.
 */
export function decryptField(encryptedBuffer: Buffer): string {
  if (encryptedBuffer.length < 29) {
    throw new Error("Buffer ciphertext tidak valid atau terlalu pendek");
  }

  const keyBuffer = Buffer.from(env.PII_ENC_KEY, "hex");
  const keyIdLen = encryptedBuffer.readUInt8(0);
  let offset = 1;

  // Baca keyId jika ada
  const keyId = encryptedBuffer.subarray(offset, offset + keyIdLen).toString("utf8");
  offset += keyIdLen;

  const iv = encryptedBuffer.subarray(offset, offset + 12);
  offset += 12;

  const tag = encryptedBuffer.subarray(offset, offset + 16);
  offset += 16;

  const ciphertext = encryptedBuffer.subarray(offset);

  const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
