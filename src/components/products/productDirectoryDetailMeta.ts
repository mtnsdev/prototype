/** Tier / price labels for directory detail panel & quick facts. */

export type DirectoryTierLevel = "ultra-luxury" | "luxury" | "premium" | "select" | "unrated";

export type DirectoryPriceTier = "$" | "$$" | "$$$" | "$$$$" | "$$$$$";

export const DIRECTORY_TIER_LEVELS: { id: DirectoryTierLevel; label: string; stars: number }[] = [
  { id: "ultra-luxury", label: "Ultra-luxury", stars: 5 },
  { id: "luxury", label: "Luxury", stars: 4 },
  { id: "premium", label: "Premium", stars: 3 },
  { id: "select", label: "Select", stars: 2 },
  { id: "unrated", label: "Unrated", stars: 0 },
];

export function directoryTierLabel(tier: DirectoryTierLevel | undefined | null): string {
  if (!tier) return "—";
  return DIRECTORY_TIER_LEVELS.find((x) => x.id === tier)?.label ?? tier;
}

export function directoryTierStars(tier: DirectoryTierLevel | undefined | null): number {
  if (!tier || tier === "unrated") return 0;
  return DIRECTORY_TIER_LEVELS.find((x) => x.id === tier)?.stars ?? 0;
}

/** Lower = sort first when ordering “ultra-luxury first”. */
export const DIRECTORY_TIER_SORT_RANK: Record<DirectoryTierLevel, number> = {
  "ultra-luxury": 0,
  luxury: 1,
  premium: 2,
  select: 3,
  unrated: 4,
};
