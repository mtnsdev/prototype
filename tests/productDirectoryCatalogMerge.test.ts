import test from "node:test";
import assert from "node:assert/strict";
import type { DirectoryProduct } from "../src/types/product-directory";
import { mergeDirectoryProductPatchInCatalog } from "../src/lib/directoryProductMerge";

function minimalProduct(id: string, name: string): DirectoryProduct {
  return {
    id,
    name,
    imageUrl: "",
    location: "",
    types: ["hotel"],
    region: "",
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
  };
}

test("mergeDirectoryProductPatchInCatalog returns null when id missing", () => {
  const out = mergeDirectoryProductPatchInCatalog([minimalProduct("a", "A")], "x", { name: "Y" });
  assert.equal(out, null);
});

test("mergeDirectoryProductPatchInCatalog shallow-merges one row", () => {
  const a = minimalProduct("a", "A");
  const b = minimalProduct("b", "B");
  const next = mergeDirectoryProductPatchInCatalog([a, b], "b", { openingLabel: "Soon" });
  assert.ok(next);
  assert.equal(next![0].name, "A");
  assert.equal(next![1].name, "B");
  assert.equal(next![1].openingLabel, "Soon");
});
