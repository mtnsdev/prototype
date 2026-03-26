"use client";

import type { DirectoryProductCategory } from "@/types/product-directory";
import { directoryCategoryColors, directoryCategoryLabel } from "./productDirectoryVisual";

export function ProductDirectoryCategoryBadge({ type }: { type: DirectoryProductCategory }) {
  const c = directoryCategoryColors(type);
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-[9px] font-medium leading-tight"
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
      }}
    >
      {directoryCategoryLabel(type)}
    </span>
  );
}
