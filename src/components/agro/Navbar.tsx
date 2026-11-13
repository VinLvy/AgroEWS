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

export function Navbar({ userName, userRole }: NavbarProps) {
  const pathname = usePathname();

  const isCoordinator = userRole === "bpp_coordinator";
  const isAdmin = userRole === "admin";

  const formatRoleBadge = () => {
    if (isAdmin) {
      return {
        title: "Administrator Sistem",
        subtitle: "Akses Penuh Semua Wilayah",
        bg: "bg-purple-100 text-purple-900 border-purple-300",
        icon: "shield-check" as IconName,
      };
    }
    if (isCoordinator) {
      return {
        title: "Koordinator BPP",
        subtitle: "Kecamatan Kuranji (4 Desa / 12 Poktan)",
        bg: "bg-blue-100 text-blue-900 border-blue-300",
        icon: "activity" as IconName,
      };
    }
    return {
      title: "Petugas Lapangan (PPL)",
      subtitle: "Wilayah Binaan: Nagari Sungai Bangek",
      bg: "bg-emerald-100 text-emerald-900 border-emerald-300",
      icon: "user-check" as IconName,
    };
  };

  const roleInfo = formatRoleBadge();

  // Menu navigasi disesuaikan dengan tanggung jawab masing-masing peran
  const navItems: NavItem[] = isCoordinator
    ? [
        { label: "Dasbor Eksekutif BPP", href: "/bpp", icon: "activity" },
        { label: "Peta Zonasi Wilayah", href: "/regions/22222222-2222-4222-8222-222222222201", icon: "map-pin" },
        { label: "Monitoring Draf Kecamatan", href: "/dashboard", icon: "shield-alert" },
        { label: "Validasi Laporan Petani", href: "/reports", icon: "file-text" },
        { label: "Kontak Seluruh Poktan", href: "/admin/contacts", icon: "users" },
        { label: "Aturan Risiko Agroklimat", href: "/admin/rules", icon: "sliders" },
        { label: "Simulator Pesan", href: "/simulator", icon: "message-square" },
      ]
    : isAdmin
    ? [
        { label: "Dasbor BPP", href: "/bpp", icon: "activity" },
        { label: "Draf Peringatan", href: "/dashboard", icon: "shield-alert" },
        { label: "Laporan Petani", href: "/reports", icon: "file-text" },
        { label: "Wilayah Pilot", href: "/regions/22222222-2222-4222-8222-222222222201", icon: "map-pin" },
        { label: "Kontak Petani", href: "/admin/contacts", icon: "users" },
        { label: "Aturan Risiko", href: "/admin/rules", icon: "sliders" },
        { label: "Simulator Pesan", href: "/simulator", icon: "message-square" },
      ]
    : [
        // Petugas Lapangan (PPL) - fokus operasional draf dan lapangan desa binaannya
        { label: "Draf Peringatan Lapangan", href: "/dashboard", icon: "shield-alert" },
        { label: "Laporan Petani Dusun", href: "/reports", icon: "file-text" },
        { label: "Wilayah Binaan", href: "/regions/22222222-2222-4222-8222-222222222201", icon: "map-pin" },
        { label: "Kontak Binaan", href: "/admin/contacts", icon: "users" },
        { label: "Simulator Pesan", href: "/simulator", icon: "message-square" },
      ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[var(--border-card)] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <Link
              href={isCoordinator ? "/bpp" : "/dashboard"}
              className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--agri-primary-700)] rounded-md px-1 py-1"
            >
              <div className="w-9 h-9 rounded bg-[var(--surface-subtle)] text-[var(--agri-primary-700)] flex items-center justify-center font-bold">
                <StatusIcon name="shield-check" className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-[var(--text-primary)] leading-none tracking-tight">
                  AgroEWS
                </span>
                <span className="text-[11px] font-medium text-[var(--agri-primary-700)] mt-0.5 leading-none">
                  Sistem Peringatan Dini Agroklimat
                </span>
              </div>
            </Link>
          </div>

          {/* User info & Role Badge & Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 leading-tight">
                  {userName}
                </span>
                <span
                  className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleInfo.bg}`}
                >
                  <StatusIcon name={roleInfo.icon} className="w-3.5 h-3.5" />
                  <span>{roleInfo.title}</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                {roleInfo.subtitle}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="min-h-[44px] px-3.5 py-2 inline-flex items-center justify-center text-xs sm:text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 hover:text-slate-950 active:bg-slate-300 border border-slate-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--agri-primary-700)]"
              aria-label="Keluar dari akun sistem"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Navigation Tabs - Horizontal Scrollable on Mobile */}
        <nav
          className="flex space-x-1.5 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar"
          aria-label="Navigasi Menu Utama"
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
                className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap inline-flex items-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--agri-primary-700)] ${
                  isActive
                    ? "bg-[var(--agri-primary-700)] text-white shadow-xs"
                    : "text-slate-700 hover:text-slate-950 hover:bg-slate-150 bg-slate-50 border border-slate-200/80"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <StatusIcon
                  name={item.icon}
                  className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-600"}`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
