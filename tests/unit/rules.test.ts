import { describe, expect, it } from "vitest";
import fixturesData from "../fixtures/rules.json";
import { evaluate, type Thresholds } from "@/core/rules";
import type { DailyFeature } from "@/core/features";

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

describe("T1.3: 9 Golden Fixtures Verification (TECH_SPEC.md §6.5)", () => {
  const thresholds: Thresholds = fixturesData.thresholds;
  const today = fixturesData.today;

  for (const fixture of fixturesData.fixtures) {
    it(`Fixture #${fixture.id}: ${fixture.description}`, () => {
      const days: DailyFeature[] = fixture.sequence.map((item) => {
        const date = addDays(today, item.offset);
        return {
          date,
          tMean: item.tMean,
          tMax: item.tMean + 2,
          tMin: item.tMean - 2,
          rhMean: item.rhMean,
          rhHoursGe80: item.rhMean >= 80 ? 12 : 0,
          precipMm: 0,
          isForecast: item.offset > 0,
          ma3T: item.tMean,
          ma3RH: item.rhMean,
          intermittentRain: false,
        };
      });

      const result = evaluate(days, thresholds, today);

      expect(result.status).toBe(fixture.expectedStatus);

      if (fixture.hasMarginalReason) {
        const hasMarginal = result.reasons.some((r) => r.rule === "marginal");
        expect(hasMarginal, "Harus menyertakan reason marginal").toBe(true);
      }
    });
  }
});
