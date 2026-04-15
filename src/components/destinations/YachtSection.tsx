"use client";

import { ExternalLink } from "lucide-react";
import type { YachtCompany } from "@/data/destinations";
import { cn } from "@/lib/utils";
import { destCardClass, destMuted } from "./destinationStyles";

type Props = {
  companies: YachtCompany[];
};

export function YachtSection({ companies }: Props) {
  if (companies.length === 0) return null;

  return (
    <div className="space-y-3">
      {companies.map((c) => (
        <div key={c.name} className={cn(destCardClass(), "p-4")}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-base font-semibold text-foreground hover:text-brand-cta"
            >
              {c.name}
              <ExternalLink className="size-4 shrink-0 opacity-80" aria-hidden />
            </a>
          </div>
          <p className={cn("mt-2 text-sm", destMuted)}>{c.contact}</p>
          <p className={cn("mt-1 text-xs", destMuted)}>Destinations served: {c.destinations}</p>
        </div>
      ))}
    </div>
  );
}
