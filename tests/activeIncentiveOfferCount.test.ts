import test from "node:test";
import assert from "node:assert/strict";
import {
  countBookableActivePartnerProgramPromotions,
  getActiveIncentiveOfferCount,
} from "../src/components/products/productDirectoryCommission";
import type { DirectoryProduct } from "../src/types/product-directory";

const baseProduct = (): DirectoryProduct =>
  ({
    id: "p1",
    name: "Test",
    imageUrl: "",
    types: ["hotel"],
    region: "",
    location: "",
    description: "",
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
  }) as DirectoryProduct;

test("getActiveIncentiveOfferCount sums advisories and bookable program activeIncentives", () => {
  const p = baseProduct();
  p.activeAdvisoryCount = 1;
  p.partnerPrograms = [
    {
      id: "lnk",
      name: "Prog",
      programId: "reg-x",
      programName: "Prog",
      scope: "enable",
      commissionRate: 10,
      commissionType: "percentage",
      expiryDate: "2026-12-31",
      activeIncentives: [
        {
          id: "pr1",
          effectiveRate: 12,
          bookingStart: "2026-01-01",
          bookingEnd: "2026-12-31",
          travelStart: "2026-01-01",
          travelEnd: "2026-12-31",
          title: "A",
        },
        {
          id: "pr2",
          effectiveRate: 13,
          bookingStart: "2026-01-01",
          bookingEnd: "2026-12-31",
          travelStart: "2026-01-01",
          travelEnd: "2026-12-31",
          title: "B",
        },
      ],
      amenities: "",
      registryStatus: "active",
      status: "active",
    },
  ];
  assert.equal(countBookableActivePartnerProgramPromotions(p), 2);
  assert.equal(getActiveIncentiveOfferCount(p), 3);
});

test("getActiveIncentiveOfferCount ignores promotions on expired / inactive programs", () => {
  const p = baseProduct();
  p.activeAdvisoryCount = 0;
  p.partnerPrograms = [
    {
      id: "lnk",
      name: "Prog",
      programId: "reg-x",
      programName: "Prog",
      scope: "enable",
      commissionRate: 10,
      commissionType: "percentage",
      expiryDate: "2020-01-01",
      activeIncentives: [{ id: "pr1", effectiveRate: 99, bookingStart: "", bookingEnd: "", travelStart: "", travelEnd: "", title: "x" }],
      amenities: "",
      registryStatus: "expired",
      status: "inactive",
    },
  ];
  assert.equal(getActiveIncentiveOfferCount(p), 0);
});
