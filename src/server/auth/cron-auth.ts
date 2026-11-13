/**
 * src/server/auth/cron-auth.ts
 * Autentikasi konstan-waktu untuk endpoint cron internal AgroEWS.
 * Sesuai TECH_SPEC.md §5.1 dan §11 (A08).
 */

import crypto from "node:crypto";
import { env } from "@/server/env";

/**
 * Verifikasi header Authorization: Bearer <CRON_SECRET> dengan perbandingan konstan-waktu.
 */
export function verifyCronAuth(req: Request, expectedSecret = env.CRON_SECRET): boolean {
  const authHeader = req.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1]) {
    return false;
  }

  const providedBuffer = Buffer.from(match[1]);
  const expectedBuffer = Buffer.from(expectedSecret);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}
