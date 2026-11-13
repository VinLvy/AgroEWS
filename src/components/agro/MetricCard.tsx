import React from "react";
import { StatusIcon, type IconName } from "./StatusIcon";
import { speakNumber } from "./speak-number";

interface SparklineData {
  values: number[]; // 3 hari: [hari1, hari2, hari3]
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
  className?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  spokenUnit,
  icon,
  description,
  sparkline,
  className = "",
}: MetricCardProps) {
  const accessibleLabel = `${label} ${speakNumber(value, spokenUnit || unit)}`;

  // Generator SVG Sparkline 3 hari
  const renderSparkline = (data: SparklineData) => {
    if (!data.values || data.values.length < 2) return null;

    const width = 80;
    const height = 30;
    const padding = 4;

    const min = data.min ?? Math.min(...data.values);
    const max = data.max ?? Math.max(...data.values);
    const range = max - min || 1;

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
        className="overflow-visible"
        aria-hidden="true"
      >
        <polyline
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {data.values.map((val, idx) => {
          const cx = padding + (idx / (data.values.length - 1)) * (width - 2 * padding);
          const cy = height - padding - ((val - min) / range) * (height - 2 * padding);
          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r="3"
              fill="var(--agri-primary-700)"
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
      className={`bg-surface-card p-4 rounded-xl border-[1.5px] border-border-card shadow-sm flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-content-secondary">{label}</span>
        <div className="p-2 rounded-lg bg-agri-50 text-agri-700">
          <StatusIcon name={icon} size={20} />
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-bold text-content-primary">
            {value.toFixed(1)}
          </span>
          <span className="text-sm font-medium text-content-muted">{unit}</span>
        </div>

        {sparkline && <div className="ml-2">{renderSparkline(sparkline)}</div>}
      </div>

      {description && (
        <p className="mt-2 text-xs text-content-muted line-clamp-1">{description}</p>
      )}
    </div>
  );
}
