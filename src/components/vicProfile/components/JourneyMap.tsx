"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Trip } from "@/types/vic-profile";
import { formatShortDate } from "@/lib/vic-profile-helpers";

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 4, { animate: false });
      return;
    }
    const b = L.latLngBounds(points);
    map.fitBounds(b, { padding: [40, 40], maxZoom: 8, animate: false });
  }, [map, points]);
  return null;
}

export function JourneyMap({ trips }: { trips: Trip[] }) {
  const pins = useMemo(() => {
    const byKey = new Map<
      string,
      { lat: number; lng: number; city: string; country: string; count: number; trips: Trip[] }
    >();
    for (const trip of trips) {
      for (const d of trip.destinations) {
        const lat = d.coordinates?.lat;
        const lng = d.coordinates?.lng;
        if (lat == null || lng == null) continue;
        const key = `${d.city}|${d.country}`;
        const prev = byKey.get(key);
        if (prev) {
          prev.count += 1;
          if (!prev.trips.some((t) => t.id === trip.id)) prev.trips.push(trip);
        } else {
          byKey.set(key, { lat, lng, city: d.city, country: d.country, count: 1, trips: [trip] });
        }
      }
    }
    return [...byKey.values()];
  }, [trips]);

  const pts = useMemo(() => pins.map((p) => [p.lat, p.lng] as [number, number]), [pins]);

  if (pins.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground">
        No destinations with coordinates in trip history.
      </p>
    );
  }

  return (
    <div className="h-[320px] overflow-hidden rounded-xl border border-border">
      <MapContainer center={[20, 0]} zoom={2} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={pts} />
        {pins.map((p) => (
          <CircleMarker
            key={`${p.city}-${p.country}`}
            center={[p.lat, p.lng]}
            radius={Math.min(28, 8 + p.count * 3)}
            pathOptions={{ color: "#38bdf8", fillColor: "#0ea5e9", fillOpacity: 0.35, weight: 2 }}
          >
            <Popup className="vic-journey-popup">
              <div className="max-w-[280px] text-background">
                <p className="text-sm font-semibold">
                  {p.city}, {p.country}
                </p>
                <p className="text-2xs text-neutral-600">{p.count} segment{p.count !== 1 ? "s" : ""}</p>
                <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-2xs">
                  {p.trips.map((t) => (
                    <li key={t.id} className="text-neutral-800">
                      <span className="font-medium">{t.name ?? t.id}</span>
                      <span className="text-neutral-600"> · {formatShortDate(t.startDate)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
