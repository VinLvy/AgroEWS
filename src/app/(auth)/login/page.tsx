"use client";

import React, { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StatusIcon } from "@/components/agro/StatusIcon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!res) {
        setErrorMsg("Gagal menghubungi server otentikasi.");
        setIsLoading(false);
        return;
      }

      if (res.error) {
        if (res.error.includes("terkunci") || res.error.includes("5 kali")) {
          setErrorMsg(res.error);
        } else if (res.error.includes("Terlalu banyak percobaan")) {
          setErrorMsg(res.error);
        } else {
          setErrorMsg("Alamat email atau kata sandi tidak sesuai.");
        }
        setIsLoading(false);
        return;
      }

      // Login berhasil, arahkan sesuai peran pengguna
      const normalized = email.toLowerCase().trim();
      if (normalized.includes("koordinator") || normalized.includes("bpp")) {
        router.push("/bpp");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      setErrorMsg("Terjadi gangguan sistem. Silakan coba kembali.");
      setIsLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Pertanian2026!");
    setErrorMsg("");
  };

  return (
    <main className="min-h-screen bg-surface-canvas flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Panel Brand AgriCore Hero (Desktop Left) */}
        <section
          aria-label="Informasi Sistem AgroEWS"
          className="hidden lg:flex lg:col-span-6 rounded-3xl bg-gradient-to-br from-agri-700 to-agri-900 p-8 text-white flex-col justify-between shadow-bento-lg"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 bg-white/15 backdrop-blur px-3.5 py-2 rounded-2xl border border-white/20">
              <div className="w-9 h-9 rounded-xl bg-white text-agri-800 flex items-center justify-center">
                <StatusIcon name="sprout" className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold block leading-none">AgroEWS v2.0</span>
                <span className="text-[11px] text-emerald-100 font-medium">
                  AgriCore + HITL Verification
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight leading-tight">
                Peringatan Dini Agroklimat Tanpa Sensor Lapangan
              </h2>
              <p className="text-sm text-emerald-50 leading-relaxed">
                Memadukan data satelit Open-Meteo dan BMKG untuk memprediksi fase kritis inkubasi telur wereng batang cokelat, tervalidasi langsung oleh Penyuluh Pertanian Lapangan (PPL).
              </p>
            </div>

            {/* GoAgri-Style 3D Isometric Field Preview Card */}
            <div className="rounded-2xl bg-white p-3 shadow-sm border border-white/25 overflow-hidden">
              <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-bold text-content-secondary border-b border-border-subtle">
                <span className="text-agri-800">Plot Model Isometrik &bull; Kec. Kuranji</span>
                <span className="px-2 py-0.5 rounded-full bg-agri-50 text-agri-800 font-mono text-[10px]">
                  Zero-Hardware
                </span>
              </div>
              <div className="relative w-full aspect-[16/10] bg-white rounded-xl overflow-hidden mt-2">
                <Image
                  src="/images/paddy-isometric-plot.webp"
                  alt="Ilustrasi 3D isometrik petak sawah terasering Nagari dengan pemantauan grid cuaca Open-Meteo"
                  width={900}
                  height={672}
                  unoptimized
                  priority
                  className="w-full h-full object-contain scale-105"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-100 block">
                  Ambang Kritis RH
                </span>
                <span className="text-2xl font-extrabold font-mono tabular-nums block">
                  &ge; 85%
                </span>
                <span className="text-xs text-emerald-100">Selama 3 hari berturut</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-100 block">
                  Suhu Optimum WBC
                </span>
                <span className="text-2xl font-extrabold font-mono tabular-nums block">
                  25 - 29&deg;C
                </span>
                <span className="text-xs text-emerald-100">Evaluasi harian 05:00 WIB</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/15 flex items-center justify-between text-xs text-emerald-100 font-medium">
            <span>Zero-Emoji Policy &bull; Feature-Phone Safe</span>
            <span className="font-mono font-bold">WCAG 2.1 AA</span>
          </div>
        </section>

        {/* Panel Form Autentikasi (Bento White Card) */}
        <section className="lg:col-span-6 w-full bg-surface-card border-[1.5px] border-border-card rounded-3xl p-6 sm:p-8 shadow-bento flex flex-col justify-center">
          {/* Header Sistem */}
          <div className="text-center lg:text-left mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-agri-50 border border-agri-100 text-agri-700 mb-3">
              <StatusIcon name="shield-check" className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-content-primary tracking-tight">
              AgroEWS
            </h1>
            <p className="text-sm font-bold text-agri-700 mt-0.5">
              Sistem Peringatan Dini Agroklimat
            </p>
            <p className="text-xs text-content-muted mt-1">
              Mitigasi Wereng Batang Cokelat (Nilaparvata lugens)
            </p>
          </div>

          {/* Notifikasi Kesalahan / Lockout */}
          {errorMsg && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-5 p-3.5 rounded-2xl border-[1.5px] border-status-red-border bg-status-red-bg text-status-red-text text-sm font-medium flex items-start gap-2.5"
            >
              <StatusIcon
                name="shield-alert"
                className="w-5 h-5 flex-shrink-0 mt-0.5 text-status-red-text"
              />
              <div>
                <p className="font-bold text-xs tracking-wider uppercase mb-0.5">
                  Peringatan Akses
                </p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-content-primary mb-1.5"
              >
                Alamat Email Petugas
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@pertanian.go.id"
                className="w-full min-h-[48px] px-4 py-2.5 text-base text-content-primary bg-white border-[1.5px] border-border-strong rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-700 focus:border-transparent placeholder:text-content-muted"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-content-primary mb-1.5"
              >
                Kata Sandi
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi akun"
                className="w-full min-h-[48px] px-4 py-2.5 text-base text-content-primary bg-white border-[1.5px] border-border-strong rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-700 focus:border-transparent placeholder:text-content-muted"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-bold text-white bg-agri-700 hover:bg-agri-800 active:bg-agri-900 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-agri-700 shadow-sm"
            >
              <span>{isLoading ? "Memproses Autentikasi..." : "Masuk ke Sistem AgroEWS"}</span>
              <StatusIcon name="arrow-right" className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Role Switcher Shortcuts */}
          <div className="mt-6 pt-5 border-t border-border-subtle space-y-2.5">
            <span className="block text-xs font-bold text-content-secondary uppercase tracking-wider text-center">
              Pilihan Cepat Masuk Sesuai Peran:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleFillDemo("ppl.kuranji@pertanian.go.id")}
                className="min-h-[48px] p-3 text-left rounded-2xl border-[1.5px] border-status-green-border bg-status-green-bg hover:bg-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-agri-700"
              >
                <div className="text-xs font-extrabold text-agri-800">
                  Petugas Lapangan (PPL)
                </div>
                <div className="text-[11px] text-agri-700 mt-0.5 font-semibold break-all">
                  ppl.kuranji@pertanian.go.id
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo("koordinator.bpp@pertanian.go.id")}
                className="min-h-[48px] p-3 text-left rounded-2xl border-[1.5px] border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                <div className="text-xs font-extrabold text-blue-900">
                  Koordinator BPP
                </div>
                <div className="text-[11px] text-blue-800 mt-0.5 font-semibold break-all">
                  koordinator.bpp@pertanian.go.id
                </div>
              </button>
            </div>
            <p className="text-[11px] text-center text-content-muted font-medium">
              Kata sandi otomatis terisi: <code className="font-mono font-bold text-content-primary">Pertanian2026!</code>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle text-center text-xs text-content-muted">
            Khusus petugas PPL, POPT, dan Koordinator BPP terdaftar.
          </div>
        </section>
      </div>
    </main>
  );
}
