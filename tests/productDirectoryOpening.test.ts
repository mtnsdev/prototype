import test from "node:test";
import assert from "node:assert/strict";
import type { DirectoryProduct } from "../src/types/product-directory";
import {
  directoryProductOpeningSearchText,
  formatProductOpeningLine,
  productHasPlannedOpening,
} from "../src/lib/productDirectoryOpening";

function baseProduct(overrides: Partial<DirectoryProduct> = {}): DirectoryProduct {
  return {
    id: "p1",
    name: "Test",
    imageUrl: "",
    location: "",
    types: ["hotel"],
    region: "",
    description: "",
    scope: "agency",
    baseCommissionRate: null,
    effectiveCommissionRate: null,
    activeIncentive: null,
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

test("formatProductOpeningLine uses label when set", () => {
  const line = formatProductOpeningLine(
    baseProduct({ openingLabel: "  Maiden voyage Dec 2026  ", openingDate: "2026-12-01" })
  );
  assert.equal(line, "Maiden voyage Dec 2026");
});

test("formatProductOpeningLine formats valid ISO date", () => {
  const line = formatProductOpeningLine(baseProduct({ openingDate: "2026-06-15" }));
  assert.ok(line != null);
  assert.ok(line!.startsWith("Opens "));
  assert.ok(line!.includes("2026"));
});

test("formatProductOpeningLine returns null without date or label", () => {
  assert.equal(formatProductOpeningLine(baseProduct()), null);
});

test("productHasPlannedOpening matches display rules", () => {
  assert.equal(productHasPlannedOpening(baseProduct()), false);
  assert.equal(productHasPlannedOpening(baseProduct({ openingLabel: "Soon" })), true);
  assert.equal(productHasPlannedOpening(baseProduct({ openingDate: "2026-01-01" })), true);
});

test("directoryProductOpeningSearchText aggregates searchable fragments", () => {
  const t = directoryProductOpeningSearchText(
    baseProduct({ openingLabel: "Q2 2026", openingDate: "2026-04-01" })
  );
  assert.ok(t.includes("q2"));
  assert.ok(t.includes("2026"));
});
