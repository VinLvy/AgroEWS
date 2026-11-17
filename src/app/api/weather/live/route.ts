/**
 * src/app/api/weather/live/route.ts
 * Endpoint cuaca live agnostik-koordinat untuk 4 lokasi preset uji AgroEWS.
 * Memanggil failover berjenjang (Open-Meteo -> BMKG -> Cache DB) dan mengevaluasi
 * risiko ledakan WBC dengan ambang operasional v1.0.0.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getWeatherDataWithFailover } from "@/server/weather/failover";
import {
  calculateDailyFeatures,
  type DailyFeature,
  type DailyReading,
  type HourlyReading,
} from "@/core/features";
import { evaluate, type Thresholds } from "@/core/rules";
import type { PrototypeWeatherDay } from "@/lib/prototype-data";

export const dynamic = "force-dynamic";

type PresetKey = "kuranji" | "banyubiru" | "tulungagung" | "deli-serdang";
type WeatherSource = "open-meteo" | "bmkg" | "cache" | "fallback-demo";

interface PresetLocation {
  id: string;
  preset: PresetKey;
  name: string;
  subtitle: string;
  code: string;
  lat: number;
  lng: number;
  bmkgAdm4: string;
  poktanCount: number;
  farmerCount: number;
}

interface FallbackDaySeed {
  offset: number;
  tMean: number;
  rhMean: number;
  precipMm: number;
}

const PRESETS: Record<PresetKey, PresetLocation> = {
  kuranji: {
    id: "22222222-2222-4222-8222-222222222201",
    preset: "kuranji",
    name: "Nagari Sungai Bangek",
    subtitle: "Kec. Kuranji, Kota Padang (Sumatera Barat)",
    code: "13.71.05.2001",
    lat: -0.820,
    lng: 100.365,
    bmkgAdm4: "13.71.09.1003",
    poktanCount: 6,
    farmerCount: 142,
  },
  banyubiru: {
    id: "preset-banyubiru",
    preset: "banyubiru",
    name: "Kec. Banyubiru",
    subtitle: "Kab. Semarang (Jawa Tengah - Lokasi Hindcast KTI)",
    code: "33.22.11.2001",
    lat: -7.300,
    lng: 110.400,
    bmkgAdm4: "33.22.11.2001",
    poktanCount: 8,
    farmerCount: 185,
  },
  tulungagung: {
    id: "preset-tulungagung",
    preset: "tulungagung",
    name: "Kec. Kedungwaru",
    subtitle: "Kab. Tulungagung (Jawa Timur - Sentra Kampus Tim)",
    code: "35.04.03.2001",
    lat: -8.065,
    lng: 111.905,
    bmkgAdm4: "35.04.03.2001",
    poktanCount: 7,
    farmerCount: 164,
  },
  "deli-serdang": {
    id: "preset-deli-serdang",
    preset: "deli-serdang",
    name: "Kec. Percut Sei Tuan",
    subtitle: "Kab. Deli Serdang (Sumatera Utara - Sentra Padi USU)",
    code: "12.07.26.2001",
    lat: 3.630,
    lng: 98.770,
    bmkgAdm4: "12.07.26.2001",
    poktanCount: 9,
    farmerCount: 210,
  },
};

const V1_THRESHOLDS: Thresholds = {
  window: { pastDays: 3, forecastDays: 3 },
  green: { tBelow: 22, tAbove: 32, rhBelow: 70 },
  amber: {
    tMin: 24,
    tMax: 29,
    rhMin: 80,
    minConsecutiveDays: 2,
    rainMinMm: 1,
    rainMaxMm: 5,
    requireRain: false,
  },
  red: {
    tMin: 25,
    tMax: 29,
    rhGt: 85,
    minConsecutiveDays: 3,
  },
};

const FALLBACK_SEEDS: Record<PresetKey, FallbackDaySeed[]> = {
  kuranji: [
    { offset: -3, tMean: 26.6, rhMean: 83.5, precipMm: 0.8 },
    { offset: -2, tMean: 26.9, rhMean: 84.8, precipMm: 1.8 },
    { offset: -1, tMean: 27.1, rhMean: 85.6, precipMm: 2.6 },
    { offset: 0, tMean: 27.2, rhMean: 86.5, precipMm: 3.8 },
    { offset: 1, tMean: 27.4, rhMean: 87.0, precipMm: 4.2 },
    { offset: 2, tMean: 27.3, rhMean: 86.2, precipMm: 2.4 },
    { offset: 3, tMean: 27.0, rhMean: 85.1, precipMm: 1.5 },
  ],
  banyubiru: [
    { offset: -3, tMean: 24.7, rhMean: 80.8, precipMm: 0.4 },
    { offset: -2, tMean: 25.1, rhMean: 81.6, precipMm: 1.4 },
    { offset: -1, tMean: 25.4, rhMean: 82.4, precipMm: 2.2 },
    { offset: 0, tMean: 25.6, rhMean: 83.2, precipMm: 2.8 },
    { offset: 1, tMean: 25.9, rhMean: 83.8, precipMm: 3.1 },
    { offset: 2, tMean: 25.5, rhMean: 82.9, precipMm: 1.8 },
    { offset: 3, tMean: 25.2, rhMean: 81.5, precipMm: 1.0 },
  ],
  tulungagung: [
    { offset: -3, tMean: 28.4, rhMean: 74.0, precipMm: 0.0 },
    { offset: -2, tMean: 29.1, rhMean: 72.5, precipMm: 0.0 },
    { offset: -1, tMean: 29.5, rhMean: 71.0, precipMm: 0.2 },
    { offset: 0, tMean: 29.8, rhMean: 69.5, precipMm: 0.0 },
    { offset: 1, tMean: 29.6, rhMean: 70.5, precipMm: 0.0 },
    { offset: 2, tMean: 29.2, rhMean: 73.0, precipMm: 0.5 },
    { offset: 3, tMean: 28.7, rhMean: 75.5, precipMm: 1.1 },
  ],
  "deli-serdang": [
    { offset: -3, tMean: 27.1, rhMean: 81.0, precipMm: 1.1 },
    { offset: -2, tMean: 27.4, rhMean: 82.2, precipMm: 2.0 },
    { offset: -1, tMean: 27.8, rhMean: 83.4, precipMm: 3.4 },
    { offset: 0, tMean: 27.6, rhMean: 84.1, precipMm: 2.6 },
    { offset: 1, tMean: 27.3, rhMean: 83.6, precipMm: 1.9 },
    { offset: 2, tMean: 27.5, rhMean: 82.0, precipMm: 1.2 },
    { offset: 3, tMean: 27.2, rhMean: 80.5, precipMm: 0.6 },
  ],
};

const ID_DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] as const;
const ID_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

const LIVE_FETCH_TIMEOUT_MS = 3500;

function isPresetKey(value: string | null): value is PresetKey {
  return (
    value === "kuranji" ||
    value === "banyubiru" ||
    value === "tulungagung" ||
    value === "deli-serdang"
  );
}

function addUtcDays(dateStr: string, offset: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function formatPrototypeDay(dateStr: string): { day: string; date: string } {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = ID_DAYS[d.getUTCDay()] ?? "Sen";
  const dayNum = String(d.getUTCDate()).padStart(2, "0");
  const month = ID_MONTHS[d.getUTCMonth()] ?? "Jan";
  return { day, date: `${dayNum} ${month}` };
}

function deriveCondition(
  precipMm: number,
  rhMean: number,
  isForecast: boolean
): string {
  let base: string;
  if (precipMm >= 10) {
    base = "Hujan Lebat";
  } else if (precipMm >= 3) {
    base = "Hujan Sedang";
  } else if (precipMm >= 1) {
    base = "Hujan Ringan";
  } else if (precipMm > 0.1) {
    base = "Gerimis Lembap";
  } else if (rhMean >= 85) {
    base = "Berawan Lembap";
  } else if (rhMean >= 75) {
    base = "Berawan";
  } else {
    base = "Cerah Berawan";
  }

  return isForecast ? `${base} (Prediksi)` : base;
}

function toPrototypeTrend(features: DailyFeature[]): PrototypeWeatherDay[] {
  return features.slice(-7).map((f) => {
    const { day, date } = formatPrototypeDay(f.date);
    return {
      day,
      date,
      tMean: f.tMean,
      rhMean: f.rhMean,
      precipMm: f.precipMm,
      condition: deriveCondition(f.precipMm, f.rhMean, f.isForecast),
    };
  });
}

function buildFallbackWeather(
  presetKey: PresetKey,
  todayStr: string
): { hourly: HourlyReading[]; daily: DailyReading[] } {
  const seeds = FALLBACK_SEEDS[presetKey];
  const hourly: HourlyReading[] = [];
  const daily: DailyReading[] = [];

  for (const seed of seeds) {
    const date = addUtcDays(todayStr, seed.offset);
    daily.push({
      date,
      temperature2mMean: seed.tMean,
      temperature2mMax: seed.tMean + 2.4,
      temperature2mMin: seed.tMean - 2.1,
      precipitationSum: seed.precipMm,
    });

    const hourOffsets = ["00:00", "06:00", "12:00", "18:00"];
    const tempDeltas = [-1.4, -0.8, 2.0, 0.2];
    const rhDeltas = [2.0, 3.0, -4.0, -1.0];

    for (let i = 0; i < hourOffsets.length; i++) {
      const hour = hourOffsets[i]!;
      const tDelta = tempDeltas[i] ?? 0;
      const rhDelta = rhDeltas[i] ?? 0;
      hourly.push({
        time: `${date}T${hour}`,
        temperature2m: seed.tMean + tDelta,
        relativeHumidity2m: Math.min(100, Math.max(40, seed.rhMean + rhDelta)),
        precipitation: i === 2 ? seed.precipMm : 0,
      });
    }
  }

  return { hourly, daily };
}

function buildPayload(
  loc: PresetLocation,
  features: DailyFeature[],
  todayStr: string,
  meta: { source: WeatherSource; isDegraded: boolean; latencyMs: number }
) {
  const evalResult = evaluate(features, V1_THRESHOLDS, todayStr);
  const weatherTrend = toPrototypeTrend(features);
  const currentFeature =
    features.find((f) => f.date === todayStr) ??
    features.filter((f) => !f.isForecast).at(-1) ??
    features[0];

  return {
    preset: loc.preset,
    region: {
      id: loc.id,
      name: loc.name,
      subtitle: loc.subtitle,
      code: loc.code,
      lat: loc.lat,
      lng: loc.lng,
      level: "kelurahan" as const,
      status: evalResult.status,
      tMean: currentFeature?.tMean ?? 0,
      rhMean: currentFeature?.rhMean ?? 0,
      precipMm: currentFeature?.precipMm ?? 0,
      poktanCount: loc.poktanCount,
      farmerCount: loc.farmerCount,
      weatherTrend,
    },
    meta: {
      source: meta.source,
      isDegraded: meta.isDegraded,
      latencyMs: meta.latencyMs,
      evaluatedAt: new Date().toISOString(),
    },
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const { searchParams } = new URL(req.url);
  const rawPreset = searchParams.get("preset");
  const presetKey: PresetKey = isPresetKey(rawPreset) ? rawPreset : "kuranji";
  const loc = PRESETS[presetKey];
  const todayStr = new Date().toISOString().slice(0, 10);

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new Error(
            `Batas waktu pengambilan cuaca live terlampaui (${LIVE_FETCH_TIMEOUT_MS}ms)`
          )
        );
      }, LIVE_FETCH_TIMEOUT_MS);
    });

    const weatherResult = await Promise.race([
      getWeatherDataWithFailover({
        id: loc.id,
        lat: loc.lat,
        lng: loc.lng,
        bmkgAdm4: loc.bmkgAdm4,
      }),
      timeoutPromise,
    ]);

    const features = calculateDailyFeatures(
      weatherResult.data.hourly,
      weatherResult.data.daily,
      todayStr
    );

    if (features.length === 0) {
      throw new Error("Fitur harian agroklimat kosong dari sumber cuaca");
    }

    const payload = buildPayload(loc, features, todayStr, {
      source: weatherResult.source,
      isDegraded: weatherResult.isDegraded,
      latencyMs: weatherResult.latencyMs,
    });

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    console.warn(
      `[WEATHER_LIVE] Gagal mengambil data live untuk preset ${presetKey}, menggunakan fallback-demo: ${(err as Error).message}`
    );

    const fallback = buildFallbackWeather(presetKey, todayStr);
    const fallbackFeatures = calculateDailyFeatures(
      fallback.hourly,
      fallback.daily,
      todayStr
    );

    const payload = buildPayload(loc, fallbackFeatures, todayStr, {
      source: "fallback-demo",
      isDegraded: true,
      latencyMs: Date.now() - startTime,
    });

    return NextResponse.json(payload, { status: 200 });
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}
