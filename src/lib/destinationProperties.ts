/**
 * Pure helpers for `Destination.properties` (free-form pills).
 *
 * Every helper returns a new `Destination` object — callers are responsible
 * for persisting via the existing destination storage helpers
 * (`publishDestination` / `saveEditedDestination`).
 */

import type { Destination, DestinationProperty } from "@/data/destinations";

function generatePropertyId(label: string, existing: DestinationProperty[]): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "prop";
  const used = new Set(existing.map((p) => p.id));
  if (!used.has(slug)) return slug;
  let i = 2;
  while (used.has(`${slug}-${i}`)) i += 1;
  return `${slug}-${i}`;
}

export function getProperties(destination: Destination): DestinationProperty[] {
  return destination.properties ?? [];
}

export function addProperty(
  destination: Destination,
  label: string,
): { destination: Destination; property: DestinationProperty } | null {
  const clean = label.trim();
  if (!clean) return null;
  const existing = getProperties(destination);
  // Idempotent: re-using an existing label simply returns it untouched.
  const dupe = existing.find((p) => p.label.toLowerCase() === clean.toLowerCase());
  if (dupe) return { destination, property: dupe };
  const property: DestinationProperty = {
    id: generatePropertyId(clean, existing),
    label: clean,
    productIds: [],
  };
  return {
    destination: { ...destination, properties: [...existing, property] },
    property,
  };
}

export function removeProperty(
  destination: Destination,
  propertyId: string,
): Destination {
  const existing = getProperties(destination);
  return {
    ...destination,
    properties: existing.filter((p) => p.id !== propertyId),
  };
}

export function renameProperty(
  destination: Destination,
  propertyId: string,
  nextLabel: string,
): Destination {
  const clean = nextLabel.trim();
  if (!clean) return destination;
  const existing = getProperties(destination);
  return {
    ...destination,
    properties: existing.map((p) =>
      p.id === propertyId ? { ...p, label: clean } : p,
    ),
  };
}

/**
 * Toggle membership of a product in a property's `productIds` list.
 * Adds the productId when absent, removes it when present.
 */
export function toggleProductOnProperty(
  destination: Destination,
  propertyId: string,
  productId: string,
): Destination {
  const existing = getProperties(destination);
  return {
    ...destination,
    properties: existing.map((p) => {
      if (p.id !== propertyId) return p;
      const has = p.productIds.includes(productId);
      return {
        ...p,
        productIds: has
          ? p.productIds.filter((id) => id !== productId)
          : [...p.productIds, productId],
      };
    }),
  };
}

/**
 * Property ids that include the given product. Cheap reverse-lookup; small
 * enough to recompute on demand without memoization.
 */
export function propertyIdsForProduct(
  destination: Destination,
  productId: string,
): string[] {
  const props = getProperties(destination);
  return props.filter((p) => p.productIds.includes(productId)).map((p) => p.id);
}
