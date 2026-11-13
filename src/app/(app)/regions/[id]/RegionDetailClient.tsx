"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { PILOT_REGION, INITIAL_CONTACTS } from "@/lib/prototype-data";
import { StatusIcon } from "@/components/agro/StatusIcon";

interface RegionDetailClientProps {
  params: Promise<{ id: string }>;
}

export function RegionDetailClient({ params }: RegionDetailClientProps) {
  const resolvedParams = use(params);
  const [region, setRegion] = useState(PILOT_REGION);
  const [unmaskedPhones, setUnmaskedPhones] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSimulatingIngest, setIsSimulatingIngest] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const togglePhoneMask = (id: string) => {
    setUnmaskedPhones((prev) => {
      const next = !prev[id];
      showToast(next ? "Sensor nomor HP dibuka sementara untuk keperluan dinas." : "Nomor HP kembali disensor.");
      return { ...prev, [id]: next };
    });
  };

  const handleSimulateIngest = () => {
    setIsSimulatingIngest(true);
    setTimeout(() => {
      setIsSimulatingIngest(false);
      showToast("Ingest data satelit Open-Meteo & BMKG sukses diperbarui untuk Nagari Sungai Bangek.");
    }, 800);
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

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/dashboard" className="hover:text-slate-800 hover:underline">
          Dasbor
        </Link>
        <span>/</span>
        <Link href="/bpp" className="hover:text-slate-800 hover:underline">
          Wilayah BPP
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">{region.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {region.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-red-100 text-red-900 border border-red-300">
              STATUS MERAH
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Kode Wilayah BPS: <span className="font-mono font-semibold">{region.code}</span> &bull; ID:{" "}
            <span className="font-mono text-[11px] text-slate-500">{resolvedParams.id}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateIngest}
            disabled={isSimulatingIngest}
            className="min-h-[48px] px-3.5 py-2 inline-flex items-center gap-2 bg-slate-100 border border-slate-300 text-slate-800 hover:bg-slate-200 hover:text-slate-950 active:bg-slate-300 text-sm font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
          >
            <StatusIcon name="cloud-rain" className="w-4 h-4 text-slate-600" />
            <span>{isSimulatingIngest ? "Memperbarui Data..." : "Perbarui Data Cuaca"}</span>
          </button>

          <Link
            href="/drafts/44444444-4444-4444-8444-444444444401"
            className="min-h-[48px] px-4 py-2 inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white text-sm font-bold rounded-lg shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <StatusIcon name="shield-alert" className="w-4 h-4" />
            <span>Tinjau Draf Peringatan</span>
          </Link>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Rerata Suhu (T)
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">{region.tMean}</span>
            <span className="text-sm font-semibold text-slate-600">&deg;C</span>
          </div>
          <div className="text-xs text-amber-700 mt-1">Rentang optimum wereng: 25-29&deg;C</div>
        </div>

        <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-red-900">
            Rerata Kelembapan (RH)
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-red-700">{region.rhMean}</span>
            <span className="text-sm font-semibold text-red-700">%</span>
          </div>
          <div className="text-xs text-red-700 font-medium mt-1">Melebihi ambang batas 85%</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Curah Hujan Harian
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">{region.precipMm}</span>
            <span className="text-sm font-semibold text-slate-600">mm</span>
          </div>
          <div className="text-xs text-slate-600 mt-1">Hujan rintik diselingi panas lembap</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Cakupan Petani Terdaftar
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">{region.farmerCount}</span>
            <span className="text-sm font-semibold text-slate-600">Orang</span>
          </div>
          <div className="text-xs text-slate-600 mt-1">Dalam {region.poktanCount} Kelompok Tani</div>
        </div>
      </div>

      {/* 7-Day Weather Trend Chart (SVG) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Tren Agroklimat 7 Hari Terakhir &amp; Prediksi
            </h2>
            <p className="text-xs text-slate-500">
              Grafik garis kelembapan (RH) dan temperatur (T) harian berbanding ambang bahaya.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-red-600 rounded-sm" />
              <span>RH Mean (%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-blue-600 rounded-sm" />
              <span>Suhu (&deg;C)</span>
            </div>
          </div>
        </div>

        {/* Responsive Weather Trend SVG */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px]">
            <svg viewBox="0 0 600 200" className="w-full h-48">
              {/* Threshold line RH 85% */}
              <line
                x1="40"
                y1="60"
                x2="580"
                y2="60"
                stroke="#DC2626"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <text x="585" y="64" fill="#DC2626" fontSize="10" fontWeight="bold">
                85% (Kritis)
              </text>

              {/* Threshold line RH 80% */}
              <line
                x1="40"
                y1="100"
                x2="580"
                y2="100"
                stroke="#D97706"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <text x="585" y="104" fill="#D97706" fontSize="10" fontWeight="bold">
                80% (Waspada)
              </text>

              {/* Data points for 7 days */}
              {region.weatherTrend.map((day, idx) => {
                const x = 70 + idx * 75;
                // RH mapped between 70% and 95% -> y = 200 - ((rh - 70) / 25) * 160
                const yRh = 180 - ((day.rhMean - 70) / 25) * 140;
                // T mapped between 20C and 35C -> y = 190 - ((t - 20) / 15) * 120
                const yT = 180 - ((day.tMean - 20) / 15) * 120;

                return (
                  <g key={day.date}>
                    {/* Day label */}
                    <text
                      x={x}
                      y="195"
                      fill="#64748B"
                      fontSize="11"
                      textAnchor="middle"
                      fontWeight="500"
                    >
                      {day.day} ({day.date})
                    </text>

                    {/* RH bar column background */}
                    <rect
                      x={x - 14}
                      y={yRh}
                      width="12"
                      height={180 - yRh}
                      fill="#FCA5A5"
                      rx="3"
                    />

                    {/* Temperature marker */}
                    <circle cx={x + 6} cy={yT} r="4" fill="#2563EB" />

                    {/* Value labels */}
                    <text
                      x={x - 8}
                      y={yRh - 4}
                      fill="#991B1B"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {day.rhMean}%
                    </text>
                    <text
                      x={x + 6}
                      y={yT - 6}
                      fill="#1E40AF"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {day.tMean}&deg;
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Farmer Contacts in this Region */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Daftar Petani Terdaftar di {region.name}
            </h2>
            <p className="text-xs text-slate-500">
              Nomor kontak disensor sesuai kebijakan PII dan perlindungan data pribadi (§11).
            </p>
          </div>

          <Link
            href="/admin/contacts"
            className="min-h-[40px] px-3.5 py-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors"
          >
            <StatusIcon name="users" className="w-4 h-4 text-emerald-700" />
            <span>Kelola Semua Kontak &rarr;</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
              <tr>
                <th className="py-3 px-4">Nama Petani</th>
                <th className="py-3 px-4">Kelompok Tani</th>
                <th className="py-3 px-4">Dusun</th>
                <th className="py-3 px-4">Nomor HP (PII)</th>
                <th className="py-3 px-4">Saluran</th>
                <th className="py-3 px-4 text-right">Aksi Privasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {INITIAL_CONTACTS.slice(0, 4).map((c) => {
                const isUnmasked = !!unmaskedPhones[c.id];

                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{c.poktan}</td>
                    <td className="py-3.5 px-4 text-slate-600">{c.dusun}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-800">
                      {isUnmasked ? (
                        <span className="font-bold text-emerald-800">{c.phone}</span>
                      ) : (
                        <span>{c.phoneMasked}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase bg-slate-100 text-slate-700">
                        {c.channel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => togglePhoneMask(c.id)}
                        className="min-h-[40px] px-3 py-1 inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 hover:text-slate-950 active:bg-slate-300 border border-slate-300 rounded-lg transition-colors"
                      >
                        <StatusIcon name={isUnmasked ? "eye-off" : "eye"} className="w-4 h-4 text-slate-600" />
                        <span>{isUnmasked ? "Tutup Sensor" : "Buka Sensor"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
