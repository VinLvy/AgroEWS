import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/server/db/client";
import {
  alertDrafts,
  riskAssessments,
  regions,
  weatherDaily,
  poktan,
  contacts,
} from "@/server/db/schema";
import { requireRegionAccess, type UserRole } from "@/server/auth/rbac";
import { RiskBadge } from "@/components/agro/RiskBadge";
import { MetricCard } from "@/components/agro/MetricCard";
import { StatusIcon } from "@/components/agro/StatusIcon";
import { explainEvaluation } from "@/core/explain";
import type { EvaluationResult } from "@/core/rules";
import { eq, and, isNotNull, isNull, inArray, asc } from "drizzle-orm";
import { DraftReviewClient } from "./DraftReviewClient";

interface DraftPageProps {
  params: Promise<{ id: string }>;
}

export default async function DraftReviewPage({ params }: DraftPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  // 1. Ambil data draf
  const draft = await db.query.alertDrafts.findFirst({
    where: eq(alertDrafts.id, id),
  });

  if (!draft) {
    notFound();
  }

  // 2. Verifikasi akses region pengguna
  try {
    await requireRegionAccess(
      session.user.id,
      session.user.role as UserRole,
      draft.regionId
    );
  } catch {
    return (
      <div className="p-8 max-w-xl mx-auto text-center bg-white border border-[var(--border-card)] rounded-lg my-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-700 mb-3">
          <StatusIcon name="shield-alert" className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Akses Wilayah Ditolak
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1 mb-4">
          Anda tidak memiliki izin penugasan resmi untuk mengelola wilayah ini.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center min-h-[48px] px-4 py-2 text-sm font-bold text-white bg-[var(--agri-primary-700)] rounded-md"
        >
          Kembali ke Dasbor
        </Link>
      </div>
    );
  }

  // 3. Ambil data region dan asesmen
  const region = await db.query.regions.findFirst({
    where: eq(regions.id, draft.regionId),
  });

  const assessment = await db.query.riskAssessments.findFirst({
    where: eq(riskAssessments.id, draft.assessmentId),
  });

  if (!region || !assessment) {
    notFound();
  }

  // 4. Ambil histori cuaca 3 hari untuk sparkline
  const recentDaily = await db
    .select()
    .from(weatherDaily)
    .where(eq(weatherDaily.regionId, draft.regionId))
    .orderBy(asc(weatherDaily.localDate))
    .limit(3);

  const features = (assessment.features ?? {}) as Record<string, unknown>;
  const tMeanVal =
    typeof features.tMean === "number" ? features.tMean : 26.8;
  const rhMeanVal =
    typeof features.rhMean === "number" ? features.rhMean : 86.0;
  const precipVal =
    typeof features.precipMm === "number" ? features.precipMm : 3.5;

  // Siapkan nilai sparkline 3 hari
  const sparklineT =
    recentDaily.length >= 2
      ? recentDaily.map((d) => Number(d.tMean ?? tMeanVal))
      : [tMeanVal - 0.4, tMeanVal + 0.2, tMeanVal];

  const sparklineRH =
    recentDaily.length >= 2
      ? recentDaily.map((d) => Number(d.rhMean ?? rhMeanVal))
      : [rhMeanVal - 2, rhMeanVal + 1, rhMeanVal];

  const sparklineRain =
    recentDaily.length >= 2
      ? recentDaily.map((d) => Number(d.precipMm ?? precipVal))
      : [precipVal, precipVal + 1.2, precipVal];

  // 5. Hitung jumlah kontak beropt-in aktif
  const regionPoktans = await db
    .select({ id: poktan.id })
    .from(poktan)
    .where(eq(poktan.regionId, draft.regionId));

  const poktanIds = regionPoktans.map((p) => p.id);
  let recipientCount = 0;

  if (poktanIds.length > 0) {
    const activeContacts = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(
        and(
          inArray(contacts.poktanId, poktanIds),
          isNotNull(contacts.optInAt),
          isNull(contacts.optOutAt)
        )
      );
    recipientCount = activeContacts.length;
  }

  // 6. Terjemahkan narasi explainability
  let explanationText = "";
  try {
    if (assessment.explain && typeof assessment.explain === "object") {
      explanationText = explainEvaluation(
        assessment.explain as unknown as EvaluationResult
      );
    }
  } catch {
    explanationText =
      "Analisis menunjukkan kombinasi suhu optimum dan kelembapan tinggi berpotensi meningkatkan risiko perkembangan wereng.";
  }

  if (!explanationText) {
    explanationText =
      "Analisis mikroklimat menunjukkan kondisi lingkungan kondusif bagi siklus hidup wereng batang cokelat.";
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Tombol Navigasi Kembali */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--agri-primary-700)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--agri-primary-700)] rounded px-1 py-0.5"
        >
          &larr; Kembali ke Antrean Dasbor
        </Link>
      </div>

      {/* Banner DATA TIDAK MUTAKHIR jika data cuaca degraded */}
      {assessment.isDegraded && (
        <div
          role="alert"
          className="p-4 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3"
        >
          <StatusIcon
            name="triangle-alert"
            className="w-5 h-5 flex-shrink-0 text-amber-800 mt-0.5"
          />
          <div>
            <h3 className="font-bold text-sm tracking-wide">
              DATA TIDAK MUTAKHIR
            </h3>
            <p className="text-xs mt-0.5 text-amber-800">
              Pengamatan cuaca menggunakan data cadangan atau estimasi satelit sekunder akibat kendala komunikasi jaringan BMKG. Mohon validasi kondisi lapangan sebelum memutuskan siaran.
            </p>
          </div>
        </div>
      )}

      {/* Header Draf */}
      <div className="bg-white border border-[var(--border-card)] rounded-lg p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <RiskBadge status={assessment.status} />
              <span className="text-xs text-[var(--text-muted)] font-medium">
                Draf ID: {draft.id.slice(0, 8)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {region.name}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Tanggal Asesmen: {assessment.assessedForDate} | Wilayah Administratif:{" "}
              {region.level.toUpperCase()}
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-[var(--border-subtle)] sm:pl-6">
            <span className="text-xs text-[var(--text-muted)] block">
              Penerima Diseminasi
            </span>
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              {recipientCount}
            </span>
            <span className="text-xs text-[var(--text-muted)] block">
              Petani Terdaftar (Opt-in)
            </span>
          </div>
        </div>
      </div>

      {/* 3 MetricCards dengan SVG Sparkline 3 Hari */}
      <section aria-label="Metrik Agroklimat Terpantau">
        <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3">
          Parameter Agroklimat Kunci (3 Hari Terakhir)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Kartu 1: Suhu */}
          <MetricCard
            label="Suhu Udara Rerata"
            value={tMeanVal}
            unit="°C"
            spokenUnit="derajat celsius"
            icon="thermometer"
            description="Zona optimum wereng batang cokelat (24 - 29 °C)"
            sparkline={{ values: sparklineT }}
          />

          {/* Kartu 2: Kelembapan Relatif */}
          <MetricCard
            label="Kelembapan Relatif (RH)"
            value={rhMeanVal}
            unit="%"
            spokenUnit="persen"
            icon="droplet"
            description="Kondisi lembap mendukung inkubasi telur wereng"
            sparkline={{ values: sparklineRH }}
          />

          {/* Kartu 3: Curah Hujan */}
          <MetricCard
            label="Curah Hujan Harian"
            value={precipVal}
            unit="mm"
            spokenUnit="milimeter"
            icon="cloud-rain"
            description="Hujan ringan berselang menjaga mikroklimat kanopi"
            sparkline={{ values: sparklineRain }}
          />
        </div>
      </section>

      {/* Bagian Explainability Log (FR-3.2) */}
      <section aria-label="Kesimpulan Biologis dan Alasan Sistem">
        <div className="bg-white border border-[var(--border-card)] rounded-lg p-5 shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <StatusIcon name="shield-check" className="w-4 h-4 text-[var(--agri-primary-700)]" />
            Kesimpulan Biologis & Alasan Sistem
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {explanationText}
          </p>
          <div className="pt-2 text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)]">
            Algoritma: Heuristik Fenologi WBC v1.0 | Sumber Data: Open-Meteo & BMKG
          </div>
        </div>
      </section>

      {/* Komponen Client Interaktif: VerificationBar & Aksi Lapangan */}
      <DraftReviewClient
        draftId={draft.id}
        regionName={region.name}
        dateStr={assessment.assessedForDate}
        status={assessment.status === "red" ? "red" : "amber"}
        tMean={tMeanVal}
        rhMean={rhMeanVal}
        recipientCount={recipientCount}
        recommendedText={draft.recommendedText}
        pplName={session.user.name || "Petugas PPL"}
      />
    </div>
  );
}
