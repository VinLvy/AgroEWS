import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { evaluate, type RiskStatus, type Thresholds } from "@/core/rules";
import type { DailyFeature } from "@/core/features";
import fixturesData from "../fixtures/rules.json";

const thresholds: Thresholds = fixturesData.thresholds;
const today = "2026-11-14";

const statusSeverity: Record<RiskStatus, number> = {
  green: 1,
  amber: 2,
  red: 3,
};

function generateDays(temps: number[], rhs: number[]): DailyFeature[] {
  const dates = [
    "2026-11-12",
    "2026-11-13",
    "2026-11-14",
    "2026-11-15",
    "2026-11-16",
    "2026-11-17",
  ];

  return dates.map((date, idx) => ({
    date,
    tMean: temps[idx] ?? 25,
    tMax: (temps[idx] ?? 25) + 2,
    tMin: (temps[idx] ?? 25) - 2,
    rhMean: rhs[idx] ?? 70,
    rhHoursGe80: (rhs[idx] ?? 70) >= 80 ? 10 : 0,
    precipMm: 2,
    isForecast: date > today,
    ma3T: temps[idx] ?? 25,
    ma3RH: rhs[idx] ?? 70,
    intermittentRain: false,
  }));
}

describe("T1.4: Property-Based Testing (fast-check) on Rule Engine", () => {
  it("Idempoten: Memanggil evaluate berulang kali menghasilkan status dan alasan identik", () => {
    fc.assert(
      fc.property(
        fc.array(fc.float({ min: 15, max: 40, noNaN: true }), { minLength: 6, maxLength: 6 }),
        fc.array(fc.float({ min: 40, max: 100, noNaN: true }), { minLength: 6, maxLength: 6 }),
        (temps, rhs) => {
          const days = generateDays(temps, rhs);
          const res1 = evaluate(days, thresholds, today);
          const res2 = evaluate(days, thresholds, today);

          expect(res1.status).toBe(res2.status);
          expect(res1.reasons.length).toBe(res2.reasons.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Order-Independent: Urutan input array tidak mempengaruhi hasil evaluasi", () => {
    fc.assert(
      fc.property(
        fc.array(fc.float({ min: 15, max: 40, noNaN: true }), { minLength: 6, maxLength: 6 }),
        fc.array(fc.float({ min: 40, max: 100, noNaN: true }), { minLength: 6, maxLength: 6 }),
        (temps, rhs) => {
          const days = generateDays(temps, rhs);
          const shuffledDays = [...days].sort(() => Math.random() - 0.5);

          const resOriginal = evaluate(days, thresholds, today);
          const resShuffled = evaluate(shuffledDays, thresholds, today);

          expect(resOriginal.status).toBe(resShuffled.status);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Monotonik: Kenaikan RH pada zona suhu optimum (26-28 C) tidak pernah menurunkan status keparahan risiko", () => {
    fc.assert(
      fc.property(
        fc.array(fc.float({ min: 26, max: 28, noNaN: true }), { minLength: 6, maxLength: 6 }),
        fc.array(fc.float({ min: 50, max: 80, noNaN: true }), { minLength: 6, maxLength: 6 }),
        fc.float({ min: 1, max: 15, noNaN: true }),
        (temps, baseRhs, deltaRh) => {
          const daysBase = generateDays(temps, baseRhs);
          const higherRhs = baseRhs.map((rh) => Math.min(100, rh + deltaRh));
          const daysHigher = generateDays(temps, higherRhs);

          const resBase = evaluate(daysBase, thresholds, today);
          const resHigher = evaluate(daysHigher, thresholds, today);

          const severityBase = statusSeverity[resBase.status];
          const severityHigher = statusSeverity[resHigher.status];

          expect(severityHigher).toBeGreaterThanOrEqual(severityBase);
        }
      ),
      { numRuns: 100 }
    );
  });
});
