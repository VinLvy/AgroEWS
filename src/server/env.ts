import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET minimal 32 karakter"),
  AUTH_URL: z.string().url().optional(),

  // PII Encryption & Blind Index
  PII_ENC_KEY: z.string().length(64, "PII_ENC_KEY harus 64 karakter hex (32 bytes)"),
  PII_ENC_KEY_ID: z.string().default("v1"),
  PII_HMAC_KEY: z.string().length(64, "PII_HMAC_KEY harus 64 karakter hex (32 bytes)"),

  // Cron Security
  CRON_SECRET: z.string().min(16, "CRON_SECRET minimal 16 karakter"),

  // WhatsApp Cloud API
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),

  // Telegram Bot API
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_SECRET_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  // Dalam lingkungan test atau saat build tanpa env live, sediakan nilai fallback aman
  if (process.env.NODE_ENV === "test" || process.env.SKIP_ENV_VALIDATION === "true") {
    const testDefaults: Record<string, string> = {
      NODE_ENV: process.env.NODE_ENV || "development",
      DATABASE_URL: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/agroews_test",
      AUTH_SECRET: process.env.AUTH_SECRET || "test_secret_must_be_at_least_32_characters_long",
      PII_ENC_KEY: process.env.PII_ENC_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      PII_ENC_KEY_ID: process.env.PII_ENC_KEY_ID || "v1",
      PII_HMAC_KEY: process.env.PII_HMAC_KEY || "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      CRON_SECRET: process.env.CRON_SECRET || "test_cron_secret_min_16_chars",
    };

    return envSchema.parse({
      ...testDefaults,
      ...process.env,
    });
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formattedErrors = result.error.errors
      .map((err) => `  [FATAL] Env variable "${err.path.join(".")}": ${err.message}`)
      .join("\n");

    const message = `[FATAL] Konfigurasi environment tidak valid saat startup:\n${formattedErrors}`;
    console.error(message);
    throw new Error(message);
  }

  return result.data;
}

export const env = parseEnv();
