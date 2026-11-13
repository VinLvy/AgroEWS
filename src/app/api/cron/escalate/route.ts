/**
 * src/app/api/cron/escalate/route.ts
 * Endpoint cron untuk eskalasi draf MERAH > 6 jam ke Koordinator BPP
 * dan kedaluwarsa draf pending > 48 jam.
 * Sesuai TECH_SPEC.md §7.4, §10, §11.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { alertDrafts, users, regions } from "@/server/db/schema";
import { verifyCronAuth } from "@/server/auth/cron-auth";
import { recordAuditLog } from "@/server/audit";
import { notifier } from "@/server/notifier/email";
import { eq, and, lte, isNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
  return handleEscalationCron(req);
}

export async function POST(req: NextRequest) {
  return handleEscalationCron(req);
}

async function handleEscalationCron(req: NextRequest) {
  // 1. Verifikasi secret cron dengan constant-time comparison
  const isValidAuth = verifyCronAuth(req);
  if (!isValidAuth) {
    return NextResponse.json(
      {
        success: false,
        error: "CRON_SECRET tidak valid atau tidak disediakan.",
      },
      { status: 401 }
    );
  }

  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  try {
    // 2. Ambil draf MERAH yang melewati batas SLA 6 jam (escalation_due_at <= now AND escalated_at IS NULL)
    const overdueDrafts = await db
      .select({
        id: alertDrafts.id,
        regionId: alertDrafts.regionId,
        regionName: regions.name,
        escalationDueAt: alertDrafts.escalationDueAt,
      })
      .from(alertDrafts)
      .innerJoin(regions, eq(alertDrafts.regionId, regions.id))
      .where(
        and(
          eq(alertDrafts.status, "pending"),
          lte(alertDrafts.escalationDueAt, now),
          isNull(alertDrafts.escalatedAt)
        )
      );

    // Ambil daftar email Koordinator BPP aktif
    const bppCoordinators = await db.query.users.findMany({
      where: and(eq(users.role, "bpp_coordinator"), eq(users.isActive, true)),
      columns: { email: true },
    });
    const bppEmails = bppCoordinators.map((u) => u.email);

    let escalatedCount = 0;

    for (const draft of overdueDrafts) {
      // Perbarui waktu eskalasi
      await db
        .update(alertDrafts)
        .set({ escalatedAt: now })
        .where(eq(alertDrafts.id, draft.id));

      // Kirim notifikasi email ke Koordinator BPP
      if (bppEmails.length > 0) {
        const overdueHours = draft.escalationDueAt
          ? Math.max(6, Math.round((now.getTime() - draft.escalationDueAt.getTime()) / (1000 * 60 * 60)) + 6)
          : 6;

        await notifier.sendEscalationAlert({
          bppEmails,
          regionName: draft.regionName,
          status: "red",
          draftId: draft.id,
          overdueHours,
        });
      }

      // Catat di audit_logs
      await recordAuditLog({
        actorId: null, // cron otomatis
        action: "escalate",
        entity: "alert_drafts",
        entityId: draft.id,
        diff: {
          regionId: draft.regionId,
          escalatedTo: bppEmails,
          escalatedAt: now.toISOString(),
        },
      });

      escalatedCount++;
    }

    // 3. Kedaluwarsakan draf pending yang lebih tua dari 48 jam
    const expiredDrafts = await db
      .select({
        id: alertDrafts.id,
        regionId: alertDrafts.regionId,
      })
      .from(alertDrafts)
      .where(
        and(
          eq(alertDrafts.status, "pending"),
          lte(alertDrafts.createdAt, fortyEightHoursAgo)
        )
      );

    let expiredCount = 0;

    for (const draft of expiredDrafts) {
      await db
        .update(alertDrafts)
        .set({ status: "expired" })
        .where(eq(alertDrafts.id, draft.id));

      await recordAuditLog({
        actorId: null,
        action: "expire",
        entity: "alert_drafts",
        entityId: draft.id,
        diff: {
          regionId: draft.regionId,
          reason: "Draf kedaluwarsa setelah 48 jam tanpa persetujuan",
          expiredAt: now.toISOString(),
        },
      });

      expiredCount++;
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      escalatedCount,
      expiredCount,
    });
  } catch (error) {
    console.error("[CRON_ESCALATE_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
