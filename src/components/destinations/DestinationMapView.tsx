"use client";

import { useEffect } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import type { DestinationMapPin } from "@/lib/destinationMapPins";

function FixResize() {
  const map = useMap();
  useEffect(() => {
    const id = requestAnimationFrame(() => map.invalidateSize({ animate: false }));
    return () => cancelAnimationFrame(id);
  }, [map]);
  return null;
}

function FitPins({ pins }: { pins: DestinationMapPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length === 0) return;
    const pts = pins.map((p) => [p.lat, p.lng] as L.LatLngTuple);
    if (pts.length === 1) {
      map.setView(pts[0]!, 11, { animate: false });
      return;
    }
    map.fitBounds(L.latLngBounds(pts), { padding: [28, 28], maxZoom: 12, animate: false });
  }, [pins, map]);
  return null;
}

const PIN: Record<DestinationMapPin["kind"], string> = {
  partner: "#c9a96e",
  yacht: "#c9a96e",
  restaurant: "#f87171",
  hotel: "#60a5fa",
};

type Props = {
  pins: DestinationMapPin[];
  destinationSlug: string;
  center: { lat: number; lng: number; zoom?: number };
};

export function DestinationMapView({ pins, destinationSlug, center }: Props) {
  const z = center.zoom ?? 6;
  return (
    <div className="h-[min(420px,55vh)] w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={z}
        className="size-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FixResize />
        <FitPins pins={pins} />
        {pins.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={9}
            pathOptions={{ color: PIN[p.kind], fillColor: PIN[p.kind], fillOpacity: 0.85 }}
          >
            <Popup>
              <div className="min-w-[160px] text-neutral-900">
                <p className="text-sm font-medium">{p.label}</p>
                <p className="mt-1 text-[10px] capitalize text-neutral-600">{p.kind}</p>
                <Link
                  href={`/dashboard/products/destinations/${destinationSlug}#item-${p.id}`}
                  className="mt-2 inline-block text-xs text-amber-900 underline"
                >
                  View on page
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
