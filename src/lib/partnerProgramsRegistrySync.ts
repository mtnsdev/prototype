import type { PartnerProgramsAdminSavePayload } from "@/components/products/productDirectoryLogic";
import type {
  PartnerProgramsSnapshot,
  ProductProgramLink,
  Program,
  Incentive,
} from "@/types/partner-programs";
import type { DirectoryAmenityTag, DirectoryPartnerProgram } from "@/types/product-directory";
import type { LinkCommissionStatus } from "@/types/partner-programs";

function formatCommissionForLink(d: DirectoryPartnerProgram, rate: number | null): string | null {
  if (rate == null) return null;
  if (d.commissionType === "flat") {
    return `${rate} flat`;
  }
  return `${rate}%`;
}

function resolveRateForProduct(
  d: DirectoryPartnerProgram,
  productId: string,
  useProductSpecificTerms: boolean,
  overrides: PartnerProgramsAdminSavePayload["productOverrides"]
): number | null {
  if (useProductSpecificTerms) {
    const ov = overrides[productId];
    if (ov?.commissionRate != null) return ov.commissionRate;
  }
  return d.commissionRate ?? null;
}

function resolveAmenitiesForProduct(
  d: DirectoryPartnerProgram,
  productId: string,
  useProductSpecificTerms: boolean,
  overrides: PartnerProgramsAdminSavePayload["productOverrides"]
): DirectoryAmenityTag[] | null {
  if (!useProductSpecificTerms) return null;
  const ov = overrides[productId];
  if (ov?.amenityTags && ov.amenityTags.length > 0) return [...ov.amenityTags];
  if (d.amenityTags && d.amenityTags.length > 0) return [...d.amenityTags];
  return null;
}

function linkStatusFromDraft(d: DirectoryPartnerProgram): LinkCommissionStatus {
  return d.status === "inactive" ? "expired" : "active";
}

/**
 * Mirrors a successful Partner programs tab admin save into the Partner Programs registry
 * when `programKey` matches a registry `Program.id` (e.g. `reg-virtuoso`).
 */
export function syncPartnerProgramsPayloadToRegistry(args: {
  programKey: string;
  payload: PartnerProgramsAdminSavePayload;
  snapshot: PartnerProgramsSnapshot;
  upsertProgram: (program: Program) => void;
  upsertLink: (link: ProductProgramLink) => void;
  removeLink: (linkId: string) => void;
  nowIso: string;
  editorId: string;
}): boolean {
  const { programKey, payload, snapshot, upsertProgram, upsertLink, removeLink, nowIso, editorId } = args;
  const program = snapshot.programs.find((p) => p.id === programKey);
  if (!program) return false;

  const d = payload.program;
  const { attachedProductIds, useProductSpecificTerms, productOverrides } = payload;

  upsertProgram({
    ...program,
    name: (d.programName ?? d.name ?? program.name).trim() || program.name,
    commissionRate:
      d.commissionRate != null
        ? formatCommissionForLink(d, d.commissionRate) ?? program.commissionRate
        : program.commissionRate,
    hasPropertyLevelOverrides: useProductSpecificTerms,
    renewalDate: d.expiryDate ?? program.renewalDate,
    updatedAt: nowIso,
  });

  const programCurrency = program.commissionCurrency;

  const existingForProgram = snapshot.links.filter((l) => l.programId === programKey);
  const linkByProduct = new Map(existingForProgram.map((l) => [l.productId, l]));
  const attached = new Set(attachedProductIds);

  for (const link of existingForProgram) {
    if (!attached.has(link.productId)) {
      removeLink(link.id);
    }
  }

  for (const productId of attachedProductIds) {
    const preserved = linkByProduct.get(productId);
    const rateNum = resolveRateForProduct(d, productId, useProductSpecificTerms, productOverrides);
    const commissionRate = formatCommissionForLink(d, rateNum);
    const amenities = resolveAmenitiesForProduct(d, productId, useProductSpecificTerms, productOverrides);

    const commissionKind =
      d.commissionType === "flat" ? "flat" : ("percentage" as const);

    upsertLink({
      id: preserved?.id ?? `lnk-${programKey}-${productId}`,
      programId: programKey,
      productId,
      commissionRate,
      commissionType: commissionKind,
      currency: preserved?.currency ?? programCurrency,
      effectiveFrom: preserved?.effectiveFrom ?? nowIso,
      expiresAt: d.expiryDate,
      contactName: preserved?.contactName ?? null,
      contactEmail: preserved?.contactEmail ?? null,
      contactPhone: preserved?.contactPhone ?? null,
      notes: preserved?.notes ?? null,
      amenities: amenities && amenities.length > 0 ? amenities : null,
      status: linkStatusFromDraft(d),
      createdBy: preserved?.createdBy ?? editorId,
      createdAt: preserved?.createdAt ?? nowIso,
      updatedAt: nowIso,
    });
  }

  return true;
}

function isNewPartnerDetailDraft(d: DirectoryPartnerProgram): boolean {
  return d.id.startsWith("pp_new") || (d.programId ?? "").startsWith("prog_new");
}

function formatDetailDraftCommission(d: DirectoryPartnerProgram, rate: number | null): string | null {
  if (rate == null) return null;
  if (d.commissionType === "flat") {
    return `${rate} flat`;
  }
  return `${rate}%`;
}

function contactPartsFromDetailLine(contact: string | undefined): {
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
} {
  const s = (contact ?? "").trim();
  if (!s) return { contactName: null, contactEmail: null, contactPhone: null };
  const parts = s.split(" · ").map((x) => x.trim()).filter(Boolean);
  const email = parts.find((p) => p.includes("@")) ?? null;
  const phone =
    parts.find((p) => /^[\d+][\d\s\-().]{6,}$/.test(p) && /\d{6,}/.test(p.replace(/\D/g, ""))) ?? null;
  const name = parts.find((p) => p !== email && p !== phone) ?? parts[0] ?? null;
  return { contactName: name, contactEmail: email, contactPhone: phone };
}

function createProgramFromDetailDraft(
  d: DirectoryPartnerProgram,
  programId: string,
  nowIso: string,
  editorId: string
): Program {
  const name = (d.programName ?? d.name ?? "New partner program").trim() || "New partner program";
  const rateStr = formatDetailDraftCommission(d, d.commissionRate ?? null) ?? "10%";
  return {
    id: programId,
    name,
    network: null,
    type: "preferred_partner",
    termsSummary: null,
    commissionRate: rateStr,
    commissionType: d.commissionType === "flat" ? "flat" : "percentage",
    commissionCurrency: "USD",
    amenities: d.amenityTags?.length ? [...d.amenityTags] : [],
    customAmenities: [],
    hasPropertyLevelOverrides: true,
    agencyContact: { name: null, email: null, phone: null },
    agreementStart: nowIso.slice(0, 10),
    renewalDate: d.expiryDate,
    status: d.status === "inactive" ? "paused" : "active",
    agencyTerms: null,
    agencyNegotiatedRate: null,
    agencyId: "tl-demo",
    createdBy: editorId,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

/**
 * Persists product-detail partner program edits into the Partner Programs registry (programs, links, incentive rates).
 * Call whenever saving from the product panel while `PartnerProgramsProvider` is mounted — same source of truth as the Partner Programs tab.
 */
export function syncProductDetailPartnerProgramsDraftToRegistry(args: {
  productId: string;
  draft: DirectoryPartnerProgram[];
  snapshot: PartnerProgramsSnapshot;
  upsertProgram: (program: Program) => void;
  upsertLink: (link: ProductProgramLink) => void;
  removeLink: (linkId: string) => void;
  upsertIncentive: (incentive: Incentive) => void;
  nowIso: string;
  editorId: string;
}): void {
  const {
    productId,
    draft,
    snapshot,
    upsertProgram,
    upsertLink,
    removeLink,
    upsertIncentive,
    nowIso,
    editorId,
  } = args;

  const existingForProduct = snapshot.links.filter((l) => l.productId === productId);
  const finalLinkIds = new Set<string>();
  let draftIndex = 0;

  for (const d of draft) {
    const rateStr = formatDetailDraftCommission(d, d.commissionRate ?? null);
    const commissionKind = d.commissionType === "flat" ? ("flat" as const) : ("percentage" as const);
    const cp = contactPartsFromDetailLine(d.contact);

    if (isNewPartnerDetailDraft(d)) {
      const stamp = `${Date.now()}-${draftIndex}-${Math.random().toString(36).slice(2, 7)}`;
      draftIndex += 1;
      const programId = `reg-detail-${stamp}`;
      const linkId = `lnk-${programId}-${productId}`;
      const program = createProgramFromDetailDraft(d, programId, nowIso, editorId);
      upsertProgram(program);
      upsertLink({
        id: linkId,
        programId,
        productId,
        commissionRate: rateStr,
        commissionType: commissionKind,
        currency: program.commissionCurrency,
        effectiveFrom: nowIso,
        expiresAt: d.expiryDate,
        contactName: cp.contactName,
        contactEmail: cp.contactEmail,
        contactPhone: cp.contactPhone,
        notes: d.amenities?.trim() ? d.amenities.trim() : null,
        amenities: d.amenityTags && d.amenityTags.length > 0 ? [...d.amenityTags] : null,
        status: linkStatusFromDraft(d),
        createdBy: editorId,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      finalLinkIds.add(linkId);
      continue;
    }

    const link =
      snapshot.links.find((l) => l.id === d.id && l.productId === productId) ??
      snapshot.links.find((l) => l.productId === productId && l.programId === d.programId);
    if (!link) {
      const stamp = `${Date.now()}-${draftIndex}-${Math.random().toString(36).slice(2, 7)}`;
      draftIndex += 1;
      const programId = (d.programId ?? "").trim() || `reg-detail-${stamp}`;
      let program = snapshot.programs.find((p) => p.id === programId);
      if (!program) {
        program = createProgramFromDetailDraft(d, programId, nowIso, editorId);
        upsertProgram(program);
      } else {
        upsertProgram({
          ...program,
          name: (d.programName ?? d.name ?? program.name).trim() || program.name,
          commissionRate: rateStr ?? program.commissionRate,
          commissionType: commissionKind,
          renewalDate: d.expiryDate ?? program.renewalDate,
          updatedAt: nowIso,
        });
      }
      const linkId = `lnk-${programId}-${productId}-${stamp}`;
      upsertLink({
        id: linkId,
        programId,
        productId,
        commissionRate: rateStr,
        commissionType: commissionKind,
        currency: program.commissionCurrency,
        effectiveFrom: nowIso,
        expiresAt: d.expiryDate,
        contactName: cp.contactName,
        contactEmail: cp.contactEmail,
        contactPhone: cp.contactPhone,
        notes: d.amenities?.trim() ? d.amenities.trim() : null,
        amenities: d.amenityTags && d.amenityTags.length > 0 ? [...d.amenityTags] : null,
        status: linkStatusFromDraft(d),
        createdBy: editorId,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      finalLinkIds.add(linkId);
      continue;
    }

    finalLinkIds.add(link.id);

    const program = snapshot.programs.find((p) => p.id === link.programId);
    if (program) {
      upsertProgram({
        ...program,
        name: (d.programName ?? d.name ?? program.name).trim() || program.name,
        commissionRate: rateStr ?? program.commissionRate,
        commissionType: commissionKind,
        renewalDate: d.expiryDate ?? program.renewalDate,
        status: d.status === "inactive" ? "paused" : program.status,
        updatedAt: nowIso,
      });
    }

    upsertLink({
      ...link,
      programId: link.programId,
      productId,
      commissionRate: rateStr,
      commissionType: commissionKind,
      expiresAt: d.expiryDate,
      contactName: cp.contactName,
      contactEmail: cp.contactEmail,
      contactPhone: cp.contactPhone,
      notes: d.amenities?.trim() ? d.amenities.trim() : link.notes,
      amenities: d.amenityTags && d.amenityTags.length > 0 ? [...d.amenityTags] : link.amenities,
      status: linkStatusFromDraft(d),
      updatedAt: nowIso,
    });

    for (const pr of d.activeIncentives ?? []) {
      const prev = snapshot.incentives.find((p) => p.id === pr.id);
      if (!prev) continue;
      const nextRate =
        pr.rateType === "flat" ? String(pr.effectiveRate) : `${pr.effectiveRate}%`;
      if (nextRate === prev.rateValue) continue;
      upsertIncentive({
        ...prev,
        rateValue: nextRate,
        updatedAt: nowIso,
        updatedBy: editorId,
      });
    }
  }

  for (const l of existingForProduct) {
    if (!finalLinkIds.has(l.id)) {
      removeLink(l.id);
    }
  }
}
