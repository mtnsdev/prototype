"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle } from "lucide-react";
import type { AdvisoryNote } from "@/types/vic-profile";

const severityRing: Record<AdvisoryNote["severity"], string> = {
  critical: "border-red-500/50 bg-red-500/10 text-foreground",
  warning: "border-amber-500/45 bg-amber-500/10 text-foreground",
  info: "border-blue-500/40 bg-blue-500/10 text-foreground",
};

/**
 * March 31 decision: No auto-expire on advisories. Manual close only.
 * Stale review nudge deferred to Layer 4.
 */
export function AdvisoryBanner({
  advisory,
  onDismiss,
  className,
}: {
  advisory: Pick<AdvisoryNote, "severity" | "title" | "body" | "status">;
  onDismiss?: () => void;
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border/40 bg-foreground/[0.03] px-4 py-3 text-sm flex items-center gap-2 text-muted-foreground/50",
          className
        )}
      >
        <CheckCircle size={14} />
        <span className="line-through">{advisory.title}</span>
        <span className="text-xs ml-auto">Dismissed</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm group relative",
        severityRing[advisory.severity],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{advisory.title}</p>
          <p className="mt-1 text-muted-foreground">{advisory.body}</p>
        </div>
        {advisory.severity !== "critical" && (
          <button
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/10"
            title="Dismiss advisory (manual close)"
            aria-label="Dismiss advisory"
          >
            <X size={14} className="text-muted-foreground/60" />
          </button>
        )}
      </div>
    </div>
  );
}
