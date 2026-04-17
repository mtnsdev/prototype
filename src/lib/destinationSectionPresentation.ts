import type { DestinationLegacySectionKey } from "@/data/destinations";

/** Default sidebar labels + Lucide keys for each logical block (order is fixed in `buildVirtualSectionsFromDestination`). */
export const DEFAULT_DESTINATION_SECTION_PRESENTATION = {
  dmc: { title: "DMC partners", iconKey: "Building2" },
  restaurants: { title: "Restaurants", iconKey: "UtensilsCrossed" },
  hotels: { title: "Hotels", iconKey: "Hotel" },
  yacht: { title: "Yachts & charters", iconKey: "Anchor" },
  tourism: { title: "Tourism & contacts", iconKey: "Landmark" },
  documents: { title: "Downloads", iconKey: "Files" },
  "trip-reports": { title: "Trip reports", iconKey: "Plane" },
  overview: { title: "About", iconKey: "ScrollText" },
} as const satisfies Record<DestinationLegacySectionKey, { title: string; iconKey: string }>;

const FALLBACK_PRESENTATION = { title: "Section", iconKey: "LayoutGrid" };

export function resolveDestinationSectionPresentation(
  key: DestinationLegacySectionKey,
): { title: string; iconKey: string } {
  const row = DEFAULT_DESTINATION_SECTION_PRESENTATION[key];
  return row ?? FALLBACK_PRESENTATION;
}
