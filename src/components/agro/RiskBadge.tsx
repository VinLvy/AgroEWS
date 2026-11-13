import React from "react";
import { StatusIcon, type IconName } from "./StatusIcon";
import type { RiskStatus } from "@/core/rules";

interface RiskBadgeProps {
  status: RiskStatus;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const BADGE_CONFIG: Record<
  RiskStatus,
  {
    text: string;
    icon: IconName;
    bgClass: string;
    borderClass: string;
    textClass: string;
    ariaLabel: string;
  }
> = {
  green: {
    text: "[AMAN]",
    icon: "shield-check",
    bgClass: "bg-status-green-bg",
    borderClass: "border-status-green-border border-status-green-text",
    textClass: "text-status-green-text",
    ariaLabel: "Status Risiko Hijau Aman",
  },
  amber: {
    text: "[WASPADA]",
    icon: "triangle-alert",
    bgClass: "bg-status-amber-bg",
    borderClass: "border-status-amber-border border-status-amber-text",
    textClass: "text-status-amber-text",
    ariaLabel: "Status Risiko Kuning Waspada",
  },
  red: {
    text: "[BAHAYA]",
    icon: "shield-alert",
    bgClass: "bg-status-red-bg",
    borderClass: "border-status-red-border border-status-red-text",
    textClass: "text-status-red-text",
    ariaLabel: "Status Risiko Merah Bahaya",
  },
};

export function RiskBadge({
  status,
  className = "",
  size = "md",
}: RiskBadgeProps) {
  const config = BADGE_CONFIG[status] || BADGE_CONFIG.green;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1.5",
    md: "px-3 py-1.5 text-sm gap-2 min-h-touch",
    lg: "px-4 py-2 text-base gap-2.5 min-h-touch",
  };

  return (
    <span
      role="status"
      aria-label={config.ariaLabel}
      className={`inline-flex items-center font-bold rounded-lg border-[1.5px] ${config.bgClass} ${config.borderClass} ${config.textClass} ${sizeClasses[size]} ${className}`}
    >
      <StatusIcon name={config.icon} size={size === "sm" ? 16 : 20} className="shrink-0" />
      <span className="tracking-wide">{config.text}</span>
    </span>
  );
}
