import type { DirectoryAmenityTag, DirectoryProduct } from "@/types/product-directory";
import type { DirectoryPriceTier, DirectoryTierLevel } from "@/components/products/productDirectoryDetailMeta";
import { getDirectoryProductRegistryCommission, isProgramBookable, programFilterId } from "./productDirectoryCommission";

export type DirectoryProductSortOption =
  | "name-asc"
  | "name-desc"
  | "commission-desc"
  | "highest-incentive"
  | "tier-desc"
  | "recently-added"
  | "enrichment-desc";

/** Default browse sort — name A→Z; commission toggle only tie-breaks, never overrides this. */
export const DEFAULT_DIRECTORY_PRODUCT_SORT: DirectoryProductSortOption = "name-asc";

export const DIRECTORY_PRODUCT_SORT_OPTIONS: { id: DirectoryProductSortOption; label: string }[] = [
  { id: "name-asc", label: "Name A → Z" },
  { id: "name-desc", label: "Name Z → A" },
  { id: "commission-desc", label: "Commission (high → low)" },
  { id: "highest-incentive", label: "Highest incentive" },
  { id: "tier-desc", label: "Tier (ultra-luxury first)" },
  { id: "recently-added", label: "Recently added" },
  { id: "enrichment-desc", label: "Enrichment score" },
];

export const AGENCY_PROGRAM_OPTIONS: { id: string; name: string }[] = [
  { id: "prog-virtuoso", name: "Virtuoso" },
  { id: "prog-fhr", name: "Amex FHR" },
  { id: "prog-preferred", name: "Preferred Partner" },
  { id: "prog-direct", name: "Direct" },
  { id: "prog-consortium", name: "Consortium" },
];

export const AMENITY_GROUPS: { label: string; tags: { id: DirectoryAmenityTag; label: string }[] }[] = [
  {
    label: "Room",
    tags: [
      { id: "room-upgrade", label: "Room Upgrade" },
      { id: "early-checkin", label: "Early Check-in" },
      { id: "late-checkout", label: "Late Checkout" },
      { id: "club-lounge", label: "Club Lounge Access" },
    ],
  },
  {
    label: "Dining & Wellness",
    tags: [
      { id: "breakfast", label: "Complimentary Breakfast" },
      { id: "dining-credit", label: "Dining Credit" },
      { id: "spa-credit", label: "Spa Credit" },
      { id: "welcome-amenity", label: "Welcome Amenity" },
    ],
  },
  {
    label: "Value",
    tags: [
      { id: "hotel-credit", label: "Hotel Credit" },
      { id: "complimentary-night", label: "Complimentary Night" },
      { id: "airport-transfer", label: "Airport Transfer" },
      { id: "house-car", label: "House car / transfer" },
      { id: "dedicated-host", label: "Dedicated host / butler" },
    ],
  },
];

/** Tier rows for filter dropdown (star color). */
export const DIRECTORY_TIER_FILTER_UI: { id: DirectoryTierLevel; label: string; stars: number; color: string }[] = [
  { id: "ultra-luxury", label: "Ultra-Luxury", stars: 5, color: "#C9A96E" },
  { id: "luxury", label: "Luxury", stars: 4, color: "#B8976E" },
  { id: "premium", label: "Premium", stars: 3, color: "#9B9590" },
  { id: "select", label: "Select", stars: 2, color: "#6B6560" },
  { id: "unrated", label: "Unrated", stars: 0, color: "#4A4540" },
];

/** Subset of price symbols used in directory filters (luxury positioning). */
export const DIRECTORY_PRICE_FILTER_OPTIONS: { id: DirectoryPriceTier; label: string; description: string }[] = [
  { id: "$$$$$", label: "$$$$$", description: "Ultra — $1,500+/night" },
  { id: "$$$$", label: "$$$$", description: "High — $600–1,500/night" },
  { id: "$$$", label: "$$$", description: "Premium — $250–600/night" },
];

export const AMENITY_LABELS: Record<DirectoryAmenityTag, string> = {
  breakfast: "Breakfast",
  "spa-credit": "Spa Credit",
  "room-upgrade": "Upgrade",
  "late-checkout": "Late C/O",
  "early-checkin": "Early C/I",
  "hotel-credit": "Hotel Credit",
  "airport-transfer": "Transfer",
  "welcome-amenity": "Welcome",
  "club-lounge": "Club Lounge",
  "complimentary-night": "Free Night",
  "dining-credit": "Dining",
  "house-car": "House car",
  "dedicated-host": "Dedicated host",
};

export type CommissionBracketId = "any" | "5-10" | "10-15" | "15+";

export const COMMISSION_BRACKETS: { id: CommissionBracketId; label: string; min: number; max: number }[] = [
  { id: "any", label: "Any Commission", min: 0, max: 100 },
  { id: "5-10", label: "5–10%", min: 5, max: 10 },
  { id: "10-15", label: "10–15%", min: 10, max: 15 },
  { id: "15+", label: "15%+", min: 15, max: 100 },
];

export function productMatchesProgramFilter(product: DirectoryProduct, selectedProgramIds: string[]): boolean {
  if (selectedProgramIds.length === 0) return true;
  return product.partnerPrograms.some((pp) => isProgramBookable(pp) && selectedProgramIds.includes(programFilterId(pp)));
}

/** Product is linked to at least one of the selected rep firm registry ids. */
export function productMatchesRepFirmFilter(product: DirectoryProduct, selectedRepFirmIds: string[]): boolean {
  if (selectedRepFirmIds.length === 0) return true;
  return product.repFirmLinks.some((l) => selectedRepFirmIds.includes(l.repFirmId));
}

/** Amenities filter — product must have ONE active program with ALL selected amenities (tags). */
export function productMatchesAmenityFilter(product: DirectoryProduct, selectedTags: DirectoryAmenityTag[]): boolean {
  if (selectedTags.length === 0) return true;
  return product.partnerPrograms.some(
    (pp) =>
      isProgramBookable(pp) &&
      selectedTags.every((tag) => (pp.amenityTags ?? []).includes(tag))
  );
}

export function productMatchesCommissionBracket(
  product: DirectoryProduct,
  bracketId: CommissionBracketId | null
): boolean {
  if (bracketId == null || bracketId === "any") return true;
  const bracket = COMMISSION_BRACKETS.find((b) => b.id === bracketId);
  if (!bracket) return true;
  const rate = getDirectoryProductRegistryCommission(product);
  if (rate == null) return false;
  return rate >= bracket.min && rate <= bracket.max;
}

export function compareProductsByRegistryCommission(a: DirectoryProduct, b: DirectoryProduct): number {
  const ra = getDirectoryProductRegistryCommission(a);
  const rb = getDirectoryProductRegistryCommission(b);
  const na = ra ?? -1;
  const nb = rb ?? -1;
  return nb - na;
}
