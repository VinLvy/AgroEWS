import { describe, expect, it } from "vitest";
import { evaluate, type Thresholds } from "@/core/rules";
import type { DailyFeature } from "@/core/features";
import fixturesData from "../fixtures/rules.json";

describe("T1.14: Benchmark Vitest: evaluate untuk 100 region sintetis < 5 detik (TECH_SPEC.md §13)", () => {
  const thresholds: Thresholds = fixturesData.thresholds;
  const today = "2026-11-14";

  it("mengeksekusi evaluasi aturan untuk 100 region sintetis dalam waktu < 5000 ms", () => {
    const dates = [
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
      "2026-11-15",
      "2026-11-16",
      "2026-11-17",
    ];

    // Buat 100 region sintetis dengan kombinasi suhu & RH bervariasi
    const syntheticRegionsData: DailyFeature[][] = [];

    for (let r = 0; r < 100; r++) {
      const regionDays: DailyFeature[] = dates.map((date, idx) => {
        const baseTemp = 23 + ((r + idx) % 10); // 23 - 32 C
        const baseRh = 65 + ((r * 2 + idx) % 35); // 65 - 99%

        return {
          date,
          tMean: baseTemp,
          tMax: baseTemp + 2,
          tMin: baseTemp - 2,
          rhMean: baseRh,
          rhHoursGe80: baseRh >= 80 ? 10 : 0,
          precipMm: (r % 5) + 0.5,
          isForecast: date > today,
          ma3T: baseTemp,
          ma3RH: baseRh,
          intermittentRain: (r % 3 === 0),
        };
      });

      syntheticRegionsData.push(regionDays);
    }

    const startTime = performance.now();

    for (let i = 0; i < syntheticRegionsData.length; i++) {
      const days = syntheticRegionsData[i]!;
      const result = evaluate(days, thresholds, today);
      expect(result.status).toBeDefined();
    }

    const durationMs = performance.now() - startTime;
    console.log(`[BENCHMARK] Waktu eksekusi evaluate 100 region sintetis: ${durationMs.toFixed(2)} ms`);

    // Target NFR §13: < 5000 ms
    expect(durationMs).toBeLessThan(5000);
  });
});
