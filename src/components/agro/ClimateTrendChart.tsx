"use client";

import React, { useState } from "react";
import type { PrototypeWeatherDay } from "@/lib/prototype-data";

interface ClimateTrendChartProps {
  trend: PrototypeWeatherDay[];
}

/**
 * Interactive 7-day agroclimate chart combining AgriCore capsule RH bars
 * against exact 80%/85% thresholds with a synchronized WBC temperature spline.
 */
export function ClimateTrendChart({ trend }: ClimateTrendChartProps) {
  const defaultIdx = Math.max(
    0,
    trend.findIndex((d) => !d.condition.includes("Prediksi") && d.rhMean >= 85) !== -1
      ? trend.reduce((best, d, i) => (!d.condition.includes("Prediksi") ? i : best), 0)
      : 0,
  );
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(defaultIdx);

  const activeDay = trend[selectedDayIdx] ?? trend[0];
  if (!activeDay) return null;
  const svgW = 880;
  const svgH = 352;
  const padLeft = 58;
  const padRight = 98;
  const plotW = svgW - padLeft - padRight;
  const colStep = plotW / trend.length;

  const rhTop = 36;
  const rhBottom = 192;
  const rhH = rhBottom - rhTop;
  const rhMin = 75;
  const rhMax = 90;
  const yRh = (rh: number) =>
    rhBottom - ((Math.min(rhMax, Math.max(rhMin, rh)) - rhMin) / (rhMax - rhMin)) * rhH;

  const y90 = yRh(90);
  const y85 = yRh(85);
  const y80 = yRh(80);
  const y75 = yRh(75);

  const tTop = 224;
  const tBottom = 294;
  const tH = tBottom - tTop;
  const tMin = 24;
  const tMax = 30;
  const yTemp = (t: number) =>
    tBottom - ((Math.min(tMax, Math.max(tMin, t)) - tMin) / (tMax - tMin)) * tH;

  const tempPoints = trend
    .map((d, i) => `${(padLeft + colStep * (i + 0.5)).toFixed(1)},${yTemp(d.tMean).toFixed(1)}`)
    .join(" ");
  const firstCx = (padLeft + colStep * 0.5).toFixed(1);
  const lastCx = (padLeft + colStep * (trend.length - 0.5)).toFixed(1);
  const tempAreaPoints = `${firstCx},${tBottom} ${tempPoints} ${lastCx},${tBottom}`;

  const rhLinePoints = trend
    .map((d, i) => `${(padLeft + colStep * (i + 0.5)).toFixed(1)},${yRh(d.rhMean).toFixed(1)}`)
    .join(" ");

  const activeStatusBadge =
    activeDay.rhMean >= 85
      ? "bg-status-red-bg text-status-red-text border-status-red-border"
      : activeDay.rhMean >= 80
        ? "bg-status-amber-bg text-status-amber-text border-status-amber-border"
        : "bg-status-green-bg text-status-green-text border-status-green-border";

  return (
    <div className="bg-surface-card rounded-3xl border-[1.5px] border-border-card p-5 sm:p-6 shadow-bento space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-content-primary">
            Tren Agroklimat 7 Hari Terakhir &amp; Prediksi
          </h2>
          <p className="text-xs text-content-muted mt-0.5">
            Kelembapan relatif (RH %) terhadap ambang waspada 80% / kritis 85%, disinkronkan dengan kurva suhu optimum WBC (25–29&deg;C).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold text-content-secondary shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-status-red-bg border border-status-red-border text-status-red-text">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-600" />
            RH &ge; 85% (Kritis)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-status-amber-bg border border-status-amber-border text-status-amber-text">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            RH 80–84% (Waspada)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            Kurva Suhu (&deg;C)
          </span>
        </div>
      </div>

      {/* Active Day Inspector Strip */}
      <div className="rounded-2xl bg-surface-subtle border border-border-subtle px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-extrabold text-content-primary">
            {activeDay.day}, {activeDay.date}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${activeStatusBadge}`}>
            {activeDay.rhMean >= 85
              ? "[BAHAYA KRITIS]"
              : activeDay.rhMean >= 80
                ? "[WASPADA]"
                : "[AMAN]"}
          </span>
          <span className="text-xs font-medium text-content-secondary">
            {activeDay.condition}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold tabular-nums">
          <span className="text-status-red-text">RH: {activeDay.rhMean}%</span>
          <span className="text-blue-800">Suhu: {activeDay.tMean}&deg;C</span>
          <span className="text-agri-800">Curah Hujan: {activeDay.precipMm.toFixed(1)} mm</span>
        </div>
      </div>

      {/* Synchronized Dual-Track AgriCore SVG */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[660px]">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-auto block select-none"
            role="group"
            aria-label="Grafik tren kelembapan relatif dan suhu udara tujuh hari"
          >
            <defs>
              <linearGradient id="rh-bar-red" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DC2626" />
                <stop offset="100%" stopColor="#F87171" />
              </linearGradient>
              <linearGradient id="rh-bar-amber" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#FBBF24" />
              </linearGradient>
              <linearGradient id="rh-bar-green" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#15803D" />
                <stop offset="100%" stopColor="#4ADE80" />
              </linearGradient>
              <linearGradient id="temp-area-blue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Danger zone shading (RH >= 85%) */}
            <rect
              x={padLeft}
              y={y90}
              width={plotW}
              height={y85 - y90}
              fill="#FEF2F2"
              opacity="0.7"
              rx="6"
            />

            {/* Left Y-Axis Labels & Horizontal Gridlines */}
            {[
              { val: 90, y: y90, color: "#64748B", dash: false },
              { val: 85, y: y85, color: "#DC2626", dash: true },
              { val: 80, y: y80, color: "#D97706", dash: true },
              { val: 75, y: y75, color: "#64748B", dash: false },
            ].map((tick) => (
              <g key={tick.val}>
                <line
                  x1={padLeft}
                  y1={tick.y}
                  x2={svgW - padRight}
                  y2={tick.y}
                  stroke={tick.dash ? tick.color : "#E2E8E2"}
                  strokeDasharray={tick.dash ? "5 4" : undefined}
                  strokeWidth={tick.dash ? 1.5 : 1}
                />
                <text
                  x={padLeft - 10}
                  y={tick.y + 4}
                  fill={tick.color}
                  fontSize="11"
                  fontWeight={tick.dash ? "700" : "600"}
                  textAnchor="end"
                >
                  {tick.val}%
                </text>
              </g>
            ))}

            {/* Right threshold pill tags */}
            <g transform={`translate(${svgW - padRight + 8}, ${y85 - 10})`}>
              <rect width="84" height="20" rx="6" fill="#FEF2F2" stroke="#FCA5A5" />
              <text x="42" y="13.5" fill="#991B1B" fontSize="10" fontWeight="700" textAnchor="middle">
                85% Kritis
              </text>
            </g>
            <g transform={`translate(${svgW - padRight + 8}, ${y80 - 10})`}>
              <rect width="84" height="20" rx="6" fill="#FFFBEB" stroke="#FCD34D" />
              <text x="42" y="13.5" fill="#92400E" fontSize="10" fontWeight="700" textAnchor="middle">
                80% Waspada
              </text>
            </g>

            {/* Lower Track: Optimum WBC Temperature Zone (25-29C) */}
            <rect
              x={padLeft}
              y={yTemp(29)}
              width={plotW}
              height={yTemp(25) - yTemp(29)}
              fill="#ECFDF5"
              opacity="0.7"
              rx="6"
            />
            {[
              { val: "29°", y: yTemp(29), labelColor: "#15803D" },
              { val: "25°", y: yTemp(25), labelColor: "#15803D" },
            ].map((t) => (
              <g key={t.val}>
                <line
                  x1={padLeft}
                  y1={t.y}
                  x2={svgW - padRight}
                  y2={t.y}
                  stroke="#BBF7D0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={t.y + 4}
                  fill={t.labelColor}
                  fontSize="10"
                  fontWeight="700"
                  textAnchor="end"
                >
                  {t.val}
                </text>
              </g>
            ))}
            <g transform={`translate(${svgW - padRight + 8}, ${tTop + 20})`}>
              <rect width="84" height="28" rx="6" fill="#ECFDF5" stroke="#86EFAC" />
              <text x="42" y="12.5" fill="#166534" fontSize="9.5" fontWeight="700" textAnchor="middle">
                Optimum WBC
              </text>
              <text x="42" y="23.5" fill="#15803D" fontSize="9.5" fontWeight="700" textAnchor="middle">
                25–29°C
              </text>
            </g>

            {/* Temperature Area + Smooth Polyline */}
            <polygon points={tempAreaPoints} fill="url(#temp-area-blue)" />
            <polyline
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={tempPoints}
            />

            {/* Subtle RH Trend Overlay Line */}
            <polyline
              fill="none"
              stroke="#334155"
              strokeOpacity="0.35"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              points={rhLinePoints}
            />

            {/* 7 Daily Columns */}
            {trend.map((day, idx) => {
              const cx = padLeft + colStep * (idx + 0.5);
              const barW = 40;
              const barX = cx - barW / 2;
              const barY = yRh(day.rhMean);
              const barH = Math.max(8, rhBottom - barY);
              const tempY = yTemp(day.tMean);
              const isCritical = day.rhMean >= 85;
              const isWarning = day.rhMean >= 80 && day.rhMean < 85;
              const isForecast = day.condition.includes("Prediksi");
              const isSelected = idx === selectedDayIdx;

              const barFill = isCritical
                ? "url(#rh-bar-red)"
                : isWarning
                  ? "url(#rh-bar-amber)"
                  : "url(#rh-bar-green)";
              const labelColor = isCritical
                ? "#991B1B"
                : isWarning
                  ? "#92400E"
                  : "#166534";

              return (
                <g
                  key={day.date}
                  className="cursor-pointer"
                  onClick={() => setSelectedDayIdx(idx)}
                  onMouseEnter={() => setSelectedDayIdx(idx)}
                >
                  {/* Active Column Highlight */}
                  {isSelected && (
                    <rect
                      x={cx - colStep * 0.44}
                      y={6}
                      width={colStep * 0.88}
                      height={svgH - 8}
                      rx="14"
                      fill="#15803D"
                      fillOpacity="0.05"
                      stroke="#CBD5E1"
                      strokeWidth="1"
                    />
                  )}

                  {/* Forecast Badge cleanly placed above 90% ceiling */}
                  {isForecast && (
                    <g transform={`translate(${cx - 28}, 12)`}>
                      <rect width="56" height="16" rx="5" fill="#F1F5F9" stroke="#CBD5E1" />
                      <text
                        x="28"
                        y="11"
                        fill="#475569"
                        fontSize="8.5"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        PREDIKSI
                      </text>
                    </g>
                  )}

                  {/* AgriCore Capsule Track Pill */}
                  <rect
                    x={barX}
                    y={rhTop}
                    width={barW}
                    height={rhH}
                    rx="12"
                    fill="#F0F5F0"
                  />

                  {/* Filled Severity Rounded Bar */}
                  <rect
                    x={barX}
                    y={barY}
                    width={barW}
                    height={barH}
                    rx="12"
                    fill={barFill}
                    opacity={isForecast ? 0.84 : 1}
                  />

                  {/* RH Value Label Above Bar */}
                  <text
                    x={cx}
                    y={barY - 7}
                    fill={labelColor}
                    fontSize="11"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {day.rhMean}%
                  </text>

                  {/* Temperature Node + Value Pill (Lower Panel) */}
                  <circle
                    cx={cx}
                    cy={tempY}
                    r={isSelected ? 6 : 4.5}
                    fill="#FFFFFF"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                  />
                  <rect
                    x={cx - 21}
                    y={tempY - 24}
                    width="42"
                    height="16"
                    rx="5"
                    fill="#FFFFFF"
                    stroke={isSelected ? "#2563EB" : "#BFDBFE"}
                    strokeWidth="1"
                  />
                  <text
                    x={cx}
                    y={tempY - 12.5}
                    fill="#1E3A8A"
                    fontSize="10"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {day.tMean}&deg;C
                  </text>

                  {/* Day, Date & Rain Footer */}
                  <text
                    x={cx}
                    y={316}
                    fill={isSelected ? "#0F172A" : "#334155"}
                    fontSize="11.5"
                    fontWeight={isSelected ? "800" : "700"}
                    textAnchor="middle"
                  >
                    {day.day}
                  </text>
                  <text
                    x={cx}
                    y={331}
                    fill="#526071"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {day.date}
                  </text>
                  <text
                    x={cx}
                    y={345}
                    fill="#15803D"
                    fontSize="9.5"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {day.precipMm.toFixed(1)} mm
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
