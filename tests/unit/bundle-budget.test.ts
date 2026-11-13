/**
 * tests/unit/bundle-budget.test.ts
 * Verifikasi batas ukuran bundle (Performance Size Budget).
 * Sesuai TECH_SPEC.md §13 dan task T2.14:
 * - JS awal < 150 KB gzip
 * - Total load < 1.5 MB
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

describe("T2.14: Size Limit & Performance Budget Check", () => {
  it("memverifikasi bahwa ukuran setiap shared chunk JavaScript awal < 150 KB (gzip)", () => {
    const staticChunksDir = path.resolve(
      process.cwd(),
      ".next/static/chunks"
    );

    const buildIdPath = path.resolve(process.cwd(), ".next/BUILD_ID");
    if (!fs.existsSync(buildIdPath) || !fs.existsSync(staticChunksDir)) {
      // Jika production build ('next build') belum pernah dijalankan, lewati
      return;
    }

    const files = fs.readdirSync(staticChunksDir, { recursive: true }) as string[];
    const jsFiles = files.filter((f) => typeof f === "string" && f.endsWith(".js"));

    expect(jsFiles.length).toBeGreaterThan(0);

    for (const file of jsFiles) {
      const fullPath = path.resolve(staticChunksDir, file);
      const content = fs.readFileSync(fullPath);
      const gzipped = zlib.gzipSync(content);
      const gzippedKb = gzipped.length / 1024;

      // Setiap individual chunk JS awal wajib < 150 KB gzip
      expect(
        gzippedKb,
        `Chunk ${file} (${gzippedKb.toFixed(2)} KB) melampaui batas 150 KB gzip`
      ).toBeLessThan(150);
    }
  });

  it("memverifikasi total build static assets < 1.5 MB", () => {
    const buildIdPath = path.resolve(process.cwd(), ".next/BUILD_ID");
    const staticDir = path.resolve(process.cwd(), ".next/static");
    if (!fs.existsSync(buildIdPath) || !fs.existsSync(staticDir)) return;

    let totalBytes = 0;
    const calculateSize = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          calculateSize(full);
        } else {
          totalBytes += fs.statSync(full).size;
        }
      }
    };

    calculateSize(staticDir);
    const totalMb = totalBytes / (1024 * 1024);

    expect(
      totalMb,
      `Total static asset size (${totalMb.toFixed(2)} MB) melampaui batas 1.5 MB`
    ).toBeLessThan(1.5);
  });
});
