"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { VerificationBar } from "@/components/agro/VerificationBar";
import { approveDraft, holdDraft } from "./actions";
import type { CropPhase } from "@/core/formatter/recommendations";
import { formatWhatsAppSessionMessage } from "@/core/formatter/whatsapp";

interface DraftReviewClientProps {
  draftId: string;
  regionName: string;
  dateStr: string;
  status: "amber" | "red";
  tMean: number;
  rhMean: number;
  recipientCount: number;
  recommendedText: string;
  pplName: string;
}

export function DraftReviewClient({
  draftId,
  regionName,
  dateStr,
  status,
  tMean,
  rhMean,
  recipientCount,
  recommendedText,
  pplName,
}: DraftReviewClientProps) {
  const router = useRouter();
  const [actionError, setActionError] = useState("");

  const handleApprove = async (cropPhase: CropPhase, editedText?: string) => {
    setActionError("");
    try {
      const res = await approveDraft({
        draftId,
        cropPhase,
        editedText,
      });

      if (!res.success) {
        setActionError(res.message || "Gagal menyetujui draf.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setActionError((err as Error).message || "Terjadi kesalahan saat menyetujui draf.");
    }
  };

  const handleHold = async (reason: string) => {
    setActionError("");
    try {
      const res = await holdDraft({
        draftId,
        reason,
      });

      if (!res.success) {
        setActionError(res.message || "Gagal menahan draf.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setActionError((err as Error).message || "Terjadi kesalahan saat menahan draf.");
    }
  };

  const generatePreviewText = (cropPhase: CropPhase, customText?: string) => {
    if (customText) {
      return customText;
    }
    return formatWhatsAppSessionMessage({
      regionName,
      dateStr,
      status,
      tMean,
      rhMean,
      runDays: 3,
      rainPattern: "Hujan berselang",
      pplName,
      cropPhase,
    });
  };

  return (
    <div className="space-y-4">
      {actionError && (
        <div
          role="alert"
          className="p-4 rounded-lg bg-[var(--status-red-bg)] border border-[var(--status-red-border)] text-[var(--status-red-text)] text-sm font-semibold"
        >
          {actionError}
        </div>
      )}

      <VerificationBar
        draftId={draftId}
        recipientCount={recipientCount}
        initialText={recommendedText}
        onApprove={handleApprove}
        onHold={handleHold}
        generatePreviewText={generatePreviewText}
      />
    </div>
  );
}
