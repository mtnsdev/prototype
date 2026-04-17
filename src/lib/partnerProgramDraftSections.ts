import type { Program } from "@/types/partner-programs";

/** In-page anchors for `PartnerProgramEditorContent` — links & incentives save independently; anchors still aid navigation. */
export const PP_EDITOR_SECTION_IDS = {
  basics: "pp-editor-basics",
  terms: "pp-editor-terms",
  links: "pp-editor-links",
} as const;

function basicsEqual(a: Program, b: Program): boolean {
  return (
    a.name === b.name &&
    a.commissionRate === b.commissionRate &&
    a.commissionType === b.commissionType
  );
}

function termsAmenitiesEqual(a: Program, b: Program): boolean {
  return (
    a.termsSummary === b.termsSummary &&
    JSON.stringify(a.amenities) === JSON.stringify(b.amenities) &&
    JSON.stringify(a.customAmenities) === JSON.stringify(b.customAmenities) &&
    a.hasPropertyLevelOverrides === b.hasPropertyLevelOverrides
  );
}

function contactAgreementEqual(a: Program, b: Program): boolean {
  return (
    JSON.stringify(a.agencyContact) === JSON.stringify(b.agencyContact) &&
    a.agreementStart === b.agreementStart &&
    a.renewalDate === b.renewalDate &&
    a.agencyTerms === b.agencyTerms
  );
}

/** Counts which program-field groups differ (max 3). Links/incentives persist immediately in the demo and are not included. */
export function countPartnerProgramDraftDirtySections(saved: Program, draft: Program): number {
  let n = 0;
  if (!basicsEqual(saved, draft)) n++;
  if (!termsAmenitiesEqual(saved, draft)) n++;
  if (!contactAgreementEqual(saved, draft)) n++;
  return n;
}

export function getPartnerProgramDraftDirtySummary(
  saved: Program | null,
  draft: Program | null
): { isDirty: boolean; sectionCount: number } {
  if (!saved || !draft) return { isDirty: false, sectionCount: 0 };
  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);
  if (!isDirty) return { isDirty: false, sectionCount: 0 };
  return { isDirty: true, sectionCount: countPartnerProgramDraftDirtySections(saved, draft) };
}
