import type { Destination } from "@/data/destinations";

export type GeoCount = { total: number; withCoords: number };

export function countDestinationGeoItems(destination: Destination): GeoCount {
  let total = 0;
  let withCoords = 0;
  const bump = (lat?: number, lng?: number) => {
    total += 1;
    if (lat != null && lng != null) withCoords += 1;
  };

  for (const p of destination.dmcPartners) {
    bump(p.latitude, p.longitude);
  }
  for (const y of destination.yachtCompanies ?? []) {
    bump(y.latitude, y.longitude);
  }
  for (const list of Object.values(destination.restaurants)) {
    for (const r of list) {
      bump(r.latitude, r.longitude);
    }
  }
  for (const list of Object.values(destination.hotels)) {
    for (const h of list) {
      bump(h.latitude, h.longitude);
    }
  }

  return { total, withCoords };
}

/** Share of catalog-linked rows that include coordinates (v1 map gate — spec: ≥30%). */
export function destinationMapCoverageRatio(destination: Destination): number {
  const { total, withCoords } = countDestinationGeoItems(destination);
  if (total === 0) return 0;
  return withCoords / total;
}
