import { describe, expect, it } from "vitest";
import { getWeatherDataWithFailover } from "@/server/weather/failover";
import { verifyCronAuth } from "@/server/auth/cron-auth";

describe("T1.13: Ingest Failover & Authentication Tests (TECH_SPEC.md §5.3)", () => {
  const dummyLocation = {
    id: "loc-test-1",
    lat: -0.9252,
    lng: 100.4124,
    bmkgAdm4: "13.71.09",
  };

  it("verifikasi CRON_SECRET secara konstan-waktu menolak token salah (401)", () => {
    const validSecret = "test_cron_secret_min_16_chars";

    const validReq = new Request("http://localhost/api/cron/ingest?slot=0500", {
      headers: { authorization: `Bearer ${validSecret}` },
    });
    expect(verifyCronAuth(validReq, validSecret)).toBe(true);

    const invalidReq = new Request("http://localhost/api/cron/ingest?slot=0500", {
      headers: { authorization: "Bearer token_salah_panjang_berbeda" },
    });
    expect(verifyCronAuth(invalidReq, validSecret)).toBe(false);

    const noHeaderReq = new Request("http://localhost/api/cron/ingest?slot=0500");
    expect(verifyCronAuth(noHeaderReq, validSecret)).toBe(false);
  });

  it("Skenario 1: Sukses dari Open-Meteo (isDegraded: false, source: 'open-meteo')", async () => {
    const mockOpenMeteoFetch = async () =>
      new Response(
        JSON.stringify({
          latitude: -0.92,
          longitude: 100.41,
          hourly: {
            time: ["2026-11-14T00:00", "2026-11-14T01:00"],
            temperature_2m: [26.5, 26.2],
            relative_humidity_2m: [85, 86],
            precipitation: [0, 0.2],
          },
          daily: {
            time: ["2026-11-14"],
            temperature_2m_mean: [26.4],
            temperature_2m_max: [28.0],
            temperature_2m_min: [24.0],
            precipitation_sum: [0.2],
          },
        }),
        { status: 200 }
      );

    const result = await getWeatherDataWithFailover(
      dummyLocation,
      mockOpenMeteoFetch as typeof fetch
    );

    expect(result.source).toBe("open-meteo");
    expect(result.isDegraded).toBe(false);
    expect(result.data.hourly.length).toBe(2);
  });

  it("Skenario 2: Open-Meteo timeout / 500 -> failover ke BMKG (source: 'bmkg', isDegraded: true)", async () => {
    const mockFailoverFetch = async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("open-meteo.com")) {
        throw new Error("HTTP 504 Gateway Timeout");
      }

      if (urlStr.includes("api.bmkg.go.id")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                cuaca: [
                  [
                    { datetime: "2026-11-14 00:00:00", t: 26.0, hu: 84 },
                    { datetime: "2026-11-14 03:00:00", t: 25.5, hu: 86 },
                  ],
                ],
              },
            ],
          }),
          { status: 200 }
        );
      }

      throw new Error("Unknown URL");
    };

    const result = await getWeatherDataWithFailover(
      dummyLocation,
      mockFailoverFetch as typeof fetch
    );

    expect(result.source).toBe("bmkg");
    expect(result.isDegraded).toBe(true);
    expect(result.data.hourly.length).toBe(2);
  });

  it("Skenario 3: Seluruh sumber eksternal gagal -> melempar error terstruktur", async () => {
    const mockAllFailFetch = async () => {
      throw new Error("Network unreachable");
    };

    await expect(
      getWeatherDataWithFailover(
        { id: "non-existent-region-uuid-xyz", lat: 0, lng: 0 },
        mockAllFailFetch as typeof fetch
      )
    ).rejects.toThrow("Seluruh sumber data cuaca gagal");
  });
});
