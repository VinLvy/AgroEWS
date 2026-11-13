"use client";

import React, { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { PILOT_REGION, INITIAL_CONTACTS } from "@/lib/prototype-data";
import { StatusIcon } from "@/components/agro/StatusIcon";
import { ClimateTrendChart } from "@/components/agro/ClimateTrendChart";

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content-primary">
              {region.name}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-status-red-bg text-status-red-text border border-status-red-border">
              STATUS MERAH
            </span>
          </div>
          <p className="text-xs font-medium text-content-muted mt-1">
            Kode Wilayah BPS: <span className="font-mono font-bold text-content-secondary">{region.code}</span> &bull; ID:{" "}
            <span className="font-mono text-[11px] text-content-muted">{resolvedParams.id}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSimulateIngest}
            disabled={isSimulatingIngest}
            className="min-h-[48px] px-4 py-2.5 inline-flex items-center gap-2 bg-surface-card border-[1.5px] border-border-card text-content-primary hover:bg-surface-subtle text-sm font-bold rounded-xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-agri-700 disabled:opacity-50"
          >
            <StatusIcon name="cloud-rain" className="w-4 h-4 text-content-secondary" />
            <span>{isSimulatingIngest ? "Memperbarui Data..." : "Perbarui Data Cuaca"}</span>
          </button>

          <Link
            href="/drafts/44444444-4444-4444-8444-444444444401"
            className="min-h-[48px] px-5 py-2.5 inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white text-sm font-bold rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <StatusIcon name="shield-alert" className="w-4 h-4" />
            <span>Tinjau Draf Peringatan</span>
          </Link>
        </div>
      </div>

      {/* Terrace Agroclimate Visual Card */}
      <div className="relative rounded-3xl overflow-hidden border-[1.5px] border-border-card shadow-bento bg-agri-900">
        <Image
          src="/images/kuranji-terrace-landscape.webp"
          alt="Hamparan sawah terasering wilayah binaan Nagari Sungai Bangek Kecamatan Kuranji"
          width={960}
          height={535}
          unoptimized
          className="w-full h-44 sm:h-52 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent flex flex-col justify-end p-5 sm:p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 block">
                Lanskap Persawahan Binaan &bull; Kota Padang
              </span>
              <p className="text-sm sm:text-base font-extrabold mt-0.5">
                {region.name} &mdash; Pemantauan Grid Satelit Terbuka ({region.poktanCount} Kelompok Tani)
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-950/80 border border-white/25 text-xs font-mono font-bold text-white">
              Open-Meteo ERA5 + BMKG
            </span>
          </div>
        </div>
      </div>

      {/* Summary Bento Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-3xl border-[1.5px] border-border-card bg-surface-card shadow-bento">
          <div className="text-xs font-bold uppercase tracking-wider text-content-muted">
            Rerata Suhu (T)
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-content-primary tabular-nums">{region.tMean}</span>
            <span className="text-sm font-bold text-content-muted">&deg;C</span>
          </div>
          <div className="text-xs font-semibold text-status-amber-text mt-2">Rentang optimum wereng: 25-29&deg;C</div>
        </div>

        <div className="p-5 rounded-3xl border-[1.5px] border-status-red-border bg-surface-card shadow-bento">
          <div className="text-xs font-bold uppercase tracking-wider text-status-red-text">
            Rerata Kelembapan (RH)
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-status-red-text tabular-nums">{region.rhMean}</span>
            <span className="text-sm font-bold text-status-red-text">%</span>
          </div>
          <div className="text-xs text-status-red-text font-semibold mt-2">Melebihi ambang batas 85%</div>
        </div>

        <div className="p-5 rounded-3xl border-[1.5px] border-border-card bg-surface-card shadow-bento">
          <div className="text-xs font-bold uppercase tracking-wider text-content-muted">
            Curah Hujan Harian
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-content-primary tabular-nums">{region.precipMm}</span>
            <span className="text-sm font-bold text-content-muted">mm</span>
          </div>
          <div className="text-xs font-medium text-content-secondary mt-2">Hujan rintik diselingi panas lembap</div>
        </div>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-agri-700 to-agri-900 text-white shadow-bento">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-100">
            Cakupan Petani Terdaftar
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tabular-nums">{region.farmerCount}</span>
            <span className="text-sm font-bold text-emerald-100">Orang</span>
          </div>
          <div className="text-xs font-medium text-emerald-100 mt-2">Dalam {region.poktanCount} Kelompok Tani</div>
        </div>
      </div>

      {/* 7-Day Weather Trend Chart (Synchronized AgriCore Dual-Track SVG) */}
      <ClimateTrendChart trend={region.weatherTrend} />

      {/* Farmer Contacts in this Region */}
      <div className="bg-surface-card rounded-3xl border-[1.5px] border-border-card overflow-hidden shadow-bento">
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
