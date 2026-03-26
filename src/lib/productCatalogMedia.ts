/**
 * Shared gallery URLs keyed by product id (registry mock / Product Directory alignment).
 * Products without an entry use hero-only fallbacks in fakeData.
 */
export const REGISTRY_PRODUCT_GALLERIES: Record<string, string[]> = {
  "prod-enable-001": [
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop",
  ],
  "prod-dmc-001": [
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&h=500&fit=crop",
  ],
};
