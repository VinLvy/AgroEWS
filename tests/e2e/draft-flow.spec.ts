/**
 * tests/e2e/draft-flow.spec.ts
 * End-to-End Test Alur Verifikasi Draf PPL & Audit Aksesibilitas (Axe-Core).
 * Diuji pada 3 ukuran viewport: Mobile (360px), Tablet (768px), Desktop (1280px).
 * Sesuai TECH_SPEC.md §12.3, §13, dan task T2.13.
 */

import { test, expect, type Page } from "@playwright/test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");

// Helper verifikasi aksesibilitas dengan axe-core (Zero serious/critical violations)
async function checkA11y(page: Page, contextName: string) {
  await page.addScriptTag({ path: axePath });

  const violations = await page.evaluate(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axe = (window as any).axe;
    if (!axe) return [];
    const results = await axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa"],
      },
    });

    return results.violations.filter(
      (v: { impact: string }) =>
        v.impact === "serious" || v.impact === "critical"
    );
  });

  expect(
    violations,
    `Pelanggaran aksesibilitas serius/kritis terdeteksi pada ${contextName}`
  ).toEqual([]);
}

test.describe("T2.13: E2E PPL Verification Flow & Axe-Core Audit", () => {
  test("Alur Lengkap: Login -> Tinjau Draf MERAH -> Pilih Fase -> Edit Anjuran -> Setujui", async ({
    page,
  }) => {
    // 1. Kunjungi Halaman Login
    await page.goto("/login");
    await expect(page).toHaveURL(/.*\/login/);

    // Verifikasi Aksesibilitas Halaman Login
    await checkA11y(page, "Halaman Login");

    // 2. Isi Kredensial Petugas PPL
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    // Verifikasi Touch Target minimal 48x48 px
    const submitBox = await submitBtn.boundingBox();
    if (submitBox) {
      expect(submitBox.height).toBeGreaterThanOrEqual(48);
    }

    await emailInput.fill("ppl.kuranji@pertanian.go.id");
    await passwordInput.fill("Pertanian2026!");
    await submitBtn.click();

    // 3. Menuju Dasbor Antrean PPL
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
    await expect(page.locator("h1")).toContainText("Antrean Draf Peringatan Dini");

    // Verifikasi Aksesibilitas Dasbor
    await checkA11y(page, "Halaman Dasbor Antrean");

    // Verifikasi Keberadaan Draf MERAH & SLA Badge
    const redDraftCard = page.locator('div:has-text("Kecamatan Kuranji")').first();
    await expect(redDraftCard).toBeVisible();
    await expect(page.locator('text="[BAHAYA]"').first()).toBeVisible();

    // 4. Buka Halaman Tinjauan Draf Spesifik
    const reviewLink = page.locator('a:has-text("Tinjau Draf")').first();
    const reviewBox = await reviewLink.boundingBox();
    if (reviewBox) {
      expect(reviewBox.height).toBeGreaterThanOrEqual(48);
    }
    await reviewLink.click();

    // 5. Verifikasi Komponen di Halaman /drafts/[id]
    await page.waitForURL(/.*\/drafts\/.*/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Kecamatan Kuranji");

    // Verifikasi 3 MetricCard Agroklimat
    await expect(page.locator('text="Suhu Udara Rerata"')).toBeVisible();
    await expect(page.locator('text="Kelembapan Relatif (RH)"')).toBeVisible();
    await expect(page.locator('text="Curah Hujan Harian"')).toBeVisible();

    // Verifikasi Keberadaan SVG Sparkline
    const sparklines = page.locator("svg polyline");
    expect(await sparklines.count()).toBeGreaterThanOrEqual(3);

    // Verifikasi Aksesibilitas Halaman Draf
    await checkA11y(page, "Halaman Tinjauan Draf");

    // 6. Interaksi Bilah Verifikasi PPL: Pilih Fase Tanam
    const phaseSelect = page.locator("#crop-phase-select");
    await phaseSelect.selectOption("vegetatif_awal");

    // 7. Buka Editor Anjuran & Tambahkan Koreksi Kearifan Lokal
    const editToggleBtn = page.locator('button:has-text("Edit Anjuran")');
    await editToggleBtn.click();

    const textarea = page.locator("#edited-text");
    await expect(textarea).toBeVisible();
    await textarea.fill(
      "PHT Mandiri: Lakukan inspeksi visual serempak poktan pada hari Selasa pagi."
    );

    // 8. Eksekusi Tombol Setujui & Siarkan
    const approveBtn = page.locator(
      'button:has-text("Setujui & Siarkan")'
    );
    await expect(approveBtn).toBeEnabled();
    await approveBtn.click();

    // 9. Pratinjau Pesan Sebelum Konfirmasi Final
    const modalConfirmBtn = page.locator(
      'div[role="dialog"] button:has-text("Setujui & Siarkan")'
    );
    await expect(modalConfirmBtn).toBeVisible();
    await modalConfirmBtn.click();

    // 10. Konfirmasi Berhasil dan Navigasi Kembali ke Dasbor
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Antrean Draf Peringatan Dini");
  });
});
