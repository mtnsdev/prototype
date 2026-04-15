"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { Restaurant } from "@/data/destinations";
import { cn } from "@/lib/utils";
import { destMuted } from "./destinationStyles";

type Props = {
  byRegion: Record<string, Restaurant[]>;
};

export function RestaurantSection({ byRegion }: Props) {
  const regions = useMemo(() => Object.keys(byRegion).sort(), [byRegion]);
  const [active, setActive] = useState(regions[0] ?? "");

  useEffect(() => {
    if (regions.length === 0) return;
    setActive((prev) => (regions.includes(prev) ? prev : regions[0]!));
  }, [regions]);

  if (regions.length === 0) {
    return (
      <p className={cn("text-sm", destMuted)}>No restaurant listings yet for this destination.</p>
    );
  }

  const list = byRegion[active] ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {regions.map((r) => {
          const on = r === active;
          const n = byRegion[r]?.length ?? 0;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setActive(r)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                on
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span>{r}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  on ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background/60 text-muted-foreground",
                )}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>
      <ul className="space-y-3" aria-label={`Restaurants in ${active}`}>
        {list.map((item) => (
          <li
            key={`${item.name}-${item.url ?? ""}`}
            className="group flex items-start gap-3 rounded-lg border border-border bg-white/[0.02] px-3 py-2.5"
          >
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-cta" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:text-brand-cta hover:underline"
                  >
                    {item.name}
                    <ExternalLink className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                  </a>
                ) : (
                  <span className="font-medium text-foreground">{item.name}</span>
                )}
              </div>
              {item.note ? <p className={cn("mt-0.5 text-xs", destMuted)}>{item.note}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
