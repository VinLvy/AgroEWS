import { describe, expect, it } from "vitest";
import { wrapLine, wrapText } from "@/core/formatter/wrap";
import { explainReasonsList, explainEvaluation } from "@/core/explain";
import { getRecommendationsText } from "@/core/formatter/recommendations";
import { calculateDailyFeatures, type DailyFeature, type HourlyReading } from "@/core/features";
import { parseLaporMessage } from "@/core/lapor-parser";
import { isAmberDay, isRedDay } from "@/core/rules";
import fixturesData from "../fixtures/rules.json";

describe("T1: Core Coverage Booster (Mencapai Cakupan src/core >= 95%)", () => {
  it("menguji wrap.ts: kata sangat panjang melebihi maxWidth dan wrapText multi-baris", () => {
    // Kata tunggal sangat panjang melebihi 38 karakter
    const superLongWord = "SUPERLONGWORDWITHOUTANYSPACESMELEBIHILIMIT38CHARS";
    const wrapped = wrapLine(superLongWord, 20);
    expect(wrapped.length).toBeGreaterThan(1);
    expect(wrapped[0]?.length).toBeLessThanOrEqual(20);

    // wrapText dengan baris kosong, pembatas, dan paragraf
    const multiLine = "Baris 1 pendek\n\nBaris 2 dengan kalimat yang lumayan panjang sekali sehingga membutuhkan pembungkusan kata secara otomatis\n======================================\nBaris 4";
    const wrappedText = wrapText(multiLine);
    expect(wrappedText).toContain("Baris 1 pendek");
    expect(wrappedText).toContain("======================================");
  });

  it("menguji explain.ts: explainReasonsList dan cabang fallback", () => {
    const reasons = [
      {
        rule: "red" as const,
        date: "2026-11-14",
        metric: "T & RH",
        value: 27.5,
        threshold: "25-29 C",
        passed: true,
        message: "Pesan khusus penjelasan",
      },
      {
        rule: "amber" as const,
        date: "2026-11-15",
        metric: "T",
        value: 26.0,
        threshold: "24-29 C",
        passed: true,
      },
    ];

    const list = explainReasonsList(reasons);
    expect(list[0]).toBe("Pesan khusus penjelasan");
    expect(list[1]).toContain("[AMBER] 2026-11-15: T bernilai 26");

    // explainEvaluation dengan status green murni tanpa alasan
    const pureGreen = explainEvaluation({
      status: "green",
      reasons: [],
      runLength: 0,
      evaluatedDates: ["2026-11-14"],
    });
    expect(pureGreen).toContain("Status HIJAU (AMAN)");
  });

  it("menguji recommendations.ts: customText override dan cabang status", () => {
    const custom = getRecommendationsText({
      status: "red",
      customText: "Gunakan ekstrak daun mimba lokal 2x seminggu",
    });
    expect(custom).toEqual(["Gunakan ekstrak daun mimba lokal 2x seminggu"]);
  });

  it("menguji features.ts: fallback perhitungan dari data hourly ketika daily null", () => {
    const hourly: HourlyReading[] = [
      {
        time: "2026-11-14T00:00:00",
        temperature2m: 25.0,
        relativeHumidity2m: 85,
        precipitation: 1.5,
      },
      {
        time: "2026-11-14T12:00:00",
        temperature2m: 29.0,
        relativeHumidity2m: 75,
        precipitation: 0.5,
      },
    ];

    // Daily kosong
    const features = calculateDailyFeatures(hourly, [], "2026-11-14");
    expect(features.length).toBe(1);
    const f = features[0]!;
    expect(f.tMean).toBe(27.0); // (25 + 29) / 2
    expect(f.tMax).toBe(29.0);
    expect(f.tMin).toBe(25.0);
    expect(f.precipMm).toBe(2.0); // 1.5 + 0.5
  });

  it("menguji lapor-parser.ts: input null, undefined, dan string kosong", () => {
    expect(parseLaporMessage(null).success).toBe(false);
    expect(parseLaporMessage(undefined).success).toBe(false);
    expect(parseLaporMessage("").success).toBe(false);
  });

  it("menguji rules.ts: isAmberDay dengan requireRain = true", () => {
    const dummyFeature: DailyFeature = {
      date: "2026-11-14",
      tMean: 26.0,
      tMax: 28.0,
      tMin: 24.0,
      rhMean: 75,
      rhHoursGe80: 5,
      precipMm: 2.5,
      isForecast: false,
      ma3T: 26.0,
      ma3RH: 75,
      intermittentRain: false,
    };

    const tAmberWithRain = {
      ...fixturesData.thresholds.amber,
      requireRain: true,
      rainMinMm: 1,
      rainMaxMm: 5,
    };

    expect(isAmberDay(dummyFeature, tAmberWithRain)).toBe(true);

    const dummyFeatureNoRain = { ...dummyFeature, precipMm: 0 };
    expect(isAmberDay(dummyFeatureNoRain, tAmberWithRain)).toBe(false);
  });
});
