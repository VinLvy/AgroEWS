import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/server/weather/failover", () => ({
  getWeatherDataWithFailover: vi.fn(),
}));

import { GET } from "@/app/api/weather/live/route";
import { getWeatherDataWithFailover, type WeatherFetchResult } from "@/server/weather/failover";
import type { DailyReading, HourlyReading } from "@/core/features";

function addDaysUtc(baseDate: string, offset: number): string {
  const d = new Date(`${baseDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function buildSyntheticWeatherResult(params: {
  regionId: string;
  baseDate: string;
  tMean: number;
  rhMean: number;
  precipMm: number;
  source?: "open-meteo" | "bmkg" | "cache";
  isDegraded?: boolean;
  latencyMs?: number;
}): WeatherFetchResult {
  const hourly: HourlyReading[] = [];
  const daily: DailyReading[] = [];

  for (let offset = -3; offset <= 3; offset++) {
    const date = addDaysUtc(params.baseDate, offset);
    daily.push({
      date,
      temperature2mMean: params.tMean,
      temperature2mMax: params.tMean + 2.0,
      temperature2mMin: params.tMean - 2.0,
      precipitationSum: params.precipMm,
    });

    for (const hour of ["00:00", "06:00", "12:00", "18:00"]) {
      hourly.push({
        time: `${date}T${hour}`,
        temperature2m: params.tMean,
        relativeHumidity2m: params.rhMean,
        precipitation: hour === "12:00" ? params.precipMm : 0,
      });
    }
  }

  return {
    data: {
      regionId: params.regionId,
      hourly,
      daily,
      rawPayload: { mocked: true },
    },
    source: params.source ?? "open-meteo",
    isDegraded: params.isDegraded ?? false,
    latencyMs: params.latencyMs ?? 125,
  };
}

describe("GET /api/weather/live: Agnostic Coordinate Preset & Failover Route", () => {
  const FIXED_TODAY = "2026-11-17";
  const mockedGetWeather = vi.mocked(getWeatherDataWithFailover);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(`${FIXED_TODAY}T03:00:00.000Z`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("menggunakan preset default 'kuranji' bila query ?preset tidak disertakan", async () => {
    mockedGetWeather.mockResolvedValueOnce(
      buildSyntheticWeatherResult({
        regionId: "22222222-2222-4222-8222-222222222201",
        baseDate: FIXED_TODAY,
        tMean: 27.2,
        rhMean: 86.5,
        precipMm: 3.4,
      })
    );

    const req = new NextRequest("http://localhost:3000/api/weather/live");
    const res = await GET(req);
    expect(res.status).toBe(200);

    expect(mockedGetWeather).toHaveBeenCalledWith({
      id: "22222222-2222-4222-8222-222222222201",
      lat: -0.82,
      lng: 100.365,
      bmkgAdm4: "13.71.09.1003",
    });

    const body = await res.json();
    expect(body.preset).toBe("kuranji");
    expect(body.region).toMatchObject({
      id: "22222222-2222-4222-8222-222222222201",
      name: "Nagari Sungai Bangek",
      subtitle: "Kec. Kuranji, Kota Padang (Sumatera Barat)",
      code: "13.71.05.2001",
      lat: -0.82,
      lng: 100.365,
      level: "kelurahan",
      status: "red",
      tMean: 27.2,
      rhMean: 86.5,
      precipMm: 3.4,
      poktanCount: 6,
      farmerCount: 142,
    });
    expect(body.region.weatherTrend).toHaveLength(7);
    expect(body.region.weatherTrend[3]).toMatchObject({
      day: "Sel",
      date: "17 Nov",
      condition: "Hujan Sedang",
    });
    expect(body.region.weatherTrend[4].condition).toContain(" (Prediksi)");
    expect(body.meta).toMatchObject({
      source: "open-meteo",
      isDegraded: false,
      latencyMs: 125,
    });
  });

  it("mendukung seluruh 4 preset lokasi (kuranji, banyubiru, tulungagung, deli-serdang) beserta evaluasi v1.0.0", async () => {
    const cases = [
      {
        preset: "kuranji",
        expectedId: "22222222-2222-4222-8222-222222222201",
        expectedName: "Nagari Sungai Bangek",
        expectedCode: "13.71.05.2001",
        lat: -0.82,
        lng: 100.365,
        bmkgAdm4: "13.71.09.1003",
        tMean: 27.0,
        rhMean: 87.0,
        precipMm: 2.0,
        expectedStatus: "red",
      },
      {
        preset: "banyubiru",
        expectedId: "preset-banyubiru",
        expectedName: "Kec. Banyubiru",
        expectedCode: "33.22.11.2001",
        lat: -7.3,
        lng: 110.4,
        bmkgAdm4: "33.22.11.2001",
        tMean: 25.5,
        rhMean: 82.5,
        precipMm: 1.5,
        expectedStatus: "amber",
      },
      {
        preset: "tulungagung",
        expectedId: "preset-tulungagung",
        expectedName: "Kec. Kedungwaru",
        expectedCode: "35.04.03.2001",
        lat: -8.065,
        lng: 111.905,
        bmkgAdm4: "35.04.03.2001",
        tMean: 32.5,
        rhMean: 68.0,
        precipMm: 0.0,
        expectedStatus: "green",
      },
      {
        preset: "deli-serdang",
        expectedId: "preset-deli-serdang",
        expectedName: "Kec. Percut Sei Tuan",
        expectedCode: "12.07.26.2001",
        lat: 3.63,
        lng: 98.77,
        bmkgAdm4: "12.07.26.2001",
        tMean: 26.8,
        rhMean: 81.5,
        precipMm: 11.0,
        expectedStatus: "amber",
      },
    ] as const;

    for (const c of cases) {
      mockedGetWeather.mockResolvedValueOnce(
        buildSyntheticWeatherResult({
          regionId: c.expectedId,
          baseDate: FIXED_TODAY,
          tMean: c.tMean,
          rhMean: c.rhMean,
          precipMm: c.precipMm,
        })
      );

      const req = new NextRequest(`http://localhost:3000/api/weather/live?preset=${c.preset}`);
      const res = await GET(req);
      expect(res.status).toBe(200);

      expect(mockedGetWeather).toHaveBeenCalledWith({
        id: c.expectedId,
        lat: c.lat,
        lng: c.lng,
        bmkgAdm4: c.bmkgAdm4,
      });

      const body = await res.json();
      expect(body.preset).toBe(c.preset);
      expect(body.region.id).toBe(c.expectedId);
      expect(body.region.name).toBe(c.expectedName);
      expect(body.region.code).toBe(c.expectedCode);
      expect(body.region.status).toBe(c.expectedStatus);
      expect(body.region.weatherTrend).toHaveLength(7);

      for (const dayItem of body.region.weatherTrend) {
        expect(["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]).toContain(dayItem.day);
        expect(dayItem.date).toMatch(/^\d{2} (Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)$/);
      }
    }
  });

  it("meneruskan metadata failover BMKG (source: 'bmkg', isDegraded: true)", async () => {
    mockedGetWeather.mockResolvedValueOnce(
      buildSyntheticWeatherResult({
        regionId: "preset-banyubiru",
        baseDate: FIXED_TODAY,
        tMean: 26.2,
        rhMean: 83.0,
        precipMm: 0.4,
        source: "bmkg",
        isDegraded: true,
        latencyMs: 310,
      })
    );

    const req = new NextRequest("http://localhost:3000/api/weather/live?preset=banyubiru");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.meta.source).toBe("bmkg");
    expect(body.meta.isDegraded).toBe(true);
    expect(body.meta.latencyMs).toBe(310);
    expect(body.region.status).toBe("amber");
  });

  it("melakukan graceful fallback deterministik (HTTP 200, source: 'fallback-demo') untuk semua 4 preset saat offline", async () => {
    const presets = ["kuranji", "banyubiru", "tulungagung", "deli-serdang"] as const;

    for (const preset of presets) {
      mockedGetWeather.mockRejectedValueOnce(new Error("Network offline / DNS failure"));

      const req = new NextRequest(`http://localhost:3000/api/weather/live?preset=${preset}`);
      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.preset).toBe(preset);
      expect(body.meta.source).toBe("fallback-demo");
      expect(body.meta.isDegraded).toBe(true);
      expect(typeof body.meta.latencyMs).toBe("number");
      expect(typeof body.meta.evaluatedAt).toBe("string");
      expect(["red", "amber", "green"]).toContain(body.region.status);
      expect(body.region.weatherTrend).toHaveLength(7);
      expect(body.region.weatherTrend[0].condition).not.toContain("(Prediksi)");
      expect(body.region.weatherTrend[6].condition).toContain("(Prediksi)");
    }
  });

  it("menangani nilai ?preset tidak dikenal dengan aman melalui fallback ke 'kuranji'", async () => {
    mockedGetWeather.mockRejectedValueOnce(new Error("Offline"));

    const req = new NextRequest("http://localhost:3000/api/weather/live?preset=unknown-region");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.preset).toBe("kuranji");
    expect(body.region.name).toBe("Nagari Sungai Bangek");
    expect(body.meta.source).toBe("fallback-demo");
  });
});
