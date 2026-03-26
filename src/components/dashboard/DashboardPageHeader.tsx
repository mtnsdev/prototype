"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: ReactNode;
  /** Renders on the right (sync, filters export, etc.). Bell + search live in DashboardTopBar. */
  actions?: ReactNode;
  className?: string;
};

/** Page title row — notifications are in the persistent DashboardTopBar. */
export default function DashboardPageHeader({ title, actions, className }: Props) {
  return (
    <header
      className={cn(
        "shrink-0 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 px-6 py-4 min-h-[56px] border-b border-[rgba(255,255,255,0.03)]",
        className
      )}
    >
      <div className="min-w-0 text-[1.25rem] font-light tracking-[0.02em] text-[#F5F0EB] leading-tight truncate">
        {title}
      </div>
      {actions ? (
        <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">{actions}</div>
      ) : null}
    </header>
  );
}
