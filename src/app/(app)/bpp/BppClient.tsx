"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BPP_SUMMARY } from "@/lib/prototype-data";
import { StatusIcon } from "@/components/agro/StatusIcon";
import { HybridZoningMapPanel } from "@/components/agro/HybridZoningMapPanel";

export function BppClient() {
  const [villages, setVillages] = useState(BPP_SUMMARY.villages);
  const [selectedVillage, setSelectedVillage] = useState<string>("vil-01");
  const [viewMode, setViewMode] = useState<"map" | "table">("map");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showInstructionModal, setShowInstructionModal] = useState<boolean>(false);
  const [instructionText, setInstructionText] = useState<string>(
    "INSTRUKSI KOORDINATOR BPP: Mengingat kelembapan udara >85% selama 3 hari berturut-turut, seluruh PPL dan Poktan binaan di Nagari Sungai Bangek diinstruksikan melakukan pengamatan intensif dan pengeringan petak sawah secara berkala (intermittent)."
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExportCsv = () => {
    showToast("Mengunduh Rekapitulasi_BPP_Kuranji_November2026.csv...");
  };

  const handleSendInstruction = () => {
    setShowInstructionModal(false);
    showToast("Instruksi pengendalian serentak berhasil disiarkan ke 12 PPL dan Poktan.");
  };

  const activeVillageData = villages.find((v) => v.id === selectedVillage) || villages[0]!;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700 text-sm font-medium transition-all"
        >
          <StatusIcon name="check-circle-2" className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-agri-700 uppercase tracking-wider">
            <StatusIcon name="sprout" className="w-4 h-4" />
            <span>Balai Penyuluhan Pertanian (BPP)</span>
            <span>&bull;</span>
            <span>{BPP_SUMMARY.kabupatenName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content-primary mt-1">
            Ikhtisar Agroklimat {BPP_SUMMARY.kecamatanName}
          </h1>
          <p className="text-xs font-medium text-content-muted mt-0.5">
            Pembaruan Asesmen Model: <span className="font-mono font-semibold">{BPP_SUMMARY.lastEvaluation}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="min-h-[48px] px-4 py-2.5 inline-flex items-center gap-2 bg-surface-card border-[1.5px] border-border-card text-content-primary hover:bg-surface-subtle text-sm font-bold rounded-xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-agri-700"
          >
            <StatusIcon name="download" className="w-4 h-4 text-content-secondary" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => setShowInstructionModal(true)}
            className="min-h-[48px] px-5 py-2.5 inline-flex items-center gap-2 bg-agri-700 text-white hover:bg-agri-800 active:bg-agri-900 text-sm font-bold rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-agri-700"
          >
            <StatusIcon name="send" className="w-4 h-4" />
            <span>Kirim Instruksi BPP</span>
          </button>
        </div>
      </div>

      {/* KPI Bento Cards (AgriCore Hybrid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Hero Leaf-Green KPI Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-agri-700 to-agri-900 text-white shadow-bento flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-100">
            <span>Partisipasi LAPOR (KPI 2)</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <StatusIcon name="activity" className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tabular-nums">
              {BPP_SUMMARY.kpi.participationRate}%
            </span>
            <span className="text-xs text-emerald-100 font-bold">
              &gt; Target {BPP_SUMMARY.kpi.participationTarget}%
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-2 rounded-full"
              style={{ width: `${BPP_SUMMARY.kpi.participationRate}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-3xl border-[1.5px] border-border-card bg-surface-card shadow-bento flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-content-muted">
            <span>Kesesuaian Status (KPI 1)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <StatusIcon name="shield-check" className="w-4 h-4 text-blue-700" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-content-primary tabular-nums">
              {BPP_SUMMARY.kpi.accuracyRate}%
            </span>
            <span className="text-xs text-content-muted font-semibold">validasi lapangan</span>
          </div>
          <div className="w-full bg-surface-subtle rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-700 h-2 rounded-full"
              style={{ width: `${BPP_SUMMARY.kpi.accuracyRate}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-3xl border-[1.5px] border-status-red-border bg-surface-card shadow-bento flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-status-red-text">
            <span>Wilayah Bahaya (MERAH)</span>
            <div className="w-8 h-8 rounded-xl bg-status-red-bg border border-status-red-border flex items-center justify-center">
              <StatusIcon name="shield-alert" className="w-4 h-4 text-status-red-text" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-status-red-text tabular-nums">1</span>
            <span className="text-xs text-status-red-text font-bold">Nagari Sungai Bangek</span>
          </div>
          <p className="text-xs font-semibold text-status-red-text pt-2 border-t border-border-subtle">
            Draf rekomendasi butuh pengawalan
          </p>
        </div>

        <div className="p-5 rounded-3xl border-[1.5px] border-border-card bg-surface-card shadow-bento flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-content-muted">
            <span>Cakupan Petani Binaan</span>
            <div className="w-8 h-8 rounded-xl bg-agri-50 border border-agri-100 flex items-center justify-center">
              <StatusIcon name="users" className="w-4 h-4 text-agri-700" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-content-primary tabular-nums">
              {BPP_SUMMARY.kpi.totalFarmers}
            </span>
            <span className="text-xs text-content-muted font-bold">
              di {BPP_SUMMARY.kpi.activePoktan} Poktan
            </span>
          </div>
          <p className="text-xs font-semibold text-agri-700 pt-2 border-t border-border-subtle">
            100% nomor terverifikasi opt-in
          </p>
        </div>
      </div>

      {/* Main View: Interactive Choropleth Map + Side Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Map / Village List */}
        <div className="lg:col-span-2 bg-surface-card rounded-3xl border-[1.5px] border-border-card p-5 sm:p-6 shadow-bento space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-content-primary">
                Peta Zonasi Agroklimat Desa Pilot
              </h2>
              <p className="text-xs font-medium text-content-muted mt-0.5">
                Klik salah satu wilayah desa untuk meninjau status agroklimat dan laporan.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-surface-subtle p-1.5 rounded-xl border border-border-subtle">
              <button
                onClick={() => setViewMode("map")}
                className={`min-h-[44px] px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === "map"
                    ? "bg-white text-content-primary shadow-xs"
                    : "text-content-secondary hover:text-content-primary"
                }`}
              >
                Peta Zonasi
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`min-h-[44px] px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === "table"
                    ? "bg-white text-content-primary shadow-xs"
                    : "text-content-secondary hover:text-content-primary"
                }`}
              >
                Daftar Tabel
              </button>
            </div>
          </div>

          {viewMode === "map" ? (
            <HybridZoningMapPanel
              villages={villages}
              selectedVillage={selectedVillage}
              onSelectVillage={setSelectedVillage}
            />
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">Nama Desa / Nagari</th>
                    <th className="py-3 px-4">Status Risiko</th>
                    <th className="py-3 px-4">Suhu / RH</th>
                    <th className="py-3 px-4">Laporan Gejala</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {villages.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedVillage(v.id)}
                      className={`cursor-pointer hover:bg-slate-50 ${
                        selectedVillage === v.id ? "bg-slate-50 font-semibold" : ""
                      }`}
                    >
                      <td className="py-3 px-4 text-slate-900">{v.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            v.status === "red"
                              ? "bg-red-100 text-red-900"
                              : v.status === "amber"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-emerald-100 text-emerald-900"
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {v.tMean}&deg;C / {v.rhMean}%
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {v.reportsCount} laporan ({v.severeReportsCount} berat)
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/regions/22222222-2222-4222-8222-222222222201`}
                          className="min-h-[40px] px-3 py-1.5 inline-flex items-center text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 rounded-lg transition-colors"
                        >
                          Buka Detail &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Selected Village Detail Inspector */}
        <div className="bg-surface-card rounded-3xl border-[1.5px] border-border-card p-5 sm:p-6 shadow-bento space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-border-subtle pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
                Inspektur Wilayah Terpilih
              </span>
              <h3 className="text-xl font-extrabold text-content-primary mt-0.5">
                {activeVillageData.name}
              </h3>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-border-subtle mt-3 bg-agri-900">
              <Image
                src="/images/kuranji-terrace-landscape.webp"
                alt="Gambaran lanskap hamparan sawah wilayah binaan Kecamatan Kuranji"
                width={960}
                height={535}
                unoptimized
                className="w-full h-28 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex items-end p-3">
                <span className="text-[11px] font-bold text-white">
                  Kec. Kuranji &bull; Zona Grid Agroklimat Aktif
                </span>
              </div>
            </div>

            <div className="space-y-3 mt-4">
            <div
              className={`p-3.5 rounded-lg border ${
                activeVillageData.status === "red"
                  ? "bg-red-50 border-red-200 text-red-900"
                  : activeVillageData.status === "amber"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <StatusIcon
                  name={
                    activeVillageData.status === "red"
                      ? "shield-alert"
                      : activeVillageData.status === "amber"
                      ? "triangle-alert"
                      : "shield-check"
                  }
                  className="w-5 h-5"
                />
                <span className="font-bold text-sm">
                  {activeVillageData.status === "red"
                    ? "STATUS MERAH (Bahaya Ledakan)"
                    : activeVillageData.status === "amber"
                    ? "STATUS AMBER (Waspada Agroklimat)"
                    : "STATUS HIJAU (Aman)"}
                </span>
              </div>
              <p className="text-xs mt-1.5 leading-relaxed">
                {activeVillageData.status === "red"
                  ? "Suhu optimal 27.2°C beririsan dengan kelembapan rata-rata 86.5% selama 3 hari berturut-turut. Perkembangan telur dan nimfa wereng batang cokelat sangat cepat."
                  : activeVillageData.status === "amber"
                  ? "Kelembapan udara melampaui 80% selama 2 hari. Potensi peningkatan populasi jika terjadi hujan intermittent."
                  : "Indikator suhu dan kelembapan berada di bawah ambang batas kritis penetasan telur wereng."}
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Rata-rata Suhu Harian:</span>
                <strong className="text-slate-900">{activeVillageData.tMean}&deg;C</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Rata-rata Kelembapan (RH):</span>
                <strong className="text-slate-900">{activeVillageData.rhMean}%</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Laporan Petani:</span>
                <strong className="text-slate-900">{activeVillageData.reportsCount} Laporan</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Laporan Gejala Berat (Kode 2):</span>
                <strong className="text-red-700 font-bold">
                  {activeVillageData.severeReportsCount} Titik
                </strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-600">Status Draf Peringatan:</span>
                <span className="font-semibold text-slate-800">
                  {activeVillageData.lastDraftStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 space-y-2.5">
            <Link
              href="/regions/22222222-2222-4222-8222-222222222201"
              className="min-h-[48px] w-full px-4 py-2.5 inline-flex items-center justify-center gap-2 bg-agri-700 text-white text-sm font-bold rounded-xl hover:bg-agri-800 transition-colors focus:outline-none focus:ring-2 focus:ring-agri-700 shadow-sm"
            >
              <span>Buka Profil Lengkap Wilayah</span>
              <StatusIcon name="arrow-right" className="w-4 h-4" />
            </Link>

            <Link
              href="/reports"
              className="min-h-[48px] w-full px-4 py-2.5 inline-flex items-center justify-center gap-2 bg-surface-subtle border-[1.5px] border-border-card text-content-primary text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-agri-700"
            >
              <StatusIcon name="file-text" className="w-4 h-4 text-content-secondary" />
              <span>Lihat Feed Laporan Masuk</span>
            </Link>
          </div>
          </div>
        </div>
      </div>

      {/* Modal: Kirim Instruksi BPP */}
      {showInstructionModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-surface-card rounded-3xl shadow-bento-lg max-w-lg w-full p-6 space-y-4 border-[1.5px] border-border-card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-content-primary">
                  Kirim Instruksi Pengendalian Serentak
                </h2>
                <p className="text-xs text-content-muted mt-0.5">
                  Disiarkan ke seluruh PPL dan Ketua Poktan di {BPP_SUMMARY.kecamatanName}.
                </p>
              </div>
              <button
                onClick={() => setShowInstructionModal(false)}
                className="min-h-[44px] min-w-[44px] text-content-muted hover:text-content-primary hover:bg-surface-subtle inline-flex items-center justify-center rounded-xl transition-colors"
                aria-label="Tutup dialog"
              >
                <StatusIcon name="x" className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-content-secondary mb-1.5">
                  Pesan Arahan Tindakan:
                </label>
                <textarea
                  rows={4}
                  value={instructionText}
                  onChange={(e) => setInstructionText(e.target.value)}
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-border-strong rounded-xl text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-agri-700"
                />
              </div>

              <div className="p-3.5 bg-surface-subtle rounded-xl border border-border-subtle text-xs text-content-secondary">
                Instruksi akan dikirimkan serentak via WhatsApp &amp; Telegram Gateway kepada{" "}
                <strong>{BPP_SUMMARY.kpi.totalFarmers} penerima terdaftar</strong>.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setShowInstructionModal(false)}
                className="min-h-[48px] px-4 py-2 text-sm font-bold text-content-primary bg-surface-subtle hover:bg-slate-200 border-[1.5px] border-border-card rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendInstruction}
                className="min-h-[48px] px-5 py-2 text-sm font-bold text-white bg-agri-700 hover:bg-agri-800 rounded-xl shadow-sm transition-colors"
              >
                Kirim Instruksi Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
