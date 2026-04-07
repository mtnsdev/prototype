"use client";

import { cn } from "@/lib/utils";

function WidgetSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex animate-pulse flex-col overflow-hidden rounded-2xl border border-border bg-card",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.055),0_1px_2px_rgba(0,0,0,0.22)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-border/70 px-5 pb-4 pt-5">
        <div className="size-9 shrink-0 rounded-[10px] bg-muted/50 ring-1 ring-inset ring-border/60" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3.5 w-2/5 max-w-[140px] rounded-md bg-muted/55" />
          <div className="h-2.5 w-1/4 max-w-[72px] rounded bg-muted/40" />
        </div>
        <div className="h-7 w-7 shrink-0 rounded-lg bg-muted/35" />
      </div>
      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
        <div className="h-2.5 w-full rounded bg-muted/30" />
        <div className="h-2.5 w-[92%] rounded bg-muted/25" />
        <div className="h-2.5 w-[78%] rounded bg-muted/25" />
        <div className="mt-2 h-9 w-full rounded-lg bg-muted/20" />
        <div className="h-9 w-full rounded-lg bg-muted/15" />
      </div>
    </div>
  );
}

/** Mirrors the two-column widget grid with varied card heights while data loads. */
export default function BriefingDashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="flex flex-col gap-6">
        <WidgetSkeleton className="min-h-[280px]" />
        <WidgetSkeleton className="min-h-[220px]" />
        <WidgetSkeleton className="min-h-[260px]" />
      </div>
      <div className="flex flex-col gap-6">
        <WidgetSkeleton className="min-h-[240px]" />
        <WidgetSkeleton className="min-h-[300px]" />
        <WidgetSkeleton className="min-h-[200px]" />
      </div>
    </div>
  );
}
