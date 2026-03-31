"use client";

import { cn } from "@/lib/utils";
import type { AdvisoryNote } from "@/types/vic-profile";

const severityRing: Record<AdvisoryNote["severity"], string> = {
  critical: "border-red-500/50 bg-red-500/10 text-foreground",
  warning: "border-amber-500/45 bg-amber-500/10 text-foreground",
  info: "border-blue-500/40 bg-blue-500/10 text-foreground",
};

export function AdvisoryBanner({
  advisory,
  className,
}: {
  advisory: Pick<AdvisoryNote, "severity" | "title" | "body">;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        severityRing[advisory.severity],
        className
      )}
    >
      <p className="font-semibold">{advisory.title}</p>
      <p className="mt-1 text-muted-foreground">{advisory.body}</p>
    </div>
  );
}
