"use client";

import { useState } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import type { Hotel } from "@/data/destinations";
import { cn } from "@/lib/utils";
import { destCardClass, destMuted, destMuted2 } from "./destinationStyles";

type Props = {
  byGroup: Record<string, Hotel[]>;
};

export function HotelSection({ byGroup }: Props) {
  const groups = Object.keys(byGroup);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g, true])),
  );

  if (groups.length === 0) {
    return (
      <p className={cn("text-sm", destMuted)}>No hotel listings yet for this destination.</p>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((groupName) => {
        const hotels = byGroup[groupName] ?? [];
        const isOpen = open[groupName] ?? false;
        return (
          <div key={groupName} className={destCardClass("overflow-hidden")}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen((prev) => ({ ...prev, [groupName]: !isOpen }))}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
            >
              <span className="font-medium text-foreground">
                {groupName}{" "}
                <span className={cn("font-normal", destMuted2)}>({hotels.length})</span>
              </span>
              <ChevronRight
                className={cn(
                  "size-5 shrink-0 text-muted-foreground transition-transform",
                  isOpen && "rotate-90",
                )}
                aria-hidden
              />
            </button>
            {isOpen ? (
              <ul className="space-y-3 border-t border-border px-4 py-3">
                {hotels.map((h) => (
                  <li
                    key={`${groupName}-${h.name}`}
                    className="border-b border-border/60 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        {h.url ? (
                          <a
                            href={h.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-foreground hover:text-brand-cta"
                          >
                            {h.name}
                            <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
                          </a>
                        ) : (
                          <span className="font-medium text-foreground">{h.name}</span>
                        )}
                        {h.contact ? <p className={cn("mt-0.5 text-xs", destMuted)}>{h.contact}</p> : null}
                        {h.note ? <p className={cn("mt-1 text-xs", destMuted2)}>{h.note}</p> : null}
                        {h.properties && h.properties.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {h.properties.map((p) => (
                              <span
                                key={p}
                                className="rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[10px] font-normal text-muted-foreground"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
