import { describe, expect, it } from "vitest";
import { normalizeDusun, parseLaporMessage } from "@/core/lapor-parser";

describe("T1.6: LAPOR Parser & Normalization Tests (TECH_SPEC.md §8.6)", () => {
  it("menormalkan berbagai variasi penulisan dusun ke bentuk baku", () => {
    expect(normalizeDusun("Dusun-Dua")).toBe("2");
    expect(normalizeDusun("dusun 2")).toBe("2");
    expect(normalizeDusun("DSN II")).toBe("2");
    expect(normalizeDusun("Dusun Satu")).toBe("1");
    expect(normalizeDusun("dsn_enam")).toBe("6");
    expect(normalizeDusun("Dusun Sukamaju")).toBe("sukamaju");
    expect(normalizeDusun("Dusun Karang Anyar III")).toBe("karang anyar 3");
  });

  it("berhasil mem-parsing pesan LAPOR yang valid", () => {
    const res1 = parseLaporMessage("LAPOR Dusun-Dua 1");
    expect(res1.success).toBe(true);
    if (res1.success) {
      expect(res1.dusunLabel).toBe("Dusun-Dua");
      expect(res1.dusunNorm).toBe("2");
      expect(res1.code).toBe(1);
    }

    const res2 = parseLaporMessage("lapor Sukamaju 0");
    expect(res2.success).toBe(true);
    if (res2.success) {
      expect(res2.dusunNorm).toBe("sukamaju");
      expect(res2.code).toBe(0);
    }

    const res3 = parseLaporMessage("Lapor DSN IV 2");
    expect(res3.success).toBe(true);
    if (res3.success) {
      expect(res3.dusunNorm).toBe("4");
      expect(res3.code).toBe(2);
    }
  });

  it("mengklasifikasikan error kode status tidak valid", () => {
    const res = parseLaporMessage("LAPOR Dusun-Dua 5");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe("kode");
      expect(res.message).toContain("Kode status salah");
    }
  });

  it("mengklasifikasikan error format tidak lengkap / salah awalan", () => {
    const res1 = parseLaporMessage("Halo Pak, wereng aman di dusun dua");
    expect(res1.success).toBe(false);
    if (!res1.success) {
      expect(res1.error).toBe("format");
    }

    const res2 = parseLaporMessage("LAPOR 1");
    expect(res2.success).toBe(false);
    if (!res2.success) {
      expect(res2.error).toBe("format");
    }
  });

  it("Fuzz Test: 200 variasi input acak/ekstrem tidak pernah melempar exception", () => {
    const prefixes = ["LAPOR", "lapor", "Lapor", "LAPORAN", "KIRIM", "", "  LAPOR  "];
    const dusunVariations = [
      "Dusun-Dua",
      "dsn 1",
      "Sukamaju",
      "Karang Anyar III",
      "  ",
      "!!!",
      "🌾🐛",
      "Dusun\tTiga\n",
      "Dusun-123-ABC",
      "Dusun dengan nama yang sangat amat panjang sekali sampai melebihi batas wajar",
    ];
    const codes = ["0", "1", "2", "3", "9", "aman", "-1", "", " "];

    let testCount = 0;
    for (const prefix of prefixes) {
      for (const dusun of dusunVariations) {
        for (const code of codes) {
          testCount++;
          const message = `${prefix} ${dusun} ${code}`;
          expect(() => parseLaporMessage(message)).not.toThrow();
        }
      }
    }

    expect(testCount).toBeGreaterThanOrEqual(200);
  });
});
