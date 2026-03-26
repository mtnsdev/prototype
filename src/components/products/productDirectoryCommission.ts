import type { DirectoryPartnerProgram, DirectoryProduct, DirectoryProgramRegistryStatus } from "@/types/product-directory";

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

/** Max display rate for one program (base vs active promotions). Null = no rate to show. */
export function programDisplayCommissionRate(program: DirectoryPartnerProgram): number | null {
  let max: number | null = program.commissionRate != null ? program.commissionRate : null;
  for (const pr of program.activePromotions ?? []) {
    max = max == null ? pr.effectiveRate : Math.max(max, pr.effectiveRate);
  }
  return max;
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
    activePromotions: p.activePromotions.map((x) => ({ ...x })),
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
    activePromotion: top?.activePromotions?.[0] ?? null,
  };
}
