"use client";

import type { VirtualDestinationSection } from "@/lib/destinationSectionModel";

type Props = {
  section: VirtualDestinationSection;
  headingId?: string;
  /** @deprecated — drag handle props no longer used; section management lives in sidebar. */
  dragHandleProps?: Record<string, unknown>;
};

/**
 * Simplified section chrome — plain heading only.
 * All admin controls (drag, rename, delete) now live in the sidebar nav.
 */
export function DestinationSectionChrome({ section, headingId }: Props) {
  return (
    <div className="mb-5">
      <h3 id={headingId} className="text-base font-semibold text-foreground">
        {section.title}
      </h3>
    </div>
  );
}
