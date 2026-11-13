"use server";

import { auth } from "@/auth";
import { db } from "@/server/db/client";
import {
  alertDrafts,
  broadcasts,
  deliveries,
  contacts,
  poktan,
  riskAssessments,
  regions,
} from "@/server/db/schema";
import { requireRegionAccess, AuthError } from "@/server/auth/rbac";
import { recordAuditLog } from "@/server/audit";
import { eq, and, isNotNull, isNull, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { CropPhase } from "@/core/formatter/recommendations";
import { formatWhatsAppSessionMessage } from "@/core/formatter/whatsapp";

const emojiRegex = /\p{Extended_Pictographic}/u;

// Schema validasi input
const approveSchema = z.object({
  draftId: z.string().uuid("ID Draf tidak valid"),
  cropPhase: z.enum([
    "bero",
    "vegetatif_awal",
    "vegetatif_akhir",
    "bunting",
    "masak_susu",
    "menjelang_panen",
  ]),
  editedText: z.string().max(1500, "Teks maksimal 1500 karakter").optional(),
});

const holdSchema = z.object({
  draftId: z.string().uuid("ID Draf tidak valid"),
  reason: z
    .string()
    .min(3, "Alasan penahanan minimal 3 karakter")
    .max(500, "Alasan penahanan maksimal 500 karakter"),
});

/**
 * Server Action: approveDraft
 * Menyetujui draf peringatan dengan fase tanam terpilih dan menyimpannya dalam snapshot broadcasts.
 * Sesuai TECH_SPEC.md §7.2, §7.3.
 */
export async function approveDraft(input: z.infer<typeof approveSchema>) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new AuthError("Sesi tidak valid. Silakan login kembali.", 401);
  }

  const parsed = approveSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || "Input tidak valid");
  }

  const { draftId, cropPhase, editedText } = parsed.data;

  // Validasi Zero-Emoji Policy pada teks editan
  if (editedText && emojiRegex.test(editedText)) {
    throw new Error("Dilarang menyertakan simbol emoji Unicode.");
  }

  // Sanitasi kontrol karakter jika ada
  const sanitizedText = editedText
    ? editedText
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
        .replace(/\r\n/g, "\n")
        .trim()
    : undefined;

  // Jalankan transaksi database
  return await db.transaction(async (tx) => {
    // 1. SELECT ... FOR UPDATE untuk mengunci baris draf (idempoten & mencegah race conditions)
    const [draft] = await tx
      .select()
      .from(alertDrafts)
      .where(eq(alertDrafts.id, draftId))
      .for("update");

    if (!draft) {
      throw new Error("Draf peringatan tidak ditemukan.");
    }

    // 2. Verifikasi kepemilikan region
    await requireRegionAccess(
      session.user.id,
      session.user.role,
      draft.regionId,
      tx as unknown as typeof db
    );

    // 3. Cek apakah status sudah bukan pending (Idempoten)
    if (draft.status !== "pending") {
      return {
        success: true,
        alreadyProcessed: true,
        status: draft.status,
        message: `Draf telah diproses sebelumnya dengan status: ${draft.status}`,
      };
    }

    const now = new Date();

    // 4. Periksa Aturan Fase Tanam: BERO
    if (cropPhase === "bero") {
      // Draf otomatis suppressed, siaran dilarang
      await tx
        .update(alertDrafts)
        .set({
          status: "suppressed",
          cropPhase: "bero",
          reviewerId: session.user.id,
          reviewedAt: now,
        })
        .where(eq(alertDrafts.id, draftId));

      await recordAuditLog(
        {
          actorId: session.user.id,
          action: "approve",
          entity: "alert_drafts",
          entityId: draftId,
          diff: {
            cropPhase: "bero",
            outcome: "suppressed",
            reason: "Lahan bero / olah tanah (siaran diredam otomatis)",
          },
        },
        tx as unknown as typeof db
      );

      return {
        success: true,
        status: "suppressed",
        message: "Lahan berstatus Bero. Peringatan otomatis diredam dan siaran dibatalkan.",
      };
    }

    // 5. Fase Aktif: Persiapkan teks final snapshot
    let finalText = sanitizedText;

    if (!finalText) {
      // Ambil data assessment & region untuk menyusun pesan baku jika tidak ada teks custom
      const assessment = await tx.query.riskAssessments.findFirst({
        where: eq(riskAssessments.id, draft.assessmentId),
      });

      const region = await tx.query.regions.findFirst({
        where: eq(regions.id, draft.regionId),
      });

      const features = (assessment?.features ?? {}) as Record<string, unknown>;
      const tMean = typeof features.tMean === "number" ? features.tMean : 26.5;
      const rhMean = typeof features.rhMean === "number" ? features.rhMean : 85.0;

      finalText = formatWhatsAppSessionMessage({
        regionName: region?.name || "Wilayah Binaan",
        dateStr: assessment?.assessedForDate || now.toISOString().slice(0, 10),
        status: (assessment?.status as "amber" | "red") || "amber",
        tMean,
        rhMean,
        runDays: 3,
        rainPattern: "Hujan berselang",
        pplName: session.user.name || "Petugas PPL",
        cropPhase,
      });
    }

    // 6. Update status alert_drafts menjadi approved
    await tx
      .update(alertDrafts)
      .set({
        status: "approved",
        cropPhase,
        editedText: sanitizedText || null,
        reviewerId: session.user.id,
        reviewedAt: now,
      })
      .where(eq(alertDrafts.id, draftId));

    // 7. Simpan snapshot siaran ke tabel broadcasts
    const [broadcast] = await tx
      .insert(broadcasts)
      .values({
        draftId,
        finalText,
        approvedBy: session.user.id,
        approvedAt: now,
      })
      .returning({ id: broadcasts.id });

    if (!broadcast) {
      throw new Error("Gagal membuat rekaman siaran.");
    }

    // 8. Stub pembuatan deliveries untuk kontak beropt-in aktif
    const regionPoktan = await tx
      .select({ id: poktan.id })
      .from(poktan)
      .where(eq(poktan.regionId, draft.regionId));

    const poktanIds = regionPoktan.map((p) => p.id);
    let targetContactsCount = 0;

    if (poktanIds.length > 0) {
      const activeContacts = await tx
        .select({
          id: contacts.id,
          channel: contacts.channel,
        })
        .from(contacts)
        .where(
          and(
            inArray(contacts.poktanId, poktanIds),
            isNotNull(contacts.optInAt),
            isNull(contacts.optOutAt)
          )
        );

      targetContactsCount = activeContacts.length;

      if (activeContacts.length > 0) {
        await tx.insert(deliveries).values(
          activeContacts.map((c) => ({
            broadcastId: broadcast.id,
            contactId: c.id,
            channel: c.channel,
            stage: "template",
            state: "queued" as const,
            attempts: 0,
            nextAttemptAt: now,
          }))
        );
      }
    }

    // 9. Rekam audit log
    await recordAuditLog(
      {
        actorId: session.user.id,
        action: "approve",
        entity: "alert_drafts",
        entityId: draftId,
        diff: {
          cropPhase,
          broadcastId: broadcast.id,
          recipientCount: targetContactsCount,
          hasEditedText: Boolean(sanitizedText),
        },
      },
      tx as unknown as typeof db
    );

    return {
      success: true,
      status: "approved",
      broadcastId: broadcast.id,
      recipientCount: targetContactsCount,
      message: `Draf berhasil disetujui untuk ${targetContactsCount} penerima aktif.`,
    };
  });
}

/**
 * Server Action: holdDraft
 * Menahan draf peringatan dengan alasan wajib untuk klarifikasi lapangan.
 * Sesuai TECH_SPEC.md §7.3.
 */
export async function holdDraft(input: z.infer<typeof holdSchema>) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new AuthError("Sesi tidak valid. Silakan login kembali.", 401);
  }

  const parsed = holdSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || "Alasan wajib diisi.");
  }

  const { draftId, reason } = parsed.data;

  if (emojiRegex.test(reason)) {
    throw new Error("Dilarang menyertakan simbol emoji Unicode.");
  }

  return await db.transaction(async (tx) => {
    // 1. Lock draf
    const [draft] = await tx
      .select()
      .from(alertDrafts)
      .where(eq(alertDrafts.id, draftId))
      .for("update");

    if (!draft) {
      throw new Error("Draf peringatan tidak ditemukan.");
    }

    // 2. Verifikasi kepemilikan region
    await requireRegionAccess(
      session.user.id,
      session.user.role,
      draft.regionId,
      tx as unknown as typeof db
    );

    // 3. Cek status
    if (draft.status !== "pending") {
      return {
        success: true,
        alreadyProcessed: true,
        status: draft.status,
        message: `Draf telah diproses sebelumnya dengan status: ${draft.status}`,
      };
    }

    const now = new Date();

    // 4. Update status menjadi 'held'
    await tx
      .update(alertDrafts)
      .set({
        status: "held",
        reviewerId: session.user.id,
        reviewedAt: now,
      })
      .where(eq(alertDrafts.id, draftId));

    // 5. Rekam audit log dengan alasan penahanan
    await recordAuditLog(
      {
        actorId: session.user.id,
        action: "hold",
        entity: "alert_drafts",
        entityId: draftId,
        diff: {
          reason,
        },
      },
      tx as unknown as typeof db
    );

    return {
      success: true,
      status: "held",
      message: "Draf berhasil ditahan untuk konfirmasi lapangan.",
    };
  });
}
