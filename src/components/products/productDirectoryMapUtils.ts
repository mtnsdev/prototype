import type { DirectoryProduct } from "@/types/product-directory";

export function pinPosition(lat: number, lng: number): { left: string; top: string; x: number; y: number } {
  const x = Math.min(97, Math.max(3, ((lng + 180) / 360) * 100));
  const y = Math.min(94, Math.max(6, ((90 - lat) / 180) * 100));
  return { left: `${x}%`, top: `${y}%`, x, y };
}

export type MapPinItem =
  | { kind: "single"; product: DirectoryProduct; left: string; top: string }
  | { kind: "cluster"; products: DirectoryProduct[]; left: string; top: string };

export function clusterMapPins(products: DirectoryProduct[], clusterThreshold = 5): MapPinItem[] {
  const withCoords = products
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => {
      const pos = pinPosition(p.latitude!, p.longitude!);
      return { product: p, ...pos };
    });
  if (withCoords.length === 0) return [];

  const used = new Set<string>();
  const out: MapPinItem[] = [];

  for (const p of withCoords) {
    if (used.has(p.product.id)) continue;
    const neighbors = withCoords.filter(
      (q) => !used.has(q.product.id) && Math.hypot(q.x - p.x, q.y - p.y) < clusterThreshold
    );
    neighbors.forEach((n) => used.add(n.product.id));
    if (neighbors.length === 1) {
      out.push({ kind: "single", product: p.product, left: p.left, top: p.top });
    } else {
      const cx = neighbors.reduce((s, n) => s + n.x, 0) / neighbors.length;
      const cy = neighbors.reduce((s, n) => s + n.y, 0) / neighbors.length;
      out.push({
        kind: "cluster",
        products: neighbors.map((n) => n.product),
        left: `${cx}%`,
        top: `${cy}%`,
      });
    }
  }
  return out;
}
