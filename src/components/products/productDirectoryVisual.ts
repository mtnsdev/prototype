import type { DirectoryProduct, DirectoryProductCategory } from "@/types/product-directory";
import {
  directoryCategoryColors,
  directoryCategoryLabel,
  directoryCategoryMarkerColor,
} from "./productDirectoryProductTypes";

export { directoryCategoryColors, directoryCategoryLabel, directoryCategoryMarkerColor };

export function directoryProductPlaceLabel(p: DirectoryProduct): string {
  if (p.city && p.country) return `${p.city}, ${p.country}`;
  return p.location;
}

/** @deprecated Prefer `directoryCategoryLabel` / `directoryCategoryColors`. */
export const DIRECTORY_CATEGORY_LABELS: Record<DirectoryProductCategory, string> = {
  hotel: "Hotel / Resort",
  villa: "Villa / Residence",
  restaurant: "Restaurant",
  dmc: "DMC",
  experience: "Experience / Tour",
  cruise: "Cruise",
  wellness: "Wellness / Spa",
  transport: "Transport",
  rep_firm: "Rep Firm",
};

/** Pin / map dot color (hex). */
export function getDirectoryCategoryPinColor(type: DirectoryProductCategory | string): string {
  return directoryCategoryMarkerColor(type);
}

/** Extra listing photos for detail gallery when `imageGalleryUrls` is not set (no overlap with common mock heroes). */
const DIRECTORY_GALLERY_FALLBACK_POOL: readonly string[] = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=240&fit=crop",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=240&fit=crop",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=240&fit=crop",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=240&fit=crop",
  "https://images.unsplash.com/photo-1445015751107-5b2a734980ff?w=400&h=240&fit=crop",
  "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=240&fit=crop",
  "https://images.unsplash.com/photo-1571001600894-dfc7432946c5?w=400&h=240&fit=crop",
  "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400&h=240&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=240&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=240&fit=crop",
];

function gallerySeedOffset(id: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % modulo;
}

/** Gallery thumbnails for detail (excludes hero); uses `imageGalleryUrls` when provided. */
export function directoryProductGalleryImages(product: DirectoryProduct): string[] {
  const hero = (product.imageUrl ?? "").trim();
  const fromProduct = (product.imageGalleryUrls ?? []).map((u) => u.trim()).filter(Boolean);
  const custom = fromProduct.filter((u) => u !== hero);
  if (custom.length > 0) return custom;

  const pool = DIRECTORY_GALLERY_FALLBACK_POOL.filter((u) => u !== hero);
  if (pool.length === 0) return [];

  const start = gallerySeedOffset(product.id, pool.length);
  const count = Math.min(5, pool.length);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(pool[(start + i) % pool.length]);
  return out;
}
