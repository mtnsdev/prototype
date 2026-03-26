import type {
  DirectoryAmenityTag,
  DirectoryProduct,
  DirectoryProductCategory,
} from "@/types/product-directory";
import type { DirectoryPriceTier, DirectoryTierLevel } from "@/components/products/productDirectoryDetailMeta";
import {
  getDirectoryProductRegistryCommission,
  daysUntilExpiry,
  isProgramBookable,
} from "@/components/products/productDirectoryCommission";
import { productMatchesAmenityFilter, productMatchesProgramFilter } from "@/components/products/productDirectoryFilterConfig";
import { productMatchesLocationCountries } from "@/components/products/locationGroups";

export type DirectoryFilterSkip =
  | "search"
  | "type"
  | "location"
  | "collection"
  | "program"
  | "amenities"
  | "commissionRange"
  | "tier"
  | "price"
  | "expiring"
  | "enriched";

export type DirectoryPageFilterInput = {
  q: string;
  activeTypeFilters: DirectoryProductCategory[];
  locationCountries: string[];
  collectionFilter: string[];
  selectedProgramIds: string[];
  selectedAmenities: DirectoryAmenityTag[];
  commissionFilterActive: boolean;
  commissionRange: [number, number];
  selectedTiers: DirectoryTierLevel[];
  selectedPriceTiers: DirectoryPriceTier[];
  showExpiringOnly: boolean;
  showMyEnrichedOnly: boolean;
  enrichFilterTeam: boolean;
  enrichFilterPersonal: boolean;
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

  if (skip !== "tier" && f.selectedTiers.length > 0) {
    result = result.filter((p) => f.selectedTiers.includes(p.tier ?? "unrated"));
  }

  if (skip !== "price" && f.selectedPriceTiers.length > 0) {
    result = result.filter((p) => p.priceTier != null && f.selectedPriceTiers.includes(p.priceTier));
  }

  if (skip !== "expiring" && f.showExpiringOnly) {
    result = result.filter((p) =>
      p.partnerPrograms.some((pp) => {
        if (!isProgramBookable(pp) || !pp.expiryDate) return false;
        const d = daysUntilExpiry(pp.expiryDate);
        return d != null && d >= 0 && d <= 30;
      })
    );
  }

  if (skip !== "enriched" && f.showMyEnrichedOnly) {
    result = result.filter((p) => {
      if (f.enrichFilterTeam && f.enrichFilterPersonal) {
        return !!p.hasTeamData || !!p.hasAdvisorNotes;
      }
      if (f.enrichFilterTeam) return !!p.hasTeamData;
      if (f.enrichFilterPersonal) return !!p.hasAdvisorNotes;
      return true;
    });
  }

  return result;
}
