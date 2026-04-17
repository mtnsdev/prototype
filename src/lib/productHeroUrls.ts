/**
 * Shared Unsplash hero URLs for registry Products (`FAKE_PRODUCTS`) and Product Directory rows.
 * Lives in `lib/` (no imports from `productDirectoryMock`) to avoid circular init with `fakeData.ts`
 * re-exports.
 */

/** Curated Unsplash hero images (w=600 h=400 fit=crop for registry / Products tab cards) */
export const IMG = {
  fourSeasons: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop",
  japanDmc: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=400&fit=crop",
  belmond: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=400&fit=crop",
  oneOnly: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&h=400&fit=crop",
  aKItaly: "https://images.unsplash.com/photo-1534445867742-43195f401b6c?w=600&h=400&fit=crop",
  ponant: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&h=400&fit=crop",
  scottDunn: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop",
  cappadocia: "https://images.unsplash.com/photo-1507041957456-9c397ce39c97?w=600&h=400&fit=crop",
  leCinq: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
  nobu: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop",
  helicopter: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=600&h=400&fit=crop",
  tuscany: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=600&h=400&fit=crop",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop",
};

/** Same Unsplash asset as a registry `hero_image_url`, sized for Product Directory cards / detail hero. */
export function registryHeroToDirectoryHero(registryHeroUrl: string): string {
  const base = registryHeroUrl.split("?")[0] ?? registryHeroUrl;
  return `${base}?w=400&h=240&fit=crop`;
}

/** Resize any Unsplash URL to explicit dimensions (drops prior query params). */
export function unsplashHeroSized(url: string, w: number, h: number): string {
  const base = url.split("?")[0] ?? url;
  return `${base}?w=${w}&h=${h}&fit=crop`;
}
