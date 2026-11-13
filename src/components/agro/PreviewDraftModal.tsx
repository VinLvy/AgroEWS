"use client";

import React from "react";
import { StatusIcon } from "./StatusIcon";

interface PreviewDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  messageText: string;
  recipientCount: number;
  isLoading: boolean;
}

export function PreviewDraftModal({
  isOpen,
  onClose,
  onConfirm,
  messageText,
  recipientCount,
  isLoading,
}: PreviewDraftModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-surface-card rounded-3xl border-[1.5px] border-border-card max-w-xl w-full p-6 shadow-bento-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-3 text-agri-700 mb-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-agri-50 border border-agri-100 flex items-center justify-center shrink-0">
            <StatusIcon name="send" size={20} />
          </div>
          <h2 id="preview-modal-title" className="text-lg font-extrabold text-content-primary">
            Pratinjau Pesan Siaran WhatsApp
          </h2>
        </div>

        <p className="text-xs text-content-secondary mb-3 shrink-0">
          Pesan ini akan dikirimkan kepada <strong>{recipientCount} kontak petani terdaftar</strong> setelah Anda menyetujuinya.
        </p>

        <div className="flex-1 overflow-y-auto bg-slate-900 text-emerald-100 p-4 rounded-2xl font-mono text-xs leading-relaxed border border-slate-700 mb-4 whitespace-pre-wrap select-all">
          {messageText}
        </div>

        <div className="flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="min-h-touch px-4 py-2.5 rounded-xl border-[1.5px] border-border-card bg-surface-subtle hover:bg-slate-200 text-content-primary font-bold text-sm transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="min-h-touch px-5 py-2.5 rounded-xl bg-agri-700 hover:bg-agri-800 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition-colors"
          >
            <StatusIcon name="send" size={18} />
            {isLoading ? "Menyiarkan..." : `Setujui & Siarkan (${recipientCount} Penerima)`}
          </button>
        </div>
      </div>
    </div>
  );
}
