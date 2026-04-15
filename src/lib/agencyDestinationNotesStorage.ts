/**
 * Prototype persistence for per-agency, per-destination free text.
 * Keyed by `agency_id` — all members of the agency read the same copy.
 * Replace with Supabase (agency_id + destination_slug + updated_by) for production.
 */

const STORAGE_PREFIX = "enable_agency_destination_notes_v1";

/** Exposed for cross-tab `storage` listeners. */
export function agencyDestinationNotesStorageKey(agencyId: string) {
  return `${STORAGE_PREFIX}:${agencyId}`;
}

export function loadAgencyDestinationNotesMap(agencyId: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(agencyDestinationNotesStorageKey(agencyId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

export function getAgencyDestinationNote(agencyId: string, destinationSlug: string): string {
  return loadAgencyDestinationNotesMap(agencyId)[destinationSlug] ?? "";
}

export function setAgencyDestinationNote(agencyId: string, destinationSlug: string, body: string): void {
  if (typeof window === "undefined") return;
  const map = { ...loadAgencyDestinationNotesMap(agencyId) };
  const t = body.trim();
  if (t === "") delete map[destinationSlug];
  else map[destinationSlug] = body;
  localStorage.setItem(agencyDestinationNotesStorageKey(agencyId), JSON.stringify(map));
}
