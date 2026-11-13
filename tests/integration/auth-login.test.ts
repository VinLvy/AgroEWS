/**
 * tests/integration/auth-login.test.ts
 * Verifikasi otentikasi login untuk peran PPL, Koordinator BPP, dan Admin.
 */

import { describe, expect, it } from "vitest";
import { authConfig } from "@/server/auth/config";

describe("Otentikasi Login AgroEWS", () => {
  const provider = authConfig.providers[0] as any;
  const authorize = provider?.options?.authorize || provider?.authorize;

  it("berhasil login sebagai Petugas Lapangan (PPL)", async () => {
    const user = await authorize({
      email: "ppl.kuranji@pertanian.go.id",
      password: "Pertanian2026!",
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe("ppl.kuranji@pertanian.go.id");
    expect(user?.role).toBe("ppl");
    expect(user?.name).toBe("Budi Santoso (PPL)");
  });

  it("berhasil login sebagai Koordinator BPP", async () => {
    const user = await authorize({
      email: "koordinator.bpp@pertanian.go.id",
      password: "Pertanian2026!",
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe("koordinator.bpp@pertanian.go.id");
    expect(user?.role).toBe("bpp_coordinator");
    expect(user?.name).toBe("Siti Rahma (Koordinator)");
  });

  it("berhasil login sebagai Administrator", async () => {
    const user = await authorize({
      email: "admin@pertanian.go.id",
      password: "Pertanian2026!",
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe("admin@pertanian.go.id");
    expect(user?.role).toBe("admin");
  });

  it("menolak login jika kata sandi salah", async () => {
    const user = await authorize({
      email: "koordinator.bpp@pertanian.go.id",
      password: "SalahPassword123!",
    });

    expect(user).toBeNull();
  });

  it("menolak login jika email tidak terdaftar", async () => {
    const user = await authorize({
      email: "tidak.ada@pertanian.go.id",
      password: "Pertanian2026!",
    });

    expect(user).toBeNull();
  });
});
