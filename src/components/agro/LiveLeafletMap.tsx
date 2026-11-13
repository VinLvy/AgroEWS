"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ZoningMapVillage } from "@/components/agro/AgroZoningMap";

export type LiveBasemapStyle = "street" | "satellite";

interface LiveLeafletMapProps {
  villages: ZoningMapVillage[];
  selectedVillage: string;
  onSelectVillage: (id: string) => void;
  basemapStyle: LiveBasemapStyle;
  onSwitchToOfflineVector: () => void;
}

interface RealGeoZone {
  center: [number, number];
  coordinates: [number, number][];
}

// Koordinat geografis nyata wilayah binaan di Padang (Kuranji & koridor Sungai Bangek)
const KURANJI_CENTER: [number, number] = [-0.864, 100.394];

const REAL_ZONES: Record<string, RealGeoZone> = {
  "vil-01": {
    // Nagari / Kawasan Sungai Bangek (Utara - Barat Laut)
    center: [-0.818, 100.365],
    coordinates: [
      [-0.814, 100.348],
      [-0.812, 100.376],
      [-0.824, 100.388],
      [-0.840, 100.380],
      [-0.843, 100.354],
      [-0.829, 100.344],
    ],
  },
  "vil-02": {
    // Kelurahan Balai Gadang (Utara - Timur Laut)
    center: [-0.840, 100.408],
    coordinates: [
      [-0.824, 100.388],
      [-0.829, 100.418],
      [-0.858, 100.422],
      [-0.868, 100.392],
      [-0.860, 100.372],
      [-0.840, 100.380],
    ],
  },
  "vil-03": {
    // Kelurahan Kuranji Timur (Kalumbuk - Korong Gadang)
    center: [-0.900, 100.390],
    coordinates: [
      [-0.885, 100.380],
      [-0.889, 100.413],
      [-0.921, 100.417],
      [-0.927, 100.387],
      [-0.906, 100.374],
    ],
  },
  "vil-04": {
    // Kelurahan Gunung Sarik (Timur - DAS Batang Kuranji)
    center: [-0.876, 100.429],
    coordinates: [
      [-0.861, 100.402],
      [-0.859, 100.440],
      [-0.899, 100.446],
      [-0.906, 100.414],
      [-0.885, 100.398],
    ],
  },
};

const OVERVIEW_FIT_OPTIONS: L.FitBoundsOptions = {
  paddingTopLeft: [52, 42],
  paddingBottomRight: [50, 34],
  maxZoom: 13,
};

function getAllZonesBounds(): L.LatLngBounds {
  const allCoords = Object.values(REAL_ZONES).flatMap((zone) => zone.coordinates);
  return L.latLngBounds(allCoords);
}

const REAL_FARMER_PINS: Array<{
  id: string;
  villageId: string;
  latlng: [number, number];
  code: 0 | 1 | 2;
  dusun: string;
  note: string;
}> = [
  {
    id: "rpin-1",
    villageId: "vil-01",
    latlng: [-0.838, 100.360],
    code: 2,
    dusun: "Dusun IV (Sungai Bangek)",
    note: "Laporan Kode 2: Populasi wereng >= 5 ekor/rumpun",
  },
  {
    id: "rpin-2",
    villageId: "vil-01",
    latlng: [-0.834, 100.378],
    code: 1,
    dusun: "Dusun II (Sungai Bangek)",
    note: "Laporan Kode 1: Nimfa awal 1-4 ekor/rumpun",
  },
  {
    id: "rpin-3",
    villageId: "vil-02",
    latlng: [-0.859, 100.400],
    code: 1,
    dusun: "Kel. Balai Gadang",
    note: "Laporan Kode 1: Teramati gejala awal",
  },
  {
    id: "rpin-4",
    villageId: "vil-03",
    latlng: [-0.920, 100.402],
    code: 0,
    dusun: "Dusun I (Kuranji)",
    note: "Laporan Kode 0: Kondisi petak aman",
  },
  {
    id: "rpin-5",
    villageId: "vil-04",
    latlng: [-0.898, 100.436],
    code: 0,
    dusun: "Gunung Sarik",
    note: "Laporan Kode 0: Kondisi petak aman",
  },
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getZoneVisualTokens(status: string) {
  if (status === "red") {
    return {
      stroke: "#B91C1C",
      fill: "#EF4444",
      dot: "#DC2626",
      badgeText: "#991B1B",
      badgeBg: "#FEF2F2",
      badgeLabel: "BAHAYA",
    };
  }
  if (status === "amber") {
    return {
      stroke: "#B45309",
      fill: "#F59E0B",
      dot: "#D97706",
      badgeText: "#92400E",
      badgeBg: "#FFFBEB",
      badgeLabel: "WASPADA",
    };
  }
  return {
    stroke: "#047857",
    fill: "#10B981",
    dot: "#15803D",
    badgeText: "#065F46",
    badgeBg: "#ECFDF5",
    badgeLabel: "AMAN",
  };
}

export function LiveLeafletMap({
  villages,
  selectedVillage,
  onSelectVillage,
  basemapStyle,
  onSwitchToOfflineVector,
}: LiveLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const prevSelectedRef = useRef<string>(selectedVillage);
  const [tileErrorCount, setTileErrorCount] = useState(0);

  // Initialize Leaflet instance once and frame all 4 Kecamatan Kuranji zones
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: KURANJI_CENTER,
      zoom: 12,
      minZoom: 10,
      maxZoom: 17,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      zoomControl: true,
      attributionControl: true,
    });

    map.fitBounds(getAllZonesBounds(), OVERVIEW_FIT_OPTIONS);
    const rafId = window.requestAnimationFrame(() => {
      map.invalidateSize(false);
      map.fitBounds(getAllZonesBounds(), OVERVIEW_FIT_OPTIONS);
    });

    const baseGroup = L.layerGroup().addTo(map);
    const zonesGroup = L.layerGroup().addTo(map);
    L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);

    mapRef.current = map;
    baseLayerGroupRef.current = baseGroup;
    zonesLayerGroupRef.current = zonesGroup;

    // Expose accessible role on Leaflet overlay SVG when created
    const overlaySvg = map.getPanes().overlayPane?.querySelector("svg");
    if (overlaySvg) {
      overlaySvg.setAttribute("aria-hidden", "true");
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      map.remove();
      mapRef.current = null;
      baseLayerGroupRef.current = null;
      zonesLayerGroupRef.current = null;
    };
  }, []);

  // Switch tile basemap cleanly (Esri World Street Map w/ Topo fallback vs Esri World Imagery)
  useEffect(() => {
    const baseGroup = baseLayerGroupRef.current;
    if (!baseGroup) return;

    baseGroup.clearLayers();
    setTileErrorCount(0);

    let cancelled = false;
    let streetLoaded = false;
    let streetErrors = 0;
    let usingTopoFallback = false;

    const handleTileError = () => {
      if (cancelled) return;
      setTileErrorCount((c) => c + 1);
    };

    if (basemapStyle === "satellite") {
      const satLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Citra &copy; Esri, Maxar, Earthstar Geographics",
          maxZoom: 17,
        }
      );
      const labelOverlay = L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 17,
          opacity: 0.9,
        }
      );
      satLayer.on("tileerror", handleTileError);
      satLayer.addTo(baseGroup);
      labelOverlay.addTo(baseGroup);
    } else {
      const esriStreet = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Peta Jalan &copy; Esri, HERE, Garmin, OpenStreetMap",
          maxZoom: 17,
        }
      );
      esriStreet.on("tileload", () => {
        streetLoaded = true;
      });
      esriStreet.on("tileerror", () => {
        if (cancelled) return;
        streetErrors += 1;
        if (!streetLoaded && !usingTopoFallback && streetErrors >= 3) {
          usingTopoFallback = true;
          baseGroup.clearLayers();
          setTileErrorCount(0);
          const esriTopo = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
            {
              attribution: "Topografi &copy; Esri &amp; Contributors",
              maxZoom: 17,
            }
          );
          esriTopo.on("tileerror", handleTileError);
          esriTopo.addTo(baseGroup);
          return;
        }
        if (usingTopoFallback) {
          handleTileError();
        }
      });
      esriStreet.addTo(baseGroup);
    }

    return () => {
      cancelled = true;
    };
  }, [basemapStyle]);

  // Render interactive GeoJSON polygons, village data pills, and farmer report pins
  useEffect(() => {
    const map = mapRef.current;
    const zonesGroup = zonesLayerGroupRef.current;
    if (!map || !zonesGroup) return;

    zonesGroup.clearLayers();

    for (const village of villages) {
      const zone = REAL_ZONES[village.id];
      if (!zone) continue;

      const isSelected = selectedVillage === village.id;
      const tokens = getZoneVisualTokens(village.status);

      const polygon = L.polygon(zone.coordinates, {
        color: isSelected ? "#0F172A" : tokens.stroke,
        weight: isSelected ? 3.5 : 2,
        dashArray: isSelected ? undefined : "5 3",
        fillColor: tokens.fill,
        fillOpacity: isSelected ? 0.36 : 0.22,
      });

      polygon.on("click", () => {
        onSelectVillage(village.id);
      });
      polygon.addTo(zonesGroup);

      // Floating crisp village badge centered over the geographic polygon
      const shortName = escapeHtml(village.name.replace(/^Kelurahan\s+/, "Kel. "));
      const pillIcon = L.divIcon({
        className: "agro-map-pill-icon",
        iconSize: [158, 40],
        iconAnchor: [79, 20],
        html: `
          <div style="
            width:158px;
            background:rgba(255,255,255,0.96);
            border:${isSelected ? "2.5px" : "1.5px"} solid ${isSelected ? "#0F172A" : tokens.stroke};
            border-radius:9px;
            padding:3px 7px;
            box-shadow:0 4px 10px rgba(15,23,42,0.18);
            font-family:var(--font-jakarta),system-ui,sans-serif;
            cursor:pointer;
          ">
            <div style="display:flex;align-items:center;gap:4px;">
              <span style="width:6px;height:6px;border-radius:9999px;background:${tokens.dot};flex-shrink:0;"></span>
              <span style="font-size:10px;font-weight:800;color:#0F172A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${shortName}
              </span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;margin-top:2px;">
              <span style="font-size:9px;font-weight:800;white-space:nowrap;color:${tokens.badgeText};font-family:var(--font-mono),monospace;">
                RH ${village.rhMean}% &bull; ${village.tMean}&deg;C
              </span>
              <span style="font-size:7.5px;font-weight:800;padding:1px 4px;border-radius:4px;background:${tokens.badgeBg};color:${tokens.badgeText};border:1px solid ${tokens.stroke};flex-shrink:0;">
                ${tokens.badgeLabel}
              </span>
            </div>
          </div>
        `,
      });

      const pillMarker = L.marker(zone.center, {
        icon: pillIcon,
        zIndexOffset: isSelected ? 600 : 500,
      });
      pillMarker.on("click", () => {
        onSelectVillage(village.id);
      });
      pillMarker.addTo(zonesGroup);
    }

    // Add farmer LAPOR pins (Kode 0/1/2)
    for (const pin of REAL_FARMER_PINS) {
      const bg =
        pin.code === 2 ? "#B91C1C" : pin.code === 1 ? "#B45309" : "#047857";
      const pinIcon = L.divIcon({
        className: "agro-farmer-pin-icon",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        html: `
          <div style="
            width:24px;
            height:24px;
            border-radius:9999px;
            background:${bg};
            border:2.5px solid #FFFFFF;
            color:#FFFFFF;
            font-size:10px;
            font-weight:800;
            font-family:var(--font-mono),monospace;
            display:flex;
            align-items:center;
            justify-content:center;
            box-shadow:0 2px 6px rgba(15,23,42,0.35);
            cursor:pointer;
          ">${pin.code}</div>
        `,
      });

      const marker = L.marker(pin.latlng, { icon: pinIcon });
      marker.bindPopup(
        `<div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.4;color:#0F172A;">
          <strong>${escapeHtml(pin.dusun)}</strong><br/>
          <span>${escapeHtml(pin.note)}</span>
        </div>`
      );
      marker.on("click", () => {
        onSelectVillage(pin.villageId);
      });
      marker.addTo(zonesGroup);
    }
  }, [villages, selectedVillage, onSelectVillage]);

  // Smoothly pan map only if zoomed in or selected zone falls near viewport edges
  useEffect(() => {
    if (prevSelectedRef.current === selectedVillage) return;
    prevSelectedRef.current = selectedVillage;

    const map = mapRef.current;
    const zone = REAL_ZONES[selectedVillage];
    if (!map || !zone) return;

    const inOverviewFrame = map.getZoom() <= 12.6 && map.getBounds().pad(-0.08).contains(zone.center);
    if (!inOverviewFrame) {
      map.panTo(zone.center, { animate: true, duration: 0.45 });
    }
  }, [selectedVillage]);

  const handleRecenter = () => {
    mapRef.current?.fitBounds(getAllZonesBounds(), {
      ...OVERVIEW_FIT_OPTIONS,
      animate: true,
    });
  };

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl border border-border-card overflow-hidden bg-surface-subtle shadow-xs">
        {/* Leaflet Interactive Canvas */}
        <div
          ref={containerRef}
          className="w-full h-[400px] sm:h-[440px] z-0 agro-leaflet-surface"
          aria-label="Peta interaktif Google Maps style Kecamatan Kuranji"
        />

        {/* Top-Right Recenter Floating Control */}
        <div className="absolute top-3 right-3 z-[400]">
          <button
            type="button"
            onClick={handleRecenter}
            className="px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white border border-border-card text-[11px] font-bold text-content-primary shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-agri-700"
          >
            Pusatkan Kuranji
          </button>
        </div>

        {/* Offline Tile Fallback Hint Bar */}
        {tileErrorCount >= 4 && (
          <div className="px-3.5 py-2 bg-amber-50 border-t border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950 font-medium">
            <span>
              Ubin peta eksternal belum termuat penuh (koneksi terbatas/offline).
            </span>
            <button
              type="button"
              onClick={onSwitchToOfflineVector}
              className="px-3 py-1 rounded-lg bg-amber-800 text-white font-bold text-[11px] hover:bg-amber-900"
            >
              Gunakan Mode Vektor Offline
            </button>
          </div>
        )}
      </div>

      {/* Quick Village Switcher + Compact Legend */}
      <div className="px-4 py-3 rounded-2xl border border-border-subtle bg-white space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted mr-1">
            Fokus Zona Peta:
          </span>
          {villages.map((v) => {
            const isSelected = selectedVillage === v.id;
            const pillClass =
              v.status === "red"
                ? isSelected
                  ? "bg-red-700 text-white border-red-800"
                  : "bg-red-50 text-red-900 border-red-200 hover:bg-red-100"
                : v.status === "amber"
                ? isSelected
                  ? "bg-amber-700 text-white border-amber-800"
                  : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                : isSelected
                ? "bg-agri-700 text-white border-agri-800"
                : "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100";

            return (
              <button
                key={`live-pill-${v.id}`}
                type="button"
                onClick={() => onSelectVillage(v.id)}
                className={`min-h-[36px] px-3 py-1 rounded-full text-xs font-bold border transition-all inline-flex items-center gap-1.5 ${pillClass}`}
              >
                <span>{v.name}</span>
                <span className="font-mono opacity-90">({v.rhMean}%)</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-subtle text-[11px] font-semibold text-content-secondary">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-600" />
              Bahaya (RH &ge; 85%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-600" />
              Waspada (80–84%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              Aman (&lt; 80%)
            </span>
          </div>
          <span className="font-mono text-[10.5px] text-content-muted">
            Klik poligon atau pin LAPOR (0/1/2) &bull; Scroll/pinch untuk zoom
          </span>
        </div>
      </div>
    </div>
  );
}
