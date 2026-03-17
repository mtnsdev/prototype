/**
 * Itinerary permission helpers. Frontend-only; backend enforces separately.
 */

import type { Itinerary } from "@/types/itinerary";

export type CurrentUser = {
  id: number | string;
  role: string;
  agency_id?: string | null;
};

export function canEditItinerary(user: CurrentUser | null, itinerary: Itinerary | null): boolean {
  if (!user || !itinerary) return false;
  const uid = String(user.id);
  if (itinerary.primary_advisor_id === uid) return true;
  if ((user.role === "admin" || user.role === "owner") && user.agency_id && String(itinerary.agency_id) === String(user.agency_id))
    return true;
  return false;
}

export function canDeleteItinerary(user: CurrentUser | null, itinerary: Itinerary | null): boolean {
  if (!user || !itinerary) return false;
  return itinerary.primary_advisor_id === String(user.id);
}

export function canViewFinancials(user: CurrentUser | null): boolean {
  if (!user) return false;
  const u = user as { can_view_financials?: boolean };
  if (typeof u.can_view_financials === "boolean") return u.can_view_financials;
  return user.role === "admin" || user.role === "owner";
}

export function getItineraryDuration(itinerary: Itinerary): number {
  if (!itinerary.days?.length) return 0;
  return itinerary.days.length;
}
