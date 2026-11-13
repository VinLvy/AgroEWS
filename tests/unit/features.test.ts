import { describe, expect, it } from "vitest";
import {
  calculateDailyFeatures,
  round1,
  type DailyReading,
  type HourlyReading,
} from "@/core/features";

describe("T1.1: Feature Engineering Tests (TECH_SPEC.md §5.4 & PRD FR-2)", () => {
  it("membulatkan angka ke 1 desimal", () => {
    expect(round1(26.789)).toBe(26.8);
    expect(round1(24.12)).toBe(24.1);
  });

  it("menghitung rerata harian T dan RH serta jam kumulatif RH >= 80%", () => {
    const hourly: HourlyReading[] = [];
    const date = "2026-11-14";

    // 24 jam data
    for (let h = 0; h < 24; h++) {
      const time = `${date}T${h.toString().padStart(2, "0")}:00:00`;
      hourly.push({
        time,
        temperature2m: 26.0,
        relativeHumidity2m: h < 12 ? 85 : 75, // 12 jam >= 80%
        precipitation: 0.1,
      });
    }

    const daily: DailyReading[] = [
      {
        date,
        temperature2mMean: 26.0,
        temperature2mMax: 28.0,
        temperature2mMin: 24.0,
        precipitationSum: 2.4,
      },
    ];

    const features = calculateDailyFeatures(hourly, daily, "2026-11-14");
    expect(features.length).toBe(1);

    const f = features[0]!;
    expect(f.date).toBe(date);
    expect(f.tMean).toBe(26.0);
    expect(f.rhHoursGe80).toBe(12);
    expect(f.precipMm).toBe(2.4);
    expect(f.isForecast).toBe(false);
  });

  it("menghitung moving average 3 hari dan mendeteksi pola hujan berselang (intermittentRain)", () => {
    const dates = ["2026-11-12", "2026-11-13", "2026-11-14"];
    const daily: DailyReading[] = [
      {
        date: dates[0]!,
        temperature2mMean: 26.0,
        precipitationSum: 2.0, // Hujan ringan (1-5mm)
      },
      {
        date: dates[1]!,
        temperature2mMean: 27.0,
        precipitationSum: 0.5,
      },
      {
        date: dates[2]!,
        temperature2mMean: 28.0,
        precipitationSum: 3.0, // Hujan ringan (1-5mm)
      },
    ];

    const hourly: HourlyReading[] = [];
    for (const d of dates) {
      for (let h = 0; h < 24; h++) {
        hourly.push({
          time: `${d}T${h.toString().padStart(2, "0")}:00:00`,
          temperature2m: 27.0,
          relativeHumidity2m: 82,
        });
      }
    }

    const features = calculateDailyFeatures(hourly, daily, "2026-11-13");
    expect(features.length).toBe(3);

    const day3 = features[2]!;
    // Rerata T 3 hari: (26 + 27 + 28) / 3 = 27.0
    expect(day3.ma3T).toBe(27.0);
    expect(day3.intermittentRain).toBe(true);
    expect(day3.isForecast).toBe(true); // 2026-11-14 > today (2026-11-13)
  });
});
