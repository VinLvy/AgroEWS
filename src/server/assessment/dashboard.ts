/**
 * src/server/assessment/dashboard.ts
 * Query data antrean draf peringatan dan feed untuk Dasbor PPL.
 * Sesuai TECH_SPEC.md §7.2, §11 (A01) dan PRD FR-4.
 */

import { db } from "@/server/db/client";
import {
  alertDrafts,
  riskAssessments,
  regions,
  pplAssignments,
} from "@/server/db/schema";
import { eq, inArray, and, asc } from "drizzle-orm";
import type { UserRole } from "@/server/auth/rbac";

export interface DashboardDraftItem {
  id: string;
  regionId: string;
  regionName: string;
  regionLevel: string;
  riskStatus: "green" | "amber" | "red";
  assessedForDate: string;
  isDegraded: boolean;
  createdAt: Date;
  escalationDueAt: Date | null;
  escalatedAt: Date | null;
}

export async function getPPLDashboardData(
  userId: string,
  userRole: UserRole,
  dbInstance = db
): Promise<{ drafts: DashboardDraftItem[]; assignedRegionsCount: number }> {
  // 1. Dapatkan daftar regionId yang berhak diakses pengguna
  let accessibleRegionIds: string[] = [];

  if (userRole === "admin" || userRole === "bpp_coordinator") {
    const allActiveRegions = await dbInstance.query.regions.findMany({
      where: eq(regions.isActive, true),
      columns: { id: true },
    });
    accessibleRegionIds = allActiveRegions.map((r) => r.id);
  } else {
    // PPL biasa: filter berdasarkan penugasan resmi
    const assignments = await dbInstance.query.pplAssignments.findMany({
      where: eq(pplAssignments.userId, userId),
      columns: { regionId: true },
    });
    accessibleRegionIds = assignments.map((a) => a.regionId);
  }

  if (accessibleRegionIds.length === 0) {
    return { drafts: [], assignedRegionsCount: 0 };
  }

  // 2. Query draf dengan status 'pending'
  const pendingDrafts = await dbInstance
    .select({
      id: alertDrafts.id,
      regionId: alertDrafts.regionId,
      regionName: regions.name,
      regionLevel: regions.level,
      riskStatus: riskAssessments.status,
      assessedForDate: riskAssessments.assessedForDate,
      isDegraded: riskAssessments.isDegraded,
      createdAt: alertDrafts.createdAt,
      escalationDueAt: alertDrafts.escalationDueAt,
      escalatedAt: alertDrafts.escalatedAt,
    })
    .from(alertDrafts)
    .innerJoin(riskAssessments, eq(alertDrafts.assessmentId, riskAssessments.id))
    .innerJoin(regions, eq(alertDrafts.regionId, regions.id))
    .where(
      and(
        eq(alertDrafts.status, "pending"),
        inArray(alertDrafts.regionId, accessibleRegionIds)
      )
    )
    .orderBy(asc(alertDrafts.createdAt));

  // 3. Urutkan: MERAH (red) prioritas tertinggi, kemudian draf tertua
  const sorted = pendingDrafts.sort((a, b) => {
    if (a.riskStatus === "red" && b.riskStatus !== "red") return -1;
    if (a.riskStatus !== "red" && b.riskStatus === "red") return 1;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return {
    drafts: sorted,
    assignedRegionsCount: accessibleRegionIds.length,
  };
}
