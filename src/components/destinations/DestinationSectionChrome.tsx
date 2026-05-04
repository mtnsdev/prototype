"use client";

import type { VirtualDestinationSection } from "@/lib/destinationSectionModel";
import { cn } from "@/lib/utils";

type Props = {
  section: VirtualDestinationSection;
  headingId?: string;
  /** Merged with default spacing (e.g. compact tiles). */
  className?: string;
};

/**
 * Simplified section chrome — plain heading only.
 * All admin controls (drag, rename, delete) now live in the sidebar nav.
 */
export function DestinationSectionChrome({ section, headingId, className }: Props) {
  return (
    <div className={cn("mb-5", className)}>
      <h3 id={headingId} className="font-display text-base font-medium tracking-tight text-foreground">
        {section.title}
      </h3>
    </div>
  );
}
