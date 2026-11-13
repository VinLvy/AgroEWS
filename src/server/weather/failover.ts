/**
 * src/server/weather/failover.ts
 * Orkestrator pengambilan data cuaca dengan mekanisme failover berjenjang:
 * 1. Open-Meteo (Utama)
 * 2. BMKG API (Failover sekunder)
 * 3. Cache Database Snapshot
 * Sesuai TECH_SPEC.md §5.3 dan PRD FR-1.4.
 */

import { fetchOpenMeteoChunk, type CoordinateLocation, type RegionWeatherData } from "./open-meteo";
import { fetchBmkgWeatherData } from "./bmkg";
import { db } from "../db/client";
import { weatherSnapshots } from "../db/schema";
import { desc, eq } from "drizzle-orm";

export interface WeatherFetchResult {
  data: RegionWeatherData;
  source: "open-meteo" | "bmkg" | "cache";
  isDegraded: boolean;
  latencyMs: number;
}

export interface RegionLocationWithMeta extends CoordinateLocation {
  bmkgAdm4?: string | null;
}

/**
 * Mengambil data cuaca dengan failover otomatis untuk satu atau sekumpulan wilayah.
 */
export async function getWeatherDataWithFailover(
  location: RegionLocationWithMeta,
  fetchFn: typeof fetch = fetch
): Promise<WeatherFetchResult> {
  const startTime = Date.now();

  // Tier 1: Open-Meteo API
  try {
    const results = await fetchOpenMeteoChunk([location], fetchFn);
    const data = results[0];
    if (data && data.hourly.length > 0) {
      return {
        data,
        source: "open-meteo",
        isDegraded: false,
        latencyMs: Date.now() - startTime,
      };
    }
  } catch (openMeteoErr) {
    console.warn(
      `[FAILOVER] Open-Meteo gagal untuk region ${location.id}: ${(openMeteoErr as Error).message}. Beralih ke BMKG...`
    );
  }

  // Tier 2: BMKG API
  try {
    const bmkgData = await fetchBmkgWeatherData(location, fetchFn);
    if (bmkgData.hourly.length > 0) {
      return {
        data: bmkgData,
        source: "bmkg",
        isDegraded: true,
        latencyMs: Date.now() - startTime,
      };
    }
  } catch (bmkgErr) {
    console.warn(
      `[FAILOVER] BMKG gagal untuk region ${location.id}: ${(bmkgErr as Error).message}. Beralih ke Cache DB...`
    );
  }

  // Tier 3: Snapshot Cache DB Terakhir
  try {
    const lastSnapshot = await db.query.weatherSnapshots.findFirst({
      where: eq(weatherSnapshots.regionId, location.id),
      orderBy: [desc(weatherSnapshots.fetchedAt)],
    });

    if (lastSnapshot) {
      const payload = lastSnapshot.payload as {
        hourly?: unknown[];
        daily?: unknown[];
      };

      if (Array.isArray(payload.hourly) && payload.hourly.length > 0) {
        return {
          data: {
            regionId: location.id,
            hourly: payload.hourly as never,
            daily: (payload.daily ?? []) as never,
            rawPayload: payload,
          },
          source: "cache",
          isDegraded: true,
          latencyMs: Date.now() - startTime,
        };
      }
    }
  } catch (dbErr) {
    console.warn(
      `[FAILOVER] Gagal mengakses cache DB untuk region ${location.id}: ${(dbErr as Error).message}`
    );
  }

  // Jika seluruh tier gagal
  throw new Error(
    `[FATAL] Seluruh sumber data cuaca gagal untuk wilayah ${location.id} (Open-Meteo, BMKG, dan Cache nihil)`
  );
}
