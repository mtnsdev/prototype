import type { Destination } from "@/data/destinations";
import {
  createStubDestination,
  destinationIsVisibleForViewer,
  destinationToSummary,
  listDestinationSlugs,
  listDestinationSummaries,
  type DestinationSummary,
} from "@/data/destinations";
import { safeParseDestination } from "@/lib/destinationEditorSchema";

/** @deprecated Use {@link destinationPublishedStorageKey} */
const LEGACY_KEY_PREFIX = "enable_v1_destination_edit_";
const PUBLISHED_PREFIX = "enable_v1_destination_published_";
const DRAFT_PREFIX = "enable_v1_destination_draft_";

/** Slugs created via “Add destination” (not in static catalog). */
const CUSTOM_SLUGS_KEY = "enable_v1_destination_custom_slugs";

/** Fired when draft or published storage changes for a slug (detail page + editor sync). */
export const DESTINATION_STORAGE_EVENT = "enable:destination-storage";

function emit(slug: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DESTINATION_STORAGE_EVENT, { detail: { slug } }));
}

export function listCustomDestinationSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_SLUGS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function registerCustomDestinationSlug(slug: string): void {
  if (typeof window === "undefined") return;
  const next = new Set(listCustomDestinationSlugs());
  next.add(slug);
  localStorage.setItem(CUSTOM_SLUGS_KEY, JSON.stringify([...next]));
  emit(slug);
}

/** Static summaries plus user-created destinations (client-only merge). */
export function buildMergedDestinationSummaries(agencyId?: string | null): DestinationSummary[] {
  const base = listDestinationSummaries(agencyId);
  if (typeof window === "undefined") return base;
  const seen = new Set(base.map((s) => s.slug));
  const merged: DestinationSummary[] = [...base];
  for (const slug of listCustomDestinationSlugs()) {
    if (seen.has(slug)) continue;
    const stub = createStubDestination(slug, slug, "");
    const d = loadPublishedDestination(slug, stub);
    if (!destinationIsVisibleForViewer(d, agencyId ?? null)) continue;
    merged.push(destinationToSummary(d));
    seen.add(slug);
  }
  merged.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return merged;
}

/** Slugify + ensure uniqueness against catalog + custom registry. */
export function allocateUniqueDestinationSlug(name: string): string {
  const baseRaw = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const base = baseRaw || "destination";
  const taken = new Set([...listDestinationSlugs(), ...listCustomDestinationSlugs()]);
  let candidate = base;
  let i = 2;
  while (taken.has(candidate)) {
    candidate = `${base}-${i}`;
    i += 1;
  }
  return candidate;
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
