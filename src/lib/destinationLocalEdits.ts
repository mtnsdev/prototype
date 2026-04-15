import type { Destination } from "@/data/destinations";
import { safeParseDestination } from "@/lib/destinationEditorSchema";

/** @deprecated Use {@link destinationPublishedStorageKey} */
const LEGACY_KEY_PREFIX = "enable_v1_destination_edit_";
const PUBLISHED_PREFIX = "enable_v1_destination_published_";
const DRAFT_PREFIX = "enable_v1_destination_draft_";

/** Fired when draft or published storage changes for a slug (detail page + editor sync). */
export const DESTINATION_STORAGE_EVENT = "enable:destination-storage";

function emit(slug: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DESTINATION_STORAGE_EVENT, { detail: { slug } }));
}

export function destinationPublishedStorageKey(slug: string): string {
  return `${PUBLISHED_PREFIX}${slug}`;
}

export function destinationDraftStorageKey(slug: string): string {
  return `${DRAFT_PREFIX}${slug}`;
}

/** @deprecated Prefer {@link destinationPublishedStorageKey} — legacy alias. */
export function destinationEditStorageKey(slug: string): string {
  return destinationPublishedStorageKey(slug);
}

function migrateLegacy(slug: string) {
  if (typeof window === "undefined") return;
  try {
    const leg = localStorage.getItem(LEGACY_KEY_PREFIX + slug);
    if (!leg) return;
    const pub = destinationPublishedStorageKey(slug);
    if (!localStorage.getItem(pub)) {
      localStorage.setItem(pub, leg);
    }
    localStorage.removeItem(LEGACY_KEY_PREFIX + slug);
  } catch {
    /* ignore */
  }
}

function parseDestination(raw: string | null): Destination | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    const r = safeParseDestination(parsed);
    return r.success ? (r.data as Destination) : null;
  } catch {
    return null;
  }
}

/** Advisors and published destination page: always this (never draft). */
export function loadPublishedDestination(slug: string, fallback: Destination): Destination {
  if (typeof window === "undefined") return fallback;
  migrateLegacy(slug);
  return parseDestination(localStorage.getItem(destinationPublishedStorageKey(slug))) ?? fallback;
}

/** Admin draft only — null if none. */
export function loadDraftDestination(slug: string): Destination | null {
  if (typeof window === "undefined") return null;
  migrateLegacy(slug);
  return parseDestination(localStorage.getItem(destinationDraftStorageKey(slug)));
}

/** Editor initial state: draft overrides published. */
export function loadEditorBootstrap(slug: string, canonical: Destination): Destination {
  return loadDraftDestination(slug) ?? loadPublishedDestination(slug, canonical);
}

export function hasDraftDestination(slug: string): boolean {
  if (typeof window === "undefined") return false;
  migrateLegacy(slug);
  return Boolean(localStorage.getItem(destinationDraftStorageKey(slug)));
}

export function saveDraftDestination(slug: string, destination: Destination): boolean {
  if (typeof window === "undefined") return false;
  const result = safeParseDestination({ ...destination, slug });
  if (!result.success) return false;
  localStorage.setItem(destinationDraftStorageKey(slug), JSON.stringify(result.data));
  emit(slug);
  return true;
}

export function publishDestination(slug: string, destination: Destination): boolean {
  if (typeof window === "undefined") return false;
  const result = safeParseDestination({ ...destination, slug });
  if (!result.success) return false;
  const data = { ...result.data, slug };
  localStorage.setItem(destinationPublishedStorageKey(slug), JSON.stringify(data));
  localStorage.removeItem(destinationDraftStorageKey(slug));
  emit(slug);
  return true;
}

export function clearDraftDestination(slug: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(destinationDraftStorageKey(slug));
  emit(slug);
}

export function clearPublishedDestination(slug: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(destinationPublishedStorageKey(slug));
  emit(slug);
}

/** Clears draft + published (+ legacy key). */
export function clearAllDestinationOverrides(slug: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(destinationDraftStorageKey(slug));
  localStorage.removeItem(destinationPublishedStorageKey(slug));
  localStorage.removeItem(LEGACY_KEY_PREFIX + slug);
  emit(slug);
}

/** @deprecated Use {@link loadPublishedDestination} */
export function loadEditedDestination(slug: string, fallback: Destination): Destination {
  return loadPublishedDestination(slug, fallback);
}

/** @deprecated Use {@link publishDestination} */
export function saveEditedDestination(slug: string, destination: Destination): boolean {
  return publishDestination(slug, destination);
}

/** @deprecated Use {@link clearAllDestinationOverrides} */
export function clearEditedDestination(slug: string): void {
  clearAllDestinationOverrides(slug);
}

/** @deprecated Use {@link DESTINATION_STORAGE_EVENT} */
export const DESTINATION_LOCAL_EDIT_EVENT = DESTINATION_STORAGE_EVENT;
