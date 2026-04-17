import test from "node:test";
import assert from "node:assert/strict";
import { deriveIncentiveKind, incentiveDisplayPhase } from "../src/lib/incentiveUi";
import { validateIncentiveForm } from "../src/lib/incentiveValidation";
import { buildPartnerProgramsFromRegistry } from "../src/lib/partnerProgramMerge";
import { createPartnerProgramsSeedSnapshot } from "../src/lib/partnerProgramsSeed";
import type { Incentive } from "../src/types/partner-programs";

const REF = new Date("2026-03-24T12:00:00.000Z");

function baseIncentive(over: Partial<Incentive> = {}): Incentive {
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

test("deriveIncentiveKind: volume metric wins", () => {
  assert.equal(
    deriveIncentiveKind(
      baseIncentive({
        volumeMetric: "room_nights",
        stacksWithBase: false,
        travelWindowStart: "2026-06-01T12:00:00.000Z",
      })
    ),
    "volume_incentive"
  );
});

test("deriveIncentiveKind: bonus when stacking and no volume", () => {
  assert.equal(deriveIncentiveKind(baseIncentive({ stacksWithBase: true })), "bonus");
});

test("deriveIncentiveKind: seasonal when not stacking and travel set", () => {
  assert.equal(
    deriveIncentiveKind(
      baseIncentive({
        stacksWithBase: false,
        travelWindowStart: "2026-06-01T12:00:00.000Z",
      })
    ),
    "seasonal"
  );
});

test("deriveIncentiveKind: rate override when not stacking and booking-only", () => {
  assert.equal(
    deriveIncentiveKind(
      baseIncentive({
        stacksWithBase: false,
        bookingWindowStart: "2026-03-01T12:00:00.000Z",
        bookingWindowEnd: "2026-06-30T12:00:00.000Z",
      })
    ),
    "rate_override"
  );
});

test("incentiveDisplayPhase: booking window active", () => {
  assert.equal(
    incentiveDisplayPhase(
      baseIncentive({
        bookingWindowStart: "2026-03-01T12:00:00.000Z",
        bookingWindowEnd: "2026-12-31T12:00:00.000Z",
      }),
      REF
    ),
    "active"
  );
});

test("incentiveDisplayPhase: no windows is active", () => {
  assert.equal(incentiveDisplayPhase(baseIncentive(), REF), "active");
});

test("validateIncentiveForm: rejects inverted booking window", () => {
  const msg = validateIncentiveForm({
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

test("validateIncentiveForm: rejects specific scope with no products", () => {
  const msg = validateIncentiveForm({
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

test("validateIncentiveForm: accepts valid volume threshold", () => {
  assert.equal(
    validateIncentiveForm({
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

test("buildPartnerProgramsFromRegistry: prod_001 has merged incentives from seed", () => {
  const snap = createPartnerProgramsSeedSnapshot();
  const rows = buildPartnerProgramsFromRegistry("prod_001", snap);
  const virtuoso = rows.find((r) => r.programId === "reg-virtuoso");
  assert.ok(virtuoso);
  assert.ok((virtuoso!.activeIncentives?.length ?? 0) >= 1);
});
