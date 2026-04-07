import { WidgetType, type BriefingWidget } from "@/types/briefing";
import { compareBriefingWidgetsByDefaultOrder } from "@/lib/briefing-widget-order";

export interface BriefingLayoutPrefs {
  hiddenIds: string[];
  order: string[];
  hideAnnouncements?: boolean;
}

const STORAGE_PREFIX = "enable.briefing.layout.v2";

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function parseBriefingLayoutPrefs(raw: unknown): BriefingLayoutPrefs | null {
  if (raw === null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!isStringArray(o.hiddenIds) || !isStringArray(o.order)) return null;
  if (o.hideAnnouncements !== undefined && typeof o.hideAnnouncements !== "boolean") return null;
  return {
    hiddenIds: o.hiddenIds,
    order: o.order,
    ...(typeof o.hideAnnouncements === "boolean" ? { hideAnnouncements: o.hideAnnouncements } : {}),
  };
}

export function briefingLayoutStorageKey(userId: string | undefined): string {
  return `${STORAGE_PREFIX}:${userId ?? "anonymous"}`;
}

export function loadBriefingLayoutPrefs(userId: string | undefined): BriefingLayoutPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(briefingLayoutStorageKey(userId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parseBriefingLayoutPrefs(parsed);
  } catch {
    return null;
  }
}

export function saveBriefingLayoutPrefs(userId: string | undefined, prefs: BriefingLayoutPrefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(briefingLayoutStorageKey(userId), JSON.stringify(prefs));
  } catch {
    /* quota / private mode */
  }
}

/** Drop unknown ids; append any catalog ids missing from saved order (stable for new API widgets). */
export function mergeOrderWithCatalog(savedOrder: string[], catalogOrder: string[]): string[] {
  const catalogSet = new Set(catalogOrder);
  const filtered = savedOrder.filter((id) => catalogSet.has(id));
  const missing = catalogOrder.filter((id) => !filtered.includes(id));
  return [...filtered, ...missing];
}

export function defaultCatalogOrder(widgets: BriefingWidget[]): string[] {
  return [...widgets]
    .filter((w) => w.widget_type !== WidgetType.QuickStart)
    .sort(compareBriefingWidgetsByDefaultOrder)
    .map((w) => w.id);
}
