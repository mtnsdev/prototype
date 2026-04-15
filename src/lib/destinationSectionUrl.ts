import type { DestinationSectionId } from "@/components/destinations/DestinationSectionNav";

const ALL: DestinationSectionId[] = [
  "dmc",
  "restaurants",
  "hotels",
  "yacht",
  "tourism",
  "documents",
];

/**
 * Parse `?section=` for destination detail. Invalid or missing → `dmc`.
 * If `yacht` requested but destination has no yacht data, falls back to `dmc`.
 */
export function parseDestinationSectionParam(
  raw: string | null,
  hasYacht: boolean,
): DestinationSectionId {
  const v = (raw ?? "").toLowerCase().trim();
  if (!v || !ALL.includes(v as DestinationSectionId)) return "dmc";
  if (v === "yacht" && !hasYacht) return "dmc";
  return v as DestinationSectionId;
}
