"use client";

import { cn } from "@/lib/utils";
import type { DirectoryProductCategory } from "@/types/product-directory";
import { directoryCategoryColors, directoryCategoryLabel } from "./productDirectoryVisual";

export function ProductDirectoryCategoryBadge({
  types,
  compact,
}: {
  types: DirectoryProductCategory[];
  compact?: boolean;
}) {
  const primary = types[0] ?? "hotel";
  const extra = types.length > 1 ? types.length - 1 : 0;
  const c = directoryCategoryColors(primary);
  return (
    <span
      className={cn(
        "inline-block rounded font-medium leading-tight",
        compact ? "px-1 py-px text-[8px]" : "px-1.5 py-0.5 text-[9px]"
      )}
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
      }}
    >
      {directoryCategoryLabel(primary)}
      {extra > 0 ? ` +${extra}` : ""}
    </span>
  );
}
