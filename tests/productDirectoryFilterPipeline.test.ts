import test from "node:test";
import assert from "node:assert/strict";
import type { DirectoryProduct } from "../src/types/product-directory";
import {
  applyDirectoryProductFilters,
  type DirectoryPageFilterInput,
} from "../src/components/products/productDirectoryFilterPipeline";

function minimal(overrides: Partial<DirectoryProduct> = {}): DirectoryProduct {
  return {
    id: "p1",
    name: "Alpha Resort",
    imageUrl: "",
    location: "Greece",
    types: ["hotel"],
    region: "Europe",
    description: "",
    scope: "agency",
    baseCommissionRate: null,
    effectiveCommissionRate: null,
    activePromotion: null,
    commissionRate: null,
    partnerProgramCount: 0,
    repFirmLinks: [],
    repFirmCount: 0,
    collectionCount: 0,
    collectionIds: [],
    partnerPrograms: [],
    agencyContacts: [],
    collections: [],
    ...overrides,
  };
}

const emptyFilters = (): DirectoryPageFilterInput => ({
  q: "",
  activeTypeFilters: [],
  locationCountries: [],
  collectionFilter: [],
  selectedProgramIds: [],
  selectedAmenities: [],
  commissionFilterActive: false,
  commissionRange: [0, 25],
  selectedRepFirmIds: [],
  hasActiveIncentive: false,
  hasPlannedOpening: false,
  selectedTiers: [],
  selectedPriceTiers: [],
});

test("applyDirectoryProductFilters matches opening text in search", () => {
  const products = [
    minimal({ id: "a", name: "No opening" }),
    minimal({ id: "b", name: "Beta", openingLabel: "Grand opening Spring 2026" }),
  ];
  const f = emptyFilters();
  f.q = "spring";
  const out = applyDirectoryProductFilters(products, f, false);
  assert.equal(out.length, 1);
  assert.equal(out[0]!.id, "b");
});

test("applyDirectoryProductFilters hasPlannedOpening narrows to labeled or dated products", () => {
  const products = [
    minimal({ id: "a", name: "A" }),
    minimal({ id: "b", name: "B", openingDate: "2027-01-01" }),
  ];
  const f = emptyFilters();
  f.hasPlannedOpening = true;
  const out = applyDirectoryProductFilters(products, f, false);
  assert.equal(out.length, 1);
  assert.equal(out[0]!.id, "b");
});
