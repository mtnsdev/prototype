import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared shell for product directory, itineraries, knowledge vault filter regions. */
export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-4 space-y-2 border-b border-border pb-4", className)}>{children}</div>;
}

export function FilterBarPrimaryStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-3", className)}>{children}</div>;
}

/** Horizontal chip / pill row (type filters, pipeline stages). */
export function FilterChipScrollRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "-mx-1 flex w-full min-w-0 items-center gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Toolbar row: filters left, counts / view toggles right (wide breakpoints). */
export function FilterBarToolbarRow({
  children,
  className,
  breakpoint = "lg",
}: {
  children: ReactNode;
  className?: string;
  /** `lg` = 1100px (products, itineraries); `md` = 900px (knowledge vault). */
  breakpoint?: "md" | "lg";
}) {
  const bp = breakpoint === "md" ? "min-[900px]" : "min-[1100px]";
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        `${bp}:flex-row ${bp}:items-center ${bp}:justify-between`,
        className
      )}
    >
      {children}
    </div>
  );
}

export function FilterBarActionsCluster({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-border min-[1100px]:border-l min-[1100px]:pl-3",
        className
      )}
    >
      {children}
    </div>
  );
}
