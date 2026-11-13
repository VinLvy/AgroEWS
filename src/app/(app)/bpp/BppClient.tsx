"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BPP_SUMMARY } from "@/lib/prototype-data";
import { StatusIcon } from "@/components/agro/StatusIcon";

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
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Balai Penyuluhan Pertanian (BPP)</span>
            <span>&bull;</span>
            <span>{BPP_SUMMARY.kabupatenName}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Ikhtisar Agroklimat {BPP_SUMMARY.kecamatanName}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Pembaruan Asesmen Model: {BPP_SUMMARY.lastEvaluation}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="min-h-[48px] px-3.5 py-2 inline-flex items-center gap-2 bg-slate-100 border border-slate-300 text-slate-800 hover:bg-slate-200 hover:text-slate-950 active:bg-slate-300 text-sm font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <StatusIcon name="download" className="w-4 h-4 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => setShowInstructionModal(true)}
            className="min-h-[48px] px-4 py-2 inline-flex items-center gap-2 bg-[var(--agri-primary-700)] text-white hover:bg-[var(--agri-primary-800)] active:bg-emerald-950 text-sm font-bold rounded-lg shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <StatusIcon name="send" className="w-4 h-4" />
            <span>Kirim Instruksi BPP</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (T4.4 Specification) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-600">
            <span>Partisipasi LAPOR (KPI 2)</span>
            <StatusIcon name="activity" className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {BPP_SUMMARY.kpi.participationRate}%
            </span>
            <span className="text-xs text-emerald-700 font-semibold">
              &gt; Target {BPP_SUMMARY.kpi.participationTarget}%
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full"
              style={{ width: `${BPP_SUMMARY.kpi.participationRate}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-600">
            <span>Kesesuaian Status (KPI 1)</span>
            <StatusIcon name="shield-check" className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {BPP_SUMMARY.kpi.accuracyRate}%
            </span>
            <span className="text-xs text-slate-500 font-medium">validasi lapangan</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${BPP_SUMMARY.kpi.accuracyRate}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-red-900">
            <span>Wilayah Bahaya (MERAH)</span>
            <StatusIcon name="shield-alert" className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-700">1</span>
            <span className="text-xs text-red-700 font-medium">Nagari Sungai Bangek</span>
          </div>
          <p className="text-xs text-red-800 mt-2">Draf rekomendasi butuh pengawalan</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-600">
            <span>Cakupan Petani Binaan</span>
            <StatusIcon name="users" className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {BPP_SUMMARY.kpi.totalFarmers}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              di {BPP_SUMMARY.kpi.activePoktan} Poktan
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-2">100% nomor terverifikasi opt-in</p>
        </div>
      </div>

      {/* Main View: Interactive Choropleth Map + Side Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Map / Village List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Peta Zonasi Agroklimat Desa Pilot
              </h2>
              <p className="text-xs text-slate-500">
                Klik salah satu wilayah desa untuk meninjau status agroklimat dan laporan.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode("map")}
                className={`min-h-[38px] px-3.5 py-1 text-xs font-bold rounded-md transition-colors ${
                  viewMode === "map"
                    ? "bg-white text-slate-950 shadow-xs"
                    : "text-slate-700 hover:text-slate-950 hover:bg-slate-200"
                }`}
              >
                Peta SVG
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`min-h-[38px] px-3.5 py-1 text-xs font-bold rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-white text-slate-950 shadow-xs"
                    : "text-slate-700 hover:text-slate-950 hover:bg-slate-200"
                }`}
              >
                Daftar Tabel
              </button>
            </div>
          </div>

          {viewMode === "map" ? (
            <div className="space-y-4">
              {/* Interactive SVG Choropleth Map */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center">
                <svg
                  viewBox="0 0 600 350"
                  className="w-full max-h-[340px] drop-shadow-xs"
                  role="img"
                  aria-label="Peta Zonasi Agroklimat Kecamatan Kuranji"
                >
                  {/* Village 1: Nagari Sungai Bangek (RED) */}
                  <g
                    className="cursor-pointer transition-transform hover:opacity-90"
                    onClick={() => setSelectedVillage("vil-01")}
                  >
                    <polygon
                      points="60,40 280,30 320,160 140,190 50,120"
                      fill={selectedVillage === "vil-01" ? "#DC2626" : "#EF4444"}
                      stroke={selectedVillage === "vil-01" ? "#991B1B" : "#B91C1C"}
                      strokeWidth={selectedVillage === "vil-01" ? 4 : 2}
                    />
                    <text
                      x="160"
                      y="105"
                      fill="#FFFFFF"
                      fontSize="14"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      Nagari Sungai Bangek
                    </text>
                    <text x="160" y="125" fill="#FEE2E2" fontSize="11" textAnchor="middle">
                      [MERAH: RH 86.5%]
                    </text>
                  </g>

                  {/* Village 2: Kelurahan Balai Gadang (AMBER) */}
                  <g
                    className="cursor-pointer transition-transform hover:opacity-90"
                    onClick={() => setSelectedVillage("vil-02")}
                  >
                    <polygon
                      points="280,30 520,50 560,180 320,160"
                      fill={selectedVillage === "vil-02" ? "#D97706" : "#F59E0B"}
                      stroke={selectedVillage === "vil-02" ? "#92400E" : "#B45309"}
                      strokeWidth={selectedVillage === "vil-02" ? 4 : 2}
                    />
                    <text
                      x="410"
                      y="105"
                      fill="#FFFFFF"
                      fontSize="14"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      Kel. Balai Gadang
                    </text>
                    <text x="410" y="125" fill="#FEF3C7" fontSize="11" textAnchor="middle">
                      [WASPADA: RH 82.3%]
                    </text>
                  </g>

                  {/* Village 3: Kelurahan Kuranji Timur (GREEN) */}
                  <g
                    className="cursor-pointer transition-transform hover:opacity-90"
                    onClick={() => setSelectedVillage("vil-03")}
                  >
                    <polygon
                      points="140,190 320,160 380,310 180,320 110,260"
                      fill={selectedVillage === "vil-03" ? "#047857" : "#10B981"}
                      stroke={selectedVillage === "vil-03" ? "#064E3B" : "#047857"}
                      strokeWidth={selectedVillage === "vil-03" ? 4 : 2}
                    />
                    <text
                      x="240"
                      y="245"
                      fill="#FFFFFF"
                      fontSize="14"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      Kel. Kuranji Timur
                    </text>
                    <text x="240" y="265" fill="#D1FAE5" fontSize="11" textAnchor="middle">
                      [HIJAU: RH 74.5%]
                    </text>
                  </g>

                  {/* Village 4: Kelurahan Gunung Sarik (GREEN) */}
                  <g
                    className="cursor-pointer transition-transform hover:opacity-90"
                    onClick={() => setSelectedVillage("vil-04")}
                  >
                    <polygon
                      points="320,160 560,180 540,310 380,310"
                      fill={selectedVillage === "vil-04" ? "#047857" : "#10B981"}
                      stroke={selectedVillage === "vil-04" ? "#064E3B" : "#047857"}
                      strokeWidth={selectedVillage === "vil-04" ? 4 : 2}
                    />
                    <text
                      x="450"
                      y="245"
                      fill="#FFFFFF"
                      fontSize="14"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      Kel. Gunung Sarik
                    </text>
                    <text x="450" y="265" fill="#D1FAE5" fontSize="11" textAnchor="middle">
                      [HIJAU: RH 76.1%]
                    </text>
                  </g>
                </svg>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-600" />
                    <span>MERAH: Bahaya Ledakan Wereng (RH &gt;= 85%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500" />
                    <span>AMBER: Waspada Agroklimat (RH &gt;= 80%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-600" />
                    <span>HIJAU: Kondisi Aman Terkendali</span>
                  </div>
                </div>
              </div>
            </div>
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
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Inspektur Wilayah Terpilih
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              {activeVillageData.name}
            </h3>
          </div>

          <div className="space-y-3">
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

          <div className="pt-2 space-y-2">
            <Link
              href="/regions/22222222-2222-4222-8222-222222222201"
              className="min-h-[48px] w-full px-4 py-2.5 inline-flex items-center justify-center gap-2 bg-[var(--agri-primary-700)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--agri-primary-800)] transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <span>Buka Profil Lengkap Wilayah</span>
              <StatusIcon name="arrow-right" className="w-4 h-4" />
            </Link>

            <Link
              href="/reports"
              className="min-h-[48px] w-full px-4 py-2.5 inline-flex items-center justify-center gap-2 bg-slate-100 border border-slate-300 text-slate-800 text-sm font-bold rounded-lg hover:bg-slate-200 hover:text-slate-950 active:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <StatusIcon name="file-text" className="w-4 h-4 text-slate-600" />
              <span>Lihat Feed Laporan Masuk</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal: Kirim Instruksi BPP */}
      {showInstructionModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Kirim Instruksi Pengendalian Serentak
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Disiarkan ke seluruh PPL dan Ketua Poktan di {BPP_SUMMARY.kecamatanName}.
                </p>
              </div>
              <button
                onClick={() => setShowInstructionModal(false)}
                className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-slate-600 inline-flex items-center justify-center rounded-lg"
                aria-label="Tutup dialog"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Pesan Arahan Tindakan:
                </label>
                <textarea
                  rows={4}
                  value={instructionText}
                  onChange={(e) => setInstructionText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--agri-primary-700)]"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                Instruksi akan dikirimkan serentak via WhatsApp &amp; Telegram Gateway kepada{" "}
                <strong>{BPP_SUMMARY.kpi.totalFarmers} penerima terdaftar</strong>.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowInstructionModal(false)}
                className="min-h-[48px] px-4 py-2 text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 hover:text-slate-950 active:bg-slate-300 border border-slate-300 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendInstruction}
                className="min-h-[48px] px-4 py-2 text-sm font-bold text-white bg-[var(--agri-primary-700)] hover:bg-[var(--agri-primary-800)] rounded-lg shadow-xs"
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
