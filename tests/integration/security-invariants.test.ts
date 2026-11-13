import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { processAssessmentDraft } from "@/server/assessment/draft-creator";

describe("T1.15: Security Invariant: No Broadcast Without User Approval (TECH_SPEC.md §7.1 & §11 A04)", () => {
  it("memverifikasi bahwa proses ingest dan pembuatan draf tidak pernah memicu broadcast otomatis", async () => {
    // Sediakan mock dbClient untuk memverifikasi alur tanpa koneksi socket fisik
    const mockDb = {
      query: {
        alertDrafts: {
          findFirst: async () => null, // Belum ada draf pending
        },
        riskAssessments: {
          findFirst: async () => null,
        },
      },
      insert: () => ({
        values: () => ({
          returning: async () => [{ id: "mock-new-draft-id", status: "pending" }],
        }),
      }),
      update: () => ({
        set: () => ({
          where: async () => {},
        }),
      }),
    };

    // Jalankan pembuat draf untuk status RED (ancaman bahaya tertinggi)
    const result = await processAssessmentDraft(
      {
        assessmentId: "mock-assessment-uuid",
        regionId: "mock-region-uuid",
        status: "red",
        regionName: "Wilayah Pengujian",
      },
      mockDb as never
    );

    // Harus berstatus 'pending', tidak langsung disiarkan
    expect(result.status).toBe("pending");
    expect(result.action).toBe("created");
  });

  it("Analisis Statis Kode: Memastikan db.insert(broadcasts) tidak pernah dipanggil di dalam cron atau ingest pipeline", () => {
    const prohibitedDirs = [
      path.resolve(process.cwd(), "src/core"),
      path.resolve(process.cwd(), "src/server/weather"),
      path.resolve(process.cwd(), "src/server/assessment"),
      path.resolve(process.cwd(), "src/app/api/cron"),
    ];

    const violations: string[] = [];

    for (const dir of prohibitedDirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isFile()) {
          const content = fs.readFileSync(fullPath, "utf-8");
          if (
            content.includes("insert(broadcasts)") ||
            content.includes("into(broadcasts)") ||
            content.includes("broadcasts.insert")
          ) {
            violations.push(path.relative(process.cwd(), fullPath));
          }
        }
      }
    }

    expect(
      violations,
      `Pelanggaran Invarian Keamanan: Ditemukan pemanggilan insert(broadcasts) di jalur otomatis:\n${violations.join(
        "\n"
      )}`
    ).toEqual([]);
  });
});
