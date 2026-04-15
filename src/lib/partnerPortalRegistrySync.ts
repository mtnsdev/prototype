import type { PartnerPortalAdminSavePayload } from "@/components/products/productDirectoryLogic";
import type { PartnerProgramsSnapshot, ProductProgramLink, Program } from "@/types/partner-programs";
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
  overrides: PartnerPortalAdminSavePayload["productOverrides"]
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
  overrides: PartnerPortalAdminSavePayload["productOverrides"]
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
 * Mirrors a successful Partner Portal admin save into the Partner Programs registry
 * when `programKey` matches a registry `Program.id` (e.g. `reg-virtuoso`).
 */
export function syncPartnerPortalPayloadToRegistry(args: {
  programKey: string;
  payload: PartnerPortalAdminSavePayload;
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
