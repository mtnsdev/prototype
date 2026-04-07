import test from "node:test";
import assert from "node:assert/strict";
import type { DirectoryPartnerProgram, DirectoryProduct } from "../src/types/product-directory";
import {
  applyPartnerPortalPayloadToProducts,
  createDirectoryCollectionRecord,
  validatePartnerPortalAdminPayload,
  type PartnerPortalAdminSavePayload,
} from "../src/components/products/productDirectoryLogic";

function makeProgram(id: string, programId: string, rate: number, amenities: string): DirectoryPartnerProgram {
  return {
    id,
    name: "Program",
    programId,
    programName: "Program",
    commissionRate: rate,
    expiryDate: null,
    activePromotions: [],
    amenities,
    amenityTags: [],
    status: "active",
    scope: "enable",
  };
}

function makeProduct(id: string, programs: DirectoryPartnerProgram[]): DirectoryProduct {
  return {
    id,
    name: id,
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
    partnerProgramCount: programs.length,
    repFirmLinks: [],
    repFirmCount: 0,
    collectionCount: 0,
    collectionIds: [],
    partnerPrograms: programs,
    agencyContacts: [],
    collections: [],
  };
}

test("createDirectoryCollectionRecord builds team collection", () => {
  const col = createDirectoryCollectionRecord({
    id: "col_1",
    input: { name: " Team Picks ", scope: "team", teamId: "team-a", description: "desc" },
    ownerId: "u1",
    ownerName: "Owner",
    teamName: "Team A",
    seedProductIds: ["p1"],
  });
  assert.equal(col.name, "Team Picks");
  assert.equal(col.scope, "team");
  assert.equal(col.teamId, "team-a");
  assert.deepEqual(col.productIds, ["p1"]);
});

function basePayload(overrides: Partial<PartnerPortalAdminSavePayload> = {}): PartnerPortalAdminSavePayload {
  return {
    program: {
      id: "pp1",
      name: "P",
      commissionRate: 10,
      expiryDate: null,
      activePromotions: [],
      amenities: "",
    },
    attachedProductIds: ["p1"],
    useProductSpecificTerms: false,
    productOverrides: {},
    ...overrides,
  };
}

test("validatePartnerPortalAdminPayload rejects empty attachments", () => {
  const bad = basePayload({ attachedProductIds: [] });
  assert.equal(validatePartnerPortalAdminPayload(bad), "Attach at least one product.");
});

test("validatePartnerPortalAdminPayload rejects negative program commission", () => {
  const bad = basePayload({
    program: {
      ...basePayload().program,
      commissionRate: -1,
    },
  });
  assert.equal(validatePartnerPortalAdminPayload(bad), "Commission cannot be negative.");
});

test("validatePartnerPortalAdminPayload rejects invalid expiry", () => {
  const bad = basePayload({
    program: { ...basePayload().program, expiryDate: "not-a-date" },
  });
  assert.equal(validatePartnerPortalAdminPayload(bad), "Invalid expiry date.");
});

test("validatePartnerPortalAdminPayload rejects negative incentive rate", () => {
  const bad = basePayload({
    program: {
      ...basePayload().program,
      activePromotions: [
        {
          id: "promo1",
          effectiveRate: -1,
          bookingStart: "2026-01-01T00:00:00.000Z",
          bookingEnd: "2026-02-01T00:00:00.000Z",
          travelStart: "2026-01-01T00:00:00.000Z",
          travelEnd: "2026-02-01T00:00:00.000Z",
        },
      ],
    },
  });
  assert.equal(validatePartnerPortalAdminPayload(bad), "Incentive effective rate cannot be negative.");
});

test("validatePartnerPortalAdminPayload rejects promotion window after program expiry", () => {
  const bad = basePayload({
    program: {
      ...basePayload().program,
      expiryDate: "2026-01-15T12:00:00.000Z",
      activePromotions: [
        {
          id: "promo1",
          effectiveRate: 5,
          bookingStart: "2026-01-01T00:00:00.000Z",
          bookingEnd: "2026-03-01T00:00:00.000Z",
          travelStart: "2026-01-01T00:00:00.000Z",
          travelEnd: "2026-03-01T00:00:00.000Z",
        },
      ],
    },
  });
  assert.equal(
    validatePartnerPortalAdminPayload(bad),
    "Promotion windows cannot exceed program expiry date."
  );
});

test("validatePartnerPortalAdminPayload rejects negative override commission", () => {
  const bad = basePayload({
    useProductSpecificTerms: true,
    productOverrides: { p1: { commissionRate: -0.5, amenities: "" } },
  });
  assert.equal(validatePartnerPortalAdminPayload(bad), "Negative commission on product p1.");
});

test("createDirectoryCollectionRecord builds private collection", () => {
  const col = createDirectoryCollectionRecord({
    id: "col_p",
    input: { name: " Mine ", scope: "private", teamId: null, description: "" },
    ownerId: "u1",
    ownerName: "Owner",
    seedProductIds: [],
  });
  assert.equal(col.name, "Mine");
  assert.equal(col.scope, "private");
  assert.deepEqual(col.productIds, []);
});

test("applyPartnerPortalPayloadToProducts propagates overrides and audits", () => {
  const p1 = makeProduct("p1", [makeProgram("pp-a1", "prog-a", 10, "base")]);
  const p2 = makeProduct("p2", [makeProgram("pp-a2", "prog-a", 10, "base")]);
  const p3 = makeProduct("p3", []);
  const payload: PartnerPortalAdminSavePayload = {
    program: {
      id: "x",
      name: "Prog A",
      programId: "prog-a",
      programName: "Prog A",
      commissionRate: 12,
      expiryDate: "2026-12-31T12:00:00.000Z",
      activePromotions: [],
      amenities: "global",
      status: "active",
      scope: "enable",
    },
    attachedProductIds: ["p1", "p3"],
    useProductSpecificTerms: true,
    productOverrides: {
      p1: { commissionRate: 15, amenities: "p1-only" },
      p3: { commissionRate: 8, amenities: "p3-only" },
    },
  };

  const result = applyPartnerPortalPayloadToProducts({
    products: [p1, p2, p3],
    programKey: "prog-a",
    payload,
    audit: { userId: "admin1", userName: "Admin", editedAtISO: "2026-03-25T00:00:00.000Z" },
  });

  assert.equal(result.updatedCount, 3);
  const out1 = result.products.find((x) => x.id === "p1")!;
  const out2 = result.products.find((x) => x.id === "p2")!;
  const out3 = result.products.find((x) => x.id === "p3")!;

  const pp1 = out1.partnerPrograms.find((pp) => pp.programId === "prog-a")!;
  assert.equal(pp1.commissionRate, 15);
  assert.equal(pp1.amenities, "p1-only");
  assert.equal(pp1.lastEditedByName, "Admin");

  assert.equal(out2.partnerPrograms.some((pp) => pp.programId === "prog-a"), false);

  const pp3 = out3.partnerPrograms.find((pp) => pp.programId === "prog-a")!;
  assert.equal(pp3.commissionRate, 8);
  assert.equal(pp3.amenities, "p3-only");
});

