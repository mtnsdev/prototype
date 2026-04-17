import { IMG, unsplashHeroSized } from "@/lib/productHeroUrls";

/**
 * Shared gallery URLs keyed by product id (registry mock / Product Directory alignment).
 * First image matches `hero_image_url` in `FAKE_PRODUCTS` (`IMG.*`); second is extra context.
 * Products without an entry use hero-only fallbacks in fakeData.
 */
export const REGISTRY_PRODUCT_GALLERIES: Record<string, string[]> = {
  "prod-enable-001": [
    unsplashHeroSized(IMG.fourSeasons, 800, 500),
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop",
  ],
  "prod-dmc-001": [
    unsplashHeroSized(IMG.bali, 800, 500),
    "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&h=500&fit=crop",
  ],
};
