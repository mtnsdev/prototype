import type { Promotion, PromotionDerivedKind } from "@/types/partner-programs";

/** Prototype “today” — aligned with directory commission reference date. */
export const PROMOTION_REFERENCE_ISO = "2026-03-24T12:00:00.000Z";

/**
 * Classifier previously stored as `type` — derived from volumeMetric, stacksWithBase, and window shape.
 * (April 15 2026 spec: do not persist on Promotion.)
 */
export function derivePromotionKind(p: Promotion): PromotionDerivedKind {
  if (p.volumeMetric != null) return "volume_incentive";
  if (p.stacksWithBase) return "bonus";
  const hasTravel = p.travelWindowStart != null || p.travelWindowEnd != null;
  if (hasTravel) return "seasonal";
  return "rate_override";
}

export function formatPromotionKindLabel(kind: PromotionDerivedKind): string {
  return kind.replace(/_/g, " ");
}

function parseIso(iso: string | null | undefined): Date | null {
  if (iso == null || iso === "") return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Advisor-facing lifecycle for list styling (active / upcoming / expired).
 * Uses booking window when present; otherwise travel window; open-ended windows count as active when not past end.
 */
export function promotionDisplayPhase(
  p: Promotion,
  ref: Date = new Date(PROMOTION_REFERENCE_ISO)
): "active" | "upcoming" | "expired" {
  const bs = parseIso(p.bookingWindowStart);
  const be = parseIso(p.bookingWindowEnd);
  const ts = parseIso(p.travelWindowStart);
  const te = parseIso(p.travelWindowEnd);

  const hasBooking = bs != null || be != null;
  const hasTravel = ts != null || te != null;

  if (hasBooking) {
    if (bs && ref < bs) return "upcoming";
    if (be && ref > be) return "expired";
    return "active";
  }
  if (hasTravel) {
    if (ts && ref < ts) return "upcoming";
    if (te && ref > te) return "expired";
    return "active";
  }
  return "active";
}

export function daysFromRefToDate(ref: Date, iso: string | null | undefined): number | null {
  const d = parseIso(iso);
  if (!d) return null;
  return Math.ceil((d.getTime() - ref.getTime()) / 86_400_000);
}

export function formatDateShort(iso: string | null | undefined): string {
  const d = parseIso(iso);
  if (!d) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatWindowLine(
  label: string,
  start: string | null | undefined,
  end: string | null | undefined
): string {
  if (!start && !end) return `${label}: open`;
  return `${label}: ${formatDateShort(start)} → ${formatDateShort(end)}`;
}

/** Recently expired (within last 30 days of reference) for dimmed list styling. */
export function promotionRecentlyExpired(p: Promotion, ref: Date = new Date(PROMOTION_REFERENCE_ISO)): boolean {
  if (promotionDisplayPhase(p, ref) !== "expired") return false;
  const be = parseIso(p.bookingWindowEnd) ?? parseIso(p.travelWindowEnd);
  if (!be) return false;
  const days = (ref.getTime() - be.getTime()) / 86_400_000;
  return days >= 0 && days <= 30;
}
