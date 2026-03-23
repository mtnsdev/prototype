"use client";

import type { IngestionStatus } from "@/types/knowledge-vault";
import { cn } from "@/lib/utils";

const DOT = "w-1.5 h-1.5 rounded-full shrink-0";

const COPY: Record<IngestionStatus, string> = {
  indexed: "Indexed",
  processing: "Processing",
  not_indexed: "Not indexed",
};

export function IngestionStatusBadge({
  status,
  className,
}: {
  status: IngestionStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] tabular-nums",
        className
      )}
    >
      {status === "indexed" && (
        <span className={cn(DOT, "bg-[color-mix(in_srgb,var(--color-success)_78%,transparent)]")} aria-hidden />
      )}
      {status === "processing" && (
        <span className={cn(DOT, "bg-[color-mix(in_srgb,var(--color-warning)_75%,transparent)]")} aria-hidden />
      )}
      {status === "not_indexed" && <span className={cn(DOT, "bg-white/28")} aria-hidden />}
      {COPY[status]}
    </span>
  );
}
