/**
 * components/map/FarmMap.tsx
 *
 * Interactive OpenStreetMap powered by Leaflet + react-leaflet.
 *
 * Handles:
 * - Farm location marker (green pin)
 * - Field markers (numbered, color-coded)
 * - Field polygons (when boundary data exists)
 * - Field selection highlighting
 * - Location picking (for fields or farm center)
 * - Farm-centered view — never shows the whole world
 * - Responsive + mobile-friendly
 * - Proper Next.js client-side rendering (no SSR issues)
 */

"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { Field } from "@/types/field";

// Fix Leaflet default marker icon issue in bundled environments.
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const farmIcon = L.divIcon({
  className: "gf-farm-center-icon",
  html: `<div style="
    width: 36px;
    height: 36px;
    border-radius: 50% 50% 50% 0;
    background: #2D6A4F;
    border: 3px solid white;
    box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <svg style="transform: rotate(45deg);" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

L.Marker.prototype.options.icon = defaultIcon;

// Field colors for visual distinction.
const FIELD_COLORS = [
  "#2D6A4F",
  "#40916C",
  "#52B788",
  "#059669",
  "#1B4332",
  "#D97706",
  "#0284C7",
  "#7C3AED",
];

function getFieldColor(index: number): string {
  return FIELD_COLORS[index % FIELD_COLORS.length];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Listens for click events on the map for location picking. */
function MapClickHandler({
  onLocationPick,
}: {
  onLocationPick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationPick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Recenter the map when the target changes. */
function MapRecenter({
  lat,
  lng,
  zoom,
}: {
  lat: number;
  lng: number;
  zoom: number;
}) {
  const map = useMap();
  const prevRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (
      prevRef.current?.lat !== lat ||
      prevRef.current?.lng !== lng
    ) {
      map.flyTo([lat, lng], zoom, { duration: 0.8 });
      prevRef.current = { lat, lng };
    }
  }, [lat, lng, zoom, map]);

  return null;
}

// ---------------------------------------------------------------------------
// Main FarmMap component
// ---------------------------------------------------------------------------

interface FarmMapProps {
  /** Farm center coordinates. */
  farmLat?: number | null;
  farmLng?: number | null;
  /** Farm name for the popup. */
  farmName?: string | null;
  /** Fields to display as markers/polygons. */
  fields?: Field[];
  /** Currently selected field ID. */
  selectedFieldId?: string | null;
  /** Called when a field marker is clicked. */
  onFieldSelect?: (field: Field) => void;
  /** Called when the user clicks on the map to pick a field location. */
  onLocationPick?: (lat: number, lng: number) => void;
  /** Called when the user clicks on the map to set the farm location. */
  onFarmLocationPick?: (lat: number, lng: number) => void;
  /** Whether to show the field location picker mode. */
  pickMode?: boolean;
  /** Whether to show the farm location picker mode. */
  farmPickMode?: boolean;
  /** Custom height for the map container. */
  height?: string;
  /** Zoom level (default 15). */
  zoom?: number;
  /** Whether the map is read-only (no click handlers). */
  readOnly?: boolean;
}

export default function FarmMap({
  farmLat,
  farmLng,
  farmName,
  fields = [],
  selectedFieldId,
  onFieldSelect,
  onLocationPick,
  onFarmLocationPick,
  pickMode = false,
  farmPickMode = false,
  height = "400px",
  zoom = 15,
  readOnly = false,
}: FarmMapProps) {
  const hasCenter = farmLat != null && farmLng != null;

  // Default center: Punjab, Pakistan (only used if no farm location).
  const centerLat = farmLat ?? 31.418;
  const centerLng = farmLng ?? 73.08;

  // Track whether Leaflet CSS has been injected.
  const [cssLoaded, setCssLoaded] = useState(false);

  useEffect(() => {
    if (!cssLoaded) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
      setCssLoaded(true);
    }
  }, [cssLoaded]);

  const fieldsWithCoords = fields.filter(
    (f) => f.latitude != null && f.longitude != null
  );

  // Determine the click handler based on mode.
  const clickHandler = farmPickMode
    ? onFarmLocationPick
    : pickMode
      ? onLocationPick
      : undefined;

  const isPickMode = pickMode || farmPickMode;

  return (
    <div
      className={`relative overflow-hidden rounded-card border border-neutral-200 shadow-card ${
        isPickMode ? "cursor-crosshair ring-2 ring-primary-500 ring-offset-2" : ""
      }`}
      style={{ height }}
    >
      {/* Pick mode instruction banner */}
      {farmPickMode && (
        <div className="absolute top-3 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-primary-700/90 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm shadow-lg">
          Tap on the map to set your farm location
        </div>
      )}
      {pickMode && !farmPickMode && (
        <div className="absolute top-3 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-primary-700/90 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm shadow-lg">
          Tap on the map to place this field
        </div>
      )}

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        style={{ borderRadius: "inherit" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Click handler — only active in pick mode */}
        {isPickMode && clickHandler && (
          <MapClickHandler onLocationPick={clickHandler} />
        )}

        {/* Recenter when farm coordinates change */}
        {hasCenter && <MapRecenter lat={centerLat} lng={centerLng} zoom={zoom} />}

        {/* Farm center marker — only when location is set */}
        {hasCenter && (
          <Marker position={[farmLat!, farmLng!]} icon={farmIcon}>
            <Popup>
              <div className="text-center">
                <strong className="text-sm">{farmName ?? "My Farm"}</strong>
                <br />
                <span className="text-xs text-neutral-500">Farm center</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Field markers */}
        {fieldsWithCoords.map((field, idx) => {
          const isSelected = field.id === selectedFieldId;
          const color = getFieldColor(idx);

          return (
            <Marker
              key={field.id}
              position={[field.latitude!, field.longitude!]}
              icon={L.divIcon({
                className: "gf-field-marker",
                html: `<div style="
                  background: ${isSelected ? "#1B4332" : color};
                  width: ${isSelected ? "30px" : "24px"};
                  height: ${isSelected ? "30px" : "24px"};
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transition: all 0.2s;
                ">
                  <span style="color:white;font-size:11px;font-weight:bold;">
                    ${(idx + 1).toString()}
                  </span>
                </div>`,
                iconSize: [isSelected ? 30 : 24, isSelected ? 30 : 24],
                iconAnchor: [isSelected ? 15 : 12, isSelected ? 15 : 12],
              })}
              eventHandlers={{
                click: () => onFieldSelect?.(field),
              }}
            >
              <Popup>
                <div className="min-w-[120px]">
                  <strong className="text-sm">{field.name}</strong>
                  <br />
                  {field.area_acres && (
                    <span className="text-xs text-neutral-600">
                      {field.area_acres} acres
                    </span>
                  )}
                  {field.active_crop_cycle && (
                    <>
                      <br />
                      <span className="text-xs text-primary-700">
                        {field.active_crop_cycle.crop_name}
                        {field.active_crop_cycle.crop_stage &&
                          ` — ${field.active_crop_cycle.crop_stage}`}
                      </span>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Field polygons (when boundary data exists) */}
        {fieldsWithCoords.map((field, idx) => {
          if (!field.boundary_geojson) return null;
          try {
            const geojson = JSON.parse(field.boundary_geojson);
            const positions = geojson.coordinates?.[0]?.map(
              (c: [number, number]) => [c[1], c[0]] as [number, number]
            );
            if (!positions?.length) return null;
            const color = getFieldColor(idx);
            return (
              <Polygon
                key={`poly-${field.id}`}
                positions={positions}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: field.id === selectedFieldId ? 0.35 : 0.2,
                  weight: field.id === selectedFieldId ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => onFieldSelect?.(field),
                }}
              />
            );
          } catch {
            return null;
          }
        })}
      </MapContainer>
    </div>
  );
}
