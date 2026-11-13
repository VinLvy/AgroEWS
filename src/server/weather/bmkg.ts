/**
 * src/server/weather/bmkg.ts
 * Adapter data cuaca BMKG API (Kecamatan/Adm4 level) sebagai secondary failover provider.
 * Sesuai TECH_SPEC.md §5.3 dan PRD FR-1.4.
 */

import { z } from "zod";
import type { DailyReading, HourlyReading } from "@/core/features";
import type { CoordinateLocation, RegionWeatherData } from "./open-meteo";

// Zod schema untuk validasi struktur respons BMKG Open Data Weather (adm4)
const bmkgDataSchema = z.object({
  data: z
    .array(
      z.object({
        lokasi: z
          .object({
            adm4: z.string().optional(),
            provinsi: z.string().optional(),
            kotkab: z.string().optional(),
            kecamatan: z.string().optional(),
            lat: z.number().optional(),
            lon: z.number().optional(),
          })
          .optional(),
        cuaca: z.array(
          z.array(
            z.object({
              datetime: z.string(),
              t: z.number(), // Suhu (C)
              hu: z.number(), // Kelembapan (%)
              ws: z.number().optional(),
              weather_desc: z.string().optional(),
            })
          )
        ),
      })
    )
    .optional(),
});

/**
 * Fetch prakiraan cuaca BMKG adm4 untuk suatu wilayah kecamatan.
 */
export async function fetchBmkgWeatherData(
  location: CoordinateLocation & { bmkgAdm4?: string | null },
  fetchFn: typeof fetch = fetch
): Promise<RegionWeatherData> {
  const adm4Code = location.bmkgAdm4 || "13.71.09";
  const url = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${encodeURIComponent(adm4Code)}`;

  const response = await fetchFn(url, {
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`BMKG API HTTP ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  const parsed = bmkgDataSchema.safeParse(json);

  const hourly: HourlyReading[] = [];
  const dailyMap = new Map<string, { temps: number[]; hus: number[] }>();

  if (parsed.success && parsed.data?.data?.[0]?.cuaca) {
    const cuacaNested = parsed.data.data[0].cuaca;
    for (const subList of cuacaNested) {
      for (const item of subList) {
        hourly.push({
          time: item.datetime,
          temperature2m: item.t,
          relativeHumidity2m: item.hu,
          precipitation: 0,
        });

        const date = item.datetime.slice(0, 10);
        const existing = dailyMap.get(date) ?? { temps: [], hus: [] };
        existing.temps.push(item.t);
        existing.hus.push(item.hu);
        dailyMap.set(date, existing);
      }
    }
  }

  const daily: DailyReading[] = [];
  for (const [date, val] of dailyMap.entries()) {
    const tMean = val.temps.reduce((acc, v) => acc + v, 0) / (val.temps.length || 1);
    daily.push({
      date,
      temperature2mMean: Math.round(tMean * 10) / 10,
      temperature2mMax: Math.max(...val.temps),
      temperature2mMin: Math.min(...val.temps),
      precipitationSum: 0,
    });
  }

  return {
    regionId: location.id,
    hourly,
    daily,
    rawPayload: json,
  };
}
