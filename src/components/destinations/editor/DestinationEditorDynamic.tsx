"use client";

import dynamic from "next/dynamic";
import type { Destination } from "@/data/destinations";

const DestinationEditorPage = dynamic(
  () =>
    import("@/components/destinations/editor/DestinationEditorPage").then((m) => m.DestinationEditorPage),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Loading editor…
      </div>
    ),
  },
);

export function DestinationEditorDynamic({ canonical }: { canonical: Destination }) {
  return <DestinationEditorPage canonical={canonical} />;
}
