import type { CommissionAlertItem, NewsAlertItem } from "@/types/briefing";

export type HubTab = "notes" | "alerts" | "announcements" | "incentives";

export type HubAnnouncement = {
  id: string;
  title: string;
  content: string;
  author: string;
  pinned: boolean;
  /** Display string, e.g. "2 days ago" or "Edited just now" */
  timeAgo: string;
};

export const HUB_TABS: { id: HubTab; label: string; hint: string }[] = [
  { id: "notes", label: "Agency notes", hint: "Pinned for everyone" },
  { id: "alerts", label: "News & alerts", hint: "Industry & partner news" },
  { id: "announcements", label: "Announcements", hint: "Team updates" },
  { id: "incentives", label: "Partner incentives", hint: "Offers & bonuses" },
];

export const HUB_ANNOUNCEMENTS_SEED: HubAnnouncement[] = [
  {
    id: "ann-001",
    title: "2026 Hotel Launches",
    content:
      "New openings to watch:\n• Aman Kyoto — Q4 2026 (24 suites)\n• Four Seasons Mallorca — June 2026\n• Rosewood São Paulo — March 2026\n\nReach out if you want early access to any of these.",
    author: "Kristin",
    pinned: true,
    timeAgo: "2 days ago",
  },
  {
    id: "ann-002",
    title: "Virtuoso Travel Week Reminder",
    content: "Registration closes April 15. Please submit your preferred sessions by Friday.",
    author: "Kristin",
    pinned: false,
    timeAgo: "5 days ago",
  },
];

export const CATEGORY_OPTIONS: { value: NewsAlertItem["category"]; label: string }[] = [
  { value: "renovation", label: "Renovation" },
  { value: "opening", label: "Opening" },
  { value: "closure", label: "Closure" },
  { value: "safety", label: "Safety" },
  { value: "promotion", label: "Promotion" },
  { value: "industry", label: "Industry" },
  { value: "regulatory", label: "Regulatory" },
];

export const SEVERITY_OPTIONS: { value: NewsAlertItem["severity"]; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
];

export const SELECT_TRIGGER_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function addDaysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return formatLocalYmd(d);
}

/** YYYY-MM-DD in local time */
export function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Calendar days from start of today to start of endDate (YYYY-MM-DD). Negative if end is before today. */
export function calendarDaysFromTodayToDate(endYmd: string): number {
  const [y, m, d] = endYmd.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const end = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
}

/** Build ISO timestamp for storage: optional HH:mm (24h), else end of that local day. */
export function toValidUntilIso(endYmd: string, endHm: string): string {
  const [y, mo, d] = endYmd.split("-").map(Number);
  if (!y || !mo || !d) {
    return new Date().toISOString();
  }
  if (endHm && /^\d{1,2}:\d{2}$/.test(endHm)) {
    const [hh, mm] = endHm.split(":").map((x) => Number(x));
    const dt = new Date(y, mo - 1, d, hh, mm, 0, 0);
    return dt.toISOString();
  }
  const dt = new Date(y, mo - 1, d, 23, 59, 59, 999);
  return dt.toISOString();
}

/** Whole days from now until end instant (minimum 0). Accepts YYYY-MM-DD (end of local day) or full ISO. */
export function wholeDaysRemainingUntil(validUntil: string): number {
  let endMs: number;
  const t = validUntil.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const [y, m, d] = t.split("-").map(Number);
    endMs = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
  } else {
    endMs = new Date(validUntil).getTime();
  }
  if (Number.isNaN(endMs)) return 0;
  return Math.max(0, Math.ceil((endMs - Date.now()) / 86400000));
}

/** Split stored value into date + time inputs (local). Empty time means all day. */
export function parseValidUntilForForm(validUntil: string): { endYmd: string; endHm: string } {
  const t = validUntil.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return { endYmd: t, endHm: "" };
  }
  const d = new Date(validUntil);
  if (Number.isNaN(d.getTime())) {
    return { endYmd: formatLocalYmd(new Date()), endHm: "" };
  }
  const endYmd = formatLocalYmd(d);
  const h = d.getHours();
  const min = d.getMinutes();
  const s = d.getSeconds();
  const isEndOfDay = h === 23 && min === 59 && s >= 59;
  if (isEndOfDay) {
    return { endYmd, endHm: "" };
  }
  const endHm = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  return { endYmd, endHm };
}

/** Short label for list rows, e.g. "Through Jun 30 · 5:00 PM" */
export function formatIncentiveEndLabel(validUntil: string): string {
  const t = validUntil.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const [y, m, d] = t.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const dateStr = dt.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `Through ${dateStr}`;
  }
  const d = new Date(validUntil);
  if (Number.isNaN(d.getTime())) return "";
  const dateStr = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const h = d.getHours();
  const min = d.getMinutes();
  const s = d.getSeconds();
  const isEndOfDay = h === 23 && min === 59 && s >= 59;
  if (isEndOfDay) {
    return `Through ${dateStr}`;
  }
  const timeStr = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `Through ${dateStr} · ${timeStr}`;
}

export function alertTimeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days >= 1) return `${days}d ago`;
  if (hours >= 1) return `${hours}h ago`;
  return `${Math.floor(diff / 60000)}m ago`;
}

export function severityBorder(sev: NewsAlertItem["severity"]): string {
  if (sev === "urgent")
    return "border-[var(--muted-error-border)] border-l-[3px] border-l-[var(--color-error)]";
  if (sev === "warning")
    return "border-[var(--muted-warning-border)] border-l-[3px] border-l-[var(--color-warning)]";
  return "border-border border-l-[3px] border-l-muted-foreground/30";
}

export function incentiveBorder(u: CommissionAlertItem["urgency"]): string {
  if (u === "urgent")
    return "border-[var(--muted-error-border)] border-l-[3px] border-l-[var(--color-error)]";
  if (u === "soon")
    return "border-[var(--muted-warning-border)] border-l-[3px] border-l-[var(--color-warning)]";
  return "border-border border-l-[3px] border-l-[var(--color-info)]";
}

export function formatSavedAt(d: Date): string {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
