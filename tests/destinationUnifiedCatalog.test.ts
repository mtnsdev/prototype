import test from "node:test";
import assert from "node:assert/strict";
import type { Destination } from "../src/data/destinations";
import {
  flattenDestinationCatalogProducts,
  regroupDestinationCatalogFromFlat,
  getDestinationCatalogBundles,
  countDestinationCatalogProductRows,
} from "../src/lib/destinationUnifiedCatalog";

const minimalDestination = (): Destination => ({
  slug: "test-dest",
  name: "Test",
  tagline: "",
  heroImage: "",
  description: "",
  subRegions: [],
  dmcPartners: [
    {
      name: "DMC One",
      preferred: true,
    },
  ],
  yachtCompanies: [
    {
      name: "Yacht Co",
      contact: "c",
      url: "https://example.com",
      destinations: "Med",
    },
  ],
  restaurants: {
    Athens: [{ name: "Taverna" }],
    Crete: [{ name: "Taverna B" }],
  },
  hotels: {
    Athens: [{ name: "Hotel A" }],
  },
  tourismRegions: [],
  documents: [],
});

test("flatten then regroup round-trips catalog bundles", () => {
  const d = minimalDestination();
  const flat = flattenDestinationCatalogProducts(d);
  assert.equal(flat.length, countDestinationCatalogProductRows(d));
  const back = regroupDestinationCatalogFromFlat(flat);
  assert.deepEqual(back.dmcPartners, d.dmcPartners);
  assert.deepEqual(back.yachtCompanies, d.yachtCompanies);
  assert.deepEqual(back.restaurants, d.restaurants);
  assert.deepEqual(back.hotels, d.hotels);
});

test("getDestinationCatalogBundles matches destination fields", () => {
  const d = minimalDestination();
  const b = getDestinationCatalogBundles(d);
  assert.deepEqual(b.dmcPartners, d.dmcPartners);
  assert.deepEqual(b.yachtCompanies, d.yachtCompanies ?? []);
  assert.deepEqual(b.restaurants, d.restaurants);
  assert.deepEqual(b.hotels, d.hotels);
});

test("flatten order is dmc, yacht, restaurants, hotels", () => {
  const d = minimalDestination();
  const flat = flattenDestinationCatalogProducts(d);
  assert.equal(flat[0]?.kind, "dmc");
  assert.equal(flat[1]?.kind, "yacht");
  assert.ok(flat.slice(2, 4).every((x) => x.kind === "restaurant"));
  assert.equal(flat[flat.length - 1]?.kind, "hotel");
});
