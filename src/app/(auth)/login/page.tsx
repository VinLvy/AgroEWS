"use client";

import React, { useState } from "react";
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
    <main className="min-h-screen bg-[var(--surface-ground)] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white border border-[var(--border-card)] rounded-lg p-6 sm:p-8 shadow-sm">
        {/* Header Sistem */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--surface-subtle)] text-[var(--agri-primary-700)] mb-3">
            <StatusIcon name="shield-check" className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            AgroEWS
          </h1>
          <p className="text-sm font-medium text-[var(--agri-primary-700)] mt-0.5">
            Sistem Peringatan Dini Agroklimat
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Mitigasi Wereng Batang Cokelat (Nilaparvata lugens)
          </p>
        </div>

        {/* Notifikasi Kesalahan / Lockout */}
        {errorMsg && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-5 p-3 rounded border border-[var(--status-red-border)] bg-[var(--status-red-bg)] text-[var(--status-red-text)] text-sm font-medium flex items-start gap-2.5"
          >
            <StatusIcon
              name="shield-alert"
              className="w-5 h-5 flex-shrink-0 mt-0.5 text-[var(--status-red-text)]"
            />
            <div>
              <p className="font-semibold text-xs tracking-wider uppercase mb-0.5">
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
              className="block text-sm font-semibold text-[var(--text-primary)] mb-1"
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
              className="w-full min-h-[48px] px-3.5 py-2.5 text-base text-[var(--text-primary)] bg-white border border-[#64748B] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--agri-primary-700)] focus:border-transparent placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-[var(--text-primary)] mb-1"
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
              className="w-full min-h-[48px] px-3.5 py-2.5 text-base text-[var(--text-primary)] bg-white border border-[#64748B] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--agri-primary-700)] focus:border-transparent placeholder:text-[var(--text-muted)]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[48px] mt-2 inline-flex items-center justify-center px-4 py-2.5 text-base font-bold text-white bg-[var(--agri-primary-700)] hover:bg-[var(--agri-primary-900)] active:bg-emerald-950 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--agri-primary-700)] shadow-xs"
          >
            {isLoading ? "Memproses Autentikasi..." : "Masuk ke Sistem AgroEWS"}
          </button>
        </form>

        {/* Demo Role Switcher Shortcuts */}
        <div className="mt-6 pt-5 border-t border-slate-200 space-y-2.5">
          <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-center">
            Pilihan Cepat Masuk Sesuai Peran:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo("ppl.kuranji@pertanian.go.id")}
              className="p-2.5 text-left rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 active:bg-emerald-200 transition-colors"
            >
              <div className="text-xs font-bold text-emerald-900">
                Petugas Lapangan (PPL)
              </div>
              <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                ppl.kuranji@pertanian.go.id
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo("koordinator.bpp@pertanian.go.id")}
              className="p-2.5 text-left rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 active:bg-blue-200 transition-colors"
            >
              <div className="text-xs font-bold text-blue-900">
                Koordinator BPP
              </div>
              <div className="text-[11px] text-blue-700 mt-0.5 font-medium">
                koordinator.bpp@pertanian.go.id
              </div>
            </button>
          </div>
          <p className="text-[11px] text-center text-slate-500 font-medium">
            Kata sandi otomatis terisi: <code className="font-mono font-bold text-slate-700">Pertanian2026!</code>
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
          Khusus petugas PPL, POPT, dan Koordinator BPP terdaftar.
        </div>
      </div>
    </main>
  );
}
