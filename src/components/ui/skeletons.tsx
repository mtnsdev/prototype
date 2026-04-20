"use client";

import { cn } from "@/lib/utils";

/**
 * Shared skeleton primitives with shimmer animation
 * Uses design system colors: subtle foreground-tinted shimmer on light surfaces
 */

// Shimmer animation keyframes
const shimmerKeyframes = `
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }
`;

/**
 * Single text line skeleton with shimmer effect
 */
export function SkeletonLine({
  className,
  width = "w-full",
}: {
  className?: string;
  width?: string;
}) {
  return (
    <div
      className={cn(
        "h-4 rounded bg-gradient-to-r from-foreground/[0.06] via-foreground/[0.1] to-foreground/[0.06]",
        "bg-[length:1000px_100%] animate-pulse",
        width,
        className
      )}
    />
  );
}

/**
 * Card placeholder with image area + text lines
 */
export function SkeletonCard({
  className,
  showImage = true,
  imageHeight = "h-40",
}: {
  className?: string;
  showImage?: boolean;
  imageHeight?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/50 p-4",
        className
      )}
    >
      {showImage && (
        <div
          className={cn(
            imageHeight,
            "rounded-lg bg-gradient-to-r from-foreground/[0.06] via-foreground/[0.1] to-foreground/[0.06]",
            "bg-[length:1000px_100%] animate-pulse mb-4"
          )}
        />
      )}
      <div className="space-y-3">
        <SkeletonLine width="w-3/4" />
        <SkeletonLine width="w-full" className="h-3" />
        <SkeletonLine width="w-2/3" className="h-3" />
      </div>
    </div>
  );
}

/**
 * Table row placeholder
 */
export function SkeletonRow({
  columns = 5,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-4 rounded-lg border border-border bg-muted/50 p-4",
        className
      )}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className={i === 0 ? "w-12 shrink-0" : "flex-1"}>
          <SkeletonLine className={i === 0 ? "h-5 w-5 rounded" : ""} />
        </div>
      ))}
    </div>
  );
}

/**
 * Circular avatar placeholder
 */
export function SkeletonAvatar({
  size = "w-10 h-10",
  className,
}: {
  size?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        size,
        "rounded-full bg-gradient-to-r from-foreground/[0.06] via-foreground/[0.1] to-foreground/[0.06]",
        "bg-[length:1000px_100%] animate-pulse",
        className
      )}
    />
  );
}

/**
 * VIC Card placeholder - matches VIC card layout
 */
export function VICCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/50 p-5",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <SkeletonLine width="w-2/3" />
          <SkeletonLine width="w-1/2" className="h-3 mt-2" />
        </div>
        <SkeletonAvatar size="w-12 h-12" className="ml-3" />
      </div>
      <div className="space-y-2 mb-4">
        <SkeletonLine width="w-full" className="h-3" />
        <SkeletonLine width="w-3/4" className="h-3" />
      </div>
      <div className="flex gap-2">
        <SkeletonLine width="w-1/3" className="h-2" />
        <SkeletonLine width="w-1/3" className="h-2" />
      </div>
    </div>
  );
}

/**
 * Product Card placeholder - matches product directory card layout
 */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/50 overflow-hidden",
        className
      )}
    >
      <div className="h-48 bg-gradient-to-r from-foreground/[0.06] via-foreground/[0.1] to-foreground/[0.06] bg-[length:1000px_100%] animate-pulse" />
      <div className="p-4 space-y-3">
        <SkeletonLine width="w-3/4" />
        <div className="flex gap-2">
          <SkeletonLine width="w-1/4" className="h-2" />
          <SkeletonLine width="w-1/4" className="h-2" />
        </div>
        <SkeletonLine width="w-full" className="h-3" />
        <div className="flex justify-between pt-2">
          <SkeletonLine width="w-1/3" className="h-2" />
          <SkeletonLine width="w-1/4" className="h-2" />
        </div>
      </div>
    </div>
  );
}

/**
 * Itinerary Card placeholder - matches itinerary card layout
 */
export function ItineraryCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/50 p-4",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <SkeletonLine width="w-1/2" />
        <SkeletonLine width="w-1/4" className="h-2" />
      </div>
      <div className="mb-3 space-y-2">
        <SkeletonLine width="w-full" className="h-3" />
        <SkeletonLine width="w-3/4" className="h-3" />
      </div>
      <div className="flex gap-2 pt-3 border-t border-border">
        <SkeletonAvatar size="w-8 h-8" />
        <div className="flex-1 space-y-1">
          <SkeletonLine width="w-1/2" className="h-2" />
          <SkeletonLine width="w-1/3" className="h-2" />
        </div>
      </div>
    </div>
  );
}

/**
 * VIC Row placeholder - for table view loading
 */
export function VICRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border border-border bg-muted/50 p-3 px-4",
        className
      )}
    >
      <SkeletonAvatar size="w-5 h-5" />
      <SkeletonLine width="w-32" className="h-3" />
      <SkeletonLine width="w-40" className="h-3" />
      <SkeletonLine width="w-24" className="h-3" />
      <SkeletonLine width="w-20" className="h-3" />
      <div className="ml-auto flex gap-1">
        <SkeletonLine width="w-8" className="h-3" />
        <SkeletonLine width="w-8" className="h-3" />
      </div>
    </div>
  );
}

/**
 * Loading spinner - used in buttons and async operations
 */
export function Spinner({
  size = "sm",
  className,
}: {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeMap = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div
      className={cn(
        "border-2 border-foreground/15 border-t-primary/50 rounded-full animate-spin shrink-0",
        sizeMap[size],
        className
      )}
      aria-hidden="true"
    />
  );
}

/**
 * Grid of skeleton cards - for gallery/grid loading states
 */
export function SkeletonGrid({
  count = 6,
  columns = 3,
}: {
  count?: number;
  columns?: number;
}) {
  return (
    <div
      className={`grid gap-4 grid-cols-${columns}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
