/**
 * src/server/weather/open-meteo.ts
 * Adapter API cuaca Open-Meteo dengan chunking multi-koordinat, timeout 10s, dan 1x retry.
 * Sesuai TECH_SPEC.md §5.2.
 */

import { z } from "zod";
import type { DailyReading, HourlyReading } from "@/core/features";

export interface CoordinateLocation {
  id: string; // region id
  lat: number;
  lng: number;
}

export interface RegionWeatherData {
  regionId: string;
  hourly: HourlyReading[];
  daily: DailyReading[];
  rawPayload: unknown;
}

// Zod schema untuk validasi response Open-Meteo
const singleLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string().optional(),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(z.number()),
    relative_humidity_2m: z.array(z.number()),
    precipitation: z.array(z.number().nullable().optional()),
  }),
  daily: z
    .object({
      time: z.array(z.string()),
      temperature_2m_mean: z.array(z.number().nullable().optional()),
      temperature_2m_max: z.array(z.number().nullable().optional()),
      temperature_2m_min: z.array(z.number().nullable().optional()),
      precipitation_sum: z.array(z.number().nullable().optional()),
    })
    .optional(),
});

export const openMeteoResponseSchema = z.union([
  singleLocationSchema,
  z.array(singleLocationSchema),
]);

export type OpenMeteoLocationResponse = z.infer<typeof singleLocationSchema>;

/**
 * Membagi array lokasi menjadi potongan (chunks) maksimal 20 koordinat.
 */
export function chunkLocations<T>(items: T[], chunkSize = 20): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Fetch data cuaca dari Open-Meteo dengan timeout 10 detik dan 1x retry dengan backoff 500ms.
 */
export async function fetchOpenMeteoChunk(
  locations: CoordinateLocation[],
  fetchFn: typeof fetch = fetch
): Promise<RegionWeatherData[]> {
  if (locations.length === 0) return [];

  const lats = locations.map((loc) => loc.lat.toFixed(4)).join(",");
  const lngs = locations.map((loc) => loc.lng.toFixed(4)).join(",");

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lats}&longitude=${lngs}` +
    `&hourly=temperature_2m,relative_humidity_2m,precipitation` +
    `&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&timezone=auto&past_days=2&forecast_days=4`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetchFn(url, {
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const parsed = openMeteoResponseSchema.parse(json);

      const items: OpenMeteoLocationResponse[] = Array.isArray(parsed)
        ? parsed
        : [parsed];

      return locations.map((loc, index) => {
        const item = items[index] ?? items[0]!;
        const hourly: HourlyReading[] = [];
        const times = item.hourly.time;

        for (let i = 0; i < times.length; i++) {
          hourly.push({
            time: times[i]!,
            temperature2m: item.hourly.temperature_2m[i] ?? 0,
            relativeHumidity2m: item.hourly.relative_humidity_2m[i] ?? 0,
            precipitation: item.hourly.precipitation?.[i] ?? 0,
          });
        }

        const daily: DailyReading[] = [];
        if (item.daily) {
          const dTimes = item.daily.time;
          for (let i = 0; i < dTimes.length; i++) {
            daily.push({
              date: dTimes[i]!,
              temperature2mMean: item.daily.temperature_2m_mean?.[i] ?? null,
              temperature2mMax: item.daily.temperature_2m_max?.[i] ?? null,
              temperature2mMin: item.daily.temperature_2m_min?.[i] ?? null,
              precipitationSum: item.daily.precipitation_sum?.[i] ?? null,
            });
          }
        }

        return {
          regionId: loc.id,
          hourly,
          daily,
          rawPayload: item,
        };
      });
    } catch (err) {
      lastError = err as Error;
      if (attempt === 1) {
        // Backoff 500 ms sebelum retry
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  throw new Error(`Gagal menghubungi Open-Meteo setelah 2 percobaan: ${lastError?.message}`);
}
