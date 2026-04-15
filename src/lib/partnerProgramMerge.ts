import type {
  PartnerProgramsSnapshot,
  ProductProgramLink,
  Program,
  Promotion,
} from "@/types/partner-programs";
import type { DirectoryPartnerProgram, DirectoryProduct, DirectoryProductPromotion } from "@/types/product-directory";
import { AMENITY_LABELS } from "@/components/products/productDirectoryFilterConfig";
import {
  directoryProductPartnerProgramsSyncPatch,
  programFilterId,
  resolveProgramRegistryStatus,
} from "@/components/products/productDirectoryCommission";
import { PARTNER_PROGRAMS_REFERENCE_ISO } from "@/lib/partnerProgramsSeed";
import { derivePromotionKind, promotionDisplayPhase } from "@/lib/promotionUi";

function refDate(): Date {
  return new Date(PARTNER_PROGRAMS_REFERENCE_ISO);
}

/** Extract first numeric value from strings like `10%`, `+2%`, `€150`, `$200 flat` (currency symbols allowed). */
export function parseRateNumber(s: string | null | undefined): number | null {
  if (s == null || s.trim() === "") return null;
  const m = s.trim().match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/**
 * Partner Portal saves incentives on catalog `partnerPrograms`; registry merge would replace them entirely.
 * Re-attach portal-only rows (e.g. ids from `newPartnerPortalIncentive`) and overlay title/details when ids match.
 */
function mergeCatalogPartnerProgramsWithRegistry(
  prev: DirectoryPartnerProgram[],
  fromRegistry: DirectoryPartnerProgram[]
): DirectoryPartnerProgram[] {
  return fromRegistry.map((g) => {
    const match = prev.find((p) => programFilterId(p) === programFilterId(g));
    if (!match?.activePromotions?.length) return g;
    const regIds = new Set(g.activePromotions.map((x) => x.id));
    const mergedList = g.activePromotions.map((rp) => {
      const portalSame = match.activePromotions!.find((pp) => pp.id === rp.id);
      if (!portalSame) return rp;
      return {
        ...rp,
        details: portalSame.details?.trim() ? portalSame.details : rp.details,
        title: portalSame.title?.trim() ? portalSame.title : rp.title,
      };
    });
    const extras = match.activePromotions.filter((pp) => !regIds.has(pp.id));
    if (extras.length === 0) return { ...g, activePromotions: mergedList };
    return { ...g, activePromotions: [...mergedList, ...extras] };
  });
}

function amenityLine(tags: import("@/types/product-directory").DirectoryAmenityTag[]): string {
  return tags.map((t) => AMENITY_LABELS[t] ?? t).join(", ");
}

function programById(programs: Program[], id: string): Program | undefined {
  return programs.find((p) => p.id === id);
}

function promotionAppliesToProduct(p: Promotion, productId: string): boolean {
  if (p.productIds === "all") return true;
  return p.productIds.includes(productId);
}

function isBookingWindowActive(p: Promotion, ref: Date): boolean {
  const hasBook =
    p.bookingWindowStart != null ||
    p.bookingWindowEnd != null ||
    p.travelWindowStart != null ||
    p.travelWindowEnd != null;
  if (!hasBook) return true;
  const bOk =
    (p.bookingWindowStart == null || new Date(p.bookingWindowStart) <= ref) &&
    (p.bookingWindowEnd == null || new Date(p.bookingWindowEnd) >= ref);
  const tOk =
    (p.travelWindowStart == null || new Date(p.travelWindowStart) <= ref) &&
    (p.travelWindowEnd == null || new Date(p.travelWindowEnd) >= ref);
  if (p.bookingWindowStart != null || p.bookingWindowEnd != null) return bOk;
  return tOk;
}

function toDirectoryPromotion(
  p: Promotion,
  effectiveRate: number,
  _ref: Date
): DirectoryProductPromotion {
  return {
    id: p.id,
    effectiveRate,
    bookingStart: p.bookingWindowStart ?? "",
    bookingEnd: p.bookingWindowEnd ?? "",
    travelStart: p.travelWindowStart ?? "",
    travelEnd: p.travelWindowEnd ?? "",
    title: p.name,
    details: p.eligibilityNotes ?? undefined,
    rateType: p.rateType,
    stacksWithBase: p.stacksWithBase,
    volumeMetric: p.volumeMetric ?? undefined,
    volumeThreshold: p.volumeThreshold,
    volumeRetroactive: p.volumeRetroactive,
  };
}

function resolveBaseCommission(program: Program, link: ProductProgramLink): {
  rate: number | null;
  type: "percentage" | "flat";
} {
  const useOverride =
    program.hasPropertyLevelOverrides && link.commissionRate != null && link.commissionRate.trim() !== "";
  const raw = useOverride ? link.commissionRate! : program.commissionRate;
  const kind = useOverride ? link.commissionType ?? program.commissionType : program.commissionType;
  const n = parseRateNumber(raw);
  if (kind === "flat") {
    return { rate: n, type: "flat" };
  }
  return { rate: n, type: "percentage" };
}

function resolveAmenities(program: Program, link: ProductProgramLink): import("@/types/product-directory").DirectoryAmenityTag[] {
  if (program.hasPropertyLevelOverrides && link.amenities != null && link.amenities.length > 0) {
    return [...link.amenities];
  }
  return [...program.amenities];
}

/**
 * Builds directory-facing partner program rows from the registry for one product.
 */
export function buildPartnerProgramsFromRegistry(
  productId: string,
  snapshot: PartnerProgramsSnapshot
): DirectoryPartnerProgram[] {
  const ref = refDate();
  const links = snapshot.links.filter((l) => l.productId === productId);
  const out: DirectoryPartnerProgram[] = [];

  for (const link of links) {
    const program = programById(snapshot.programs, link.programId);
    if (!program || program.status === "archived") continue;

    const base = resolveBaseCommission(program, link);
    const amenities = resolveAmenities(program, link);
    const promos = snapshot.promotions.filter(
      (p) => p.programId === program.id && promotionAppliesToProduct(p, productId)
    );

    const activePromos = promos.filter(
      (p) => promotionDisplayPhase(p, ref) === "active" && isBookingWindowActive(p, ref)
    );

    let basePct = base.type === "percentage" ? base.rate : null;
    const baseFlat = base.type === "flat" ? base.rate : null;

    const overrideRates: number[] = [];

    for (const p of activePromos) {
      if (p.rateType === "flat") continue;
      const n = parseRateNumber(p.rateValue);
      if (n == null) continue;
      const kind = derivePromotionKind(p);
      const isOverrideFamily =
        kind === "rate_override" || kind === "seasonal" || (kind === "volume_incentive" && !p.stacksWithBase);
      if (isOverrideFamily) {
        overrideRates.push(n);
      }
    }

    let afterOverride = basePct;
    if (overrideRates.length > 0) {
      const bestOv = Math.max(...overrideRates);
      afterOverride = afterOverride == null ? bestOv : Math.max(afterOverride, bestOv);
    }

    const dirPromos: DirectoryProductPromotion[] = [];
    for (const p of activePromos) {
      const n = parseRateNumber(p.rateValue);
      if (n == null) continue;
      const kind = derivePromotionKind(p);

      if (p.rateType === "flat") {
        dirPromos.push(toDirectoryPromotion(p, n, ref));
        continue;
      }

      let eff = n;
      const stacksLikeBonus = kind === "bonus" || (kind === "volume_incentive" && p.stacksWithBase);
      if (stacksLikeBonus) {
        const root = afterOverride ?? basePct ?? 0;
        eff = root + n;
      }
      dirPromos.push(toDirectoryPromotion(p, eff, ref));
    }

    const contact =
      [link.contactName, link.contactEmail, link.contactPhone].filter(Boolean).join(" · ") ||
      [program.agencyContact.name, program.agencyContact.email, program.agencyContact.phone].filter(Boolean).join(" · ");

    const expiry = link.expiresAt ?? program.renewalDate;

    const dp: DirectoryPartnerProgram = {
      id: link.id,
      name: program.name,
      programId: program.id,
      programName: program.name,
      scope: "enable",
      commissionRate: basePct ?? baseFlat,
      commissionType: base.type === "flat" ? "flat" : "percentage",
      expiryDate: expiry,
      contact: contact || undefined,
      activePromotions: dirPromos,
      amenities: amenityLine(amenities),
      amenityTags: amenities,
      registryStatus: expiry ? resolveProgramRegistryStatus({ expiryDate: expiry } as DirectoryPartnerProgram) : "active",
      status: program.status === "paused" ? "inactive" : "active",
    };
    out.push(dp);
  }

  return out;
}

/**
 * Applies registry partner data onto a directory product and recomputes aggregate commission fields.
 */
export function applyPartnerRegistryToProduct(
  product: DirectoryProduct,
  snapshot: PartnerProgramsSnapshot | null
): DirectoryProduct {
  if (!snapshot || snapshot.programs.length === 0) {
    return product;
  }
  const merged = buildPartnerProgramsFromRegistry(product.id, snapshot);
  if (merged.length === 0) {
    return product;
  }
  const combined = mergeCatalogPartnerProgramsWithRegistry(product.partnerPrograms, merged);
  const patch = directoryProductPartnerProgramsSyncPatch(product, combined);
  return { ...product, ...patch };
}
