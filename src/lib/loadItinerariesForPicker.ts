/**
 * Itinerary options for product flows (e.g. Add to itinerary).
 * Mirrors ItinerariesPage: real API when available, else fake catalog in preview / on failure.
 */

import { IS_PREVIEW_MODE } from "@/config/preview";
import { filterAndPaginateFakeItineraries } from "@/components/itineraries/fakeData";
import { getPreviewItinerarySource } from "@/lib/itineraryLocalOverlay";
import { fetchItineraryList, getItineraryId } from "@/lib/itineraries-api";
import type { Itinerary, ItineraryListParams } from "@/types/itinerary";

export type ItineraryPickerRow = { id: string; name: string; dayCount?: number };

function itineraryPickerDayCount(it: Itinerary): number | undefined {
  const days = it.days;
  if (!days || days.length === 0) return undefined;
  const maxDayNum = Math.max(...days.map((d) => d.day_number ?? 0));
  return Math.max(days.length, maxDayNum);
}

export async function loadItinerariesForPicker(opts: {
  agencyId?: string | null;
}): Promise<ItineraryPickerRow[]> {
  const agencyId = opts.agencyId != null && opts.agencyId !== "" ? String(opts.agencyId) : "agency-1";

  const params: ItineraryListParams = {
    tab: "agency",
    agency_id: agencyId,
    page: 1,
    limit: 100,
    sort_by: "updated_at",
    sort_order: "desc",
  };

  try {
    const data = await fetchItineraryList(params);
    const apiEmpty = !data.itineraries?.length && (data.total ?? 0) === 0;
    if (!IS_PREVIEW_MODE && !apiEmpty) {
      return (data.itineraries ?? []).map((it) => ({
        id: getItineraryId(it),
        name: it.trip_name?.trim() ? it.trip_name : "Untitled trip",
        dayCount: itineraryPickerDayCount(it),
      }));
    }
  } catch {
    /* use fake below */
  }

  const fake = filterAndPaginateFakeItineraries(getPreviewItinerarySource(), {
    tab: "agency",
    agencyId,
    page: 1,
    limit: 100,
    sortBy: "updated_at",
    sortOrder: "desc",
  });

  return fake.itineraries.map((it) => ({
    id: getItineraryId(it),
    name: it.trip_name?.trim() ? it.trip_name : "Untitled trip",
    dayCount: itineraryPickerDayCount(it),
  }));
}
