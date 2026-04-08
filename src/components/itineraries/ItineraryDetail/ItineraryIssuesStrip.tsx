"use client";

import { AlertTriangle } from "lucide-react";
import type { ItineraryIssue } from "@/lib/itineraryValidation";
import { cn } from "@/lib/utils";

export default function ItineraryIssuesStrip({
  issues,
  className,
}: {
  issues: ItineraryIssue[];
  className?: string;
}) {
  if (issues.length === 0) return null;

  return (
    <div
      role="status"
      className={cn(
        "mx-4 mb-0 rounded-lg border border-[var(--muted-amber-border)] bg-[var(--muted-amber-bg)] px-3 py-2 text-sm text-[var(--muted-amber-text)]",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 opacity-90" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="font-medium text-foreground/90">Trip checks ({issues.length})</p>
          <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
            {issues.map((i) => (
              <li key={i.id}>{i.message}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
