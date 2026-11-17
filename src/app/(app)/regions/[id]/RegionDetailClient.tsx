"use client";

import React, { useEffect, useRef, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { PILOT_REGION, INITIAL_CONTACTS, type PrototypeRegion } from "@/lib/prototype-data";
import { StatusIcon } from "@/components/agro/StatusIcon";
import { ClimateTrendChart } from "@/components/agro/ClimateTrendChart";

type PresetKey = "kuranji" | "banyubiru" | "tulungagung" | "deli-serdang";
type WeatherSource = "open-meteo" | "bmkg" | "cache" | "fallback-demo" | "pilot-static";

interface LiveRegionState extends PrototypeRegion {
  subtitle: string;
  lat: number;
  lng: number;
}

interface TelemetryMeta {
  source: WeatherSource;
  isDegraded: boolean;
  latencyMs: number | null;
  evaluatedAt: string | null;
}

interface LiveWeatherApiResponse {
  preset: PresetKey;
  region: LiveRegionState;
  meta: {
    source: "open-meteo" | "bmkg" | "cache" | "fallback-demo";
    isDegraded: boolean;
    latencyMs: number;
    evaluatedAt: string;
  };
}

const LIVE_PRESETS: ReadonlyArray<{ key: PresetKey; label: string; coords: string }> = [
  { key: "kuranji", label: "Kuranji (Padang)", coords: "-0.820, 100.365" },
  { key: "banyubiru", label: "Banyubiru (Semarang - KTI)", coords: "-7.300, 110.400" },
  { key: "tulungagung", label: "Tulungagung (Jatim)", coords: "-8.065, 111.905" },
  { key: "deli-serdang", label: "Deli Serdang (Sumut)", coords: "3.630, 98.770" },
];

const INITIAL_REGION_STATE: LiveRegionState = {
  ...PILOT_REGION,
  subtitle: "Kec. Kuranji, Kota Padang (Sumatera Barat)",
  lat: -0.820,
  lng: 100.365,
};

function formatSourceLabel(source: WeatherSource): string {
  switch (source) {
    case "open-meteo":
      return "Open-Meteo Live";
    case "bmkg":
      return "BMKG API (Failover)";
    case "cache":
      return "Cache DB Snapshot";
    case "fallback-demo":
      return "Fallback Demo (Offline)";
    default:
      return "Dataset Pilot";
  }
}

interface RegionDetailClientProps {
  params: Promise<{ id: string }>;
}

export function RegionDetailClient({ params }: RegionDetailClientProps) {
  const resolvedParams = use(params);
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("kuranji");
  const [region, setRegion] = useState<LiveRegionState>(INITIAL_REGION_STATE);
  const [telemetry, setTelemetry] = useState<TelemetryMeta>({
    source: "pilot-static",
    isDegraded: false,
    latencyMs: null,
    evaluatedAt: null,
  });
  const [unmaskedPhones, setUnmaskedPhones] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSimulatingIngest, setIsSimulatingIngest] = useState<boolean>(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeqRef = useRef<number>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const fetchLivePreset = async (
    presetKey: PresetKey,
    options: { notify: boolean; signal?: AbortSignal }
  ) => {
    const reqId = ++requestSeqRef.current;
    if (options.notify) {
      setIsSimulatingIngest(true);
    }

    try {
      const res = await fetch(`/api/weather/live?preset=${encodeURIComponent(presetKey)}`, {
        cache: "no-store",
        signal: options.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const payload = (await res.json()) as LiveWeatherApiResponse;
      if (reqId !== requestSeqRef.current) return;

      setRegion(payload.region);
      setTelemetry({
        source: payload.meta.source,
        isDegraded: payload.meta.isDegraded,
        latencyMs: payload.meta.latencyMs,
        evaluatedAt: payload.meta.evaluatedAt,
      });

      if (options.notify) {
        showToast(
          `Ingest data satelit Open-Meteo & BMKG sukses diperbarui untuk ${payload.region.name} (${formatSourceLabel(payload.meta.source)}).`
        );
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      if (reqId !== requestSeqRef.current) return;

      if (options.notify) {
        showToast(
          `Ingest data satelit Open-Meteo & BMKG sukses diperbarui (cadangan lokal) untuk ${region.name}.`
        );
      }
    } finally {
      if (options.notify && reqId === requestSeqRef.current) {
        setIsSimulatingIngest(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void fetchLivePreset("kuranji", { notify: false, signal: controller.signal });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePhoneMask = (id: string) => {
    setUnmaskedPhones((prev) => {
      const next = !prev[id];
      showToast(next ? "Sensor nomor HP dibuka sementara untuk keperluan dinas." : "Nomor HP kembali disensor.");
      return { ...prev, [id]: next };
    });
  };

  const handleSimulateIngest = () => {
    void fetchLivePreset(selectedPreset, { notify: true });
  };

  const handleSelectPreset = (presetKey: PresetKey) => {
    setSelectedPreset(presetKey);
    void fetchLivePreset(presetKey, { notify: true });
  };

  const statusBadge =
    region.status === "red"
      ? {
          cls: "bg-status-red-bg text-status-red-text border-status-red-border",
          icon: "shield-alert" as const,
          label: "STATUS MERAH [BAHAYA]",
        }
      : region.status === "amber"
      ? {
          cls: "bg-status-amber-bg text-status-amber-text border-status-amber-border",
          icon: "triangle-alert" as const,
          label: "STATUS AMBER [WASPADA]",
        }
      : {
          cls: "bg-status-green-bg text-status-green-text border-status-green-border",
          icon: "shield-check" as const,
          label: "STATUS HIJAU [AMAN]",
        };

  const rhCardTone =
    region.rhMean >= 85
      ? {
          border: "border-status-red-border",
          text: "text-status-red-text",
          hint: "Melebihi ambang batas kritis 85%",
        }
      : region.rhMean >= 80
      ? {
          border: "border-status-amber-border",
          text: "text-status-amber-text",
          hint: "Berada di zona waspada 80-84%",
        }
      : {
          border: "border-border-card",
          text: "text-status-green-text",
          hint: "Di bawah ambang waspada 80%",
        };

  const precipHint =
    region.precipMm >= 1 && region.precipMm <= 5
      ? "Hujan rintik diselingi panas lembap"
      : region.precipMm > 5
      ? "Curah hujan tinggi membantu pencucian nimfa"
      : "Curah hujan minimal, pantau pengairan petak";

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
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase border inline-flex items-center gap-1.5 ${statusBadge.cls}`}
            >
              <StatusIcon name={statusBadge.icon} className="w-3.5 h-3.5" />
              <span>{statusBadge.label}</span>
            </span>
          </div>
          <p className="text-xs font-medium text-content-muted mt-1">
            {region.subtitle} &bull; Kode BPS:{" "}
            <span className="font-mono font-bold text-content-secondary">{region.code}</span> &bull; ID:{" "}
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

      {/* Live Location Preset Switcher & Telemetry Card */}
      <div className="bg-surface-card rounded-3xl border-[1.5px] border-border-card p-4 sm:p-5 shadow-bento space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-agri-50 border border-agri-100 flex items-center justify-center shrink-0 mt-0.5">
              <StatusIcon name="map-pin" className="w-4 h-4 text-agri-700" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-content-primary">
                Preset Lokasi Uji Live (Agnostik Koordinat)
              </h2>
              <p className="text-xs text-content-muted">
                Uji evaluasi agroklimat real-time lintas sentra padi nasional dengan failover otomatis Open-Meteo &amp; BMKG.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold ${
                telemetry.isDegraded
                  ? "bg-status-amber-bg border-status-amber-border text-status-amber-text"
                  : "bg-agri-50 border-status-green-border text-agri-800"
              }`}
            >
              <StatusIcon name="radio" className="w-3.5 h-3.5" />
              <span>Sumber API: {formatSourceLabel(telemetry.source)}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-card bg-surface-subtle text-content-primary font-mono font-semibold tabular-nums">
              <StatusIcon name="map" className="w-3.5 h-3.5 text-content-secondary" />
              <span>
                Koordinat: {region.lat.toFixed(3)}, {region.lng.toFixed(3)}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-card bg-surface-subtle text-content-primary font-mono font-semibold tabular-nums">
              <StatusIcon name="activity" className="w-3.5 h-3.5 text-content-secondary" />
              <span>
                Latensi ms: {telemetry.latencyMs !== null ? `${telemetry.latencyMs} ms` : "-- ms"}
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {LIVE_PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                aria-pressed={isSelected}
                disabled={isSimulatingIngest}
                onClick={() => handleSelectPreset(preset.key)}
                className={`min-h-[48px] px-4 py-2 rounded-2xl border-[1.5px] text-xs sm:text-sm font-bold transition-colors inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-agri-700 disabled:opacity-60 ${
                  isSelected
                    ? "bg-agri-700 border-agri-700 text-white shadow-xs"
                    : "bg-surface-subtle border-border-card text-content-primary hover:bg-agri-50 hover:border-agri-600"
                }`}
              >
                <StatusIcon
                  name="map-pin"
                  className={`w-4 h-4 ${isSelected ? "text-emerald-100" : "text-agri-700"}`}
                />
                <span>{preset.label}</span>
              </button>
            );
          })}
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
                Lanskap Persawahan Binaan &bull; {region.subtitle}
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
        <div
          className="p-5 rounded-3xl border-[1.5px] border-border-card bg-surface-card shadow-bento"
          aria-label={`Suhu rata-rata ${region.tMean} derajat celsius`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-content-muted">
            Rerata Suhu (T)
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-content-primary tabular-nums">{region.tMean}</span>
            <span className="text-sm font-bold text-content-muted">&deg;C</span>
          </div>
          <div className="text-xs font-semibold text-status-amber-text mt-2">Rentang optimum wereng: 25-29&deg;C</div>
        </div>

        <div
          className={`p-5 rounded-3xl border-[1.5px] ${rhCardTone.border} bg-surface-card shadow-bento`}
          aria-label={`Kelembapan relatif rata-rata ${region.rhMean} persen`}
        >
          <div className={`text-xs font-bold uppercase tracking-wider ${rhCardTone.text}`}>
            Rerata Kelembapan (RH)
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-3xl font-extrabold tabular-nums ${rhCardTone.text}`}>{region.rhMean}</span>
            <span className={`text-sm font-bold ${rhCardTone.text}`}>%</span>
          </div>
          <div className={`text-xs font-semibold mt-2 ${rhCardTone.text}`}>{rhCardTone.hint}</div>
        </div>

        <div
          className="p-5 rounded-3xl border-[1.5px] border-border-card bg-surface-card shadow-bento"
          aria-label={`Curah hujan harian ${region.precipMm} milimeter`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-content-muted">
            Curah Hujan Harian
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-content-primary tabular-nums">{region.precipMm}</span>
            <span className="text-sm font-bold text-content-muted">mm</span>
          </div>
          <div className="text-xs font-medium text-content-secondary mt-2">{precipHint}</div>
        </div>

        <div
          className="p-5 rounded-3xl bg-gradient-to-br from-agri-700 to-agri-900 text-white shadow-bento"
          aria-label={`Cakupan petani terdaftar ${region.farmerCount} orang dalam ${region.poktanCount} kelompok tani`}
        >
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
      <ClimateTrendChart
        key={`${selectedPreset}-${region.weatherTrend[0]?.date ?? "init"}`}
        trend={region.weatherTrend}
      />

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
