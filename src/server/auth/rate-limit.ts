/**
 * src/server/auth/rate-limit.ts
 * In-memory sliding-window rate limiter untuk pencegahan brute-force.
 * Sesuai TECH_SPEC.md §11 (A07).
 */

interface RateLimitRecord {
  timestamps: number[];
}

const store = new Map<string, RateLimitRecord>();

// Bersihkan rekaman yang lebih tua dari 1 jam setiap 10 menit
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of store.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (record.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

export interface RateLimitOptions {
  windowMs?: number; // durasi jendela dalam ms, default: 60000 (1 menit)
  maxAttempts?: number; // batas maksimum upaya dalam jendela, default: 10
}

/**
 * Memeriksa apakah suatu identitas (IP / email) telah melampaui batas frekuensi permintaan.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const windowMs = options.windowMs ?? 60 * 1000;
  const maxAttempts = options.maxAttempts ?? 10;
  const now = Date.now();

  cleanupExpired(windowMs);

  let record = store.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    store.set(identifier, record);
  }

  // Filter timestamp yang masih berada di dalam jendela waktu
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxAttempts) {
    const oldest = record.timestamps[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxAttempts - record.timestamps.length,
    retryAfterSeconds: 0,
  };
}

/**
 * Reset rate limit untuk suatu identifier (misal setelah login berhasil atau dalam pengujian).
 */
export function resetRateLimit(identifier: string): void {
  store.delete(identifier);
}
