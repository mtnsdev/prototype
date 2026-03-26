"use client";

import { useEffect } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Search } from "lucide-react";
import type { DirectoryProduct } from "@/types/product-directory";
import type { GeoPinItem } from "./productDirectoryMapUtils";
import {
  directoryCategoryLabel,
  directoryProductPlaceLabel,
  getDirectoryCategoryPinColor,
} from "./productDirectoryVisual";
import {
  getTopBookableProgramByCommission,
  programDisplayCommissionRate,
  programDisplayName,
} from "./productDirectoryCommission";

function MapResize({ listFrac }: { listFrac: number }) {
  const map = useMap();
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      map.invalidateSize({ animate: false });
    });
    return () => cancelAnimationFrame(id);
  }, [listFrac, map]);
  return null;
}

function FitBounds({ geoPins }: { geoPins: GeoPinItem[] }) {
  const map = useMap();
  useEffect(() => {
    const pts: L.LatLngExpression[] = [];
    for (const pin of geoPins) {
      if (pin.kind === "single") {
        const p = pin.product;
        if (p.latitude != null && p.longitude != null) pts.push([p.latitude, p.longitude]);
      } else {
        pts.push([pin.lat, pin.lng]);
      }
    }
    if (pts.length === 0) return;
    if (pts.length === 1) {
      const ll = pts[0] as L.LatLngTuple;
      map.setView(ll, 10, { animate: false });
      return;
    }
    const b = L.latLngBounds(pts);
    map.fitBounds(b, { padding: [32, 32], maxZoom: 12, animate: false });
  }, [geoPins, map]);
  return null;
}

function PopupBody({
  product,
  canViewCommissions,
  externalSearchCollectionId,
  externalSearchTooltip,
}: {
  product: DirectoryProduct;
  canViewCommissions: boolean;
  externalSearchCollectionId?: string;
  externalSearchTooltip?: (productId: string) => string | undefined;
}) {
  const best = getTopBookableProgramByCommission(product);
  const bestRate = best != null ? programDisplayCommissionRate(best) : null;
  const place =
    product.city && product.country ? `${product.city}, ${product.country}` : directoryProductPlaceLabel(product);
  return (
    <div className="min-w-[200px] text-[#08080c]">
      <p className="truncate text-[12px] font-medium">{product.name}</p>
      <p className="text-[10px] text-neutral-600">{place}</p>
      <p className="mt-1 text-[9px] text-neutral-500">{directoryCategoryLabel(product.type)}</p>
      {canViewCommissions && best != null && bestRate != null && (
        <p className="mt-0.5 text-[10px] text-amber-900/90">
          {bestRate}% · {programDisplayName(best)}
        </p>
      )}
      {externalSearchCollectionId && product.collectionIds.includes(externalSearchCollectionId) ? (
        <p
          className="mt-1 flex items-center gap-1 text-[9px] text-neutral-500"
          title={
            externalSearchTooltip?.(product.id) ??
            "Saved from chat or external search to your External Search collection."
          }
        >
          <Search className="h-2.5 w-2.5 shrink-0" aria-hidden />
          Saved from search
        </p>
      ) : null}
    </div>
  );
}

type Props = {
  geoPins: GeoPinItem[];
  selectedId: string | null;
  listFrac: number;
  canViewCommissions: boolean;
  onSelectProduct: (id: string) => void;
  onClusterOpen: (products: DirectoryProduct[]) => void;
  externalSearchCollectionId?: string;
  externalSearchTooltip?: (productId: string) => string | undefined;
};

export default function ProductDirectoryMapLeaflet({
  geoPins,
  selectedId,
  listFrac,
  canViewCommissions,
  onSelectProduct,
  onClusterOpen,
  externalSearchCollectionId,
  externalSearchTooltip,
}: Props) {
  return (
    <MapContainer
      center={[24, 10]}
      zoom={2}
      className="z-0 h-full w-full min-h-[320px] rounded-r-xl"
      scrollWheelZoom
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />
      <MapResize listFrac={listFrac} />
      {geoPins.length > 0 ? <FitBounds geoPins={geoPins} /> : null}
      {geoPins.map((pin, i) => {
        if (pin.kind === "single") {
          const p = pin.product;
          if (p.latitude == null || p.longitude == null) return null;
          const selected = selectedId === p.id;
          const fill = getDirectoryCategoryPinColor(p.type);
          return (
            <CircleMarker
              key={p.id}
              center={[p.latitude, p.longitude]}
              radius={selected ? 11 : 8}
              pathOptions={{
                color: selected ? "#C9A96E" : "#ffffff",
                weight: selected ? 2 : 1,
                fillColor: fill,
                fillOpacity: 0.92,
              }}
              eventHandlers={{
                click: () => onSelectProduct(p.id),
              }}
            >
              <Popup>
                <PopupBody
                  product={p}
                  canViewCommissions={canViewCommissions}
                  externalSearchCollectionId={externalSearchCollectionId}
                  externalSearchTooltip={externalSearchTooltip}
                />
              </Popup>
            </CircleMarker>
          );
        }
        return (
          <CircleMarker
            key={`cluster-${i}-${pin.lat}-${pin.lng}`}
            center={[pin.lat, pin.lng]}
            radius={14}
            pathOptions={{
              color: "#C9A96E",
              weight: 2,
              fillColor: "rgba(201,169,110,0.45)",
              fillOpacity: 0.95,
            }}
            eventHandlers={{
              click: () => onClusterOpen(pin.products),
            }}
          >
            <Popup>
              <div className="text-[#08080c]">
                <p className="text-[11px] font-medium">{pin.products.length} products in this area</p>
                <p className="text-[10px] text-neutral-600">Use the panel below to pick one, or click again.</p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
