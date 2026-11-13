/**
 * tests/e2e/prototype-navigation.spec.ts
 * E2E test untuk menguji seluruh halaman prototipe dan fungsionalitas penekanan tombol
 * dengan diferensiasi peran (Koordinator BPP vs Petugas Lapangan PPL).
 */

import { test, expect } from "@playwright/test";

test.describe("Prototipe UI: Pengujian Peran & Fungsionalitas Tombol", () => {
  test("Koordinator BPP: Login, Dasbor Eksekutif, Peta Zonasi, dan Manajemen Aturan", async ({ page }) => {
    // 1. Login Koordinator BPP
    await page.goto("/login");
    await page.fill('input[type="email"]', "koordinator.bpp@pertanian.go.id");
    await page.fill('input[type="password"]', "Pertanian2026!");
    await page.click('button[type="submit"]');

    // Otomatis diarahkan ke /bpp
    await expect(page).toHaveURL(/.*\/bpp/);
    await expect(page.locator("header")).toContainText("Siti Rahma (Koordinator)");
    await expect(page.locator("header")).toContainText("Koordinator BPP");

    // 2. Interaksi Dasbor BPP
    await expect(page.locator("h1")).toContainText("Ikhtisar Agroklimat");

    // Switch view mode (Peta / Tabel / Vektor Offline)
    await page.click('button:has-text("Daftar Tabel")');
    await expect(page.locator("table")).toBeVisible();
    await page.click('button:has-text("Peta Zonasi")');
    await expect(page.locator('[data-testid="agro-map-container"]')).toBeVisible();
    await page.click('button:has-text("Vektor Offline")');
    await expect(page.locator('svg[role="img"]')).toBeVisible();

    // Ekspor CSV
    await page.click('button:has-text("Ekspor CSV")');
    await expect(page.locator('div[role="status"]')).toBeVisible();

    // 3. Navigasi ke Aturan Risiko Agroklimat
    await page.click('nav a:has-text("Aturan Risiko")');
    await expect(page).toHaveURL(/.*\/admin\/rules/);
    await expect(page.locator("h1")).toContainText("Manajemen Aturan");

    // Geser slider suhu simulator
    const tempSlider = page.locator('input[type="range"]').first();
    await tempSlider.fill("28.0");
    await expect(page.locator("text=28.0°C")).toBeVisible();

    // 4. Buka /dashboard untuk memverifikasi Banner Supervisi Koordinator
    await page.click('nav a:has-text("Monitoring Draf")');
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator("text=Supervisi Koordinator BPP")).toBeVisible();
  });

  test("Petugas Lapangan (PPL): Operasional Draf, Laporan Petani, Kontak, dan Simulator", async ({ page }) => {
    // 1. Login Petugas Lapangan (PPL)
    await page.goto("/login");
    await page.fill('input[type="email"]', "ppl.kuranji@pertanian.go.id");
    await page.fill('input[type="password"]', "Pertanian2026!");
    await page.click('button[type="submit"]');

    // Otomatis diarahkan ke /dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator("header")).toContainText("Budi Santoso (PPL)");
    await expect(page.locator("header")).toContainText("Petugas Lapangan");

    // 2. Buka Halaman /reports (Laporan Petani Dusun)
    await page.click('nav a:has-text("Laporan Petani")');
    await expect(page).toHaveURL(/.*\/reports/);
    await expect(page.locator("h1")).toContainText("Feed Laporan Petani");

    // Uji filter tombol
    await page.click('button:has-text("Bahaya Kode 2")');
    await expect(page.locator("tbody tr")).toHaveCount(2);

    await page.click('button:has-text("Semua")');

    // Uji tombol "Tandai Verifikasi"
    const verifyBtn = page.locator('tbody tr button:has-text("Tandai Verifikasi")').first();
    if (await verifyBtn.isVisible()) {
      await verifyBtn.click();
      await expect(page.locator('div[role="status"]')).toBeVisible();
    }

    // Uji tombol "Simulasi Laporan Baru"
    await page.click('button:has-text("Simulasi Laporan Baru")');
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    await page.click('div[role="dialog"] button:has-text("Kirim Laporan")');
    await expect(page.locator('div[role="status"]')).toBeVisible();

    // 3. Buka Halaman /regions/[id] (Wilayah Binaan)
    await page.click('nav a:has-text("Wilayah Binaan")');
    await expect(page).toHaveURL(/.*\/regions\/.*/);
    await expect(page.locator("h1")).toContainText("Nagari Sungai Bangek");

    // Uji tombol "Buka Sensor" pada tabel nomor PII
    const unmaskBtn = page.locator('button:has-text("Buka Sensor")').first();
    await unmaskBtn.click();
    await expect(page.locator('div[role="status"]')).toBeVisible();

    // Uji tombol "Perbarui Data Cuaca"
    await page.click('button:has-text("Perbarui Data Cuaca")');
    await expect(page.locator('div[role="status"]')).toBeVisible();

    // 4. Buka Halaman /admin/contacts (Kontak Binaan)
    await page.click('nav a:has-text("Kontak Binaan")');
    await expect(page).toHaveURL(/.*\/admin\/contacts/);
    await expect(page.locator("h1")).toContainText("Manajemen Kontak");

    // Uji tombol "Kirim Tes"
    const pingBtn = page.locator('button:has-text("Kirim Tes")').first();
    await pingBtn.click();
    await expect(page.locator('div[role="status"]')).toBeVisible();

    // Uji modal "Tambah Kontak Baru"
    await page.click('button:has-text("Tambah Kontak Baru")');
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    await page.click('div[role="dialog"] button:has-text("Batal")');

    // 5. Buka Halaman /simulator (Simulator Pesan Petani)
    await page.click('nav a:has-text("Simulator Pesan")');
    await expect(page).toHaveURL(/.*\/simulator/);
    await expect(page.locator("h1")).toContainText("Simulator Pesan Petani");

    // Uji tombol Quick Reply [Buka Rekomendasi Lengkap]
    await page.click('button:has-text("[ Buka Rekomendasi Lengkap ]")');
    await expect(page.locator("pre")).toContainText("PERINGATAN DINI AGROKLIMAT");

    // Uji shortcut LAPOR
    await page.click('button:has-text("LAPOR Dusun-2 2")');
    await expect(page.locator("text=Laporan diterima. Wilayah Dusun 2, status Bahaya")).toBeVisible();
  });
});
