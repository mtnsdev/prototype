"use client";

import type { AcuityStatus } from "@/types/vic";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  AcuityStatus,
  { label: string; className: string; animated?: boolean }
> = {
  not_run: { label: "Not Run", className: "bg-[rgba(255,255,255,0.08)] text-[rgba(245,245,245,0.6)]" },
  running: {
    label: "Running",
    className: "bg-[var(--muted-info-bg)] text-[var(--muted-info-text)] border border-[var(--muted-info-border)]",
    animated: true,
  },
  complete: { label: "Complete", className: "bg-[var(--muted-success-bg)] text-[var(--muted-success-text)] border border-[var(--muted-success-border)]" },
  failed: { label: "Failed", className: "bg-[var(--muted-error-bg)] text-[var(--muted-error-text)] border border-[var(--muted-error-border)]" },
};

type Props = { status: AcuityStatus; className?: string };

export default function AcuityStatusBadge({ status, className }: Props) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        config.className,
        config.animated && "animate-pulse",
        className
      )}
    >
      {config.label}
    </span>
  );
}
