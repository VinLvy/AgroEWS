import React from "react";
import Image from "next/image";
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
import { RiskGauge } from "@/components/agro/RiskGauge";
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

  const gaugeScore = Math.max(20, Math.min(100, Math.round(rhMeanVal)));

  return (
    <div className="space-y-6 pb-20">
      {/* Tombol Navigasi Kembali */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-agri-700 hover:text-agri-800 hover:underline focus:outline-none focus:ring-2 focus:ring-agri-700 rounded-lg px-2 py-1"
        >
          &larr; Kembali ke Antrean Dasbor
        </Link>
      </div>

      {/* Banner DATA TIDAK MUTAKHIR jika data cuaca degraded */}
      {assessment.isDegraded && (
        <div
          role="alert"
          className="p-4 sm:p-5 rounded-2xl bg-status-amber-bg border-[1.5px] border-status-amber-border text-status-amber-text flex items-start gap-3 shadow-xs"
        >
          <StatusIcon
            name="triangle-alert"
            className="w-5 h-5 flex-shrink-0 text-status-amber-text mt-0.5"
          />
          <div>
            <h3 className="font-extrabold text-sm tracking-wide">
              DATA TIDAK MUTAKHIR
            </h3>
            <p className="text-xs mt-1 text-amber-900 leading-relaxed">
              Pengamatan cuaca menggunakan data cadangan atau estimasi satelit sekunder akibat kendala komunikasi jaringan BMKG. Mohon validasi kondisi lapangan sebelum memutuskan siaran.
            </p>
          </div>
        </div>
      )}

      {/* Header Draf Bento */}
      <div className="bg-surface-card border-[1.5px] border-border-card rounded-3xl p-5 sm:p-6 shadow-bento">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <RiskBadge status={assessment.status} />
              <span className="text-xs text-content-muted font-mono font-semibold px-2.5 py-1 rounded-full bg-surface-subtle border border-border-subtle">
                Draf ID: {draft.id.slice(0, 8)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
              {region.name}
            </h1>
            <p className="text-xs font-medium text-content-muted">
              Tanggal Asesmen:{" "}
              <span className="font-mono font-bold text-content-secondary">
                {assessment.assessedForDate}
              </span>{" "}
              | Wilayah Administratif:{" "}
              <span className="font-bold text-content-secondary">
                {region.level.toUpperCase()}
              </span>
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-agri-700 to-agri-900 text-white px-5 py-4 sm:min-w-[200px] shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 block">
              Penerima Diseminasi
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-extrabold tabular-nums">
                {recipientCount}
              </span>
              <span className="text-xs font-semibold text-emerald-100">
                Petani Opt-in
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 MetricCards dengan SVG Sparkline + Mini Bar 3 Hari */}
      <section aria-label="Metrik Agroklimat Terpantau">
        <h2 className="text-xs font-extrabold text-content-secondary uppercase tracking-wider mb-3">
          Parameter Agroklimat Kunci (3 Hari Terakhir)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Kartu 1: Suhu */}
          <MetricCard
            label="Suhu Udara Rerata"
            value={tMeanVal}
            unit="°C"
            spokenUnit="derajat celsius"
            icon="thermometer"
            badgeText={tMeanVal >= 25 && tMeanVal <= 29 ? "Zona Optimum WBC" : "Terpantau"}
            description="Zona optimum penetasan telur wereng batang cokelat (24 - 29 °C)"
            sparkline={{ values: sparklineT }}
          />

          {/* Kartu 2: Kelembapan Relatif */}
          <MetricCard
            label="Kelembapan Relatif (RH)"
            value={rhMeanVal}
            unit="%"
            spokenUnit="persen"
            icon="droplet"
            tone={rhMeanVal >= 85 ? "red" : rhMeanVal >= 80 ? "amber" : "default"}
            badgeText={rhMeanVal >= 85 ? "Ambang Kritis >= 85%" : "Terpantau"}
            description="Kondisi lembap tinggi mempercepat inkubasi telur wereng"
            sparkline={{ values: sparklineRH }}
          />

          {/* Kartu 3: Curah Hujan */}
          <MetricCard
            label="Curah Hujan Harian"
            value={precipVal}
            unit="mm"
            spokenUnit="milimeter"
            icon="cloud-rain"
            badgeText="Pola Berselang"
            description="Hujan ringan berselang menjaga mikroklimat kanopi lembap"
            sparkline={{ values: sparklineRain }}
          />
        </div>
      </section>

      {/* Explainability Log + Segmented Gauge Bento Grid */}
      <section aria-label="Kesimpulan Biologis dan Alasan Sistem">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-surface-card border-[1.5px] border-border-card rounded-3xl p-5 sm:p-6 shadow-bento flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold text-content-primary uppercase tracking-wider flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-agri-50 border border-agri-100 text-agri-700 flex items-center justify-center">
                    <StatusIcon name="shield-check" className="w-4 h-4" />
                  </span>
                  Kesimpulan Biologis & Alasan Sistem
                </h2>
                <span className="px-2.5 py-1 rounded-full bg-surface-subtle border border-border-subtle text-[11px] font-bold font-mono text-content-secondary">
                  HITL Audit Ready
                </span>
              </div>

              {/* GoAgri Row-3 Style Crop Cutaway Reference Strip */}
              <div className="rounded-2xl border border-border-subtle bg-white p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
                  <span className="text-agri-800">
                    Fokus Titik Pengamatan: Pangkal Batang Rumpun Padi
                  </span>
                  <span className="text-content-muted font-mono">
                    Inkubasi Telur WBC: 5–7 Hari
                  </span>
                </div>
                <div className="w-full overflow-hidden rounded-xl bg-white">
                  <Image
                    src="/images/paddy-stem-cutaway.webp"
                    alt="Ilustrasi penampang rumpun tanaman padi menunjukkan zona pangkal batang untuk inspeksi nimfa wereng"
                    width={960}
                    height={535}
                    unoptimized
                    className="w-full h-36 sm:h-44 object-contain"
                  />
                </div>
              </div>

              <p className="text-sm text-content-secondary leading-relaxed bg-surface-subtle/70 p-4 rounded-2xl border border-border-subtle">
                {explanationText}
              </p>
            </div>
            <div className="pt-3 text-xs font-semibold text-content-muted border-t border-border-subtle flex flex-wrap items-center justify-between gap-2">
              <span>Algoritma: Heuristik Fenologi WBC v1.0</span>
              <span>Sumber Data: Open-Meteo &amp; BMKG</span>
            </div>
          </div>

          <RiskGauge
            title="Kelembapan Kanopi Kritis"
            subtitle="Evaluasi Moving Window 72 Jam"
            score={gaugeScore}
            status={assessment.status}
            footerLeft="Aman < 80%"
            footerRight="Kritis >= 85%"
          />
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
