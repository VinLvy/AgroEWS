import React from "react";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPPLDashboardData } from "@/server/assessment/dashboard";
import { RiskBadge } from "@/components/agro/RiskBadge";
import { RiskGauge } from "@/components/agro/RiskGauge";
import { StatusIcon } from "@/components/agro/StatusIcon";
import type { UserRole } from "@/server/auth/rbac";

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const { drafts, assignedRegionsCount } = await getPPLDashboardData(
    session.user.id,
    session.user.role as UserRole
  );

  const redCount = drafts.filter((d) => d.riskStatus === "red").length;
  const amberCount = drafts.filter((d) => d.riskStatus === "amber").length;
  const topPriorityDraft = drafts.find((d) => d.riskStatus === "red") ?? drafts[0];

  const gaugeScore = redCount > 0 ? 86 : amberCount > 0 ? 64 : 28;
  const gaugeStatus = redCount > 0 ? "red" : amberCount > 0 ? "amber" : "green";

  const renderSlaCountdown = (
    escalationDueAt: Date | null,
    escalatedAt: Date | null
  ) => {
    if (!escalationDueAt) return null;

    const now = new Date();
    const isOverdue = now.getTime() >= escalationDueAt.getTime();
    const diffMs = escalationDueAt.getTime() - now.getTime();
    const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    const diffMinutes = Math.max(
      0,
      Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    );

    if (escalatedAt || isOverdue) {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-red-bg text-status-red-text border-[1.5px] border-status-red-border text-xs font-bold"
          aria-label="SLA terlewati dan telah diekskalasi ke Koordinator BPP"
        >
          <StatusIcon name="shield-alert" className="w-3.5 h-3.5" />
          SLA Terlewati (Diekskalasi)
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-amber-bg text-status-amber-text border-[1.5px] border-status-amber-border text-xs font-bold font-mono"
        aria-label={`Sisa waktu batas verifikasi ${diffHours} jam ${diffMinutes} menit`}
      >
        <StatusIcon name="clock" className="w-3.5 h-3.5" />
        Sisa SLA: {diffHours}j {diffMinutes}m
      </span>
    );
  };

  const isCoordinator = session.user.role === "bpp_coordinator";

  return (
    <div className="space-y-6">
      {/* Executive Role Banner */}
      {isCoordinator ? (
        <div className="rounded-3xl border-[1.5px] border-blue-300 bg-blue-50/90 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-bento">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-800 text-white tracking-wide">
                Supervisi Koordinator BPP
              </span>
              <span className="text-xs font-bold text-blue-950">
                Kecamatan Kuranji (4 Desa &amp; 12 Poktan)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-900 leading-relaxed max-w-2xl">
              Anda memantau seluruh draf peringatan agroklimat tingkat desa. Draf MERAH yang melewati batas SLA 6 jam otomatis dieskalasi untuk otorisasi darurat BPP.
            </p>
          </div>

          <Link
            href="/bpp"
            className="min-h-[48px] px-4 py-2.5 inline-flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-colors whitespace-nowrap"
          >
            <span>Buka Dasbor Eksekutif &amp; Peta Zonasi</span>
            <StatusIcon name="arrow-right" className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border-[1.5px] border-status-green-border bg-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-bento">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-agri-700 text-white tracking-wide">
                Petugas Penyuluh Lapangan (PPL)
              </span>
              <span className="text-xs font-bold text-content-primary">
                Wilayah Kerja: Kecamatan Kuranji / Nagari Sungai Bangek
              </span>
            </div>
            <p className="text-xs sm:text-sm text-content-secondary leading-relaxed max-w-2xl">
              Verifikasi kondisi fase tanam di petak sawah sebelum menyetujui siaran WhatsApp petani. Lahan fase Bero otomatis meredam diseminasi.
            </p>
          </div>

          <Link
            href="/reports"
            className="min-h-[48px] px-4 py-2.5 inline-flex items-center justify-center gap-2 bg-agri-700 hover:bg-agri-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-colors whitespace-nowrap"
          >
            <StatusIcon name="file-text" className="w-4 h-4" />
            <span>Lihat Laporan Petani Dusun</span>
          </Link>
        </div>
      )}

      {/* GoAgri Style Priority Alert Strip (Shown on Red Drafts) */}
      {redCount > 0 && topPriorityDraft && (
        <div
          role="alert"
          className="rounded-2xl border-[1.5px] border-status-red-border bg-status-red-bg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-700 text-white flex items-center justify-center shrink-0">
              <StatusIcon name="shield-alert" className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-status-red-text">
                Prioritas Penanganan Segera (SLA 6 Jam)
              </div>
              <p className="text-sm font-bold text-content-primary mt-0.5">
                {redCount} Draf [BAHAYA] menunggu validasi PPL untuk {topPriorityDraft.regionName}.
              </p>
            </div>
          </div>

          <Link
            href={`/drafts/${topPriorityDraft.id}`}
            className="min-h-[48px] px-4 py-2 inline-flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-colors shrink-0"
          >
            <span>Verifikasi Prioritas</span>
            <StatusIcon name="chevron-right" className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Header + AgriCore Bento Overview Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
            {isCoordinator
              ? "Antrean Draf Peringatan Dini Kecamatan"
              : "Antrean Draf Peringatan Dini"}
          </h1>
          <p className="text-sm text-content-muted mt-1">
            {isCoordinator
              ? `Cakupan wilayah pengawasan: ${assignedRegionsCount} desa binaan BPP Kuranji.`
              : `Wilayah binaan aktif: ${assignedRegionsCount} desa/kelurahan terpantau hari ini.`}
          </p>
        </div>
      </div>

      {/* Bento KPI Grid (AgriCore Inspired) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Hero Leaf-Green Bento Card */}
        <div className="rounded-3xl bg-gradient-to-br from-agri-700 to-agri-900 p-5 text-white shadow-bento flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              Wilayah Terpantau
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <StatusIcon name="map" size={18} className="text-white" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-4xl font-extrabold tabular-nums">{assignedRegionsCount}</div>
            <div className="text-xs font-semibold text-emerald-100 mt-1">
              Wilayah Agroklimat Aktif
            </div>
          </div>
          <div className="pt-3 border-t border-white/15 text-[11px] font-semibold text-emerald-100 flex items-center justify-between">
            <span>Grid ERA5 + BMKG</span>
            <span className="font-mono">05:00 WIB</span>
          </div>
        </div>

        {/* Merah Counter Bento */}
        <div className="rounded-3xl border-[1.5px] border-status-red-border bg-surface-card p-5 shadow-bento flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-status-red-text">
              Status MERAH
            </span>
            <div className="w-9 h-9 rounded-xl bg-status-red-bg border border-status-red-border text-status-red-text flex items-center justify-center">
              <StatusIcon name="shield-alert" size={18} />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-status-red-text tabular-nums">
              {redCount}
            </span>
            <span className="text-xs font-bold text-content-muted">draf kritis</span>
          </div>
          <div className="pt-3 border-t border-border-subtle text-xs font-semibold text-status-red-text">
            RH &ge; 85% &bull; Suhu 25-29&deg;C
          </div>
        </div>

        {/* Amber Counter Bento */}
        <div className="rounded-3xl border-[1.5px] border-status-amber-border bg-surface-card p-5 shadow-bento flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-status-amber-text">
              Status KUNING
            </span>
            <div className="w-9 h-9 rounded-xl bg-status-amber-bg border border-status-amber-border text-status-amber-text flex items-center justify-center">
              <StatusIcon name="triangle-alert" size={18} />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-status-amber-text tabular-nums">
              {amberCount}
            </span>
            <span className="text-xs font-bold text-content-muted">draf waspada</span>
          </div>
          <div className="pt-3 border-t border-border-subtle text-xs font-semibold text-status-amber-text">
            RH &ge; 80% &bull; Monitor 48 Jam
          </div>
        </div>

        {/* AgriCore Segmented Risk Gauge */}
        <RiskGauge
          title="Indeks Risiko WBC"
          subtitle="Komposit kelembapan & suhu"
          score={gaugeScore}
          status={gaugeStatus}
          footerLeft="Ambang 0%"
          footerRight="Outbreak 100%"
        />
      </div>

      {/* Main Content Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cols 1-2: Draft Approval Queue */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-content-secondary uppercase tracking-wider">
              Daftar Draf Menunggu Persetujuan ({drafts.length})
            </h2>
            <span className="text-xs font-semibold text-content-muted">
              Urutan prioritas risiko tertinggi
            </span>
          </div>

          {drafts.length === 0 ? (
            <div className="p-8 text-center bg-surface-card border-[1.5px] border-border-card rounded-3xl shadow-bento">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-agri-50 border border-agri-100 text-agri-700 mb-3">
                <StatusIcon name="shield-check" className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-content-primary">
                Tidak Ada Draf Menunggu
              </h3>
              <p className="text-sm text-content-muted mt-1 max-w-md mx-auto">
                Semua wilayah binaan Anda saat ini dalam kondisi agroklimat aman atau telah selesai diverifikasi.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className={`bg-surface-card border-[1.5px] rounded-3xl p-5 sm:p-6 shadow-bento transition-all hover:shadow-bento-lg ${
                    draft.riskStatus === "red"
                      ? "border-status-red-border ring-1 ring-red-100"
                      : "border-border-card"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <RiskBadge status={draft.riskStatus} />
                        {draft.isDegraded && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            DATA TIDAK MUTAKHIR
                          </span>
                        )}
                        {renderSlaCountdown(
                          draft.escalationDueAt,
                          draft.escalatedAt
                        )}
                      </div>

                      <h3 className="text-xl font-extrabold text-content-primary tracking-tight">
                        {draft.regionName}
                      </h3>
                      <p className="text-xs font-medium text-content-muted">
                        Tanggal Asesmen:{" "}
                        <span className="font-mono font-bold text-content-secondary">
                          {draft.assessedForDate}
                        </span>{" "}
                        &bull; Dibuat:{" "}
                        {new Date(draft.createdAt).toLocaleString("id-ID", {
                          timeZone: "Asia/Jakarta",
                        })}{" "}
                        WIB
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:pt-0 shrink-0">
                      <Link
                        href={`/drafts/${draft.id}`}
                        className="w-full sm:w-auto min-h-[48px] min-w-[48px] px-5 py-3 inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-agri-700 hover:bg-agri-800 rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-agri-700 focus:ring-offset-2"
                        aria-label={`Tinjau draf peringatan untuk wilayah ${draft.regionName}`}
                      >
                        <StatusIcon name="user-check" className="w-5 h-5" />
                        Tinjau Draf
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Col 3: Operational SOP Panel */}
        <div className="space-y-4">
          {isCoordinator ? (
            <>
              <div className="bg-surface-card border-[1.5px] border-blue-200 rounded-3xl p-5 shadow-bento space-y-3">
                <div className="flex items-center gap-2.5 text-blue-900">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <StatusIcon name="activity" className="w-5 h-5 text-blue-700" />
                  </div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider">
                    Wewenang Koordinator BPP
                  </h3>
                </div>
                <ul className="text-xs text-content-secondary space-y-2.5 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="font-extrabold text-blue-700 mt-0.5">1.</span>
                    <span>
                      <strong>Supervisi Lintas Desa:</strong> Meninjau seluruh draf agroklimat pada 4 wilayah binaan BPP.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-extrabold text-blue-700 mt-0.5">2.</span>
                    <span>
                      <strong>Eskalasi Kedaruratan:</strong> Otorisasi siaran saat PPL melewati batas SLA 6 jam.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-extrabold text-blue-700 mt-0.5">3.</span>
                    <span>
                      <strong>Instruksi Massal:</strong> Koordinasi pengendalian hayati &amp; jadwal kunjungan POPT.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-surface-card border-[1.5px] border-border-card rounded-3xl p-5 shadow-bento space-y-3">
                <h3 className="text-xs font-extrabold text-content-primary uppercase tracking-wider">
                  Ikhtisar Cepat Wilayah BPP
                </h3>
                <div className="text-xs text-content-secondary space-y-2 font-semibold">
                  <div className="flex justify-between items-center py-1.5 border-b border-border-subtle">
                    <span>Nagari Sungai Bangek</span>
                    <span className="px-2 py-0.5 rounded-full bg-status-red-bg text-status-red-text font-bold text-[10px]">
                      MERAH
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border-subtle">
                    <span>Kel. Balai Gadang</span>
                    <span className="px-2 py-0.5 rounded-full bg-status-amber-bg text-status-amber-text font-bold text-[10px]">
                      WASPADA
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border-subtle">
                    <span>Kel. Kuranji Timur</span>
                    <span className="px-2 py-0.5 rounded-full bg-status-green-bg text-status-green-text font-bold text-[10px]">
                      AMAN
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span>Kel. Gunung Sarik</span>
                    <span className="px-2 py-0.5 rounded-full bg-status-green-bg text-status-green-text font-bold text-[10px]">
                      AMAN
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    href="/bpp"
                    className="w-full min-h-[48px] px-4 py-2 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
                  >
                    <span>Buka Dasbor Eksekutif</span>
                    <StatusIcon name="arrow-right" className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-surface-card border-[1.5px] border-status-green-border rounded-3xl p-5 shadow-bento space-y-3">
                <div className="flex items-center gap-2.5 text-agri-800">
                  <div className="w-9 h-9 rounded-xl bg-agri-50 border border-agri-100 flex items-center justify-center">
                    <StatusIcon name="user-check" className="w-5 h-5 text-agri-700" />
                  </div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider">
                    Petunjuk Verifikasi PPL
                  </h3>
                </div>
                <ul className="text-xs text-content-secondary space-y-2.5 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="font-extrabold text-agri-700 mt-0.5">1.</span>
                    <span>
                      <strong>Cek Fase Tanam:</strong> Validasi fase pertanaman sebelum menyiarkan pesan. Fase <strong>Bero</strong> otomatis meredam siaran.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-extrabold text-agri-700 mt-0.5">2.</span>
                    <span>
                      <strong>SLA 6 Jam Draf Merah:</strong> Draf bahaya wajib ditindaklanjuti dalam 6 jam sebelum eskalasi ke Koordinator BPP.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-extrabold text-agri-700 mt-0.5">3.</span>
                    <span>
                      <strong>Zero-Emoji Policy:</strong> Anjuran wajib memakai teks bersih tanpa emotikon agar terbaca di seluruh ponsel petani.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-surface-card border-[1.5px] border-border-card rounded-3xl p-5 shadow-bento space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-agri-700 block">
                      Visual Zonasi Petak
                    </span>
                    <h3 className="text-sm font-extrabold text-content-primary">
                      Model Kanopi Sawah (Tanpa IoT)
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-agri-50 border border-agri-100 text-agri-800 font-mono text-[10px] font-bold">
                    ERA5 Grid
                  </span>
                </div>
                <div className="rounded-2xl bg-white border border-border-subtle overflow-hidden">
                  <Image
                    src="/images/paddy-isometric-plot.webp"
                    alt="Visual isometrik petak sawah padi terpantau agroklimat terbuka tanpa sensor IoT"
                    width={900}
                    height={672}
                    unoptimized
                    className="w-full h-40 object-contain"
                  />
                </div>
                <p className="text-xs text-content-secondary leading-relaxed">
                  Pemodelan mikroklimat pangkal rumpun padi berbasis koordinat satelit &amp; laporan balik <code className="font-mono font-bold text-content-primary">LAPOR</code> petani.
                </p>
              </div>

              <div className="relative rounded-3xl overflow-hidden bg-[#064E3B] text-white p-5 shadow-bento">
                <Image
                  src="/images/pht-botanical-banner.webp"
                  alt="Rumpun padi sehat untuk pengendalian hama terpadu mandiri"
                  width={960}
                  height={535}
                  unoptimized
                  className="absolute inset-0 w-full h-full object-cover object-right opacity-85"
                />
                <div className="relative z-10 bg-gradient-to-r from-[#064E3B] via-[#064E3B]/95 to-transparent pr-10 space-y-2.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                    PHT Mandiri
                  </span>
                  <h3 className="text-base font-extrabold leading-snug">
                    Cegah Ledakan Nimfa Lebih Awal
                  </h3>
                  <p className="text-xs text-emerald-50 leading-relaxed">
                    Prioritaskan pengeringan berkala petak sebelum penyemprotan kimiawi.
                  </p>
                  <Link
                    href="/reports"
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-white text-agri-900 text-xs font-extrabold inline-flex items-center gap-1.5 hover:bg-emerald-50 transition-colors"
                  >
                    <span>Cek Laporan Dusun</span>
                    <StatusIcon name="arrow-right" className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
