"use client";

import { Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PreferenceSignal } from "@/types/vic-profile";

export function PreferenceSignalCard({
  signal,
  onTogglePin,
}: {
  signal: PreferenceSignal;
  onTogglePin?: (id: string) => void;
}) {
  const hasConflict = (signal.conflicts ?? []).some((c) => !c.resolved);
  const low = signal.confidence === "low";

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-background p-3 text-sm",
        low && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-foreground">{signal.value}</p>
        <div className="flex shrink-0 items-center gap-1">
          {hasConflict ? (
            <span className="h-2 w-2 rounded-full bg-orange-400" title="Unresolved conflict" />
          ) : null}
          {onTogglePin ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              title={signal.pinned ? "Unpin from overview" : "Pin to overview"}
              onClick={() => onTogglePin(signal.id)}
            >
              {signal.pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
            </Button>
          ) : null}
        </div>
      </div>
      <p className="mt-1 text-2xs uppercase tracking-wide text-muted-foreground">
        {signal.confidence} confidence
      </p>
      {signal.lastConfirmedContext ? (
        <p className="mt-1 text-xs text-muted-foreground">{signal.lastConfirmedContext}</p>
      ) : null}
      <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
        {signal.sources.map((s) => (
          <li key={`${s.label}-${s.date ?? ""}`}>· {s.label}</li>
        ))}
      </ul>
    </div>
  );
}
