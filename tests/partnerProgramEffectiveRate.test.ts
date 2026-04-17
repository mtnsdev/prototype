import test from "node:test";
import assert from "node:assert/strict";
import { buildPartnerProgramsFromRegistry } from "../src/lib/partnerProgramMerge";
import { createPartnerProgramsSeedSnapshot } from "../src/lib/partnerProgramsSeed";
import type { PartnerProgramsSnapshot } from "../src/types/partner-programs";

test("buildPartnerProgramsFromRegistry: card commission stays at guaranteed program base (12%) while override lives on activeIncentives", () => {
  const snapshot = createPartnerProgramsSeedSnapshot();
  const rows = buildPartnerProgramsFromRegistry("prod_002", snapshot);
  const fs = rows.find((r) => r.programId === "reg-fs-pp");
  assert.equal(fs?.commissionRate, 12);
  assert.ok((fs?.activeIncentives?.length ?? 0) >= 1);
  const overrideRow = fs?.activeIncentives?.find((i) => i.effectiveRate === 15);
  assert.ok(overrideRow);
});

test("buildPartnerProgramsFromRegistry: with no incentives, rate equals program default percentage", () => {
  const snapshot = createPartnerProgramsSeedSnapshot();
  const noIncentives: PartnerProgramsSnapshot = { ...snapshot, incentives: [] };
  const rows = buildPartnerProgramsFromRegistry("prod_002", noIncentives);
  const fs = rows.find((r) => r.programId === "reg-fs-pp");
  assert.equal(fs?.commissionRate, 12);
});
