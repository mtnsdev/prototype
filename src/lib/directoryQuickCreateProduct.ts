import type { DirectoryProduct, DirectoryProductCategory } from "@/types/product-directory";

export type DirectoryQuickCreateCategory =
  | "Hotel"
  | "DMC"
  | "Restaurant"
  | "Yacht Charter"
  | "Tour Operator"
  | "Villa"
  | "Other";

function categoryToTypes(c: DirectoryQuickCreateCategory): DirectoryProductCategory[] {
  switch (c) {
    case "Hotel":
      return ["hotel"];
    case "DMC":
      return ["dmc"];
    case "Restaurant":
      return ["restaurant"];
    case "Yacht Charter":
      return ["transport"];
    case "Tour Operator":
      return ["experience"];
    case "Villa":
      return ["villa"];
    case "Other":
    default:
      return ["experience"];
  }
}

export function newQuickCreateProductId(): string {
  return `cat-created-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Minimal directory row for “create from destination” prototype flow. */
export function buildDirectoryProductQuickCreate(
  name: string,
  category: DirectoryQuickCreateCategory,
  id: string,
): DirectoryProduct {
  const types = categoryToTypes(category);
  const now = new Date().toISOString();
  return {
    id,
    name: name.trim(),
    imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=240&fit=crop",
    location: "—",
    region: "—",
    description: "Created from destination guide (prototype).",
    types,
    scope: "agency",
    baseCommissionRate: null,
    effectiveCommissionRate: null,
    activeIncentive: null,
    commissionRate: null,
    partnerProgramCount: 0,
    collectionCount: 0,
    collectionIds: [],
    partnerPrograms: [],
    repFirmLinks: [],
    repFirmCount: 0,
    agencyContacts: [],
    collections: [],
    addedAt: now,
    updatedAt: now,
  };
}
