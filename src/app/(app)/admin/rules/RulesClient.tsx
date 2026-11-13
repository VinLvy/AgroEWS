"use client";

import React, { useState } from "react";
import { INITIAL_RULE_VERSIONS, type PrototypeRuleVersion } from "@/lib/prototype-data";
import { StatusIcon } from "@/components/agro/StatusIcon";

export function RulesClient() {
  const [ruleVersions, setRuleVersions] = useState<PrototypeRuleVersion[]>(INITIAL_RULE_VERSIONS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Rule Simulator State
  const [simTemp, setSimTemp] = useState<number>(27.2);
  const [simRh, setSimRh] = useState<number>(86.5);
  const [simRunDays, setSimRunDays] = useState<number>(3);

  // New Version Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newVersionTitle, setNewVersionTitle] = useState<string>("Kalibrasi Musim Hujan 2026/2027");
  const [newVersionNum, setNewVersionNum] = useState<string>("v1.1.0");
  const [newTOptMin, setNewTOptMin] = useState<number>(25.0);
  const [newTOptMax, setNewTOptMax] = useState<number>(29.0);
  const [newRhRed, setNewRhRed] = useState<number>(85.0);
  const [newRhAmber, setNewRhAmber] = useState<number>(80.0);
  const [newRedRun, setNewRedRun] = useState<number>(3);
  const [newAmberRun, setNewAmberRun] = useState<number>(2);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const activeRule = ruleVersions.find((r) => r.isActive) || ruleVersions[0]!;

  // Interactive Rule Calculation
  const calculateSimStatus = () => {
    const p = activeRule.params;
    const isTempOptimum = simTemp >= p.tOptimumMin && simTemp <= p.tOptimumMax;

    if (isTempOptimum && simRh >= p.rhRedThreshold && simRunDays >= p.redRunDays) {
      return {
        status: "red" as const,
        label: "STATUS MERAH (Bahaya Ledakan Populasi)",
        reason: `Suhu (${simTemp}°C) berada di rentang optimum (${p.tOptimumMin}-${p.tOptimumMax}°C) dan RH (${simRh}%) >= ${p.rhRedThreshold}% selama ${simRunDays} hari (>= ${p.redRunDays} hari).`,
      };
    }

    if (isTempOptimum && simRh >= p.rhAmberThreshold && simRunDays >= p.amberRunDays) {
      return {
        status: "amber" as const,
        label: "STATUS AMBER (Waspada Peningkatan Nimfa)",
        reason: `Suhu optimum terpenuhi dan RH (${simRh}%) >= ${p.rhAmberThreshold}% selama ${simRunDays} hari.`,
      };
    }

    return {
      status: "green" as const,
      label: "STATUS HIJAU (Aman / Terkendali)",
      reason: "Indikator cuaca tidak memenuhi kriteria bahaya ledakan wereng.",
    };
  };

  const simResult = calculateSimStatus();

  const handleActivateVersion = (version: string) => {
    setRuleVersions((prev) =>
      prev.map((r) => ({
        ...r,
        isActive: r.version === version,
      }))
    );
    showToast(`Versi aturan ${version} sekarang aktif sebagai acuan evaluasi risiko agroklimat.`);
  };

  const handleCreateVersion = (e: React.FormEvent) => {
    e.preventDefault();
    const newVersion: PrototypeRuleVersion = {
      version: newVersionNum,
      title: newVersionTitle,
      isActive: false,
      createdAt: new Date().toISOString().split("T")[0]!,
      author: "Pakar Perlindungan Tanaman (PPL)",
      params: {
        tOptimumMin: newTOptMin,
        tOptimumMax: newTOptMax,
        rhRedThreshold: newRhRed,
        rhAmberThreshold: newRhAmber,
        redRunDays: newRedRun,
        amberRunDays: newAmberRun,
      },
    };

    setRuleVersions([newVersion, ...ruleVersions]);
    setShowModal(false);
    showToast(`Draf aturan baru ${newVersionNum} berhasil disimpan.`);
  };

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Aturan Model Risiko Agroklimat
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Konfigurasi ambang batas biometeorologi wereng batang cokelat (*Nilaparvata lugens*) sesuai TECH_SPEC §6.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="min-h-[48px] px-4 py-2 inline-flex items-center gap-2 bg-[var(--agri-primary-700)] text-white hover:bg-[var(--agri-primary-800)] text-sm font-semibold rounded-lg shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          <StatusIcon name="plus" className="w-4 h-4" />
          <span>Buat Draf Aturan Baru</span>
        </button>
      </div>

      {/* Active Rule Card */}
      <div className="bg-white rounded-xl border-2 border-emerald-600 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider">
              VERSI AKTIF
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              {activeRule.version} &mdash; {activeRule.title}
            </h2>
          </div>
          <div className="text-xs text-slate-500">
            Dibuat oleh: <span className="font-semibold text-slate-700">{activeRule.author}</span> ({activeRule.createdAt})
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-600 uppercase">
              Rentang Suhu Optimum
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {activeRule.params.tOptimumMin}&deg;C &ndash; {activeRule.params.tOptimumMax}&deg;C
            </div>
            <p className="text-xs text-slate-500 mt-1">Zona laju penetasan telur tertinggi</p>
          </div>

          <div className="p-3.5 bg-red-50 rounded-lg border border-red-200">
            <span className="text-xs font-semibold text-red-900 uppercase">
              Ambang Batas MERAH (Bahaya)
            </span>
            <div className="text-xl font-bold text-red-700 mt-1">
              RH &ge; {activeRule.params.rhRedThreshold}% &bull; {activeRule.params.redRunDays} Hari
            </div>
            <p className="text-xs text-red-800 mt-1">Pemicu draf peringatan ledakan nimfa</p>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200">
            <span className="text-xs font-semibold text-amber-900 uppercase">
              Ambang Batas AMBER (Waspada)
            </span>
            <div className="text-xl font-bold text-amber-800 mt-1">
              RH &ge; {activeRule.params.rhAmberThreshold}% &bull; {activeRule.params.amberRunDays} Hari
            </div>
            <p className="text-xs text-amber-900 mt-1">Pemicu peringatan sanitasi dan pengamatan</p>
          </div>
        </div>
      </div>

      {/* Interactive Simulator Sandbox */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            Simulator Evaluasi Risiko Cuaca (Interaktif)
          </h2>
          <p className="text-xs text-slate-500">
            Uji respons logika model terhadap kombinasi variabel suhu, kelembapan, dan durasi hari.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Suhu Rerata (T):</span>
              <span className="font-bold text-slate-900">{simTemp.toFixed(1)}&deg;C</span>
            </div>
            <input
              type="range"
              min="20"
              max="35"
              step="0.1"
              value={simTemp}
              onChange={(e) => setSimTemp(parseFloat(e.target.value))}
              className="w-full accent-[var(--agri-primary-700)] h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>20&deg;C</span>
              <span>27&deg;C</span>
              <span>35&deg;C</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Kelembapan Rerata (RH):</span>
              <span className="font-bold text-slate-900">{simRh.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="65"
              max="98"
              step="0.5"
              value={simRh}
              onChange={(e) => setSimRh(parseFloat(e.target.value))}
              className="w-full accent-red-600 h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>65%</span>
              <span>85%</span>
              <span>98%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Durasi Hari Berturut-turut:</span>
              <span className="font-bold text-slate-900">{simRunDays} Hari</span>
            </div>
            <input
              type="range"
              min="1"
              max="7"
              step="1"
              value={simRunDays}
              onChange={(e) => setSimRunDays(parseInt(e.target.value, 10))}
              className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>1 Hari</span>
              <span>3 Hari</span>
              <span>7 Hari</span>
            </div>
          </div>
        </div>

        {/* Calculated Result Box */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            simResult.status === "red"
              ? "bg-red-50 border-red-300 text-red-900"
              : simResult.status === "amber"
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-emerald-50 border-emerald-300 text-emerald-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <StatusIcon
              name={
                simResult.status === "red"
                  ? "shield-alert"
                  : simResult.status === "amber"
                  ? "triangle-alert"
                  : "shield-check"
              }
              className="w-5 h-5"
            />
            <span className="font-bold text-sm tracking-tight">{simResult.label}</span>
          </div>
          <p className="text-xs mt-1.5 leading-relaxed">{simResult.reason}</p>
        </div>
      </div>

      {/* Rule Versions History Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">Riwayat Versi Aturan (rule_versions)</h2>
          <p className="text-xs text-slate-500">
            Sistem hanya mengizinkan tepat satu versi aturan aktif pada waktu bersamaan (§4 skema).
          </p>
        </div>

        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
            <tr>
              <th className="py-3 px-4">Versi</th>
              <th className="py-3 px-4">Keterangan / Judul</th>
              <th className="py-3 px-4">Parameter Kunci</th>
              <th className="py-3 px-4">Tanggal Dibuat</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {ruleVersions.map((rule) => (
              <tr key={rule.version} className="hover:bg-slate-50">
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{rule.version}</td>
                <td className="py-3.5 px-4 font-semibold text-slate-800">{rule.title}</td>
                <td className="py-3.5 px-4 text-xs font-mono text-slate-700">
                  T:[{rule.params.tOptimumMin}-{rule.params.tOptimumMax}&deg;] &bull; RED: RH&ge;
                  {rule.params.rhRedThreshold}% ({rule.params.redRunDays}h)
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">{rule.createdAt}</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      rule.isActive
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {rule.isActive ? "Aktif" : "Arsip"}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  {rule.isActive ? (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-300">
                      Sedang Digunakan
                    </span>
                  ) : (
                    <button
                      onClick={() => handleActivateVersion(rule.version)}
                      className="min-h-[40px] px-3 py-1 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 border border-emerald-300 rounded-lg transition-colors"
                    >
                      Aktifkan Versi Ini
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Buat Draf Aturan Baru */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Buat Draf Versi Aturan Baru</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Modifikasi parameter ambang batas untuk kalibrasi lapangan.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-slate-600 inline-flex items-center justify-center rounded-lg"
                aria-label="Tutup dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVersion} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Label Versi:
                  </label>
                  <input
                    type="text"
                    required
                    value={newVersionNum}
                    onChange={(e) => setNewVersionNum(e.target.value)}
                    className="min-h-[44px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama / Judul Kalibrasi:
                  </label>
                  <input
                    type="text"
                    required
                    value={newVersionTitle}
                    onChange={(e) => setNewVersionTitle(e.target.value)}
                    className="min-h-[44px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    T Optimum Min (&deg;C):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newTOptMin}
                    onChange={(e) => setNewTOptMin(parseFloat(e.target.value))}
                    className="min-h-[44px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    T Optimum Max (&deg;C):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newTOptMax}
                    onChange={(e) => setNewTOptMax(parseFloat(e.target.value))}
                    className="min-h-[44px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ambang Batas RH MERAH (%):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newRhRed}
                    onChange={(e) => setNewRhRed(parseFloat(e.target.value))}
                    className="min-h-[44px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Durasi Run MERAH (Hari):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={newRedRun}
                    onChange={(e) => setNewRedRun(parseInt(e.target.value, 10))}
                    className="min-h-[44px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ambang Batas RH AMBER (%):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newRhAmber}
                    onChange={(e) => setNewRhAmber(parseFloat(e.target.value))}
                    className="min-h-[44px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Durasi Run AMBER (Hari):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={newAmberRun}
                    onChange={(e) => setNewAmberRun(parseInt(e.target.value, 10))}
                    className="min-h-[44px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="min-h-[48px] px-4 py-2 text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 hover:text-slate-950 active:bg-slate-300 border border-slate-300 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[48px] px-4 py-2 text-sm font-bold text-white bg-[var(--agri-primary-700)] hover:bg-[var(--agri-primary-800)] rounded-lg shadow-xs"
                >
                  Simpan Draf Versi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
