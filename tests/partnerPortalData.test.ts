import test from "node:test";
import assert from "node:assert/strict";
import {
  clonePartnerPortalPrograms,
  formatPartnerPortalValueDisplay,
  partnerPortalProgramDomId,
  PARTNER_PORTAL_DEMO_PROGRAMS,
  programMetaEqual,
  programMetaFromCard,
} from "../src/lib/partnerPortalData";

test("partnerPortalProgramDomId sanitizes keys for DOM ids", () => {
  assert.equal(partnerPortalProgramDomId("pp-fs-preferred"), "partner-program-pp-fs-preferred");
  assert.equal(partnerPortalProgramDomId("bad id!"), "partner-program-bad_id_");
});

test("formatPartnerPortalValueDisplay masks when commission view is off", () => {
  assert.equal(formatPartnerPortalValueDisplay("+3%", true), "+3%");
  assert.equal(formatPartnerPortalValueDisplay("+3%", false), "—");
});

test("clonePartnerPortalPrograms deep-clones incentives", () => {
  const a = clonePartnerPortalPrograms(PARTNER_PORTAL_DEMO_PROGRAMS);
  assert.notEqual(a, PARTNER_PORTAL_DEMO_PROGRAMS);
  assert.notEqual(a[0]?.incentives, PARTNER_PORTAL_DEMO_PROGRAMS[0]?.incentives);
  a[0]!.incentives[0]!.name = "mutated";
  assert.notEqual(PARTNER_PORTAL_DEMO_PROGRAMS[0]?.incentives[0]?.name, "mutated");
});

test("PARTNER_PORTAL_DEMO_PROGRAMS has four partner programs", () => {
  assert.equal(PARTNER_PORTAL_DEMO_PROGRAMS.length, 4);
});

test("programMetaEqual detects program shell changes", () => {
  const p = PARTNER_PORTAL_DEMO_PROGRAMS[0]!;
  const a = programMetaFromCard(p);
  assert.ok(programMetaEqual(a, programMetaFromCard(p)));
  assert.ok(!programMetaEqual(a, { ...a, name: "x" }));
});
