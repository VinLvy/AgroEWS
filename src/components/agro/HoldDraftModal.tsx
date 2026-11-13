"use client";

import React, { useState } from "react";
import { StatusIcon } from "./StatusIcon";

interface HoldDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isLoading: boolean;
}

export function HoldDraftModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: HoldDraftModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Alasan penahanan siaran wajib diisi secara jelas.");
      return;
    }
    setError("");
    await onConfirm(reason.trim());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hold-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-surface-card rounded-3xl border-[1.5px] border-border-card max-w-lg w-full p-6 shadow-bento-lg">
        <div className="flex items-center gap-3 text-status-amber-text mb-4">
          <div className="w-10 h-10 rounded-xl bg-status-amber-bg border border-status-amber-border flex items-center justify-center shrink-0">
            <StatusIcon name="triangle-alert" size={20} />
          </div>
          <h2 id="hold-modal-title" className="text-lg font-extrabold text-content-primary">
            Tahan / Batalkan Siaran Peringatan
          </h2>
        </div>

        <p className="text-sm text-content-secondary mb-4">
          Status draf akan diubah menjadi <strong>HELD (DITAHAN)</strong>. Peringatan tidak akan disiarkan ke kontak petani di wilayah ini.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="hold-reason" className="block text-sm font-semibold text-content-primary mb-1">
              Alasan Penahanan (Wajib):
            </label>
            <textarea
              id="hold-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Petani baru saja panen serempak, risiko outbreak nihil..."
              className="w-full rounded-lg border-[1.5px] border-border-strong p-3 text-sm focus:ring-2 focus:ring-agri-700 focus:outline-none"
              disabled={isLoading}
            />
            {error && <p className="text-xs text-status-red-text font-medium mt-1">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="min-h-touch px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950 active:bg-slate-300 font-bold text-sm transition-colors"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="min-h-touch px-5 py-2.5 rounded-lg bg-status-amber-accent hover:bg-amber-600 text-white font-bold text-sm"
            >
              {isLoading ? "Menyimpan..." : "Konfirmasi Tahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
