"use client";

import React, { useState } from "react";
import { StatusIcon } from "./StatusIcon";
import { HoldDraftModal } from "./HoldDraftModal";
import { PreviewDraftModal } from "./PreviewDraftModal";
import type { CropPhase } from "@/core/formatter/recommendations";

export interface VerificationBarProps {
  draftId: string;
  recipientCount: number;
  initialText: string;
  onApprove: (cropPhase: CropPhase, editedText?: string) => Promise<void>;
  onHold: (reason: string) => Promise<void>;
  generatePreviewText: (cropPhase: CropPhase, customText?: string) => string;
}

const CROP_PHASES: { value: CropPhase; label: string }[] = [
  { value: "bero", label: "Bero / Olah Tanah (Siaran Diredam)" },
  { value: "vegetatif_awal", label: "Vegetatif Awal" },
  { value: "vegetatif_akhir", label: "Vegetatif Akhir" },
  { value: "bunting", label: "Bunting" },
  { value: "masak_susu", label: "Masak Susu" },
  { value: "menjelang_panen", label: "Menjelang Panen" },
];

export function VerificationBar({
  draftId,
  recipientCount,
  initialText,
  onApprove,
  onHold,
  generatePreviewText,
}: VerificationBarProps) {
  const [selectedPhase, setSelectedPhase] = useState<CropPhase | "">("");
  const [editedText, setEditedText] = useState(initialText);
  const [isEditing, setIsEditing] = useState(false);
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [textError, setTextError] = useState("");

  const emojiRegex = /\p{Extended_Pictographic}/u;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (emojiRegex.test(val)) {
      setTextError("DILARANG menggunakan emoji Unicode sesuai Zero-Emoji Policy.");
      return;
    }
    if (val.length > 1500) {
      setTextError("Teks koreksi maksimal 1500 karakter.");
      return;
    }
    setTextError("");
    setEditedText(val);
  };

  const handleApproveSubmit = async () => {
    if (!selectedPhase) return;
    setIsLoading(true);
    try {
      await onApprove(selectedPhase, isEditing ? editedText : undefined);
      setPreviewModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHoldSubmit = async (reason: string) => {
    setIsLoading(true);
    try {
      await onHold(reason);
      setHoldModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const previewMessage = selectedPhase
    ? generatePreviewText(selectedPhase, isEditing ? editedText : undefined)
    : "";

  return (
    <div className="bg-surface-card border-t-[1.5px] border-border-card p-4 sm:p-5 sticky bottom-0 z-40 shadow-lg safe-bottom">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Toggle Editor Teks Rekomendasi */}
        {isEditing && (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs text-content-secondary">
              <label htmlFor="edited-text" className="font-semibold">
                Koreksi Anjuran Teknis (Maksimal 1500 Karakter):
              </label>
              <span className={editedText.length > 1400 ? "text-status-red-text font-bold" : ""}>
                {editedText.length}/1500
              </span>
            </div>
            <textarea
              id="edited-text"
              rows={3}
              value={editedText}
              onChange={handleTextChange}
              className="w-full text-xs font-mono rounded-lg border-[1.5px] border-border-strong p-3 focus:ring-2 focus:ring-agri-700 focus:outline-none"
            />
            {textError && <p className="text-xs text-status-red-text font-semibold">{textError}</p>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Dropdown 6 Fase Tanam */}
          <div className="flex-1 min-w-[240px]">
            <label htmlFor="crop-phase-select" className="sr-only">
              Pilih Fase Tanaman
            </label>
            <select
              id="crop-phase-select"
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value as CropPhase)}
              className="w-full min-h-touch px-3 py-2 text-sm font-semibold rounded-lg border-[1.5px] border-border-strong bg-surface-card text-content-primary focus:ring-2 focus:ring-agri-700 focus:outline-none"
            >
              <option value="">-- Wajib Pilih Fase Tanaman --</option>
              {CROP_PHASES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tombol Aksi Lapangan */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="min-h-touch px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950 active:bg-slate-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
            >
              <StatusIcon name="pencil" size={16} />
              {isEditing ? "Tutup Editor" : "Edit Anjuran"}
            </button>

            <button
              type="button"
              onClick={() => setHoldModalOpen(true)}
              disabled={isLoading}
              className="min-h-touch px-4 py-2 rounded-lg border-[1.5px] border-status-amber-border bg-status-amber-bg text-status-amber-text hover:bg-amber-100 text-xs sm:text-sm font-bold flex items-center gap-1.5"
            >
              <StatusIcon name="triangle-alert" size={16} />
              Tahan / Batal
            </button>

            <button
              type="button"
              onClick={() => setPreviewModalOpen(true)}
              disabled={!selectedPhase || isLoading || !!textError}
              className="min-h-touch px-5 py-2 rounded-lg bg-agri-700 hover:bg-agri-900 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm"
            >
              <StatusIcon name="send" size={16} />
              Setujui & Siarkan ({recipientCount} Penerima)
            </button>
          </div>
        </div>
      </div>

      <HoldDraftModal
        isOpen={holdModalOpen}
        onClose={() => setHoldModalOpen(false)}
        onConfirm={handleHoldSubmit}
        isLoading={isLoading}
      />

      <PreviewDraftModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        onConfirm={handleApproveSubmit}
        messageText={previewMessage}
        recipientCount={recipientCount}
        isLoading={isLoading}
      />
    </div>
  );
}
