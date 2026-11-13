"use client";

import React, { useState } from "react";
import { INITIAL_REPORTS, type PrototypeFarmerReport } from "@/lib/prototype-data";
import { StatusIcon } from "@/components/agro/StatusIcon";

interface ReportsClientProps {
  userRole?: string;
}

export function ReportsClient({ userRole = "ppl" }: ReportsClientProps) {
  const isCoordinator = userRole === "bpp_coordinator" || userRole === "admin";
  const [reports, setReports] = useState<PrototypeFarmerReport[]>(INITIAL_REPORTS);
  const [filterCode, setFilterCode] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [selectedReport, setSelectedReport] = useState<PrototypeFarmerReport | null>(null);
  const [visitDate, setVisitDate] = useState<string>("2026-11-15");
  const [visitNotes, setVisitNotes] = useState<string>("");
  const [showSimModal, setShowSimModal] = useState<boolean>(false);

  // Quick report simulation input
  const [simName, setSimName] = useState<string>("Pak Kasmir");
  const [simPoktan, setSimPoktan] = useState<string>("Poktan Makmur");
  const [simDusun, setSimDusun] = useState<string>("Dusun II");
  const [simCode, setSimCode] = useState<0 | 1 | 2>(2);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleVerify = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isVerified: true } : r))
    );
    showToast("Laporan berhasil diverifikasi oleh PPL.");
  };

  const handleOpenScheduleModal = (report: PrototypeFarmerReport) => {
    setSelectedReport(report);
    setVisitDate(report.poptVisitDate || "2026-11-15");
    setVisitNotes(report.poptNotes || "Pemeriksaan intensitas serangan nimfa wereng.");
  };

  const handleSaveSchedule = () => {
    if (!selectedReport) return;
    setReports((prev) =>
      prev.map((r) =>
        r.id === selectedReport.id
          ? {
              ...r,
              isPoptScheduled: true,
              poptVisitDate: visitDate,
              poptNotes: visitNotes,
              isVerified: true,
            }
          : r
      )
    );
    setSelectedReport(null);
    showToast("Jadwal kunjungan POPT berhasil disimpan dan dikonfirmasi.");
  };

  const handleSimulateNewReport = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} WIB`;
    const labelMap: Record<0 | 1 | 2, string> = {
      0: "Aman (0 ekor)",
      1: "Waspada (1-4 ekor/rumpun)",
      2: "Bahaya (>=5 ekor/rumpun)",
    };

    const newReport: PrototypeFarmerReport = {
      id: `rep-${Date.now()}`,
      time: timeStr,
      farmerName: simName,
      poktan: simPoktan,
      dusun: simDusun,
      rawMessage: `LAPOR ${simDusun.replace(" ", "-")} ${simCode}`,
      code: simCode,
      statusLabel: labelMap[simCode],
      isVerified: false,
      isPoptScheduled: false,
    };

    setReports([newReport, ...reports]);
    setShowSimModal(false);
    showToast(`Laporan baru dari ${simName} berhasil diterima via SMS/WhatsApp.`);
  };

  const filteredReports = reports.filter((r) => {
    const matchesCode =
      filterCode === "all" ||
      (filterCode === "2" && r.code === 2) ||
      (filterCode === "1" && r.code === 1) ||
      (filterCode === "0" && r.code === 0);

    const matchesSearch =
      r.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.dusun.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.poktan.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCode && matchesSearch;
  });

  const totalReports = reports.length;
  const severeReports = reports.filter((r) => r.code === 2).length;
  const verifiedReports = reports.filter((r) => r.isVerified).length;

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

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content-primary">
              {isCoordinator
                ? "Validasi Laporan Petani (Supervisi BPP)"
                : "Feed Laporan Petani (Ground-Truthing Dusun)"}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                isCoordinator
                  ? "bg-blue-50 text-blue-900 border-blue-300"
                  : "bg-agri-50 text-agri-800 border-agri-100"
              }`}
            >
              {isCoordinator ? "Supervisi Kecamatan" : "Wilayah Binaan PPL"}
            </span>
          </div>
          <p className="text-sm text-content-muted mt-1">
            {isCoordinator
              ? "Rekapitulasi laporan observasi wereng cokelat di seluruh 4 desa binaan BPP Kuranji (Design 5.5)."
              : "Umpan balik observasi populasi wereng cokelat di petak sawah oleh petani binaan Nagari Sungai Bangek."}
          </p>
        </div>

        <button
          onClick={() => setShowSimModal(true)}
          className="min-h-[48px] px-5 py-2.5 inline-flex items-center justify-center gap-2 bg-agri-700 text-white text-sm font-bold rounded-xl hover:bg-agri-800 active:bg-agri-900 transition-colors focus:outline-none focus:ring-2 focus:ring-agri-700 shadow-sm shrink-0"
        >
          <StatusIcon name="plus" className="w-4 h-4" />
          <span>Simulasi Laporan Baru</span>
        </button>
      </div>

      {/* Metric Summary Cards (AgriCore Bento) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-3xl border-[1.5px] border-border-card bg-surface-card shadow-bento">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
              Total Laporan Masuk
            </span>
            <div className="w-9 h-9 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-center">
              <StatusIcon name="file-text" className="w-4 h-4 text-content-secondary" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-content-primary tabular-nums">{totalReports}</span>
            <span className="text-xs text-content-muted font-bold">laporan</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl border-[1.5px] border-status-red-border bg-surface-card shadow-bento">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-status-red-text">
              Gejala Berat (Kode 2)
            </span>
            <div className="w-9 h-9 rounded-xl bg-status-red-bg border border-status-red-border flex items-center justify-center">
              <StatusIcon name="shield-alert" className="w-4 h-4 text-status-red-text" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-status-red-text tabular-nums">{severeReports}</span>
            <span className="text-xs text-status-red-text font-bold">butuh penanganan</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-agri-700 to-agri-900 text-white shadow-bento">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              Terverifikasi PPL
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <StatusIcon name="user-check" className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tabular-nums">{verifiedReports}</span>
            <span className="text-xs text-emerald-100 font-bold">
              ({Math.round((verifiedReports / (totalReports || 1)) * 100)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-surface-card p-4 rounded-2xl border-[1.5px] border-border-card shadow-bento">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-content-muted uppercase tracking-wider mr-1">
            Status Gejala:
          </span>
          <button
            onClick={() => setFilterCode("all")}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-agri-700 ${
              filterCode === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-surface-subtle text-content-secondary hover:bg-slate-200"
            }`}
          >
            Semua ({reports.length})
          </button>
          <button
            onClick={() => setFilterCode("2")}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 ${
              filterCode === "2"
                ? "bg-red-700 text-white shadow-xs"
                : "bg-status-red-bg text-status-red-text border border-status-red-border hover:bg-red-100"
            }`}
          >
            Bahaya Kode 2 ({reports.filter((r) => r.code === 2).length})
          </button>
          <button
            onClick={() => setFilterCode("1")}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-600 ${
              filterCode === "1"
                ? "bg-amber-700 text-white shadow-xs"
                : "bg-status-amber-bg text-status-amber-text border border-status-amber-border hover:bg-amber-100"
            }`}
          >
            Waspada Kode 1 ({reports.filter((r) => r.code === 1).length})
          </button>
          <button
            onClick={() => setFilterCode("0")}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-agri-700 ${
              filterCode === "0"
                ? "bg-agri-700 text-white shadow-xs"
                : "bg-status-green-bg text-status-green-text border border-status-green-border hover:bg-emerald-100"
            }`}
          >
            Aman Kode 0 ({reports.filter((r) => r.code === 0).length})
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Cari petani / dusun / poktan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-h-[44px] w-full sm:w-64 px-3.5 py-2 text-sm rounded-xl border-[1.5px] border-border-strong focus:outline-none focus:ring-2 focus:ring-agri-700 text-content-primary bg-white"
          />
        </div>
      </div>

      {/* Reports Table (Design 5.5 Specification) */}
      <div className="bg-surface-card rounded-3xl border-[1.5px] border-border-card overflow-hidden shadow-bento">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Jam / Waktu
                </th>
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Nama Petani / Poktan
                </th>
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Dusun / Petak
                </th>
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Input Laporan
                </th>
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Status Terhitung
                </th>
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600 text-right">
                  Aksi Petugas PPL
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-500">
                    Tidak ada laporan petani yang cocok dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const isRed = report.code === 2;
                  const isAmber = report.code === 1;

                  return (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-sm font-mono text-slate-700 whitespace-nowrap">
                        {report.time}
                      </td>
                      <td className="py-3.5 px-4 text-sm text-slate-900">
                        <div className="font-semibold">{report.farmerName}</div>
                        <div className="text-xs text-slate-500">{report.poktan}</div>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-slate-800 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <StatusIcon name="map-pin" className="w-3.5 h-3.5 text-slate-400" />
                          {report.dusun}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm whitespace-nowrap">
                        <code className="px-2 py-1 rounded bg-slate-100 text-slate-800 font-mono text-xs border border-slate-200">
                          {report.rawMessage}
                        </code>
                      </td>
                      <td className="py-3.5 px-4 text-sm whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isRed
                              ? "bg-red-100 text-red-900 border border-red-300"
                              : isAmber
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          }`}
                        >
                          <StatusIcon
                            name={isRed ? "shield-alert" : isAmber ? "triangle-alert" : "shield-check"}
                            className="w-3.5 h-3.5"
                          />
                          {report.statusLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {report.isPoptScheduled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 text-indigo-800 text-xs font-semibold border border-indigo-200">
                              <StatusIcon name="calendar" className="w-3.5 h-3.5" />
                              POPT {report.poptVisitDate}
                            </span>
                          ) : isRed ? (
                            <button
                              onClick={() => handleOpenScheduleModal(report)}
                              className="min-h-[44px] px-3 py-1.5 inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-red-600"
                            >
                              <StatusIcon name="calendar" className="w-4 h-4" />
                              Jadwalkan Kunjungan POPT
                            </button>
                          ) : null}

                          {report.isVerified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 rounded border border-emerald-300">
                              <StatusIcon name="check" className="w-3.5 h-3.5 text-emerald-600" />
                              Terverifikasi
                            </span>
                          ) : (
                            <button
                              onClick={() => handleVerify(report.id)}
                              className="min-h-[44px] px-3.5 py-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 hover:text-slate-950 active:bg-slate-300 border border-slate-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                            >
                              <StatusIcon name="user-check" className="w-4 h-4 text-slate-600" />
                              Tandai Verifikasi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Jadwalkan Kunjungan POPT */}
      {selectedReport && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-surface-card rounded-3xl shadow-bento-lg max-w-md w-full p-6 space-y-4 border-[1.5px] border-border-card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-content-primary">
                  Jadwalkan Kunjungan Lapangan POPT
                </h2>
                <p className="text-xs text-content-muted mt-0.5">
                  Tindak lanjut laporan gejala berat (Kode 2) di wilayah binaan.
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="min-h-[44px] min-w-[44px] text-content-muted hover:text-content-primary hover:bg-surface-subtle inline-flex items-center justify-center rounded-xl transition-colors"
                aria-label="Tutup dialog"
              >
                <StatusIcon name="x" className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div>
                <strong className="text-slate-700">Pelapor:</strong> {selectedReport.farmerName} (
                {selectedReport.poktan})
              </div>
              <div>
                <strong className="text-slate-700">Lokasi:</strong> {selectedReport.dusun}
              </div>
              <div>
                <strong className="text-slate-700">Laporan:</strong>{" "}
                <code className="font-mono text-red-700">{selectedReport.rawMessage}</code>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Tanggal Kunjungan Lapangan:
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="min-h-[48px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--agri-primary-700)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Catatan Awal Petugas POPT:
                </label>
                <textarea
                  rows={3}
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Instruksi pengamatan rumpun padi, sampel nimfa..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--agri-primary-700)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="min-h-[48px] px-4 py-2 text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 hover:text-slate-950 active:bg-slate-300 border border-slate-300 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="min-h-[48px] px-4 py-2 text-sm font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs"
              >
                Konfirmasi Jadwal POPT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Simulasi Laporan Baru */}
      {showSimModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Simulasi Laporan Baru (SMS/WA)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Uji coba alur masuk laporan petani ke feed secara instan.
                </p>
              </div>
              <button
                onClick={() => setShowSimModal(false)}
                className="min-h-[44px] min-w-[44px] text-content-muted hover:text-content-primary hover:bg-surface-subtle inline-flex items-center justify-center rounded-xl transition-colors"
                aria-label="Tutup dialog"
              >
                <StatusIcon name="x" className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateNewReport} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Petani:
                </label>
                <input
                  type="text"
                  required
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="min-h-[44px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kelompok Tani:
                </label>
                <input
                  type="text"
                  required
                  value={simPoktan}
                  onChange={(e) => setSimPoktan(e.target.value)}
                  className="min-h-[44px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dusun / Wilayah:
                </label>
                <select
                  value={simDusun}
                  onChange={(e) => setSimDusun(e.target.value)}
                  className="min-h-[44px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                >
                  <option value="Dusun I">Dusun I</option>
                  <option value="Dusun II">Dusun II</option>
                  <option value="Dusun III">Dusun III</option>
                  <option value="Dusun IV">Dusun IV</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Gejala Lapangan:
                </label>
                <select
                  value={simCode}
                  onChange={(e) => setSimCode(Number(e.target.value) as 0 | 1 | 2)}
                  className="min-h-[44px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                >
                  <option value={0}>0 - Aman (0 ekor)</option>
                  <option value={1}>1 - Waspada (1-4 ekor/rumpun)</option>
                  <option value={2}>2 - Bahaya (&gt;=5 ekor/rumpun)</option>
                </select>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-700">
                Format SMS/WA: LAPOR {simDusun.replace(" ", "-")} {simCode}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  className="min-h-[48px] px-4 py-2 text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 hover:text-slate-950 active:bg-slate-300 border border-slate-300 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[48px] px-4 py-2 text-sm font-bold text-white bg-[var(--agri-primary-700)] hover:bg-[var(--agri-primary-800)] rounded-lg shadow-xs"
                >
                  Kirim Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
