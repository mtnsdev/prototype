/**
 * Itineraries HTTP API. Calls endpoints as specified; backend built separately.
 */

import type {
  Itinerary,
  ItineraryDay,
  ItineraryEvent,
  ItineraryListParams,
  ItineraryListResponse,
  ItineraryStatus,
} from "@/types/itinerary";

export function getItineraryId(it: Itinerary): string {
  return (it as { id?: string; _id?: string }).id ?? (it as { _id?: string })._id ?? "";
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  return headers;
}

function buildQuery(params: ItineraryListParams): string {
  const sp = new URLSearchParams();
  if (params.agency_id != null && params.agency_id !== "") sp.set("agency_id", params.agency_id);
  if (params.search != null && params.search !== "") sp.set("search", params.search);
  if (params.status != null) sp.set("status", params.status);
  if (params.vic_id != null && params.vic_id !== "") sp.set("vic_id", params.vic_id);
  if (params.destination_countries != null && params.destination_countries.length > 0) {
    sp.set("destinations", params.destination_countries.join(","));
  }
  if (params.date_from != null) sp.set("date_from", params.date_from);
  if (params.date_to != null) sp.set("date_to", params.date_to);
  if (params.pipeline_stage != null) sp.set("pipeline_stage", params.pipeline_stage);
  if (params.tab != null) sp.set("tab", params.tab);
  if (params.sort_by != null) sp.set("sort_by", params.sort_by);
  if (params.sort_order != null) sp.set("sort_order", params.sort_order);
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export async function fetchItineraryList(params: ItineraryListParams): Promise<ItineraryListResponse> {
  const res = await fetch(`/api/itineraries${buildQuery(params)}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function fetchItinerary(itineraryId: string): Promise<Itinerary> {
  const res = await fetch(`/api/itineraries/${itineraryId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createItinerary(body: Partial<Itinerary>): Promise<Itinerary> {
  const res = await fetch("/api/itineraries", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function updateItinerary(itineraryId: string, body: Partial<Itinerary>): Promise<Itinerary> {
  const res = await fetch(`/api/itineraries/${itineraryId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function deleteItinerary(itineraryId: string): Promise<void> {
  const res = await fetch(`/api/itineraries/${itineraryId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
}

export async function addItineraryDay(itineraryId: string, body: Partial<ItineraryDay>): Promise<Itinerary> {
  const res = await fetch(`/api/itineraries/${itineraryId}/days`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function updateItineraryDay(
  itineraryId: string,
  dayNumber: number,
  body: Partial<ItineraryDay>
): Promise<Itinerary> {
  const res = await fetch(`/api/itineraries/${itineraryId}/days/${dayNumber}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function deleteItineraryDay(itineraryId: string, dayNumber: number): Promise<Itinerary> {
  const res = await fetch(`/api/itineraries/${itineraryId}/days/${dayNumber}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function addItineraryEvent(
  itineraryId: string,
  dayNumber: number,
  body: Partial<ItineraryEvent>
): Promise<Itinerary> {
  const res = await fetch(`/api/itineraries/${itineraryId}/days/${dayNumber}/events`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function updateItineraryEvent(
  itineraryId: string,
  dayNumber: number,
  eventId: string,
  body: Partial<ItineraryEvent>
): Promise<Itinerary> {
  const res = await fetch(`/api/itineraries/${itineraryId}/days/${dayNumber}/events/${eventId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function deleteItineraryEvent(
  itineraryId: string,
  dayNumber: number,
  eventId: string
): Promise<Itinerary> {
  const res = await fetch(`/api/itineraries/${itineraryId}/days/${dayNumber}/events/${eventId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function updateItineraryStatus(
  itineraryId: string,
  new_status: ItineraryStatus
): Promise<Itinerary> {
  const res = await fetch(`/api/itineraries/${itineraryId}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ new_status }),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function duplicateItinerary(itineraryId: string): Promise<Itinerary> {
  const res = await fetch(`/api/itineraries/${itineraryId}/duplicate`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}
