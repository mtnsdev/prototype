/**
 * VIC HTTP API. All requests use Authorization: Bearer token from localStorage.
 * Backend is assumed to expose these endpoints.
 */

import type { VIC, AcuitySettings, VICListParams, VICListResponse } from "@/types/vic";

/** Prefer id; fallback to _id for legacy API. */
export function getVICId(vic: VIC): string {
  return (vic as { id?: string; _id?: string }).id ?? (vic as { _id?: string })._id ?? "";
}

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    try {
      const raw = localStorage.getItem("user_data");
      if (raw) {
        const u = JSON.parse(raw) as { id?: number | string };
        if (u?.id != null) (headers as Record<string, string>)["x-mock-advisor-id"] = String(u.id);
      }
    } catch {
      /* ignore */
    }
  }
  return headers;
}

function buildQuery(params: VICListParams): string {
  const sp = new URLSearchParams();
  if (params.agency_id != null && params.agency_id !== "") sp.set("agency_id", params.agency_id);
  if (params.search != null && params.search !== "") sp.set("search", params.search);
  if (params.tab != null) sp.set("tab", params.tab);
  if (params.status != null) sp.set("status", params.status);
  if (params.tags != null && params.tags !== "") sp.set("tags", params.tags);
  if (params.country != null && params.country !== "") sp.set("country", params.country);
  const acuityStatus = params.acuity_status ?? params.acuityStatus;
  if (acuityStatus != null) sp.set("acuity_status", acuityStatus);
  if (params.assigned_advisor_id != null && params.assigned_advisor_id !== "") sp.set("assigned_advisor_id", params.assigned_advisor_id);
  if (params.passport_expiry_warning === true) sp.set("passport_expiry_warning", "true");
  const sortBy = params.sort_by ?? params.sortBy;
  const sortOrder = params.sort_order ?? params.sortOrder;
  if (sortBy != null) sp.set("sort_by", sortBy);
  if (sortOrder != null) sp.set("sort_order", sortOrder);
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export async function fetchVICList(params: VICListParams): Promise<VICListResponse> {
  const res = await fetch(`/api/vics${buildQuery(params)}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function fetchVIC(id: string): Promise<VIC> {
  const res = await fetch(`/api/vics/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createVIC(body: Partial<VIC>): Promise<VIC> {
  const res = await fetch("/api/vics", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function updateVIC(id: string, body: Partial<VIC>): Promise<VIC> {
  const res = await fetch(`/api/vics/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function deleteVIC(id: string): Promise<void> {
  const res = await fetch(`/api/vics/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
}

export async function importVICs(formData: FormData): Promise<{ imported: number; skipped: number; ids?: string[] }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  const res = await fetch("/api/vics/import", { method: "POST", headers, body: formData });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function exportVICs(params: VICListParams): Promise<Blob> {
  const q = buildQuery(params);
  const res = await fetch(`/api/vics/export${q}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.blob();
}

export async function triggerAcuitySingle(vicId: string): Promise<{ status: string }> {
  const res = await fetch(`/api/vics/${vicId}/acuity`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function triggerAcuityBulk(vicIds: string[]): Promise<{ taskId?: string; status: string }> {
  const res = await fetch("/api/vics/acuity/bulk", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ vicIds }),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function fetchAcuityStatus(vicId: string): Promise<{ status: string; last_run?: string; profile?: string }> {
  const res = await fetch(`/api/vics/${vicId}/acuity/status`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function shareVIC(
  vicId: string,
  body:
    | { advisor_id: string; access_level: "view" | "edit"; sharing_level?: "none" | "basic" | "full" }
    | { team_id: string; access_level: "view" | "edit"; sharing_level?: "none" | "basic" | "full" }
): Promise<void> {
  const res = await fetch(`/api/vics/${vicId}/share`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
}

export async function unshareVIC(vicId: string, advisorId: string): Promise<void> {
  const res = await fetch(`/api/vics/${vicId}/share/${advisorId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
}

export async function unshareVICTeam(vicId: string, teamId: string): Promise<void> {
  const res = await fetch(`/api/vics/${vicId}/share/team/${teamId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
}

export async function linkEntity(
  vicId: string,
  body: { entity_type: "product" | "itinerary"; entity_id: string }
): Promise<void> {
  const res = await fetch(`/api/vics/${vicId}/link`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
}

export async function unlinkEntity(vicId: string, entityId: string): Promise<void> {
  const res = await fetch(`/api/vics/${vicId}/link/${entityId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
}

export async function fetchAcuitySettings(): Promise<AcuitySettings | null> {
  const res = await fetch("/api/workspace/acuity-settings", { headers: getAuthHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function updateAcuitySettings(settings: AcuitySettings): Promise<AcuitySettings> {
  const res = await fetch("/api/workspace/acuity-settings", {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}
