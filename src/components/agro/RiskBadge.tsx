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
    dotClass: string;
    ariaLabel: string;
  }
> = {
  green: {
    text: "[AMAN]",
    icon: "shield-check",
    bgClass: "bg-status-green-bg",
    borderClass: "border-status-green-border",
    textClass: "text-status-green-text",
    dotClass: "bg-status-green-accent",
    ariaLabel: "Status Risiko Hijau Aman",
  },
  amber: {
    text: "[WASPADA]",
    icon: "triangle-alert",
    bgClass: "bg-status-amber-bg",
    borderClass: "border-status-amber-border",
    textClass: "text-status-amber-text",
    dotClass: "bg-status-amber-accent",
    ariaLabel: "Status Risiko Kuning Waspada",
  },
  red: {
    text: "[BAHAYA]",
    icon: "shield-alert",
    bgClass: "bg-status-red-bg",
    borderClass: "border-status-red-border",
    textClass: "text-status-red-text",
    dotClass: "bg-status-red-accent",
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
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-xs sm:text-sm gap-2 min-h-touch",
    lg: "px-4 py-2 text-sm sm:text-base gap-2.5 min-h-touch",
  };

  return (
    <span
      role="status"
      aria-label={config.ariaLabel}
      className={`inline-flex items-center font-bold rounded-full border-[1.5px] shadow-xs ${config.bgClass} ${config.borderClass} ${config.textClass} ${sizeClasses[size]} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dotClass}`} aria-hidden="true" />
      <StatusIcon name={config.icon} size={size === "sm" ? 15 : 18} className="shrink-0" />
      <span className="tracking-wide font-mono">{config.text}</span>
    </span>
  );
}
