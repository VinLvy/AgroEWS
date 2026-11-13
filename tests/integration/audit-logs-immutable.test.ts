import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("T0.5: Audit Logs Immutability Verification (TECH_SPEC.md §4 & §11)", () => {
  it("memverifikasi migrasi SQL mencabut hak UPDATE dan DELETE pada tabel audit_logs", () => {
    const drizzleDir = path.resolve(process.cwd(), "drizzle");
    const migrationFiles = fs
      .readdirSync(drizzleDir)
      .filter((file) => file.endsWith(".sql"));

    expect(migrationFiles.length).toBeGreaterThan(0);

    let hasRevokeStatement = false;
    let hasProtectTrigger = false;

    for (const file of migrationFiles) {
      const content = fs.readFileSync(path.join(drizzleDir, file), "utf-8");
      if (
        content.includes('REVOKE UPDATE, DELETE ON TABLE "audit_logs"') ||
        content.includes("REVOKE UPDATE, DELETE ON audit_logs")
      ) {
        hasRevokeStatement = true;
      }
      if (
        content.includes("protect_audit_logs") &&
        content.includes("audit_logs_no_update_delete")
      ) {
        hasProtectTrigger = true;
      }
    }

    expect(
      hasRevokeStatement,
      "Migrasi SQL wajib memuat pernyataan REVOKE UPDATE, DELETE pada audit_logs"
    ).toBe(true);

    expect(
      hasProtectTrigger,
      "Migrasi SQL wajib memuat TRIGGER protect_audit_logs untuk mencegah mutasi data"
    ).toBe(true);
  });
});
