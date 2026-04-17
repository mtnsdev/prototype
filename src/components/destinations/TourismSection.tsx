"use client";

import { Globe } from "lucide-react";
import type { TourismRegion } from "@/data/destinations";
import { cn } from "@/lib/utils";
import { destCardClass, destMuted } from "./destinationStyles";

type Props = {
  regions: TourismRegion[];
};

export function TourismSection({ regions }: Props) {
  if (regions.length === 0) {
    return (
      <p className={cn("text-sm", destMuted)}>No tourism links yet for this destination.</p>
    );
  }

  return (
    <div className="space-y-4">
      {regions.map((r) => (
        <div key={r.name} className={cn(destCardClass(), "p-4")}>
          <h3 className="font-semibold text-foreground">{r.name}</h3>
          {r.description ? <p className={cn("mt-1 text-sm", destMuted)}>{r.description}</p> : null}
          {r.contact ? (
            <p className={cn("mt-2 text-sm", destMuted)}>{r.contact}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {r.links.map((l, idx) => (
              <a
                key={`${r.name}-${l.label}-${l.url}-${idx}`}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-brand-cta transition-colors hover:border-brand-cta/40 hover:bg-muted"
              >
                <Globe className="size-3.5 shrink-0" aria-hidden />
                {l.label}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
