"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { AgroZoningMap, type ZoningMapVillage } from "@/components/agro/AgroZoningMap";
import type { LiveBasemapStyle } from "@/components/agro/LiveLeafletMap";

const DynamicLiveLeafletMap = dynamic(
  () => import("@/components/agro/LiveLeafletMap").then((mod) => mod.LiveLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] sm:h-[440px] rounded-2xl border border-border-card bg-surface-subtle flex items-center justify-center text-xs font-semibold text-content-muted">
        Memuat peta interaktif Kecamatan Kuranji...
      </div>
    ),
  }
);

type MapMode = LiveBasemapStyle | "vector";

interface HybridZoningMapPanelProps {
  villages: ZoningMapVillage[];
  selectedVillage: string;
  onSelectVillage: (id: string) => void;
}

export function HybridZoningMapPanel({
  villages,
  selectedVillage,
  onSelectVillage,
}: HybridZoningMapPanelProps) {
  const [mapMode, setMapMode] = useState<MapMode>("street");

  return (
    <div data-testid="agro-map-container" className="space-y-3">
      {/* Mode Switcher: Peta Jalan (GMaps style) | Citra Satelit | Vektor Offline */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-subtle/80 p-2 rounded-2xl border border-border-subtle">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Pilih Lapisan Peta Dasar">
          <button
            type="button"
            onClick={() => setMapMode("street")}
            aria-pressed={mapMode === "street"}
            className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
              mapMode === "street"
                ? "bg-agri-700 text-white border-agri-800 shadow-xs"
                : "bg-white text-content-secondary border-border-subtle hover:text-content-primary"
            }`}
          >
            Peta Jalan (Live)
          </button>
          <button
            type="button"
            onClick={() => setMapMode("satellite")}
            aria-pressed={mapMode === "satellite"}
            className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
              mapMode === "satellite"
                ? "bg-agri-700 text-white border-agri-800 shadow-xs"
                : "bg-white text-content-secondary border-border-subtle hover:text-content-primary"
            }`}
          >
            Citra Satelit
          </button>
          <button
            type="button"
            onClick={() => setMapMode("vector")}
            aria-pressed={mapMode === "vector"}
            className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
              mapMode === "vector"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-content-secondary border-border-subtle hover:text-content-primary"
            }`}
          >
            Vektor Offline
          </button>
        </div>

        <span className="px-2.5 py-1 rounded-lg bg-white border border-border-subtle text-[10.5px] font-mono font-semibold text-content-muted">
          {mapMode === "street"
            ? "Esri World Street • Tanpa API Key"
            : mapMode === "satellite"
            ? "Esri World Imagery • Tanpa API Key"
            : "SVG Topografis • 100% Offline"}
        </span>
      </div>

      {mapMode === "vector" ? (
        <AgroZoningMap
          villages={villages}
          selectedVillage={selectedVillage}
          onSelectVillage={onSelectVillage}
        />
      ) : (
        <DynamicLiveLeafletMap
          villages={villages}
          selectedVillage={selectedVillage}
          onSelectVillage={onSelectVillage}
          basemapStyle={mapMode}
          onSwitchToOfflineVector={() => setMapMode("vector")}
        />
      )}
    </div>
  );
}
