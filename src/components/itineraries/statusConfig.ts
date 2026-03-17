import type { ItineraryStatus } from "@/types/itinerary";

export const ITINERARY_STATUS_BADGES: Record<
  ItineraryStatus,
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: "bg-white/10 text-[rgba(245,245,245,0.7)] border-white/20" },
  proposed: { label: "Proposed", className: "bg-[var(--muted-info-bg)] text-[var(--muted-info-text)] border-[var(--muted-info-border)]" },
  confirmed: { label: "Confirmed", className: "bg-[var(--muted-success-bg)] text-[var(--muted-success-text)] border-[var(--muted-success-border)]" },
  in_progress: { label: "In progress", className: "bg-[var(--muted-amber-bg)] text-[var(--muted-amber-text)] border-[var(--muted-amber-border)]" },
  completed: { label: "Completed", className: "bg-[var(--muted-accent-bg)] text-[var(--muted-accent-text)] border-[var(--muted-accent-border)]" },
  cancelled: { label: "Cancelled", className: "bg-[var(--muted-error-bg)] text-[var(--muted-error-text)] border-[var(--muted-error-border)]" },
};

export function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return "Dates TBD";
  if (!end) return start ?? "—";
  if (!start) return end ?? "—";
  try {
    const s = new Date(start);
    const e = new Date(end);
    const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `${fmt(s)} – ${fmt(e)}`;
  } catch {
    return `${start} – ${end}`;
  }
}
