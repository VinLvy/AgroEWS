import React from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPPLDashboardData } from "@/server/assessment/dashboard";
import { RiskBadge } from "@/components/agro/RiskBadge";
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

  const renderSlaCountdown = (
    escalationDueAt: Date | null,
    escalatedAt: Date | null
  ) => {
    if (!escalationDueAt) return null;

    const now = new Date();
    const isOverdue = now.getTime() >= escalationDueAt.getTime();
    const diffMs = escalationDueAt.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (escalatedAt || isOverdue) {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--status-red-bg)] text-[var(--status-red-text)] border border-[var(--status-red-border)] text-xs font-bold"
          aria-label="SLA terlewati dan telah diekskalasi ke Koordinator BPP"
        >
          <StatusIcon name="shield-alert" className="w-4 h-4" />
          SLA Terlewati (Diekskalasi)
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold"
        aria-label={`Sisa waktu batas verifikasi ${diffHours} jam ${diffMinutes} menit`}
      >
        <StatusIcon name="triangle-alert" className="w-4 h-4 text-amber-700" />
        Sisa SLA: {diffHours}j {diffMinutes}m
      </span>
    );
  };

  const isCoordinator = session.user.role === "bpp_coordinator";
  const isAdmin = session.user.role === "admin";

  return (
    <div className="space-y-6">
      {/* Role-Specific Executive Banner */}
      {isCoordinator ? (
        <div className="bg-blue-50/90 border-2 border-blue-400 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-700 text-white tracking-wide">
                MODE SUPERVISI KOORDINATOR BPP
              </span>
              <span className="text-xs font-bold text-blue-950">
                Kecamatan Kuranji (Supervisi 4 Desa &amp; 12 Poktan)
              </span>
            </div>
            <p className="text-xs text-blue-900 leading-relaxed max-w-2xl">
              Sebagai pimpinan BPP, Anda memantau seluruh draf peringatan di tingkat desa. Draf status MERAH yang melewati batas SLA 6 jam tanpa tindakan PPL akan otomatis dieskalasi kepada Anda untuk penerbitan darurat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/bpp"
              className="min-h-[44px] px-4 py-2 inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-950 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <span>Buka Dasbor Eksekutif &amp; Peta Zonasi</span>
              <StatusIcon name="arrow-right" className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/90 border-2 border-emerald-500 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-800 text-white tracking-wide">
                PETUGAS PENYULUH LAPANGAN (PPL)
              </span>
              <span className="text-xs font-bold text-emerald-950">
                Wilayah Kerja: Nagari Sungai Bangek
              </span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed max-w-2xl">
              Lakukan verifikasi kondisi riil tanaman padi di petak sawah. Pilih fase pertumbuhan tanaman saat ini (misal: Vegetatif / Bunting) untuk menyesuaikan anjuran teknis sebelum menyetujui siaran ke petani binaan.
            </p>
          </div>

          <Link
            href="/reports"
            className="min-h-[44px] px-4 py-2 inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white text-xs font-bold rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <StatusIcon name="file-text" className="w-4 h-4" />
            <span>Lihat Laporan Petani Dusun</span>
          </Link>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            {isCoordinator
              ? "Monitoring Draf Peringatan Dini Kecamatan"
              : "Antrean Verifikasi Draf Lapangan"}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {isCoordinator
              ? `Cakupan wilayah pengawasan: ${assignedRegionsCount} desa binaan BPP Kuranji.`
              : `Wilayah binaan aktif: ${assignedRegionsCount} desa/kelurahan.`}
          </p>
        </div>

        {/* Ringkasan Status */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-md bg-[var(--status-red-bg)] border border-[var(--status-red-border)] text-[var(--status-red-text)] text-xs font-bold">
            MERAH: {redCount}
          </div>
          <div className="px-3 py-1.5 rounded-md bg-[var(--status-amber-bg)] border border-[var(--status-amber-border)] text-[var(--status-amber-text)] text-xs font-bold">
            KUNING: {amberCount}
          </div>
        </div>
      </div>

      {/* Grid Responsif (1 col mobile, 2 col tablet, 3 col desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Kolom 1 & 2: Daftar Antrean Draf (Spans 2 cols on lg) */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-wider text-xs">
            Daftar Draf Menunggu Persetujuan ({drafts.length})
          </h2>

          {drafts.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[var(--border-card)] rounded-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-800 mb-3">
                <StatusIcon name="shield-check" className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Tidak Ada Draf Menunggu
              </h3>
              <p className="text-sm text-[var(--text-muted)] mt-1 max-w-md mx-auto">
                Semua wilayah binaan Anda saat ini dalam kondisi agroklimat aman atau telah selesai diverifikasi.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className={`bg-white border rounded-lg p-5 transition-shadow hover:shadow-md ${
                    draft.riskStatus === "red"
                      ? "border-red-400 border-l-4 border-l-red-600"
                      : "border-[var(--border-card)]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <RiskBadge status={draft.riskStatus} />
                        {draft.isDegraded && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            DATA TIDAK MUTAKHIR
                          </span>
                        )}
                        {renderSlaCountdown(
                          draft.escalationDueAt,
                          draft.escalatedAt
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-[var(--text-primary)]">
                        {draft.regionName}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        Tanggal Asesmen: {draft.assessedForDate} | Dibuat:{" "}
                        {new Date(draft.createdAt).toLocaleString("id-ID", {
                          timeZone: "Asia/Jakarta",
                        })}{" "}
                        WIB
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:pt-0">
                      <Link
                        href={`/drafts/${draft.id}`}
                        className="w-full sm:w-auto min-h-[48px] min-w-[48px] px-5 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-[var(--agri-primary-700)] hover:bg-[var(--agri-primary-900)] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--agri-primary-700)] focus:ring-offset-2"
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

        {/* Kolom 3: Panel Info & Standar Operasional Sesuai Peran */}
        <div className="space-y-4">
          {isCoordinator ? (
            <>
              <div className="bg-white border-2 border-blue-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-blue-900">
                  <StatusIcon name="activity" className="w-5 h-5 text-blue-700" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    Wewenang Koordinator BPP
                  </h3>
                </div>
                <ul className="text-xs text-slate-700 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-700 mt-0.5">1.</span>
                    <span>
                      <strong>Supervisi Lintas Desa:</strong> Meninjau seluruh draf agroklimat yang diajukan oleh PPL di 4 wilayah binaan BPP.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-700 mt-0.5">2.</span>
                    <span>
                      <strong>Eskalasi Kedaruratan:</strong> Mengambil alih persetujuan siaran bila PPL berhalangan hadir melewati batas SLA 6 jam.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-700 mt-0.5">3.</span>
                    <span>
                      <strong>Instruksi Massal:</strong> Mengoordinasikan penanganan hama serempak dan penjadwalan kunjungan POPT kecamatan.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2.5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Ikhtisar Cepat Wilayah BPP
                </h3>
                <div className="text-xs text-slate-600 space-y-1.5 font-medium">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span>Nagari Sungai Bangek</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">MERAH</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span>Kel. Balai Gadang</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">WASPADA</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span>Kel. Kuranji Timur</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">AMAN</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Kel. Gunung Sarik</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">AMAN</span>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    href="/bpp"
                    className="w-full min-h-[40px] px-3 py-1.5 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                  >
                    <span>Buka Dasbor Eksekutif &rarr;</span>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white border-2 border-emerald-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-900">
                  <StatusIcon name="user-check" className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    Petunjuk Verifikasi PPL
                  </h3>
                </div>
                <ul className="text-xs text-slate-700 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[var(--agri-primary-700)] mt-0.5">
                      1.
                    </span>
                    <span>
                      <strong>Cek Fase Tanam:</strong> Pastikan fase pertanaman di lapangan sebelum menyetujui siaran. Lahan berstatus <strong>Bero</strong> otomatis diredam siarannya.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[var(--agri-primary-700)] mt-0.5">
                      2.
                    </span>
                    <span>
                      <strong>SLA 6 Jam Draf Merah:</strong> Draf status bahaya wajib diverifikasi dalam 6 jam sebelum dialihkan ke Koordinator BPP.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[var(--agri-primary-700)] mt-0.5">
                      3.
                    </span>
                    <span>
                      <strong>Zero-Emoji:</strong> Teks anjuran teknis dilarang memuat emotikon demi kepatuhan ponsel fitur petani.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Bantuan Operasional PPL
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bila jaringan seluler di petak sawah lemah, catat kondisi sampel rumpun secara manual. Kirimkan konfirmasi persetujuan draf segera setelah Anda tiba di kantor BPP atau lokasi bersinyal.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
