/**
 * tests/integration/rbac.test.ts
 * Pengujian RBAC (Role-Based Access Control) dan batasan wilayah (A01 Broken Access Control).
 * Sesuai TECH_SPEC.md §4, §11 (A01) dan task T2.12.
 */

import { describe, expect, it, vi } from "vitest";
import { requireRegionAccess, AuthError } from "@/server/auth/rbac";
import nextConfig from "../../next.config";

describe("T2.12: RBAC & Region Access Boundary Tests (OWASP A01)", () => {
  const userIdPpl1 = "user-ppl-001";
  const userIdPpl2 = "user-ppl-002";
  const regionKuranji = "region-kuranji-uuid";
  const regionNanggalo = "region-nanggalo-uuid";

  it("mengizinkan Administrator mengakses wilayah manapun tanpa pengecekan penugasan", async () => {
    const result = await requireRegionAccess(
      "admin-user-uuid",
      "admin",
      regionKuranji
    );
    expect(result).toBe(true);
  });

  it("mengizinkan Koordinator BPP mengakses wilayah binaan manapun", async () => {
    const result = await requireRegionAccess(
      "bpp-coord-uuid",
      "bpp_coordinator",
      regionKuranji
    );
    expect(result).toBe(true);
  });

  it("mengizinkan Petugas PPL mengakses wilayah binaan yang ditugaskan resmi", async () => {
    const mockDb = {
      query: {
        pplAssignments: {
          findFirst: async () => ({
            userId: userIdPpl1,
            regionId: regionKuranji,
          }),
        },
      },
    };

    const result = await requireRegionAccess(
      userIdPpl1,
      "ppl",
      regionKuranji,
      mockDb as never
    );
    expect(result).toBe(true);
  });

  it("MENOLAK (403) Petugas PPL yang mencoba mengakses wilayah binaan PPL lain (IDOR / Cross-Region)", async () => {
    const mockDb = {
      query: {
        pplAssignments: {
          findFirst: async () => null, // Tidak ada assignment
        },
      },
    };

    await expect(
      requireRegionAccess(userIdPpl2, "ppl", regionKuranji, mockDb as never)
    ).rejects.toThrowError(AuthError);

    try {
      await requireRegionAccess(
        userIdPpl2,
        "ppl",
        regionKuranji,
        mockDb as never
      );
    } catch (err) {
      const authErr = err as AuthError;
      expect(authErr.status).toBe(403);
      expect(authErr.message).toContain("Akses terlarang");
    }
  });

  it("memverifikasi konfigurasi Security Headers wajib di next.config.ts (OWASP A05)", async () => {
    if (typeof nextConfig.headers !== "function") {
      throw new Error("nextConfig.headers harus berupa fungsi");
    }

    const headerConfigs = await nextConfig.headers();
    const globalHeaders = headerConfigs.find((h) => h.source === "/:path*");

    expect(globalHeaders).toBeDefined();
    const headersMap = new Map(
      globalHeaders?.headers.map((h) => [h.key, h.value])
    );

    // Verifikasi CSP
    expect(headersMap.get("Content-Security-Policy")).toBeDefined();
    expect(headersMap.get("Content-Security-Policy")).toContain("default-src 'self'");

    // Verifikasi HSTS
    expect(headersMap.get("Strict-Transport-Security")).toContain("max-age=63072000");

    // Verifikasi X-Content-Type-Options: nosniff
    expect(headersMap.get("X-Content-Type-Options")).toBe("nosniff");

    // Verifikasi Referrer-Policy
    expect(headersMap.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");

    // Verifikasi X-Frame-Options: DENY (mencegah Clickjacking)
    expect(headersMap.get("X-Frame-Options")).toBe("DENY");
  });
});
