"use client";

import React, { useState } from "react";

export interface ZoningMapVillage {
  id: string;
  name: string;
  status: "red" | "amber" | "green" | string;
  tMean: number;
  rhMean: number;
  reportsCount: number;
  severeReportsCount: number;
  lastDraftStatus: string;
}

interface AgroZoningMapProps {
  villages: ZoningMapVillage[];
  selectedVillage: string;
  onSelectVillage: (id: string) => void;
}

interface ZoneGeometry {
  path: string;
  parcelOverlayPaths: string[];
  labelX: number;
  labelY: number;
  cardWidth: number;
  nodeX: number;
  nodeY: number;
  nodeCode: string;
}

const ZONE_GEOMETRIES: Record<string, ZoneGeometry> = {
  "vil-01": {
    // Nagari Sungai Bangek (Barat Laut - hulu terasering lembap)
    path: "M 76 92 C 118 52, 224 44, 344 52 C 358 102, 366 154, 370 198 C 304 206, 232 224, 174 236 C 122 214, 78 176, 62 132 C 58 114, 64 102, 76 92 Z",
    parcelOverlayPaths: [
      "M 105 98 L 235 84 L 248 148 L 116 164 Z",
      "M 244 82 L 332 76 L 348 168 L 256 150 Z",
      "M 118 170 L 252 156 L 274 202 L 178 218 Z",
    ],
    labelX: 215,
    labelY: 138,
    cardWidth: 198,
    nodeX: 298,
    nodeY: 82,
    nodeCode: "ERA5 #KRN-01",
  },
  "vil-02": {
    // Kel. Balai Gadang (Timur Laut - perbatasan perbukitan)
    path: "M 344 52 C 454 50, 566 64, 652 96 C 684 128, 694 176, 672 226 C 578 228, 468 208, 370 198 C 366 154, 358 102, 344 52 Z",
    parcelOverlayPaths: [
      "M 374 84 L 512 86 L 522 160 L 382 152 Z",
      "M 522 88 L 634 108 L 648 194 L 530 162 Z",
      "M 386 158 L 526 168 L 544 208 L 392 188 Z",
    ],
    labelX: 528,
    labelY: 142,
    cardWidth: 198,
    nodeX: 598,
    nodeY: 84,
    nodeCode: "ERA5 #KRN-02",
  },
  "vil-03": {
    // Kel. Kuranji Timur (Barat Daya - dataran rendah)
    path: "M 174 236 C 232 224, 304 206, 370 198 C 388 248, 408 308, 418 366 C 322 378, 224 374, 152 344 C 122 314, 128 264, 174 236 Z",
    parcelOverlayPaths: [
      "M 176 254 L 350 218 L 368 286 L 194 316 Z",
      "M 196 322 L 372 292 L 394 352 L 224 358 Z",
    ],
    labelX: 274,
    labelY: 292,
    cardWidth: 198,
    nodeX: 298,
    nodeY: 342,
    nodeCode: "ERA5 #KRN-03",
  },
  "vil-04": {
    // Kel. Gunung Sarik (Tenggara - hilir irigasi)
    path: "M 370 198 C 468 208, 578 228, 672 226 C 690 278, 670 338, 620 356 C 546 372, 474 372, 418 366 C 408 308, 388 248, 370 198 Z",
    parcelOverlayPaths: [
      "M 402 224 L 546 238 L 544 312 L 420 296 Z",
      "M 554 240 L 650 244 L 634 328 L 552 314 Z",
      "M 424 304 L 548 318 L 554 354 L 434 350 Z",
    ],
    labelX: 540,
    labelY: 306,
    cardWidth: 198,
    nodeX: 612,
    nodeY: 248,
    nodeCode: "ERA5 #KRN-04",
  },
};

interface FarmerPin {
  id: string;
  villageId: string;
  x: number;
  y: number;
  code: 0 | 1 | 2;
  dusun: string;
  countLabel: string;
}

const FARMER_PINS: FarmerPin[] = [
  { id: "pin-1", villageId: "vil-01", x: 142, y: 192, code: 2, dusun: "Dusun IV", countLabel: "2" },
  { id: "pin-2", villageId: "vil-01", x: 324, y: 176, code: 1, dusun: "Dusun II", countLabel: "1" },
  { id: "pin-3", villageId: "vil-02", x: 446, y: 188, code: 1, dusun: "Balai Gadang", countLabel: "1" },
  { id: "pin-4", villageId: "vil-03", x: 320, y: 242, code: 0, dusun: "Dusun I", countLabel: "0" },
  { id: "pin-5", villageId: "vil-04", x: 454, y: 248, code: 0, dusun: "Gunung Sarik", countLabel: "0" },
];

function getStatusStyles(status: string, isSelected: boolean) {
  if (status === "red") {
    return {
      gradientId: isSelected ? "url(#zone-red-active)" : "url(#zone-red-base)",
      stroke: isSelected ? "#7F1D1D" : "#B91C1C",
      cardBorder: isSelected ? "#991B1B" : "#DC2626",
      dotColor: "#DC2626",
      metricColor: "#991B1B",
      badgeBg: "#FEF2F2",
      badgeText: "#991B1B",
      badgeLabel: "BAHAYA",
    };
  }
  if (status === "amber") {
    return {
      gradientId: isSelected ? "url(#zone-amber-active)" : "url(#zone-amber-base)",
      stroke: isSelected ? "#78350F" : "#B45309",
      cardBorder: isSelected ? "#92400E" : "#D97706",
      dotColor: "#D97706",
      metricColor: "#92400E",
      badgeBg: "#FFFBEB",
      badgeText: "#92400E",
      badgeLabel: "WASPADA",
    };
  }
  return {
    gradientId: isSelected ? "url(#zone-green-active)" : "url(#zone-green-base)",
    stroke: isSelected ? "#064E3B" : "#047857",
    cardBorder: isSelected ? "#065F46" : "#15803D",
    dotColor: "#15803D",
    metricColor: "#065F46",
    badgeBg: "#ECFDF5",
    badgeText: "#065F46",
    badgeLabel: "AMAN",
  };
}

export function AgroZoningMap({
  villages,
  selectedVillage,
  onSelectVillage,
}: AgroZoningMapProps) {
  const [hoveredVillage, setHoveredVillage] = useState<string | null>(null);
  const [showGridLayer, setShowGridLayer] = useState<boolean>(true);
  const [showRiverContours, setShowRiverContours] = useState<boolean>(true);
  const [showFarmerPins, setShowFarmerPins] = useState<boolean>(true);

  return (
    <div className="space-y-4">
      <div className="w-full rounded-2xl border border-border-card bg-[#EEF4EE] overflow-hidden shadow-xs">
        {/* Top GIS Overlay HUD Bar */}
        <div className="px-3.5 py-2.5 bg-white/90 border-b border-border-subtle flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-content-secondary">
            <span className="px-2 py-0.5 rounded-md bg-agri-50 border border-agri-100 text-agri-800 font-mono font-bold">
              DAS BATANG KURANJI
            </span>
            <span className="font-mono text-content-muted hidden sm:inline">
              0.89&deg;LS, 100.41&deg;BT &bull; Grid Satelit 9 km
            </span>
          </div>

          {/* Interactive Map Layers */}
          <div className="flex flex-wrap items-center gap-1.5" aria-label="Pengaturan Lapisan Peta">
            <button
              type="button"
              onClick={() => setShowRiverContours((prev) => !prev)}
              aria-pressed={showRiverContours}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                showRiverContours
                  ? "bg-sky-50 border-sky-300 text-sky-900"
                  : "bg-surface-subtle border-border-subtle text-content-muted hover:text-content-primary"
              }`}
            >
              Irigasi &amp; Kontur
            </button>
            <button
              type="button"
              onClick={() => setShowGridLayer((prev) => !prev)}
              aria-pressed={showGridLayer}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                showGridLayer
                  ? "bg-agri-50 border-agri-200 text-agri-800"
                  : "bg-surface-subtle border-border-subtle text-content-muted hover:text-content-primary"
              }`}
            >
              Grid ERA5 (9 km)
            </button>
            <button
              type="button"
              onClick={() => setShowFarmerPins((prev) => !prev)}
              aria-pressed={showFarmerPins}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                showFarmerPins
                  ? "bg-red-50 border-red-200 text-red-900"
                  : "bg-surface-subtle border-border-subtle text-content-muted hover:text-content-primary"
              }`}
            >
              Pin LAPOR Petani
            </button>
          </div>
        </div>

        {/* Cartographic SVG Map */}
        <div className="relative p-2 sm:p-3">
          <svg
            viewBox="0 0 760 420"
            className="w-full h-auto max-h-[430px] select-none"
            role="img"
            aria-label="Peta Zonasi Agroklimat Kecamatan Kuranji"
          >
            <defs>
              {/* Terrain backdrop gradient */}
              <radialGradient id="terrain-backdrop" cx="48%" cy="48%" r="65%">
                <stop offset="0%" stopColor="#F4F8F4" />
                <stop offset="65%" stopColor="#E6EFE7" />
                <stop offset="100%" stopColor="#D8E6DA" />
              </radialGradient>

              {/* Soft land mass shadow */}
              <filter id="landmass-shadow" x="-8%" y="-8%" width="116%" height="118%">
                <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.14" />
              </filter>

              {/* Active village elevation shadow */}
              <filter id="zone-active-shadow" x="-8%" y="-8%" width="116%" height="118%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.22" />
              </filter>

              {/* Label pill shadow */}
              <filter id="pill-shadow" x="-10%" y="-15%" width="120%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.16" />
              </filter>

              {/* Paddy terrace hatch pattern */}
              <pattern
                id="paddy-terrace-pattern"
                width="18"
                height="18"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(-16)"
              >
                <line x1="0" y1="6" x2="18" y2="6" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.24" />
                <line x1="0" y1="14" x2="18" y2="14" stroke="#FFFFFF" strokeWidth="0.7" strokeOpacity="0.14" />
              </pattern>

              {/* Rich choropleth status gradients */}
              <linearGradient id="zone-red-base" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.86" />
                <stop offset="100%" stopColor="#DC2626" stopOpacity="0.92" />
              </linearGradient>
              <linearGradient id="zone-red-active" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#DC2626" stopOpacity="0.96" />
                <stop offset="100%" stopColor="#B91C1C" stopOpacity="0.98" />
              </linearGradient>

              <linearGradient id="zone-amber-base" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.84" />
                <stop offset="100%" stopColor="#D97706" stopOpacity="0.90" />
              </linearGradient>
              <linearGradient id="zone-amber-active" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D97706" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#B45309" stopOpacity="0.98" />
              </linearGradient>

              <linearGradient id="zone-green-base" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.82" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.88" />
              </linearGradient>
              <linearGradient id="zone-green-active" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0.98" />
              </linearGradient>
            </defs>

            {/* Layer 0: Base Terrain Backdrop */}
            <rect x="0" y="0" width="760" height="420" rx="14" fill="url(#terrain-backdrop)" />

            {/* Topographic Contours & Bukit Barisan Eastern Slope Hint */}
            {showRiverContours && (
              <g fill="none" stroke="#9EB9A4" strokeWidth="1" opacity="0.55">
                <path d="M 520 -10 C 570 95, 620 140, 770 155" strokeDasharray="4 4" />
                <path d="M 575 -10 C 618 75, 665 112, 770 122" />
                <path d="M 635 -10 C 675 55, 710 85, 770 92" />
                <path d="M -10 280 C 68 250, 96 315, 130 430" strokeDasharray="4 4" />
                <path d="M -10 335 C 48 310, 74 360, 96 430" />
                <text x="692" y="76" fill="#5D7B65" stroke="none" fontSize="9" fontWeight="700" fontFamily="monospace">
                  94 mdpl
                </text>
                <text x="688" y="138" fill="#5D7B65" stroke="none" fontSize="9" fontWeight="600" fontFamily="monospace">
                  48 mdpl
                </text>
              </g>
            )}

            {/* Neighboring Sub-District Context Labels */}
            <g fill="#64748B" opacity="0.65" fontSize="10" fontWeight="700" letterSpacing="1.4">
              <text x="58" y="34">KEC. KOTO TANGAH</text>
              <text x="546" y="34">LERENG BUKIT BARISAN</text>
              <text x="26" y="255">NANGGALO</text>
              <text x="364" y="398">KEC. PAUH &bull; LUBUK KILANGAN</text>
            </g>

            {/* Layer 1: ERA5-Land 9 km Satellite Coordinate Grid */}
            {showGridLayer && (
              <g opacity="0.48">
                {[152, 304, 456, 608].map((gx, i) => (
                  <g key={`gx-${gx}`}>
                    <line
                      x1={gx}
                      y1="0"
                      x2={gx}
                      y2="420"
                      stroke="#64748B"
                      strokeWidth="0.75"
                      strokeDasharray="3 5"
                    />
                    <text
                      x={gx + 4}
                      y="411"
                      fill="#475569"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="600"
                    >
                      100&deg;{22 + i * 2}&apos;E
                    </text>
                  </g>
                ))}
                {[105, 210, 315].map((gy, i) => (
                  <g key={`gy-${gy}`}>
                    <line
                      x1="0"
                      y1={gy}
                      x2="760"
                      y2={gy}
                      stroke="#64748B"
                      strokeWidth="0.75"
                      strokeDasharray="3 5"
                    />
                    <text
                      x="10"
                      y={gy - 4}
                      fill="#475569"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="600"
                    >
                      0&deg;{53 + i}&apos;S
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* Layer 2: Interactive Choropleth Village Polygons */}
            <g filter="url(#landmass-shadow)">
              {villages.map((village) => {
                const geom = ZONE_GEOMETRIES[village.id];
                if (!geom) return null;
                const isSelected = selectedVillage === village.id;
                const isHovered = hoveredVillage === village.id;
                const styles = getStatusStyles(village.status, isSelected);

                return (
                  <g
                    key={village.id}
                    className="cursor-pointer focus:outline-none"
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    aria-label={`${village.name}, status ${styles.badgeLabel}, kelembapan ${village.rhMean}%`}
                    onClick={() => onSelectVillage(village.id)}
                    onMouseEnter={() => setHoveredVillage(village.id)}
                    onMouseLeave={() => setHoveredVillage(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectVillage(village.id);
                      }
                    }}
                    filter={isSelected ? "url(#zone-active-shadow)" : undefined}
                  >
                    {/* Main Polygon Fill */}
                    <path
                      d={geom.path}
                      fill={styles.gradientId}
                      stroke="#FFFFFF"
                      strokeWidth={isSelected ? 4 : 2.5}
                      strokeLinejoin="round"
                      opacity={isSelected || isHovered ? 1 : 0.88}
                    />

                    {/* Paddy Block Texture & Sub-Plot Boundaries */}
                    <path d={geom.path} fill="url(#paddy-terrace-pattern)" pointerEvents="none" />
                    <g fill="none" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.28" pointerEvents="none">
                      {geom.parcelOverlayPaths.map((pPath, idx) => (
                        <path key={`${village.id}-parcel-${idx}`} d={pPath} strokeDasharray="3 2" />
                      ))}
                    </g>

                    {/* Active Highlight Ring */}
                    {isSelected && (
                      <path
                        d={geom.path}
                        fill="none"
                        stroke={styles.stroke}
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        pointerEvents="none"
                      />
                    )}
                  </g>
                );
              })}
            </g>

            {/* Layer 3: Sungai Batang Kuranji River & Rural Collector Road */}
            {showRiverContours && (
              <g pointerEvents="none">
                {/* Main Batang Kuranji Irrigation River */}
                <path
                  d="M 730 142 C 635 162, 545 198, 442 204 C 338 210, 260 226, 174 238 C 108 248, 56 276, 16 312"
                  fill="none"
                  stroke="#E0F2FE"
                  strokeWidth="8.5"
                  strokeLinecap="round"
                  opacity="0.88"
                />
                <path
                  d="M 730 142 C 635 162, 545 198, 442 204 C 338 210, 260 226, 174 238 C 108 248, 56 276, 16 312"
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Secondary Irrigation Branch */}
                <path
                  d="M 398 205 C 378 158, 355 110, 326 60"
                  fill="none"
                  stroke="#7DD3FC"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.85"
                />
                <path
                  d="M 488 202 C 504 252, 514 294, 534 352"
                  fill="none"
                  stroke="#7DD3FC"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.85"
                />

                {/* River Name Label Badge */}
                <g transform="translate(254, 224)">
                  <rect x="-54" y="-10" width="108" height="19" rx="9.5" fill="#0369A1" stroke="#E0F2FE" strokeWidth="1.5" />
                  <text x="0" y="3" fill="#FFFFFF" fontSize="9.5" fontWeight="700" textAnchor="middle">
                    S. Batang Kuranji
                  </text>
                </g>

                {/* Rural Feeder Road */}
                <path
                  d="M 134 46 C 148 118, 172 178, 182 246 C 190 302, 212 350, 232 400"
                  fill="none"
                  stroke="#F8FAFC"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  opacity="0.72"
                />
                <path
                  d="M 134 46 C 148 118, 172 178, 182 246 C 190 302, 212 350, 232 400"
                  fill="none"
                  stroke="#475569"
                  strokeWidth="1.2"
                  strokeDasharray="6 4"
                  opacity="0.7"
                />
              </g>
            )}

            {/* Layer 4: Virtual Grid Reticles (Satellite ERA5 Nodes — Zero Field Hardware) */}
            {showGridLayer && (
              <g pointerEvents="none">
                {villages.map((village) => {
                  const geom = ZONE_GEOMETRIES[village.id];
                  if (!geom) return null;
                  return (
                    <g key={`node-${village.id}`} transform={`translate(${geom.nodeX}, ${geom.nodeY})`}>
                      <circle r="10" fill="#FFFFFF" fillOpacity="0.22" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="2 2" />
                      <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFFFFF" strokeWidth="1.5" />
                      <line x1="0" y1="-5" x2="0" y2="5" stroke="#FFFFFF" strokeWidth="1.5" />
                      <rect x="-31" y="12" width="62" height="14" rx="4" fill="#0F172A" fillOpacity="0.78" />
                      <text x="0" y="22" fill="#F8FAFC" fontSize="7.8" fontFamily="monospace" fontWeight="700" textAnchor="middle">
                        {geom.nodeCode}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Layer 5: Farmer Ground-Truthing Pins (LAPOR Kode 0/1/2) */}
            {showFarmerPins && (
              <g>
                {FARMER_PINS.map((pin) => {
                  const pinColor =
                    pin.code === 2 ? "#B91C1C" : pin.code === 1 ? "#B45309" : "#047857";
                  return (
                    <g
                      key={pin.id}
                      transform={`translate(${pin.x}, ${pin.y})`}
                      className="cursor-pointer"
                      onClick={() => onSelectVillage(pin.villageId)}
                    >
                      {pin.code === 2 && (
                        <>
                          <circle r="18" fill="#FEE2E2" fillOpacity="0.4" stroke="#DC2626" strokeWidth="1.5">
                            <animate attributeName="r" values="10;22;10" dur="2.4s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.85;0.15;0.85" dur="2.4s" repeatCount="indefinite" />
                          </circle>
                        </>
                      )}
                      <circle r="10" fill={pinColor} stroke="#FFFFFF" strokeWidth="2.5" filter="url(#pill-shadow)" />
                      <text x="0" y="3.5" fill="#FFFFFF" fontSize="10" fontWeight="800" fontFamily="monospace" textAnchor="middle">
                        {pin.countLabel}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Layer 6: Floating High-Contrast Map Village Data Cards */}
            {villages.map((village) => {
              const geom = ZONE_GEOMETRIES[village.id];
              if (!geom) return null;
              const isSelected = selectedVillage === village.id;
              const styles = getStatusStyles(village.status, isSelected);
              const halfW = geom.cardWidth / 2;

              return (
                <g
                  key={`card-${village.id}`}
                  transform={`translate(${geom.labelX}, ${geom.labelY})`}
                  className="cursor-pointer"
                  onClick={() => onSelectVillage(village.id)}
                >
                  <rect
                    x={-halfW}
                    y="-27"
                    width={geom.cardWidth}
                    height="54"
                    rx="12"
                    fill="#FFFFFF"
                    fillOpacity="0.97"
                    stroke={styles.cardBorder}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    filter="url(#pill-shadow)"
                  />

                  {/* Status Beacon Dot */}
                  <circle cx={-halfW + 14} cy="-10" r="4.5" fill={styles.dotColor} />

                  {/* Village Title */}
                  <text
                    x={-halfW + 25}
                    y="-6"
                    fill="#0F172A"
                    fontSize="11.5"
                    fontWeight="800"
                  >
                    {village.name.replace(/^Kelurahan\s+/, "Kel. ")}
                  </text>

                  {/* Metrics Row: RH% & Temp */}
                  <text
                    x={-halfW + 11}
                    y="14"
                    fill={styles.metricColor}
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    RH {village.rhMean}%
                  </text>
                  <text
                    x={-halfW + 72}
                    y="14"
                    fill="#475569"
                    fontSize="10.5"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    &bull; {village.tMean}&deg;C
                  </text>

                  {/* Status Pill Inside Card */}
                  <rect
                    x={halfW - 56}
                    y="2"
                    width="47"
                    height="17"
                    rx="6"
                    fill={styles.badgeBg}
                    stroke={styles.cardBorder}
                    strokeWidth="0.75"
                  />
                  <text
                    x={halfW - 32.5}
                    y="13.5"
                    fill={styles.badgeText}
                    fontSize="8"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {styles.badgeLabel}
                  </text>
                </g>
              );
            })}

            {/* Layer 7: Cartographic Scale Bar & North Compass Rose */}
            {/* North Compass Rose (Top Right) */}
            <g transform="translate(718, 42)">
              <circle r="20" fill="#FFFFFF" fillOpacity="0.95" stroke="#CBD5E1" strokeWidth="1.5" filter="url(#pill-shadow)" />
              <text x="0" y="-7.5" fill="#0F172A" fontSize="8.5" fontWeight="800" textAnchor="middle">
                U
              </text>
              <polygon points="0,-5 4.5,6 0,3.5 -4.5,6" fill="#15803D" />
              <polygon points="0,14 3.5,5 0,7 -3.5,5" fill="#94A3B8" />
            </g>

            {/* Scale Bar (Bottom Right) */}
            <g transform="translate(570, 396)">
              <rect x="-10" y="-16" width="174" height="22" rx="8" fill="#FFFFFF" fillOpacity="0.92" stroke="#CBD5E1" strokeWidth="1" />
              <line x1="2" y1="-2" x2="62" y2="-2" stroke="#0F172A" strokeWidth="2" />
              <line x1="2" y1="-6" x2="2" y2="1" stroke="#0F172A" strokeWidth="1.5" />
              <line x1="32" y1="-5" x2="32" y2="0" stroke="#0F172A" strokeWidth="1.2" />
              <line x1="62" y1="-6" x2="62" y2="1" stroke="#0F172A" strokeWidth="1.5" />
              <text x="69" y="1" fill="#334155" fontSize="9.5" fontWeight="700" fontFamily="monospace">
                0 — 2 km | 1:25rb
              </text>
            </g>
          </svg>
        </div>

        {/* Bottom Village Quick-Switch & Map Legend */}
        <div className="px-4 py-3 bg-white/95 border-t border-border-subtle space-y-3">
          {/* Quick-Tap Village Pills (Mobile & Keyboard Friendly) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted mr-1">
              Pilih Zona:
            </span>
            {villages.map((v) => {
              const isSelected = selectedVillage === v.id;
              const pillStyle =
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
                  key={`quick-${v.id}`}
                  type="button"
                  onClick={() => onSelectVillage(v.id)}
                  className={`min-h-[36px] px-3 py-1 rounded-full text-xs font-bold border transition-all inline-flex items-center gap-1.5 ${pillStyle}`}
                >
                  <span>{v.name}</span>
                  <span className="font-mono opacity-90">({v.rhMean}%)</span>
                </button>
              );
            })}
          </div>

          {/* Crisp Cartographic Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-subtle text-[11px] font-semibold text-content-secondary">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-600" />
                <span>Bahaya (RH &ge; 85%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-600" />
                <span>Waspada (80–84%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
                <span>Aman (&lt; 80%)</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-1 rounded-full bg-sky-600" />
                <span>Irigasi Batang Kuranji</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-red-700 text-white text-[9px] font-mono inline-flex items-center justify-center font-bold">
                  2
                </span>
                <span>Pin LAPOR Petani (0/1/2)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
