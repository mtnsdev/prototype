import type { KeyDate, PreferenceSignal, TouchPoint, Trip } from "@/types/vic-profile";

export function confidenceRank(c: PreferenceSignal["confidence"]): number {
  if (c === "high") return 3;
  if (c === "medium") return 2;
  return 1;
}

export function sortQuickPreferences(signals: PreferenceSignal[]): PreferenceSignal[] {
  return [...signals].sort((a, b) => {
    const cr = confidenceRank(b.confidence) - confidenceRank(a.confidence);
    if (cr !== 0) return cr;
    return new Date(b.lastConfirmed).getTime() - new Date(a.lastConfirmed).getTime();
  });
}

export function engagementHealth(touchPoints: TouchPoint[]): "green" | "amber" | "red" {
  const meaningful = touchPoints.filter((t) => t.type !== "note");
  if (meaningful.length === 0) return "red";
  const latest = [...meaningful].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];
  const days = (Date.now() - new Date(latest.date).getTime()) / 86400000;
  if (days < 30) return "green";
  if (days <= 90) return "amber";
  return "red";
}

/** Next upcoming key date from today (recurring: use current year if passed). */
export function upcomingKeyDates(dates: KeyDate[], ref = new Date()): KeyDate[] {
  const startOfToday = new Date(ref);
  startOfToday.setHours(0, 0, 0, 0);
  const y = ref.getFullYear();
  const scored = dates.map((kd) => {
    const d = new Date(kd.date);
    if (kd.recurring) {
      d.setFullYear(y);
      if (d < startOfToday) d.setFullYear(y + 1);
    }
    return { kd, t: d.getTime() };
  });
  return scored
    .filter((x) => x.t >= startOfToday.getTime())
    .sort((a, b) => a.t - b.t)
    .map((x) => x.kd);
}

export function tripNights(trip: Trip): number {
  return trip.destinations.reduce(
    (acc, d) => acc + d.properties.reduce((n, p) => n + p.nights, 0),
    0
  );
}

export function formatShortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    n
  );
}
