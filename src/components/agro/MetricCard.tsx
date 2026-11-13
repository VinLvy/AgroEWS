import React from "react";
import { StatusIcon, type IconName } from "./StatusIcon";
import { speakNumber } from "./speak-number";

interface SparklineData {
  values: number[];
  min?: number;
  max?: number;
}

interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  spokenUnit?: string;
  icon: IconName;
  description?: string;
  sparkline?: SparklineData;
  tone?: "default" | "amber" | "red";
  badgeText?: string;
  className?: string;
}

const TONE_CLASSES = {
  default: {
    card: "bg-surface-card border-border-card",
    iconWrap: "bg-agri-50 text-agri-700 border border-agri-100",
    barFill: "#DCFCE7",
    barPeakFill: "#86EFAC",
    lineStroke: "#15803D",
    badge: "bg-agri-50 text-agri-800 border-agri-100",
  },
  amber: {
    card: "bg-surface-card border-status-amber-border",
    iconWrap: "bg-status-amber-bg text-status-amber-text border border-status-amber-border",
    barFill: "#FEF3C7",
    barPeakFill: "#FCD34D",
    lineStroke: "#B45309",
    badge: "bg-status-amber-bg text-status-amber-text border-status-amber-border",
  },
  red: {
    card: "bg-surface-card border-status-red-border",
    iconWrap: "bg-status-red-bg text-status-red-text border border-status-red-border",
    barFill: "#FEE2E2",
    barPeakFill: "#FCA5A5",
    lineStroke: "#B91C1C",
    badge: "bg-status-red-bg text-status-red-text border-status-red-border",
  },
};

export function MetricCard({
  label,
  value,
  unit,
  spokenUnit,
  icon,
  description,
  sparkline,
  tone = "default",
  badgeText,
  className = "",
}: MetricCardProps) {
  const accessibleLabel = `${label} ${speakNumber(value, spokenUnit || unit)}`;
  const palette = TONE_CLASSES[tone];

  const renderSparkline = (data: SparklineData) => {
    if (!data.values || data.values.length < 2) return null;

    const width = 96;
    const height = 40;
    const padding = 5;

    const min = data.min ?? Math.min(...data.values);
    const max = data.max ?? Math.max(...data.values);
    const range = max - min || 1;
    const barWidth = Math.max(8, Math.floor((width - 2 * padding) / data.values.length) - 4);

    const points = data.values
      .map((val, idx) => {
        const x = padding + (idx / (data.values.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((val - min) / range) * (height - 2 * padding);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible shrink-0"
        aria-hidden="true"
      >
        {data.values.map((val, idx) => {
          const cx = padding + (idx / (data.values.length - 1)) * (width - 2 * padding);
          const normH = Math.max(8, ((val - min) / range) * (height - 12) + 8);
          const isLast = idx === data.values.length - 1;
          return (
            <rect
              key={`bar-${idx}`}
              x={cx - barWidth / 2}
              y={height - normH}
              width={barWidth}
              height={normH}
              rx={3}
              fill={isLast ? palette.barPeakFill : palette.barFill}
            />
          );
        })}
        <polyline
          fill="none"
          stroke={palette.lineStroke}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {data.values.map((val, idx) => {
          const cx = padding + (idx / (data.values.length - 1)) * (width - 2 * padding);
          const cy = height - padding - ((val - min) / range) * (height - 2 * padding);
          return (
            <circle
              key={`dot-${idx}`}
              cx={cx}
              cy={cy}
              r="3"
              fill={palette.lineStroke}
              stroke="#FFFFFF"
              strokeWidth="1.2"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div
      tabIndex={0}
      aria-label={accessibleLabel}
      className={`rounded-2xl border-[1.5px] p-5 shadow-bento flex flex-col justify-between transition-all hover:shadow-bento-lg focus:outline-none focus:ring-2 focus:ring-agri-700 ${palette.card} ${className}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-content-muted block">
            {label}
          </span>
          {badgeText && (
            <span
              className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${palette.badge}`}
            >
              {badgeText}
            </span>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${palette.iconWrap}`}>
          <StatusIcon name={icon} size={20} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 mt-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-content-primary tabular-nums leading-none">
            {value.toFixed(1)}
          </span>
          <span className="text-sm font-bold text-content-muted">{unit}</span>
        </div>

        {sparkline && renderSparkline(sparkline)}
      </div>

      {description && (
        <p className="mt-3 pt-2.5 border-t border-border-subtle text-xs font-medium text-content-secondary line-clamp-2">
          {description}
        </p>
      )}
    </div>
  );
}
