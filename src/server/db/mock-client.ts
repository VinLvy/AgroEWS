/**
 * src/server/db/mock-client.ts
 * In-memory mock database client untuk pengujian E2E & lingkungan CI tanpa daemon Postgres aktif.
 */

import { getTableName } from "drizzle-orm";

/* eslint-disable */

const PASSWORD_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$/wX7bRB4XXKpqTcSc8F5lA$/zrGY0OdxqcVAUc3QqdQuUGpr/fu7uYm0uGi7WkzjCw"; // Pertanian2026!

const USER_ID = "11111111-1111-4111-8111-111111111101";
const REGION_ID = "22222222-2222-4222-8222-222222222201";
const ASSESSMENT_ID = "33333333-3333-4333-8333-333333333301";
const DRAFT_ID = "44444444-4444-4444-8444-444444444401";
const POKTAN_ID = "55555555-5555-4555-8555-555555555501";
const CONTACT_ID = "66666666-6666-4666-8666-666666666601";

export function createMockDb() {
  const state = {
    users: [
      {
        id: USER_ID,
        name: "Budi Santoso (PPL)",
        email: "ppl.kuranji@pertanian.go.id",
        passwordHash: PASSWORD_HASH,
        role: "ppl" as const,
        isActive: true,
        failedLogins: 0,
        lockedUntil: null,
      },
      {
        id: "11111111-1111-4111-8111-111111111102",
        name: "Siti Rahma (Koordinator)",
        email: "koordinator.bpp@pertanian.go.id",
        passwordHash: PASSWORD_HASH,
        role: "bpp_coordinator" as const,
        isActive: true,
        failedLogins: 0,
        lockedUntil: null,
      },
      {
        id: "11111111-1111-4111-8111-111111111103",
        name: "Administrator AgroEWS",
        email: "admin@pertanian.go.id",
        passwordHash: PASSWORD_HASH,
        role: "admin" as const,
        isActive: true,
        failedLogins: 0,
        lockedUntil: null,
      },
    ],
    regions: [
      {
        id: REGION_ID,
        name: "Kecamatan Kuranji",
        level: "kecamatan",
        code: "13.71.05",
        isActive: true,
      },
    ],
    pplAssignments: [
      {
        userId: USER_ID,
        regionId: REGION_ID,
      },
    ],
    riskAssessments: [
      {
        id: ASSESSMENT_ID,
        regionId: REGION_ID,
        assessedForDate: "2026-11-14",
        status: "red" as const,
        features: {
          tMean: 27.2,
          rhMean: 86.5,
          precipMm: 3.8,
        },
        explain: {
          status: "red" as const,
          reasons: [
            {
              rule: "red" as const,
              date: "2026-11-14",
              metric: "tMean",
              value: 27.2,
              threshold: 25.0,
              passed: true,
            },
          ],
          runLength: 3,
        },
        isDegraded: false,
      },
    ],
    alertDrafts: [
      {
        id: DRAFT_ID,
        assessmentId: ASSESSMENT_ID,
        regionId: REGION_ID,
        status: "pending" as const,
        cropPhase: null as any,
        recommendedText: "PERINGATAN DINI AGROKLIMAT: Waspada ledakan nimfa wereng batang cokelat.",
        editedText: null,
        reviewerId: null,
        reviewedAt: null,
        escalationDueAt: new Date(Date.now() + 5 * 3600 * 1000),
        escalatedAt: null,
        createdAt: new Date(),
      },
    ],
    weatherDaily: [
      {
        regionId: REGION_ID,
        localDate: "2026-11-12",
        tMean: "26.8",
        rhMean: "84.0",
        precipMm: "2.0",
      },
      {
        regionId: REGION_ID,
        localDate: "2026-11-13",
        tMean: "27.0",
        rhMean: "85.5",
        precipMm: "3.5",
      },
      {
        regionId: REGION_ID,
        localDate: "2026-11-14",
        tMean: "27.2",
        rhMean: "86.5",
        precipMm: "3.8",
      },
    ],
    poktan: [
      {
        id: POKTAN_ID,
        name: "Poktan Makmur",
        regionId: REGION_ID,
      },
    ],
    contacts: [
      {
        id: CONTACT_ID,
        poktanId: POKTAN_ID,
        channel: "whatsapp" as const,
        optInAt: new Date(),
        optOutAt: null,
      },
    ],
    broadcasts: [] as any[],
    deliveries: [] as any[],
    auditLogs: [] as any[],
  };

  const mockDb: any = {
    query: {
      users: {
        findFirst: async ({ where }: any = {}) => {
          if (!where) return state.users[0];
          // Ekstrak nilai filter (email atau id) dari klausa where Drizzle
          let filterVal: any = undefined;
          if (where.queryChunks && Array.isArray(where.queryChunks)) {
            for (const chunk of where.queryChunks) {
              if (chunk && typeof chunk === "object" && "value" in chunk && !Array.isArray(chunk.value)) {
                filterVal = chunk.value;
                break;
              }
            }
          }
          if (filterVal !== undefined) {
            const normalized = String(filterVal).toLowerCase().trim();
            const found = state.users.find(
              (u) => u.email.toLowerCase().trim() === normalized || u.id === filterVal
            );
            return found || null;
          }
          return state.users[0];
        },
        findMany: async () => state.users,
      },
      regions: {
        findFirst: async () => state.regions[0],
        findMany: async () => state.regions,
      },
      pplAssignments: {
        findFirst: async () => state.pplAssignments[0],
        findMany: async () => state.pplAssignments,
      },
      riskAssessments: {
        findFirst: async () => state.riskAssessments[0],
        findMany: async () => state.riskAssessments,
      },
      alertDrafts: {
        findFirst: async () => state.alertDrafts[0],
        findMany: async () => state.alertDrafts,
      },
      poktan: {
        findMany: async () => state.poktan,
      },
      contacts: {
        findMany: async () => state.contacts,
      },
    },
    select: (fields?: any) => {
      return {
        from: (table: any) => {
          const resolveData = () => {
            let tableName = "";
            try {
              tableName = getTableName(table);
            } catch {
              tableName = table?.dbName || table?._?.name || "";
            }

            if (tableName === "weather_daily") {
              return state.weatherDaily;
            }
            if (tableName === "poktan") {
              return state.poktan;
            }
            if (tableName === "contacts") {
              return state.contacts;
            }

            // Default untuk alert_drafts
            return state.alertDrafts.map((d) => ({
              id: d.id,
              assessmentId: d.assessmentId,
              regionId: d.regionId,
              regionName: state.regions[0]?.name || "Kecamatan Kuranji",
              regionLevel: state.regions[0]?.level || "kecamatan",
              riskStatus: "red" as const,
              assessedForDate: "2026-11-14",
              recommendedText: d.recommendedText,
              isDegraded: false,
              createdAt: d.createdAt,
              escalationDueAt: d.escalationDueAt,
              escalatedAt: d.escalatedAt,
              status: d.status,
            }));
          };

          const chain: any = {
            innerJoin: () => chain,
            where: () => chain,
            orderBy: () => chain,
            limit: () => chain,
            for: () => chain,
            then: (resolve: any) => resolve(resolveData()),
          };
          // Make it awaitable directly
          chain[Symbol.toStringTag] = "Promise";
          chain.then = (onfulfilled: any) => Promise.resolve(resolveData()).then(onfulfilled);
          return chain;
        },
      };
    },
    insert: (table: any) => ({
      values: (val: any) => ({
        returning: async () => [{ id: "77777777-7777-4777-8777-777777777701" }],
        then: (onfulfilled: any) =>
          Promise.resolve([{ id: "77777777-7777-4777-8777-777777777701" }]).then(
            onfulfilled
          ),
      }),
    }),
    update: (table: any) => ({
      set: (val: any) => ({
        where: async () => {
          if (val.status && state.alertDrafts[0]) {
            state.alertDrafts[0].status = val.status;
          }
        },
      }),
    }),
    transaction: async (cb: any) => {
      return await cb(mockDb);
    },
  };

  return mockDb;
}
