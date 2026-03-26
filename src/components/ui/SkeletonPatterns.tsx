"use client";

import { cn } from "@/lib/utils";

export function SkeletonCard() {
  return (
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-white/[0.04] rounded w-3/4 mb-2" />
      <div className="h-3 bg-white/[0.04] rounded w-1/2" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-white/[0.04]" />
      <div className="flex-1 min-w-0">
        <div className="h-3.5 bg-white/[0.04] rounded w-2/3 mb-1.5" />
        <div className="h-2.5 bg-white/[0.04] rounded w-1/3" />
      </div>
      <div className="h-3 bg-white/[0.04] rounded w-16 shrink-0" />
    </div>
  );
}

/** Matches source card footprint for KV */
export function SourceCardSkeleton() {
  return (
    <div className="shrink-0 w-[180px] rounded-xl border border-white/[0.06] bg-[#161616] p-3 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-lg bg-white/[0.06]" />
        <div className="h-3 flex-1 bg-white/[0.06] rounded" />
      </div>
      <div className="h-2 w-16 bg-white/[0.05] rounded mb-2" />
      <div className="h-4 w-14 bg-white/[0.05] rounded mb-2" />
      <div className="h-2 w-full bg-white/[0.04] rounded mt-2" />
    </div>
  );
}

export function Spinner({ size = "sm", className }: { size?: "sm" | "md"; className?: string }) {
  return (
    <div
      className={cn(
        "border-2 border-white/10 border-t-white/40 rounded-full animate-spin shrink-0",
        size === "sm" ? "w-3 h-3" : "w-5 h-5",
        className
      )}
      aria-hidden
    />
  );
}
