/**
 * src/app/api/cron/ingest/route.ts
 * Endpoint cron ingest data cuaca, eksekusi asesmen risiko WBC, dan pembuatan draf peringatan.
 * Sesuai TECH_SPEC.md §5.1, §5.3, §10 dan PRD FR-1.1.
 */

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db/client";
import {
  regions,
  riskAssessments,
  ruleVersions,
  weatherDaily,
  weatherSnapshots,
} from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getWeatherDataWithFailover } from "@/server/weather/failover";
import { calculateDailyFeatures } from "@/core/features";
import { evaluate, type Thresholds } from "@/core/rules";
import { explainEvaluation } from "@/core/explain";
import { processAssessmentDraft } from "@/server/assessment/draft-creator";
import { verifyCronAuth } from "@/server/auth/cron-auth";

async function handleIngest(req: NextRequest): Promise<NextResponse> {
  // 1. Verifikasi CRON_SECRET secara konstan-waktu
  if (!verifyCronAuth(req)) {
    return NextResponse.json(
      { error: "Unauthorized: Token CRON_SECRET tidak valid atau tidak disertakan" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const slot = (searchParams.get("slot") || "manual") as "0500" | "1700" | "manual";

  // 2. Ambil Rule Version aktif
  const activeRule = await db.query.ruleVersions.findFirst({
    where: eq(ruleVersions.isActive, true),
  });

  if (!activeRule) {
    return NextResponse.json(
      { error: "Tidak ada rule_versions yang aktif di sistem" },
      { status: 500 }
    );
  }

  const thresholds = activeRule.thresholds as Thresholds;

  // 3. Ambil daftar wilayah aktif
  const activeRegions = await db.query.regions.findMany({
    where: eq(regions.isActive, true),
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const results: Array<{
    regionId: string;
    regionName: string;
    status?: string;
    source?: string;
    draftAction?: string;
    error?: string;
  }> = [];

  // 4. Proses per wilayah
  for (const reg of activeRegions) {
    try {
      const weatherResult = await getWeatherDataWithFailover({
        id: reg.id,
        lat: Number.parseFloat(reg.lat),
        lng: Number.parseFloat(reg.lng),
        bmkgAdm4: reg.bmkgAdm4,
      });

      const { data, source, isDegraded, latencyMs } = weatherResult;

      // Simpan weather_snapshots
      const [savedSnapshot] = await db
        .insert(weatherSnapshots)
        .values({
          regionId: reg.id,
          runSlot: slot,
          source,
          isDegraded,
          latencyMs,
          payload: data.rawPayload as never,
        })
        .returning();

      // Hitung fitur harian
      const dailyFeatures = calculateDailyFeatures(
        data.hourly,
        data.daily,
        todayStr
      );

      // Simpan weather_daily
      for (const feat of dailyFeatures) {
        await db
          .insert(weatherDaily)
          .values({
            regionId: reg.id,
            localDate: feat.date,
            tMean: feat.tMean.toFixed(1),
            tMax: feat.tMax.toFixed(1),
            tMin: feat.tMin.toFixed(1),
            rhMean: feat.rhMean.toFixed(1),
            rhHoursGe80: feat.rhHoursGe80,
            precipMm: feat.precipMm.toFixed(1),
            isForecast: feat.isForecast,
            snapshotId: savedSnapshot?.id,
          })
          .onConflictDoUpdate({
            target: [weatherDaily.regionId, weatherDaily.localDate],
            set: {
              tMean: feat.tMean.toFixed(1),
              tMax: feat.tMax.toFixed(1),
              tMin: feat.tMin.toFixed(1),
              rhMean: feat.rhMean.toFixed(1),
              rhHoursGe80: feat.rhHoursGe80,
              precipMm: feat.precipMm.toFixed(1),
              isForecast: feat.isForecast,
              snapshotId: savedSnapshot?.id,
            },
          });
      }

      // Jalankan evaluasi aturan risiko
      const evalResult = evaluate(dailyFeatures, thresholds, todayStr);
      const narrativeExplanation = explainEvaluation(evalResult);

      // Simpan risk_assessments
      const [savedAssessment] = await db
        .insert(riskAssessments)
        .values({
          regionId: reg.id,
          assessedForDate: todayStr,
          status: evalResult.status,
          ruleVersionId: activeRule.id,
          snapshotId: savedSnapshot?.id,
          features: dailyFeatures as never,
          explain: {
            narrative: narrativeExplanation,
            reasons: evalResult.reasons,
            runLength: evalResult.runLength,
          } as never,
          isDegraded,
        })
        .returning();

      // Buat draf bila status AMBER atau RED
      let draftActionResult = "none";
      if (savedAssessment) {
        const draftRes = await processAssessmentDraft({
          assessmentId: savedAssessment.id,
          regionId: reg.id,
          status: evalResult.status,
          regionName: reg.name,
        });
        draftActionResult = draftRes.action;
      }

      results.push({
        regionId: reg.id,
        regionName: reg.name,
        status: evalResult.status,
        source,
        draftAction: draftActionResult,
      });
    } catch (regionErr) {
      console.error(
        `[INGEST] Gagal memproses wilayah ${reg.name} (${reg.id}):`,
        regionErr
      );
      results.push({
        regionId: reg.id,
        regionName: reg.name,
        error: (regionErr as Error).message,
      });
    }
  }

  return NextResponse.json({
    success: true,
    slot,
    processedCount: results.length,
    results,
  });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  return handleIngest(req);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return handleIngest(req);
}
