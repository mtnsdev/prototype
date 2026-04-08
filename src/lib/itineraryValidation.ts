import type { Itinerary, ItineraryEvent } from "@/types/itinerary";

export type ItineraryIssue = {
  id: string;
  message: string;
};

function parseIsoDate(s?: string): number | null {
  if (!s?.trim()) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

function dayHasTimedEvents(events: ItineraryEvent[]): boolean {
  return events.some((e) => !!(e.start_time?.trim() || e.end_time?.trim()));
}

export function getItineraryIssues(itinerary: Itinerary): ItineraryIssue[] {
  const issues: ItineraryIssue[] = [];
  const days = itinerary.days ?? [];
  const tripStart = parseIsoDate(itinerary.trip_start_date);
  const tripEnd = parseIsoDate(itinerary.trip_end_date);

  if (days.length === 0) {
    issues.push({ id: "no-days", message: "No days in the itinerary yet." });
  }

  const emptyDays = days.filter((d) => (d.events?.length ?? 0) === 0);
  if (emptyDays.length > 0 && days.length > 1) {
    issues.push({
      id: "empty-days",
      message: `${emptyDays.length} day(s) have no events — double-check the flow.`,
    });
  }

  const tentative = days.flatMap((d) =>
    (d.events ?? []).filter((e) => e.status === "tentative").map((e) => ({ day: d.day_number, e }))
  );
  if (tentative.length > 0) {
    issues.push({
      id: "tentative",
      message: `${tentative.length} event(s) still tentative — confirm or update before publishing.`,
    });
  }

  for (const d of days) {
    const evs = d.events ?? [];
    if (evs.length >= 2 && dayHasTimedEvents(evs)) {
      const missingTime = evs.filter((e) => e.status !== "cancelled" && !e.start_time?.trim() && !e.end_time?.trim());
      if (missingTime.length > 0 && missingTime.length < evs.length) {
        issues.push({
          id: `times-day-${d.day_number}`,
          message: `Day ${d.day_number}: some events have times and some do not — clients may read the order as unclear.`,
        });
        break;
      }
    }
  }

  for (const d of days) {
    const dayDate = parseIsoDate(d.date);
    if (dayDate != null && tripStart != null && dayDate < tripStart) {
      issues.push({
        id: `day-before-trip-${d.day_number}`,
        message: `Day ${d.day_number} is dated before the trip start.`,
      });
      break;
    }
    if (dayDate != null && tripEnd != null && dayDate > tripEnd) {
      issues.push({
        id: `day-after-trip-${d.day_number}`,
        message: `Day ${d.day_number} is dated after the trip end.`,
      });
      break;
    }
  }

  for (const d of days) {
    for (const e of d.events ?? []) {
      if (e.event_type !== "flight") continue;
      if (e.status === "cancelled") continue;
      const dep = e.departure_airport?.trim();
      const arr = e.arrival_airport?.trim();
      if (!dep || !arr) {
        issues.push({
          id: `flight-airports-${e.id}`,
          message: `Flight “${e.title}” is missing departure or arrival airport codes.`,
        });
      }
    }
  }

  return issues;
}
