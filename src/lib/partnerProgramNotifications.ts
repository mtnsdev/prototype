import type { PartnerProgramsSnapshot } from "@/types/partner-programs";
import {
  INCENTIVE_REFERENCE_ISO,
  daysFromRefToDate,
  incentiveDisplayPhase,
} from "@/lib/incentiveUi";

/** Fire the day before the booking/travel window opens (spec: 1 day before). */
export const PROMOTION_START_ALERT_DAYS_BEFORE = 1;

/** Fire three days before the booking window closes (spec: 3 days before). */
export const PROMOTION_END_ALERT_DAYS_BEFORE = 3;

/** Property link and program renewal reminders while within this many days of expiry. */
export const LINK_AND_RENEWAL_ALERT_MAX_DAYS = 30;

/** @deprecated Use LINK_AND_RENEWAL_ALERT_MAX_DAYS or the specific promo constants. */
export const PARTNER_ALERT_HORIZON_DAYS = LINK_AND_RENEWAL_ALERT_MAX_DAYS;

function parseDay(iso: string | null | undefined): Date | null {
  if (iso == null || iso === "") return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function programById(snapshot: PartnerProgramsSnapshot, id: string) {
  return snapshot.programs.find((p) => p.id === id);
}

export type PartnerProgramAlertKind =
  | "promotion_starting"
  | "promotion_ending"
  | "program_renewal"
  | "partner_link_expiring";

/** Feed item before mapping to `AppNotification`. */
export interface PartnerProgramAlert {
  id: string;
  kind: PartnerProgramAlertKind;
  title: string;
  body: string;
  timestamp: string;
  actionUrl?: string;
  actionLabel?: string;
}

/**
 * Synthetic alerts from registry snapshot (promotions, program renewals, expiring property links).
 * Uses the same reference “today” as `incentiveUi` for stable prototype behavior.
 *
 * - `promotion_starting`: when the window opens **tomorrow** (exactly 1 calendar day away).
 * - `promotion_ending`: when the booking window ends in **exactly 3 days** (spec April 16).
 * - Link expiry & renewal: any time within **30 days** of expiry (commission_expiring style).
 */
export function buildPartnerProgramAlerts(
  snapshot: PartnerProgramsSnapshot,
  ref: Date = new Date(INCENTIVE_REFERENCE_ISO)
): PartnerProgramAlert[] {
  const out: PartnerProgramAlert[] = [];

  for (const p of snapshot.incentives) {
    const prog = programById(snapshot, p.programId);
    const programName = prog?.name ?? "Partner program";
    const phase = incentiveDisplayPhase(p, ref);

    const bs = parseDay(p.bookingWindowStart);
    const be = parseDay(p.bookingWindowEnd);
    const ts = parseDay(p.travelWindowStart);
    const te = parseDay(p.travelWindowEnd);
    const hasBooking = bs != null || be != null;

    if (phase === "upcoming") {
      const startIso = hasBooking
        ? p.bookingWindowStart || p.travelWindowStart
        : p.travelWindowStart || p.bookingWindowStart;
      if (!startIso) continue;
      const startD = parseDay(startIso);
      if (!startD || ref >= startD) continue;
      const days = daysFromRefToDate(ref, startIso);
      if (days === PROMOTION_START_ALERT_DAYS_BEFORE) {
        out.push({
          id: `pp-promo-start-${p.id}`,
          kind: "promotion_starting",
          title: `Incentive starts tomorrow — ${p.name}`,
          body: `${programName}: booking window opens in ${PROMOTION_START_ALERT_DAYS_BEFORE} day.`,
          timestamp: ref.toISOString(),
          actionUrl: "/dashboard/products?tab=partner",
          actionLabel: "Programs",
        });
      }
    }

    if (phase === "active") {
      const endIso = hasBooking ? p.bookingWindowEnd ?? p.travelWindowEnd : p.travelWindowEnd ?? p.bookingWindowEnd;
      if (!endIso) continue;
      const end = parseDay(endIso);
      if (!end || ref >= end) continue;
      const days = daysFromRefToDate(ref, endIso);
      if (days === PROMOTION_END_ALERT_DAYS_BEFORE) {
        out.push({
          id: `pp-promo-end-${p.id}`,
          kind: "promotion_ending",
          title: `Incentive ending soon — ${p.name}`,
          body: `${programName}: booking window closes in ${PROMOTION_END_ALERT_DAYS_BEFORE} days.`,
          timestamp: ref.toISOString(),
          actionUrl: "/dashboard/products?tab=partner",
          actionLabel: "Programs",
        });
      }
    }
  }

  for (const program of snapshot.programs) {
    if (program.status === "expired" || program.status === "archived") continue;
    const rd = program.renewalDate;
    if (!rd) continue;
    const renewalIso = rd.includes("T") ? rd : `${rd}T12:00:00.000Z`;
    const renewal = parseDay(renewalIso);
    if (!renewal || ref >= renewal) continue;
    const days = daysFromRefToDate(ref, renewalIso);
    if (
      days == null ||
      days <= 0 ||
      days > LINK_AND_RENEWAL_ALERT_MAX_DAYS
    ) {
      continue;
    }
    out.push({
      id: `pp-renewal-${program.id}`,
      kind: "program_renewal",
      title: `Agreement renewal — ${program.name}`,
      body: `Program agreement renews in ${days} day${days === 1 ? "" : "s"} (${renewalIso.slice(0, 10)}).`,
      timestamp: ref.toISOString(),
      actionUrl: "/dashboard/products?tab=partner",
      actionLabel: "Programs",
    });
  }

  for (const link of snapshot.links) {
    if (link.status === "expired") continue;
    const ex = link.expiresAt;
    if (!ex) continue;
    const end = parseDay(ex);
    if (!end || ref >= end) continue;
    const days = daysFromRefToDate(ref, ex);
    if (days == null || days <= 0 || days > LINK_AND_RENEWAL_ALERT_MAX_DAYS) continue;
    const prog = programById(snapshot, link.programId);
    out.push({
      id: `pp-link-${link.id}`,
      kind: "partner_link_expiring",
      title: `Property link expiring — ${prog?.name ?? "Partner program"}`,
      body: `Linked commission terms for this property end in ${days} day${days === 1 ? "" : "s"}.`,
      timestamp: ref.toISOString(),
      actionUrl: "/dashboard/products?tab=partner",
      actionLabel: "Programs",
    });
  }

  return out;
}
