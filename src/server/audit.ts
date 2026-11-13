/**
 * src/server/audit.ts
 * Perekam jejak audit (audit_logs append-only).
 * Sesuai TECH_SPEC.md §4, §11 (A09) dan PRD.
 */

import { db } from "./db/client";
import { auditLogs } from "./db/schema";

export type AuditAction =
  | "login"
  | "logout"
  | "approve"
  | "hold"
  | "edit"
  | "export"
  | "escalate"
  | "verify_report";

export interface AuditLogEntry {
  actorId?: string | null;
  action: AuditAction | string;
  entity: string;
  entityId?: string | null;
  diff?: Record<string, unknown> | null;
  ip?: string | null;
}

/**
 * Mencatat peristiwa ke tabel audit_logs.
 * Fungsi ini membungkus operasi dalam try/catch agar kegagalan audit non-kritis
 * tidak menghentikan alur utama namun tetap dicatat di stderr.
 */
export async function recordAuditLog(
  entry: AuditLogEntry,
  dbInstance = db
): Promise<void> {
  try {
    await dbInstance.insert(auditLogs).values({
      actorId: entry.actorId ?? null,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      diff: entry.diff ?? null,
      ip: entry.ip ?? null,
    });
  } catch (err) {
    console.error(
      `[AUDIT_ERROR] Gagal mencatat audit log (${entry.action} pada ${entry.entity}):`,
      (err as Error).message
    );
  }
}
