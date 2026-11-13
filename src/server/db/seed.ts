import argon2 from "argon2";
import { db } from "./client";
import {
  contacts,
  poktan,
  pplAssignments,
  regions,
  ruleVersions,
  users,
} from "./schema";
import { encryptField } from "../crypto/aes";
import { generateBlindIndex } from "../crypto/blind-index";

export async function runSeed(): Promise<void> {
  console.log("[SEED] Memulai proses database seeding AgroEWS...");

  // 1. Seed Rule Versions v1 aktif sesuai TECH_SPEC.md Bagian 6.1
  const ruleV1Thresholds = {
    window: { pastDays: 2, forecastDays: 3 },
    green: { tBelow: 22, tAbove: 32, rhBelow: 70 },
    amber: {
      tMin: 24,
      tMax: 29,
      rhMin: 70,
      minConsecutiveDays: 2,
      rainMinMm: 1,
      rainMaxMm: 5,
      requireRain: false,
    },
    red: {
      tMin: 25,
      tMax: 29,
      rhGt: 80,
      minConsecutiveDays: 3,
    },
  };

  const [ruleV1] = await db
    .insert(ruleVersions)
    .values({
      version: 1,
      thresholds: ruleV1Thresholds,
      note: "Ambang baku WBC Versi 1.0.0 (Sesuai Resolusi R-4)",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  console.log(`[SEED] Rule version v1 aktif: ${ruleV1 ? "Dibuat" : "Sudah ada"}`);

  // 2. Seed Users (1 Admin, 1 PPL)
  const adminPasswordHash = await argon2.hash("AdminAgroEWS2026!");
  const pplPasswordHash = await argon2.hash("PplAgroEWS2026!");

  const [adminUser] = await db
    .insert(users)
    .values({
      name: "Administrator Sistem AgroEWS",
      email: "admin@agroews.id",
      passwordHash: adminPasswordHash,
      role: "admin",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  const [pplUser] = await db
    .insert(users)
    .values({
      name: "Budi Santoso (PPL Kuranji)",
      email: "ppl.kuranji@agroews.id",
      passwordHash: pplPasswordHash,
      role: "ppl",
      phoneEnc: encryptField("+6281200000000"),
      phoneHash: generateBlindIndex("+6281200000000"),
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  console.log(`[SEED] User admin & PPL: ${adminUser && pplUser ? "Dibuat" : "Sudah ada / parsial"}`);

  // 3. Seed Regions (1 Kecamatan, 1 Desa)
  const [kecamatan] = await db
    .insert(regions)
    .values({
      level: "kecamatan",
      code: "13.71.09",
      name: "Kecamatan Kuranji",
      lat: "-0.925200",
      lng: "100.412400",
      timezone: "Asia/Jakarta",
      bmkgAdm4: "13.71.09",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  let parentKecamatanId = kecamatan?.id;
  if (!parentKecamatanId) {
    const existing = await db.query.regions.findFirst({
      where: (r, { eq }) => eq(r.code, "13.71.09"),
    });
    parentKecamatanId = existing?.id;
  }

  const [desa] = await db
    .insert(regions)
    .values({
      level: "desa",
      code: "13.71.09.1001",
      name: "Kelurahan Korong Gadang",
      parentId: parentKecamatanId,
      lat: "-0.926100",
      lng: "100.413200",
      timezone: "Asia/Jakarta",
      bmkgAdm4: "13.71.09.1001",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  let targetDesaId = desa?.id;
  if (!targetDesaId) {
    const existingDesa = await db.query.regions.findFirst({
      where: (r, { eq }) => eq(r.code, "13.71.09.1001"),
    });
    targetDesaId = existingDesa?.id;
  }

  console.log(`[SEED] Region kecamatan & desa: ${parentKecamatanId ? "Tersedia" : "Gagal"}`);

  // 4. Assign PPL ke Region
  const targetPplId = pplUser?.id ?? (await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, "ppl.kuranji@agroews.id"),
  }))?.id;

  if (targetPplId && parentKecamatanId) {
    await db
      .insert(pplAssignments)
      .values({
        userId: targetPplId,
        regionId: parentKecamatanId,
      })
      .onConflictDoNothing();
  }

  // 5. Seed Poktan
  let targetPoktanId: string | undefined;
  if (targetDesaId) {
    const [createdPoktan] = await db
      .insert(poktan)
      .values({
        name: "Kelompok Tani Tani Sejahtera",
        regionId: targetDesaId,
      })
      .returning();
    targetPoktanId = createdPoktan?.id;
  }

  // 6. Seed Kontak Dummy Fiktif (Nomor telepon khusus +62 800xxx)
  if (targetPoktanId) {
    const dummyPhone = "+6281200000001";
    await db
      .insert(contacts)
      .values({
        poktanId: targetPoktanId,
        nameEnc: encryptField("Bapak Sukardi (Ketua Poktan)"),
        phoneEnc: encryptField(dummyPhone),
        phoneHash: generateBlindIndex(dummyPhone),
        channel: "whatsapp",
        dusunLabel: "Dusun Dua",
        isLeader: true,
        optInAt: new Date(),
        optInSource: "Formulir Registrasi Pilot BPP Kuranji 2026",
      })
      .onConflictDoNothing();
  }

  console.log("[SEED] Database seeding AgroEWS selesai dengan sukses.");
}

// Jalankan jika dieksekusi langsung
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[FATAL] Gagal menjalankan seed:", err);
      process.exit(1);
    });
}
