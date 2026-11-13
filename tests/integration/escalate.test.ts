/**
 * tests/integration/escalate.test.ts
 * Pengujian job eskalasi draf red > 6 jam dan kedaluwarsa draf > 48 jam dengan fake timers.
 * Sesuai TECH_SPEC.md §7.4 dan task T2.10.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/cron/escalate/route";
import { db } from "@/server/db/client";
import { notifier } from "@/server/notifier/email";
import * as auditModule from "@/server/audit";
import { env } from "@/server/env";

describe("T2.10: Escalation Cron Job & Expiration with Fake Timers", () => {
  const CRON_SECRET = env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db.query.users, "findMany").mockResolvedValue([
      { email: "koordinator.bpp@pertanian.go.id" } as never,
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("menolak permintaan tanpa header otorisasi CRON_SECRET yang valid", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/escalate", {
      method: "POST",
      headers: {
        Authorization: "Bearer wrong-secret-token",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("CRON_SECRET tidak valid");
  });

  it("mengekskalasi draf MERAH yang melewati 6 jam dan mengirim alert ke BPP", async () => {
    // Gunakan Fake Timer khusus Date agar async promise tidak terblokir
    const baseTime = new Date("2026-11-14T08:00:00.000Z");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(baseTime);

    // Draf dibuat pada 08:00, batas waktu SLA adalah 14:00 (+6 jam)
    const dueTime = new Date("2026-11-14T14:00:00.000Z");

    // Majukan waktu ke 14:01 (melewati batas 6 jam)
    const escalatedTime = new Date("2026-11-14T14:01:00.000Z");
    vi.setSystemTime(escalatedTime);

    const mockOverdueDraft = {
      id: "draft-red-overdue-1",
      regionId: "region-kuranji-1",
      regionName: "Kecamatan Kuranji",
      escalationDueAt: dueTime,
    };

    // Spy query db
    vi.spyOn(db, "select").mockImplementation(() => {
      return {
        from: () => ({
          innerJoin: () => ({
            where: async () => [mockOverdueDraft],
          }),
          where: async () => [], // Expired drafts empty
        }),
      } as never;
    });

    vi.spyOn(db, "update").mockImplementation(() => {
      return {
        set: () => ({
          where: async () => {},
        }),
      } as never;
    });

    const sendEscalationSpy = vi
      .spyOn(notifier, "sendEscalationAlert")
      .mockResolvedValue(true);

    const auditSpy = vi
      .spyOn(auditModule, "recordAuditLog")
      .mockResolvedValue();

    const req = new NextRequest("http://localhost:3000/api/cron/escalate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.escalatedCount).toBe(1);
    expect(sendEscalationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        bppEmails: ["koordinator.bpp@pertanian.go.id"],
        regionName: "Kecamatan Kuranji",
        status: "red",
        draftId: "draft-red-overdue-1",
      })
    );

    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "escalate",
        entity: "alert_drafts",
        entityId: "draft-red-overdue-1",
      })
    );
  });

  it("menandai draf pending lebih dari 48 jam sebagai expired", async () => {
    const baseTime = new Date("2026-11-14T08:00:00.000Z");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(baseTime);

    // Majukan waktu 49 jam ke depan
    const expiredTime = new Date("2026-11-16T09:00:00.000Z");
    vi.setSystemTime(expiredTime);

    const mockExpiredDraft = {
      id: "draft-old-pending-1",
      regionId: "region-sungai-bangek",
    };

    vi.spyOn(db, "select").mockImplementation(() => {
      return {
        from: () => ({
          innerJoin: () => ({
            where: async () => [], // No overdue red drafts
          }),
          where: async () => [mockExpiredDraft], // Expired drafts
        }),
      } as never;
    });

    vi.spyOn(db, "update").mockImplementation(() => {
      return {
        set: () => ({
          where: async () => {},
        }),
      } as never;
    });

    const auditSpy = vi
      .spyOn(auditModule, "recordAuditLog")
      .mockResolvedValue();

    const req = new NextRequest("http://localhost:3000/api/cron/escalate", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.expiredCount).toBe(1);
    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "expire",
        entity: "alert_drafts",
        entityId: "draft-old-pending-1",
      })
    );
  });
});
