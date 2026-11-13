"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { StatusIcon, type IconName } from "./StatusIcon";

interface NavbarProps {
  userName: string;
  userRole: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
}

function getRoleMeta(userRole: string) {
  if (userRole === "admin") {
    return {
      title: "Administrator Sistem",
      subtitle: "Akses Penuh Semua Wilayah",
      badgeClass: "bg-purple-50 text-purple-900 border-purple-300",
      icon: "shield-check" as IconName,
    };
  }
  if (userRole === "bpp_coordinator") {
    return {
      title: "Koordinator BPP",
      subtitle: "Kecamatan Kuranji (4 Desa / 12 Poktan)",
      badgeClass: "bg-blue-50 text-blue-900 border-blue-300",
      icon: "activity" as IconName,
    };
  }
  return {
    title: "Petugas Lapangan (PPL)",
    subtitle: "Wilayah Binaan: Nagari Sungai Bangek",
    badgeClass: "bg-agri-50 text-agri-800 border-agri-100",
    icon: "user-check" as IconName,
  };
}

function getNavItems(userRole: string): NavItem[] {
  if (userRole === "bpp_coordinator") {
    return [
      { label: "Dasbor Eksekutif BPP", href: "/bpp", icon: "layout-dashboard" },
      { label: "Peta Zonasi Wilayah", href: "/regions/22222222-2222-4222-8222-222222222201", icon: "map" },
      { label: "Monitoring Draf Kecamatan", href: "/dashboard", icon: "shield-alert" },
      { label: "Validasi Laporan Petani", href: "/reports", icon: "file-text" },
      { label: "Kontak Seluruh Poktan", href: "/admin/contacts", icon: "users" },
      { label: "Aturan Risiko Agroklimat", href: "/admin/rules", icon: "sliders" },
      { label: "Simulator Pesan", href: "/simulator", icon: "message-square" },
    ];
  }
  if (userRole === "admin") {
    return [
      { label: "Dasbor BPP", href: "/bpp", icon: "layout-dashboard" },
      { label: "Draf Peringatan", href: "/dashboard", icon: "shield-alert" },
      { label: "Laporan Petani", href: "/reports", icon: "file-text" },
      { label: "Wilayah Pilot", href: "/regions/22222222-2222-4222-8222-222222222201", icon: "map" },
      { label: "Kontak Petani", href: "/admin/contacts", icon: "users" },
      { label: "Aturan Risiko", href: "/admin/rules", icon: "sliders" },
      { label: "Simulator Pesan", href: "/simulator", icon: "message-square" },
    ];
  }
  return [
    { label: "Draf Peringatan Lapangan", href: "/dashboard", icon: "layout-dashboard" },
    { label: "Laporan Petani Dusun", href: "/reports", icon: "file-text" },
    { label: "Wilayah Binaan", href: "/regions/22222222-2222-4222-8222-222222222201", icon: "map" },
    { label: "Kontak Binaan", href: "/admin/contacts", icon: "users" },
    { label: "Simulator Pesan", href: "/simulator", icon: "message-square" },
  ];
}

export function Navbar({ userName, userRole }: NavbarProps) {
  const pathname = usePathname();
  const isCoordinator = userRole === "bpp_coordinator";
  const roleInfo = getRoleMeta(userRole);
  const navItems = getNavItems(userRole);

  return (
    <>
      {/* Top Header Bar: Compact Mobile Header + Floating Desktop Topbar */}
      <header className="sticky top-0 lg:top-4 z-30 lg:ml-[288px] lg:mr-6 bg-white/95 backdrop-blur border-b-[1.5px] lg:border-[1.5px] border-border-card lg:rounded-2xl shadow-bento">
        <div className="px-4 sm:px-6 py-3 flex flex-wrap justify-between items-center gap-3">
          {/* Left: Mobile Brand (hidden on Desktop) + Live Source Pill */}
          <div className="flex items-center gap-3">
            <Link
              href={isCoordinator ? "/bpp" : "/dashboard"}
              className="flex lg:hidden items-center gap-2 focus:outline-none focus:ring-2 focus:ring-agri-700 rounded-xl px-1 py-0.5"
            >
              <div className="w-9 h-9 rounded-xl bg-agri-700 text-white flex items-center justify-center shrink-0">
                <StatusIcon name="sprout" className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-content-primary leading-none">
                  AgroEWS
                </span>
                <span className="text-[11px] font-semibold text-agri-700 mt-0.5 leading-none">
                  EWS Agroklimat
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-agri-50 border border-agri-100 text-agri-800 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-agri-600" aria-hidden="true" />
                <StatusIcon name="radio" size={14} />
                <span>Sensorless Live: Open-Meteo + BMKG</span>
              </span>
              <span className="text-xs font-medium text-content-muted">
                {roleInfo.subtitle}
              </span>
            </div>
          </div>

          {/* Right: User Profile + Role Badge + Logout */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm font-bold text-content-primary leading-tight">
                  {userName}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${roleInfo.badgeClass}`}
                >
                  <StatusIcon name={roleInfo.icon} className="w-3.5 h-3.5" />
                  <span>{roleInfo.title}</span>
                </span>
              </div>
              <span className="hidden sm:block lg:hidden text-[11px] text-content-muted font-medium mt-0.5">
                {roleInfo.subtitle}
              </span>
            </div>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="min-h-[48px] px-3.5 py-2 inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-content-primary bg-surface-subtle hover:bg-slate-200 border-[1.5px] border-border-card rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-agri-700"
              aria-label="Keluar dari akun sistem"
            >
              <StatusIcon name="log-out" size={16} className="text-content-secondary" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Single Semantic Navigation: Horizontal Bento Strip (<1024px) & Floating Sidebar (lg+) */}
      <aside
        aria-label="Panel Navigasi AgroEWS"
        className="sticky top-[73px] sm:top-[73px] lg:fixed lg:top-4 lg:bottom-4 lg:left-4 lg:w-[260px] z-20 lg:z-40 bg-white/95 lg:bg-white backdrop-blur border-b-[1.5px] lg:border-[1.5px] border-border-card lg:rounded-3xl lg:shadow-bento px-3 py-2 lg:p-4 flex flex-col justify-between"
      >
        <div className="lg:space-y-5">
          {/* Desktop Brand Identity (AgriCore Floating Sidebar Header) */}
          <div className="hidden lg:flex items-center gap-3 px-2 pt-1 pb-4 border-b border-border-subtle">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-agri-600 to-agri-800 text-white flex items-center justify-center shadow-sm shrink-0">
              <StatusIcon name="sprout" size={22} />
            </div>
            <div>
              <span className="font-extrabold text-lg text-content-primary tracking-tight block leading-none">
                AgroEWS
              </span>
              <span className="text-[11px] font-bold text-agri-700 mt-1 block leading-tight">
                Mitigasi Wereng Padi
              </span>
            </div>
          </div>

          {/* Primary Navigation Links */}
          <nav
            aria-label="Navigasi Menu Utama"
            className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible no-scrollbar"
          >
            {navItems.map((item) => {
              const isRootDashboard = item.href === "/dashboard";
              const isRootBpp = item.href === "/bpp";
              const isActive =
                pathname === item.href ||
                (!isRootDashboard && !isRootBpp && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`min-h-[48px] shrink-0 px-3 py-2.5 rounded-xl text-xs lg:text-[13px] font-bold whitespace-nowrap inline-flex items-center gap-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-agri-700 ${
                    isActive
                      ? "bg-agri-700 text-white shadow-sm"
                      : "text-content-secondary bg-surface-subtle/60 lg:bg-transparent hover:bg-agri-50 hover:text-agri-800 border border-transparent hover:border-agri-100"
                  }`}
                >
                  <StatusIcon
                    name={item.icon}
                    size={18}
                    className={`shrink-0 ${isActive ? "text-white" : "text-content-muted"}`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop Sidebar Bottom Card (Zero-Hardware Status) */}
        <div className="hidden lg:block mt-4 p-4 rounded-2xl bg-gradient-to-br from-agri-800 to-agri-900 text-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
              Arsitektur Terbuka
            </span>
            <StatusIcon name="shield-check" size={16} className="text-emerald-200" />
          </div>
          <p className="text-xs font-semibold leading-relaxed text-white">
            Zero-Hardware Field Level: Estimasi mikroklimat berbasis grid satelit tanpa sensor IoT sawah.
          </p>
          <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-emerald-100 font-mono">
            <span>HITL v2.0</span>
            <span>WCAG AA</span>
          </div>
        </div>
      </aside>
    </>
  );
}
