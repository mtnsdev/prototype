import type { PartnerProgramsSnapshot } from "@/types/partner-programs";
import {
  PROMOTION_REFERENCE_ISO,
  daysFromRefToDate,
  promotionDisplayPhase,
} from "@/lib/promotionUi";

/** Calendar-day lookahead for “starts soon” / “ends soon” / link & renewal reminders. */
export const PARTNER_ALERT_HORIZON_DAYS = 14;

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
 * Uses the same reference “today” as `promotionUi` for stable prototype behavior.
 */
export function buildPartnerProgramAlerts(
  snapshot: PartnerProgramsSnapshot,
  ref: Date = new Date(PROMOTION_REFERENCE_ISO)
): PartnerProgramAlert[] {
  const horizon = PARTNER_ALERT_HORIZON_DAYS;
  const out: PartnerProgramAlert[] = [];

  for (const p of snapshot.promotions) {
    const prog = programById(snapshot, p.programId);
    const programName = prog?.name ?? "Partner program";
    const phase = promotionDisplayPhase(p, ref);

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
      if (days != null && days > 0 && days <= horizon) {
          out.push({
            id: `pp-promo-start-${p.id}`,
            kind: "promotion_starting",
            title: `Incentive starts soon — ${p.name}`,
            body: `${programName}: booking/travel window opens in ${days} day${days === 1 ? "" : "s"}.`,
            timestamp: ref.toISOString(),
            actionUrl: "/dashboard/settings/programs",
            actionLabel: "Programs",
          });
      }
    }

    if (phase === "active") {
      const endIso = hasBooking ? p.bookingWindowEnd || p.travelWindowEnd : p.travelWindowEnd || p.bookingWindowEnd;
      if (!endIso) continue;
      const end = parseDay(endIso);
      if (!end || ref >= end) continue;
      const days = daysFromRefToDate(ref, endIso);
      if (days != null && days > 0 && days <= horizon) {
          out.push({
            id: `pp-promo-end-${p.id}`,
            kind: "promotion_ending",
            title: `Incentive ending soon — ${p.name}`,
            body: `${programName}: current window closes in ${days} day${days === 1 ? "" : "s"}.`,
            timestamp: ref.toISOString(),
            actionUrl: "/dashboard/settings/programs",
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
    if (days == null || days <= 0 || days > horizon) continue;
    out.push({
      id: `pp-renewal-${program.id}`,
      kind: "program_renewal",
      title: `Agreement renewal — ${program.name}`,
      body: `Program agreement renews in ${days} day${days === 1 ? "" : "s"} (${renewalIso.slice(0, 10)}).`,
      timestamp: ref.toISOString(),
      actionUrl: "/dashboard/settings/programs",
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
    if (days == null || days <= 0 || days > horizon) continue;
    const prog = programById(snapshot, link.programId);
    out.push({
      id: `pp-link-${link.id}`,
      kind: "partner_link_expiring",
      title: `Property link expiring — ${prog?.name ?? "Partner program"}`,
      body: `Linked commission terms for this property end in ${days} day${days === 1 ? "" : "s"}.`,
      timestamp: ref.toISOString(),
      actionUrl: "/dashboard/settings/programs",
      actionLabel: "Programs",
    });
  }

  return out;
}
