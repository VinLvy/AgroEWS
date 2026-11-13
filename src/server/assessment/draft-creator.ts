/**
 * src/server/assessment/draft-creator.ts
 * Logika pembuatan dan manajemen status alert_drafts setelah evaluasi risiko.
 * Sesuai TECH_SPEC.md §7.1 dan PRD FR-4.1.
 */

import { db } from "../db/client";
import { alertDrafts, type riskStatusEnum } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getRecommendationsText } from "@/core/formatter/recommendations";
import type { RiskStatus } from "@/core/rules";

const STATUS_SEVERITY: Record<RiskStatus, number> = {
  green: 1,
  amber: 2,
  red: 3,
};

export interface ProcessAssessmentDraftParams {
  assessmentId: string;
  regionId: string;
  status: RiskStatus;
  regionName?: string;
}

export interface ProcessDraftResult {
  action: "none" | "created" | "updated" | "superseded";
  draftId?: string;
  status?: string;
}

/**
 * Memproses hasil asesmen risiko untuk membuat atau memperbarui alert_drafts.
 * Aturan:
 * - Status GREEN: Tidak membuat draf.
 * - Status AMBER/RED:
 *   - Jika ada draf pending:
 *     - Jika status baru lebih tinggi: tandai draf lama 'superseded', buat draf baru.
 *     - Jika status baru sama atau lebih rendah: perbarui draf yang ada tanpa membuat duplikat.
 *   - Jika belum ada draf pending: buat draf baru.
 *   - Jika status RED: set escalation_due_at = now() + 6 jam.
 */
export async function processAssessmentDraft(
  params: ProcessAssessmentDraftParams,
  dbInstance = db
): Promise<ProcessDraftResult> {
  const { assessmentId, regionId, status } = params;

  // 1. Status HIJAU tidak pernah menghasilkan draf
  if (status === "green") {
    return { action: "none" };
  }

  const recLines = getRecommendationsText({ status });
  const recommendedText = recLines.join("\n");

  // Hitung escalation_due_at untuk status RED (now + 6 jam)
  const escalationDueAt =
    status === "red" ? new Date(Date.now() + 6 * 60 * 60 * 1000) : null;

  // 2. Cari draf berstatus 'pending' yang sudah ada di wilayah ini
  const existingPendingDraft = await dbInstance.query.alertDrafts.findFirst({
    where: and(
      eq(alertDrafts.regionId, regionId),
      eq(alertDrafts.status, "pending")
    ),
  });

  if (!existingPendingDraft) {
    // Buat draf baru
    const [newDraft] = await dbInstance
      .insert(alertDrafts)
      .values({
        assessmentId,
        regionId,
        status: "pending",
        recommendedText,
        escalationDueAt,
      })
      .returning();

    return {
      action: "created",
      draftId: newDraft?.id ?? "mock-draft-id",
      status: "pending",
    };
  }

  // Jika draf pending sudah ada, cek apakah status baru lebih tinggi
  // Cari assessment lama untuk membandingkan status
  const oldAssessment = await dbInstance.query.riskAssessments.findFirst({
    where: (r, { eq: eqOp }) => eqOp(r.id, existingPendingDraft.assessmentId),
  });

  const oldStatus: RiskStatus =
    (oldAssessment?.status as RiskStatus) || "amber";

  if (STATUS_SEVERITY[status] > STATUS_SEVERITY[oldStatus]) {
    // Status naik (misal dari AMBER ke RED): tandai yang lama 'superseded', buat baru
    await dbInstance
      .update(alertDrafts)
      .set({ status: "superseded" })
      .where(eq(alertDrafts.id, existingPendingDraft.id));

    const [newDraft] = await dbInstance
      .insert(alertDrafts)
      .values({
        assessmentId,
        regionId,
        status: "pending",
        recommendedText,
        escalationDueAt,
      })
      .returning();

    return {
      action: "superseded",
      draftId: newDraft?.id ?? "mock-draft-id",
      status: "pending",
    };
  }

  // Status sama atau lebih rendah: update assessmentId dan recommendedText tanpa duplikasi
  await dbInstance
    .update(alertDrafts)
    .set({
      assessmentId,
      recommendedText,
      escalationDueAt: escalationDueAt ?? existingPendingDraft.escalationDueAt,
    })
    .where(eq(alertDrafts.id, existingPendingDraft.id));

  return {
    action: "updated",
    draftId: existingPendingDraft.id,
    status: "pending",
  };
}
