"use client";

import { cn } from "@/lib/utils";

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card/40 p-4">
      <div className="mb-2 h-4 w-3/4 rounded bg-muted/50" />
      <div className="h-3 w-1/2 rounded bg-muted/40" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-xl border border-border bg-card/40 p-3">
      <div className="h-8 w-8 rounded-lg bg-muted/50" />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 h-3.5 w-2/3 rounded bg-muted/50" />
        <div className="h-2.5 w-1/3 rounded bg-muted/40" />
      </div>
      <div className="h-3 w-16 shrink-0 rounded bg-muted/40" />
    </div>
  );
}

/** Matches source card footprint for KV */
export function SourceCardSkeleton() {
  return (
    <div className="w-[180px] shrink-0 animate-pulse rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-9 w-9 rounded-lg bg-muted/50" />
        <div className="h-3 flex-1 rounded bg-muted/45" />
      </div>
      <div className="mb-2 h-2 w-16 rounded bg-muted/40" />
      <div className="mb-2 h-4 w-14 rounded bg-muted/40" />
      <div className="mt-2 h-2 w-full rounded bg-muted/35" />
    </div>
  );
}

export function Spinner({ size = "sm", className }: { size?: "sm" | "md"; className?: string }) {
  return (
    <div
      className={cn(
        "border-2 border-input border-t-muted-foreground/50 rounded-full animate-spin shrink-0",
        size === "sm" ? "w-3 h-3" : "w-5 h-5",
        className
      )}
      aria-hidden
    />
  );
}
