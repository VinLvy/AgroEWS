import React from "react";
import type { RiskStatus } from "@/core/rules";
import { speakNumber } from "./speak-number";

interface RiskGaugeProps {
  title: string;
  subtitle?: string;
  score: number;
  unit?: string;
  status: RiskStatus;
  footerLeft?: string;
  footerRight?: string;
  className?: string;
}

const GAUGE_THEME: Record<
  RiskStatus,
  { activeColor: string; chipBg: string; chipText: string; label: string }
> = {
  red: {
    activeColor: "#DC2626",
    chipBg: "bg-status-red-bg border-status-red-border",
    chipText: "text-status-red-text",
    label: "[BAHAYA KRITIS]",
  },
  amber: {
    activeColor: "#D97706",
    chipBg: "bg-status-amber-bg border-status-amber-border",
    chipText: "text-status-amber-text",
    label: "[WASPADA NIMFA]",
  },
  green: {
    activeColor: "#16A34A",
    chipBg: "bg-status-green-bg border-status-green-border",
    chipText: "text-status-green-text",
    label: "[TERKENDALI]",
  },
};

/**
 * Segmented semi-circular radial gauge modeled on AgriCore KPI cards.
 * Uses pure SVG ticks with redundant text + status chip for WCAG compliance.
 */
export function RiskGauge({
  title,
  subtitle = "Indeks Kondusivitas Mikroklimat Wereng",
  score,
  unit = "%",
  status,
  footerLeft = "Aman 0%",
  footerRight = "Kritis 100%",
  className = "",
}: RiskGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const totalTicks = 24;
  const activeTicks = Math.round((clamped / 100) * totalTicks);
  const theme = GAUGE_THEME[status];

  const cx = 110;
  const cy = 104;
  const rInner = 68;
  const rOuter = 86;

  return (
    <div
      className={`rounded-2xl border-[1.5px] border-border-card bg-surface-card p-5 shadow-bento flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-content-primary">{title}</h3>
          <p className="text-xs text-content-muted mt-0.5">{subtitle}</p>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border ${theme.chipBg} ${theme.chipText}`}
        >
          {theme.label}
        </span>
      </div>

      <div className="relative flex flex-col items-center justify-center pt-2">
        <svg
          viewBox="0 0 220 120"
          className="w-full max-w-[230px]"
          role="img"
          aria-label={`${title}: ${speakNumber(clamped, "persen")}`}
        >
          {Array.from({ length: totalTicks }).map((_, idx) => {
            const angle = Math.PI + (idx / (totalTicks - 1)) * Math.PI;
            const x1 = cx + Math.cos(angle) * rInner;
            const y1 = cy + Math.sin(angle) * rInner;
            const x2 = cx + Math.cos(angle) * rOuter;
            const y2 = cy + Math.sin(angle) * rOuter;
            const isActive = idx < activeTicks;

            return (
              <line
                key={idx}
                x1={x1.toFixed(1)}
                y1={y1.toFixed(1)}
                x2={x2.toFixed(1)}
                y2={y2.toFixed(1)}
                stroke={isActive ? theme.activeColor : "#E2E8E2"}
                strokeWidth="5"
                strokeLinecap="round"
              />
            );
          })}
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            className="fill-content-primary font-extrabold"
            fontSize="30"
          >
            {Math.round(clamped)}
            <tspan fontSize="15" fontWeight="700" className="fill-content-muted">
              {unit}
            </tspan>
          </text>
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            className="fill-content-muted font-semibold"
            fontSize="10"
          >
            Skor Risiko Fenologi WBC
          </text>
        </svg>
      </div>

      <div className="flex items-center justify-between text-[11px] font-semibold text-content-muted pt-2 border-t border-border-subtle">
        <span>{footerLeft}</span>
        <span>{footerRight}</span>
      </div>
    </div>
  );
}
