"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SourceConflict } from "@/types/vic-profile";
import { formatShortDate } from "@/lib/vic-profile-helpers";

export function ConflictResolver({
  conflict,
  onResolve,
  className,
}: {
  conflict: SourceConflict;
  onResolve?: (id: string, value: string) => void;
  className?: string;
}) {
  const resolved = conflict.status === "resolved";

  return (
    <div className={cn("rounded-xl border border-border bg-background p-4 text-sm", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-foreground capitalize">{conflict.field.replace(/_/g, " ")}</p>
        {resolved ? (
          <span className="text-2xs text-muted-foreground">Resolved</span>
        ) : (
          <span className="text-2xs text-amber-300">Unresolved</span>
        )}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {conflict.values.map((v, i) => (
          <div key={i} className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="font-medium text-foreground">{v.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{v.source}</p>
            <p className="text-2xs text-muted-foreground">{formatShortDate(v.date)}</p>
            {v.context ? <p className="mt-1 text-xs text-muted-foreground/90">{v.context}</p> : null}
            {!resolved && onResolve ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => onResolve(conflict.id, v.value)}
              >
                Use this value
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      {resolved && conflict.resolvedValue ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Kept: <span className="text-foreground">{conflict.resolvedValue}</span>
        </p>
      ) : null}
    </div>
  );
}
