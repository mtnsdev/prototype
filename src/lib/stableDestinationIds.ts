/**
 * Deterministic pseudo-UUIDs for destination sections/items (prototype + stable deep links).
 * Same inputs always yield the same id — survives reloads without a database.
 */

function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function toHex(n: number, bytes: number): string {
  return (n >>> 0).toString(16).padStart(bytes * 2, "0").slice(0, bytes * 2);
}

/** 8-4-4-4-12 hex (UUID-shaped) from a seed string. */
export function stableDestinationUuid(seed: string): string {
  const a = fnv1a(`${seed}|a`);
  const b = fnv1a(`${seed}|b`);
  const c = fnv1a(`${seed}|c`);
  const p1 = toHex(a, 4);
  const p2 = toHex(a ^ b, 2);
  const p3 = toHex(b, 2);
  const p4 = toHex(c, 2);
  const p5 = toHex((a ^ b) + c, 6);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

export function stableSectionId(destinationSlug: string, sectionKey: string): string {
  return stableDestinationUuid(`dest-section|${destinationSlug}|${sectionKey}`);
}

export function stableItemId(destinationSlug: string, sectionId: string, itemKey: string): string {
  return stableDestinationUuid(`dest-item|${destinationSlug}|${sectionId}|${itemKey}`);
}
