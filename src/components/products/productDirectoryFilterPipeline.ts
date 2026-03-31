import type {
  DirectoryAmenityTag,
  DirectoryProduct,
  DirectoryProductCategory,
} from "@/types/product-directory";
import type { DirectoryPriceTier, DirectoryTierLevel } from "@/components/products/productDirectoryDetailMeta";
import { getDirectoryProductRegistryCommission } from "@/components/products/productDirectoryCommission";
import {
  productMatchesAmenityFilter,
  productMatchesProgramFilter,
  productMatchesRepFirmFilter,
} from "@/components/products/productDirectoryFilterConfig";
import { productMatchesLocationCountries } from "@/components/products/locationGroups";

export type DirectoryFilterSkip =
  | "search"
  | "type"
  | "location"
  | "collection"
  | "program"
  | "amenities"
  | "commissionRange"
  | "repFirm"
  | "activeIncentive"
  | "tier"
  | "price";

export type DirectoryPageFilterInput = {
  q: string;
  activeTypeFilters: DirectoryProductCategory[];
  locationCountries: string[];
  collectionFilter: string[];
  selectedProgramIds: string[];
  selectedAmenities: DirectoryAmenityTag[];
  commissionFilterActive: boolean;
  commissionRange: [number, number];
  /** Registry rep firm ids — product must have a repFirmLink to one of these. */
  selectedRepFirmIds: string[];
  hasActiveIncentive?: boolean;
  selectedTiers: DirectoryTierLevel[];
  selectedPriceTiers: DirectoryPriceTier[];
};

export function applyDirectoryProductFilters(
  products: DirectoryProduct[],
  f: DirectoryPageFilterInput,
  canViewCommissions: boolean,
  skip?: DirectoryFilterSkip
): DirectoryProduct[] {
  let result = products;
  const q = f.q.trim().toLowerCase();

  if (skip !== "search" && q) {
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        p.partnerPrograms.some(
          (pp) =>
            pp.name.toLowerCase().includes(q) ||
            (pp.programName ?? "").toLowerCase().includes(q)
        )
    );
  }

  if (skip !== "type" && f.activeTypeFilters.length > 0) {
    result = result.filter((p) => f.activeTypeFilters.includes(p.type));
  }

  if (skip !== "location" && f.locationCountries.length > 0) {
    result = result.filter((p) => productMatchesLocationCountries(p, f.locationCountries));
  }

  if (skip !== "collection" && f.collectionFilter.length > 0) {
    result = result.filter((p) => p.collectionIds.some((id) => f.collectionFilter.includes(id)));
  }

  if (skip !== "program" && f.selectedProgramIds.length > 0) {
    result = result.filter((p) => productMatchesProgramFilter(p, f.selectedProgramIds));
  }

  if (skip !== "amenities" && f.selectedAmenities.length > 0) {
    result = result.filter((p) => productMatchesAmenityFilter(p, f.selectedAmenities));
  }

  if (canViewCommissions && skip !== "commissionRange" && f.commissionFilterActive) {
    const [lo, hi] = f.commissionRange;
    result = result.filter((p) => {
      const rate = getDirectoryProductRegistryCommission(p);
      return rate != null && rate >= lo && rate <= hi;
    });
  }

  if (skip !== "repFirm") {
    if (f.selectedRepFirmIds.length > 0) {
      result = result.filter((p) => productMatchesRepFirmFilter(p, f.selectedRepFirmIds));
    }
  }

  if (skip !== "activeIncentive" && f.hasActiveIncentive) {
    result = result.filter((p) => (p.activeAdvisoryCount ?? 0) > 0);
  }

  if (skip !== "tier" && f.selectedTiers.length > 0) {
    result = result.filter((p) => f.selectedTiers.includes(p.tier ?? "unrated"));
  }

  if (skip !== "price" && f.selectedPriceTiers.length > 0) {
    result = result.filter((p) => p.priceTier != null && f.selectedPriceTiers.includes(p.priceTier));
  }

  return result;
}
