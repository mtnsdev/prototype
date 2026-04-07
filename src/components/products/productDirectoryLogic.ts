import type {
  DirectoryAmenityTag,
  DirectoryCollectionOption,
  DirectoryPartnerProgram,
  DirectoryProduct,
  NewDirectoryCollectionInput,
} from "../../types/product-directory";
import {
  directoryProductPartnerProgramsSyncPatch,
  programFilterId,
} from "./productDirectoryCommission";

export function createDirectoryCollectionRecord(args: {
  id: string;
  input: NewDirectoryCollectionInput;
  ownerId: string;
  ownerName: string;
  teamName?: string;
  seedProductIds?: string[];
}): DirectoryCollectionOption {
  const { id, input, ownerId, ownerName, teamName, seedProductIds = [] } = args;
  if (input.scope === "private") {
    return {
      id,
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      scope: "private",
      ownerId,
      ownerName,
      teamId: null,
      productIds: [...seedProductIds],
    };
  }
  return {
    id,
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    scope: "team",
    ownerId,
    ownerName,
    teamId: input.teamId,
    teamName,
    productIds: [...seedProductIds],
  };
}

export type PartnerPortalAdminSavePayload = {
  program: DirectoryPartnerProgram;
  attachedProductIds: string[];
  useProductSpecificTerms: boolean;
  productOverrides: Record<
    string,
    { commissionRate: number | null; amenities: string; amenityTags?: DirectoryAmenityTag[] }
  >;
};

export function validatePartnerPortalAdminPayload(payload: PartnerPortalAdminSavePayload): string | null {
  if (payload.attachedProductIds.length === 0) return "Attach at least one product.";
  if (payload.program.commissionRate != null && payload.program.commissionRate < 0) {
    return "Commission cannot be negative.";
  }
  const exp = payload.program.expiryDate;
  if (exp && Number.isNaN(new Date(exp).getTime())) return "Invalid expiry date.";
  const expTs = exp ? new Date(exp).getTime() : null;

  for (const pr of payload.program.activePromotions ?? []) {
    if (pr.effectiveRate < 0) return "Incentive effective rate cannot be negative.";
    const bStart = new Date(pr.bookingStart).getTime();
    const bEnd = new Date(pr.bookingEnd).getTime();
    const tStart = new Date(pr.travelStart).getTime();
    const tEnd = new Date(pr.travelEnd).getTime();
    if ([bStart, bEnd, tStart, tEnd].some((t) => Number.isNaN(t))) return "Invalid promotion date.";
    if (bStart > bEnd) return "Promotion booking start must be before booking end.";
    if (tStart > tEnd) return "Promotion travel start must be before travel end.";
    if (expTs != null && (bEnd > expTs || tEnd > expTs)) {
      return "Promotion windows cannot exceed program expiry date.";
    }
  }

  if (payload.useProductSpecificTerms) {
    for (const [pid, o] of Object.entries(payload.productOverrides)) {
      if (o.commissionRate != null && o.commissionRate < 0) return `Negative commission on product ${pid}.`;
    }
  }
  return null;
}

export function applyPartnerPortalPayloadToProducts(args: {
  products: DirectoryProduct[];
  programKey: string;
  payload: PartnerPortalAdminSavePayload;
  audit: { userId: string; userName: string; editedAtISO: string };
}): { products: DirectoryProduct[]; updatedCount: number } {
  const { products, programKey, payload, audit } = args;
  let updatedCount = 0;
  const next = products.map((p) => {
    const wasAttached = p.partnerPrograms.some((pp) => programFilterId(pp) === programKey);
    const shouldAttach = payload.attachedProductIds.includes(p.id);
    if (!wasAttached && !shouldAttach) return p;

    const preserved = p.partnerPrograms.find((pp) => programFilterId(pp) === programKey);
    const nextProgramsBase = p.partnerPrograms.filter((pp) => programFilterId(pp) !== programKey);
    let nextPrograms = nextProgramsBase;
    if (shouldAttach) {
      const override = payload.useProductSpecificTerms ? payload.productOverrides[p.id] : undefined;
      const nextProgram = {
        ...payload.program,
        id: preserved?.id ?? `${programKey}-${p.id}`,
        programId: preserved?.programId ?? payload.program.programId ?? programKey,
        programName: payload.program.programName ?? payload.program.name,
        name: payload.program.programName ?? payload.program.name,
        commissionRate: override ? override.commissionRate : payload.program.commissionRate,
        amenities: override ? override.amenities : payload.program.amenities,
        amenityTags:
          override?.amenityTags != null
            ? [...override.amenityTags]
            : payload.program.amenityTags
              ? [...payload.program.amenityTags]
              : [],
        lastEditedAt: audit.editedAtISO,
        lastEditedById: audit.userId,
        lastEditedByName: audit.userName,
      };
      nextPrograms = [...nextProgramsBase, nextProgram];
    }

    updatedCount += 1;
    return { ...p, ...directoryProductPartnerProgramsSyncPatch(p, nextPrograms) };
  });
  return { products: next, updatedCount };
}

