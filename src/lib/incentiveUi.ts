import type { Incentive, IncentiveDerivedKind } from "@/types/partner-programs";

/** Prototype “today” — aligned with directory commission reference date. */
export const INCENTIVE_REFERENCE_ISO = "2026-03-24T12:00:00.000Z";

/** @deprecated Use `INCENTIVE_REFERENCE_ISO`. */
export const PROMOTION_REFERENCE_ISO = INCENTIVE_REFERENCE_ISO;

/**
 * Classifier previously stored as `type` — derived from volumeMetric, stacksWithBase, and window shape.
 * (April 15 2026 spec: do not persist on Incentive.)
 */
export function deriveIncentiveKind(p: Incentive): IncentiveDerivedKind {
  if (p.volumeMetric != null) return "volume_incentive";
  if (p.stacksWithBase) return "bonus";
  const hasTravel = p.travelWindowStart != null || p.travelWindowEnd != null;
  if (hasTravel) return "seasonal";
  return "rate_override";
}

/** @deprecated Use `deriveIncentiveKind`. */
export const derivePromotionKind = deriveIncentiveKind;

export function formatIncentiveKindLabel(kind: IncentiveDerivedKind): string {
  return kind.replace(/_/g, " ");
}

/** @deprecated Use `formatIncentiveKindLabel`. */
export const formatPromotionKindLabel = formatIncentiveKindLabel;

function parseIso(iso: string | null | undefined): Date | null {
  if (iso == null || iso === "") return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Advisor-facing lifecycle for list styling (active / upcoming / expired).
 * Uses booking window when present; otherwise travel window; open-ended windows count as active when not past end.
 */
export function incentiveDisplayPhase(
  p: Incentive,
  ref: Date = new Date(INCENTIVE_REFERENCE_ISO)
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

/** @deprecated Use `incentiveDisplayPhase`. */
export const promotionDisplayPhase = incentiveDisplayPhase;

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

/** dd/mm/yyyy — advisor-facing compact copy (matches partner program previews). */
export function formatDateDMY(iso: string | null | undefined): string {
  const d = parseIso(iso);
  if (!d) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Separate Book / Travel lines for layouts that stack vertically. */
export function incentiveWindowParts(pr: Incentive): {
  bookLine: string | null;
  travelLine: string | null;
} {
  const bookRange =
    pr.bookingWindowStart || pr.bookingWindowEnd
      ? `${formatDateDMY(pr.bookingWindowStart)} – ${formatDateDMY(pr.bookingWindowEnd)}`
      : null;
  const travelRange =
    pr.travelWindowStart || pr.travelWindowEnd
      ? `${formatDateDMY(pr.travelWindowStart)} – ${formatDateDMY(pr.travelWindowEnd)}`
      : null;
  return {
    bookLine: bookRange ? `Book ${bookRange}` : null,
    travelLine: travelRange ? `Travel ${travelRange}` : null,
  };
}

/** One-line book / travel window summary for list cards and detail previews. */
export function incentiveWindowsCompact(pr: Incentive): string {
  const { bookLine, travelLine } = incentiveWindowParts(pr);
  const parts: string[] = [];
  if (bookLine) parts.push(bookLine);
  if (travelLine) parts.push(travelLine);
  return parts.length > 0 ? parts.join(" · ") : "Open-ended windows";
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
export function incentiveRecentlyExpired(p: Incentive, ref: Date = new Date(INCENTIVE_REFERENCE_ISO)): boolean {
  if (incentiveDisplayPhase(p, ref) !== "expired") return false;
  const be = parseIso(p.bookingWindowEnd) ?? parseIso(p.travelWindowEnd);
  if (!be) return false;
  const days = (ref.getTime() - be.getTime()) / 86_400_000;
  return days >= 0 && days <= 30;
}

/** @deprecated Use `incentiveRecentlyExpired`. */
export const promotionRecentlyExpired = incentiveRecentlyExpired;
