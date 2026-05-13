"use client";

import type { VirtualDestinationSection } from "@/lib/destinationSectionModel";
import { cn } from "@/lib/utils";

type Props = {
  section: VirtualDestinationSection;
  /** Reserved for future per-section admin actions. */
  destinationSlug?: string;
  headingId?: string;
  /** Merged with default spacing (e.g. compact tiles). */
  className?: string;
};

/**
 * Section heading wrapper. Per-section admin controls live alongside row cards
 * via {@link RowCardAdminControls} in {@link DestinationDetailView}.
 */
export function DestinationSectionChrome({ section, headingId, className }: Props) {
  return (
    <div className={cn("mb-3 flex items-start gap-2", className)}>
      <h3
        id={headingId}
        className="min-w-0 flex-1 truncate font-display text-sm font-medium tracking-tight text-foreground"
      >
        {section.title}
      </h3>
    </div>
  );
}
