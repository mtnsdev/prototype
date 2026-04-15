import test from "node:test";
import assert from "node:assert/strict";
import { derivePromotionKind, promotionDisplayPhase } from "../src/lib/promotionUi";
import { validatePromotionForm } from "../src/lib/promotionValidation";
import { buildPartnerProgramsFromRegistry } from "../src/lib/partnerProgramMerge";
import { createPartnerProgramsSeedSnapshot } from "../src/lib/partnerProgramsSeed";
import type { Promotion } from "../src/types/partner-programs";

const REF = new Date("2026-03-24T12:00:00.000Z");

function basePromotion(over: Partial<Promotion> = {}): Promotion {
  const now = "2026-01-01T12:00:00.000Z";
  return {
    id: "p1",
    programId: "reg-x",
    productIds: "all",
    name: "Test",
    rateValue: "10%",
    rateType: "percentage",
    stacksWithBase: true,
    bookingWindowStart: null,
    bookingWindowEnd: null,
    travelWindowStart: null,
    travelWindowEnd: null,
    volumeThreshold: null,
    volumeMetric: null,
    volumeRetroactive: false,
    eligibilityNotes: null,
    createdBy: "u",
    createdAt: now,
    updatedAt: now,
    updatedBy: "u",
    ...over,
  };
}

test("derivePromotionKind: volume metric wins", () => {
  assert.equal(
    derivePromotionKind(
      basePromotion({
        volumeMetric: "room_nights",
        stacksWithBase: false,
        travelWindowStart: "2026-06-01T12:00:00.000Z",
      })
    ),
    "volume_incentive"
  );
});

test("derivePromotionKind: bonus when stacking and no volume", () => {
  assert.equal(derivePromotionKind(basePromotion({ stacksWithBase: true })), "bonus");
});

test("derivePromotionKind: seasonal when not stacking and travel set", () => {
  assert.equal(
    derivePromotionKind(
      basePromotion({
        stacksWithBase: false,
        travelWindowStart: "2026-06-01T12:00:00.000Z",
      })
    ),
    "seasonal"
  );
});

test("derivePromotionKind: rate override when not stacking and booking-only", () => {
  assert.equal(
    derivePromotionKind(
      basePromotion({
        stacksWithBase: false,
        bookingWindowStart: "2026-03-01T12:00:00.000Z",
        bookingWindowEnd: "2026-06-30T12:00:00.000Z",
      })
    ),
    "rate_override"
  );
});

test("promotionDisplayPhase: booking window active", () => {
  assert.equal(
    promotionDisplayPhase(
      basePromotion({
        bookingWindowStart: "2026-03-01T12:00:00.000Z",
        bookingWindowEnd: "2026-12-31T12:00:00.000Z",
      }),
      REF
    ),
    "active"
  );
});

test("promotionDisplayPhase: no windows is active", () => {
  assert.equal(promotionDisplayPhase(basePromotion(), REF), "active");
});

test("validatePromotionForm: rejects inverted booking window", () => {
  const msg = validatePromotionForm({
    bookingStart: "2026-06-30",
    bookingEnd: "2026-03-01",
    travelStart: "",
    travelEnd: "",
    volumeThreshold: "",
    volumeMetric: "",
    scopeAll: true,
    selectedProductIds: [],
    linkedProductIds: [],
  });
  assert.ok(msg && msg.includes("Booking"));
});

test("validatePromotionForm: rejects specific scope with no products", () => {
  const msg = validatePromotionForm({
    bookingStart: "",
    bookingEnd: "",
    travelStart: "",
    travelEnd: "",
    volumeThreshold: "",
    volumeMetric: "",
    scopeAll: false,
    selectedProductIds: [],
    linkedProductIds: ["prod_001"],
  });
  assert.ok(msg && msg.includes("linked product"));
});

test("validatePromotionForm: accepts valid volume threshold", () => {
  assert.equal(
    validatePromotionForm({
      bookingStart: "",
      bookingEnd: "",
      travelStart: "",
      travelEnd: "",
      volumeThreshold: "10",
      volumeMetric: "bookings",
      scopeAll: true,
      selectedProductIds: [],
      linkedProductIds: [],
    }),
    null
  );
});

test("buildPartnerProgramsFromRegistry: prod_001 has merged promotions from seed", () => {
  const snap = createPartnerProgramsSeedSnapshot();
  const rows = buildPartnerProgramsFromRegistry("prod_001", snap);
  const virtuoso = rows.find((r) => r.programId === "reg-virtuoso");
  assert.ok(virtuoso);
  assert.ok((virtuoso!.activePromotions?.length ?? 0) >= 1);
});
