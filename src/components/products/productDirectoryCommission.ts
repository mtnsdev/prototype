import type { DirectoryPartnerProgram, DirectoryProduct, DirectoryProgramRegistryStatus } from "@/types/product-directory";

/**
 * Commission display rules (product directory):
 * - **Card / list:** show the **highest guaranteed base rate** from linked partner programs (no folded incentives).
 * - **Filter “Has rate” / commission threshold:** same base-only numbers (`getDirectoryProductRegistryCommission`).
 * - **Incentive indicator:** flame / count via `getActiveIncentiveOfferCount` — never a combined “effective” headline on cards (April 17 2026).
 */

export type ProgramStatus = "active" | "inactive";

/** Demo “today” for expiry / expiring-soon derivation (stable in mocks). */
const REGISTRY_REFERENCE = new Date("2026-03-24T12:00:00Z");

export function resolveProgramRegistryStatus(program: DirectoryPartnerProgram): DirectoryProgramRegistryStatus {
  if (program.registryStatus) return program.registryStatus;
  if (program.status === "inactive") return "inactive";
  if (program.expiryDate == null || program.expiryDate === "") return "active";
  try {
    const exp = new Date(program.expiryDate);
    if (Number.isNaN(exp.getTime())) return "active";
    if (exp < REGISTRY_REFERENCE) return "expired";
    const days = (exp.getTime() - REGISTRY_REFERENCE.getTime()) / 86_400_000;
    if (days <= 30) return "expiring-soon";
    return "active";
  } catch {
    return "active";
  }
}

export function isProgramBookable(program: DirectoryPartnerProgram): boolean {
  const s = resolveProgramRegistryStatus(program);
  return s === "active" || s === "expiring-soon";
}

export function programFilterId(program: DirectoryPartnerProgram): string {
  return program.programId ?? program.id;
}

export function programDisplayName(program: DirectoryPartnerProgram): string {
  return program.programName ?? program.name;
}

/** Guaranteed base display rate for one program (registry merge stores base in `commissionRate`). */
export function programDisplayCommissionRate(program: DirectoryPartnerProgram): number | null {
  return program.commissionRate != null ? program.commissionRate : null;
}

/**
 * Highest commission among bookable linked partner programs (registry source of truth for cards).
 */
export function getDirectoryProductRegistryCommission(product: DirectoryProduct): number | null {
  const bookable = product.partnerPrograms.filter(isProgramBookable);
  if (bookable.length === 0) return null;
  const rates = bookable.map(programDisplayCommissionRate).filter((r): r is number => r != null);
  if (rates.length === 0) return null;
  const best = Math.max(...rates);
  return Number.isFinite(best) ? best : null;
}

export function productHasRatedCommission(product: DirectoryProduct): boolean {
  return getDirectoryProductRegistryCommission(product) != null;
}

/**
 * Active time-bound incentives from linked **bookable** partner programs (merged onto `activeIncentives`).
 */
export function countBookableActivePartnerProgramIncentives(product: DirectoryProduct): number {
  return product.partnerPrograms
    .filter(isProgramBookable)
    .reduce((sum, p) => sum + (p.activeIncentives?.length ?? 0), 0);
}

/** @deprecated Use `countBookableActivePartnerProgramIncentives`. */
export const countBookableActivePartnerProgramPromotions = countBookableActivePartnerProgramIncentives;

/**
 * Total active temporary incentives for cards / filters: commission advisories plus registry incentives.
 */
export function getActiveIncentiveOfferCount(product: DirectoryProduct): number {
  return (product.activeAdvisoryCount ?? 0) + countBookableActivePartnerProgramIncentives(product);
}

/** Bookable program used for commission + amenity highlights (prefers programs with a quoted rate). */
export function getTopBookableProgramByCommission(product: DirectoryProduct): DirectoryPartnerProgram | null {
  const bookable = product.partnerPrograms.filter(isProgramBookable);
  if (bookable.length === 0) return null;
  const withRate = bookable.filter((p) => programDisplayCommissionRate(p) != null);
  const pool = withRate.length > 0 ? withRate : bookable;
  const [first, ...rest] = pool;
  return rest.reduce((best, p) => {
    const ra = programDisplayCommissionRate(p) ?? -1;
    const rb = programDisplayCommissionRate(best) ?? -1;
    return ra > rb ? p : best;
  }, first);
}

/** Commission + amenities fingerprint — compare across programs on one product. */
export function programTermsSignature(program: DirectoryPartnerProgram): string {
  return `${program.commissionRate ?? ""}::${(program.amenities ?? "").trim()}`;
}

/** True when the product has 2+ bookable programs whose commission/amenities differ. */
export function productHasDistinctPartnerTerms(product: DirectoryProduct): boolean {
  const bookable = product.partnerPrograms.filter(isProgramBookable);
  if (bookable.length < 2) return false;
  return new Set(bookable.map(programTermsSignature)).size > 1;
}

export function daysUntilExpiry(iso: string | null | undefined): number | null {
  if (iso == null || iso === "") return null;
  try {
    const exp = new Date(iso);
    if (Number.isNaN(exp.getTime())) return null;
    return Math.ceil((exp.getTime() - REGISTRY_REFERENCE.getTime()) / 86_400_000);
  } catch {
    return null;
  }
}

export function isExpiringSoonDate(iso: string | null | undefined): boolean {
  const d = daysUntilExpiry(iso);
  return d != null && d > 0 && d <= 30;
}

function clonePartnerProgram(p: DirectoryPartnerProgram): DirectoryPartnerProgram {
  return {
    ...p,
    activeIncentives: p.activeIncentives.map((x) => ({ ...x })),
    amenityTags: p.amenityTags ? [...p.amenityTags] : undefined,
  };
}

/** After admin edits linked programs — deep-clones programs and syncs aggregate commission fields on the product. */
export function directoryProductPartnerProgramsSyncPatch(
  product: DirectoryProduct,
  partnerPrograms: DirectoryPartnerProgram[]
): Partial<DirectoryProduct> {
  const cloned = partnerPrograms.map(clonePartnerProgram);
  const synthetic: DirectoryProduct = {
    ...product,
    partnerPrograms: cloned,
    partnerProgramCount: cloned.length,
  };
  const rate = getDirectoryProductRegistryCommission(synthetic);
  const top = getTopBookableProgramByCommission(synthetic);
  return {
    partnerPrograms: cloned,
    partnerProgramCount: cloned.length,
    commissionRate: rate,
    effectiveCommissionRate: rate,
    baseCommissionRate: rate,
    activeIncentive: top?.activeIncentives?.[0] ?? null,
  };
}
