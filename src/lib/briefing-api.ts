/**
 * Briefing Room HTTP API. Calls endpoints as specified; uses mock when backend unavailable.
 */

import { IS_PREVIEW_MODE } from "@/config/preview";
import { getMockBriefingWidgets } from "@/components/briefing/briefingMockData";
import type { BriefingWidget } from "@/types/briefing";

const BRIEFING_WIDGETS_FETCH_MS = 15_000;

function fetchTimeoutSignal(): AbortSignal | undefined {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(BRIEFING_WIDGETS_FETCH_MS);
  }
  return undefined;
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  return headers;
}

export type FetchBriefingWidgetsForDashboardResult =
  | { ok: true; widgets: BriefingWidget[] }
  | { ok: false; error: string };

/** Loads dashboard widgets; does not fall back to mock on failure (use for user-visible errors + retry). */
export async function fetchBriefingWidgetsForDashboard(
  userId?: string,
): Promise<FetchBriefingWidgetsForDashboardResult> {
  if (IS_PREVIEW_MODE) {
    return { ok: true, widgets: getMockBriefingWidgets() };
  }
  const q = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  try {
    const res = await fetch(`/api/briefing/widgets${q}`, {
      headers: getAuthHeaders(),
      signal: fetchTimeoutSignal(),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return {
        ok: false,
        error: errBody?.trim() || `Could not load widgets (HTTP ${res.status})`,
      };
    }
    const data = (await res.json()) as { widgets?: BriefingWidget[] } | BriefingWidget[];
    const raw = Array.isArray(data) ? data : data.widgets;
    return { ok: true, widgets: Array.isArray(raw) ? raw : [] };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Network error — check your connection and try again.",
    };
  }
}

export async function fetchBriefingWidgets(userId?: string): Promise<BriefingWidget[]> {
  if (IS_PREVIEW_MODE) {
    return getMockBriefingWidgets();
  }
  const q = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  try {
    const res = await fetch(`/api/briefing/widgets${q}`, {
      headers: getAuthHeaders(),
      signal: fetchTimeoutSignal(),
    });
    if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
    const data = await res.json();
    return Array.isArray(data.widgets) ? data.widgets : data;
  } catch {
    return getMockBriefingWidgets();
  }
}

export async function saveBriefingWidgets(widgets: BriefingWidget[]): Promise<BriefingWidget[]> {
  if (IS_PREVIEW_MODE) return widgets;
  try {
    const res = await fetch("/api/briefing/widgets", {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ widgets }),
    });
    if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
    const data = await res.json();
    return Array.isArray(data.widgets) ? data.widgets : data;
  } catch {
    return widgets;
  }
}

export async function fetchNewsAlerts(params?: { limit?: number; severity?: string }): Promise<unknown[]> {
  if (IS_PREVIEW_MODE) return [];
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.severity) sp.set("severity", params.severity);
  const q = sp.toString() ? `?${sp}` : "";
  try {
    const res = await fetch(`/api/briefing/news-alerts${q}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchPartnerUpdates(params?: { limit?: number; action_required?: boolean }): Promise<unknown[]> {
  if (IS_PREVIEW_MODE) return [];
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.action_required != null) sp.set("action_required", String(params.action_required));
  const q = sp.toString() ? `?${sp}` : "";
  try {
    const res = await fetch(`/api/briefing/partner-updates${q}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchActionItems(userId?: string, status?: string): Promise<unknown[]> {
  if (IS_PREVIEW_MODE) return [];
  const sp = new URLSearchParams();
  if (userId) sp.set("user_id", userId);
  if (status) sp.set("status", status);
  const q = sp.toString() ? `?${sp}` : "";
  try {
    const res = await fetch(`/api/briefing/action-items${q}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return [];
  }
}

export async function updateActionItemStatus(itemId: string, status: string): Promise<void> {
  if (IS_PREVIEW_MODE) return;
  try {
    const res = await fetch(`/api/briefing/action-items/${itemId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error();
  } catch {
    // no-op
  }
}

export async function fetchUpcomingTrips(userId?: string, daysAhead?: number): Promise<unknown[]> {
  if (IS_PREVIEW_MODE) return [];
  const sp = new URLSearchParams();
  if (userId) sp.set("user_id", userId);
  if (daysAhead != null) sp.set("days_ahead", String(daysAhead));
  const q = sp.toString() ? `?${sp}` : "";
  try {
    const res = await fetch(`/api/briefing/upcoming-trips${q}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchBriefingCalendar(userId?: string, month?: string, year?: string): Promise<unknown[]> {
  if (IS_PREVIEW_MODE) return [];
  const sp = new URLSearchParams();
  if (userId) sp.set("user_id", userId);
  if (month) sp.set("month", month);
  if (year) sp.set("year", year);
  const q = sp.toString() ? `?${sp}` : "";
  try {
    const res = await fetch(`/api/briefing/calendar${q}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchRecentActivity(userId?: string, limit?: number): Promise<unknown[]> {
  if (IS_PREVIEW_MODE) return [];
  const sp = new URLSearchParams();
  if (userId) sp.set("user_id", userId);
  if (limit != null) sp.set("limit", String(limit));
  const q = sp.toString() ? `?${sp}` : "";
  try {
    const res = await fetch(`/api/briefing/recent-activity${q}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return [];
  }
}
