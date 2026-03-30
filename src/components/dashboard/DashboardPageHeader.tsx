"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { typographyPageTitleClass } from "@/components/ui/typography";

type Props = {
  title: ReactNode;
  /** Renders on the right (sync, filters export, etc.). Notifications bell is fixed top-right in DashboardFrame. */
  actions?: ReactNode;
  className?: string;
};

/** Page title row — notifications bell is fixed in DashboardFrame. */
export default function DashboardPageHeader({ title, actions, className }: Props) {
  return (
    <header
      className={cn(
        "shrink-0 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 px-6 py-4 min-h-[56px] border-b border-border",
        className
      )}
    >
      <div className={cn("min-w-0 truncate", typographyPageTitleClass)}>{title}</div>
      {actions ? (
        <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">{actions}</div>
      ) : null}
    </header>
  );
}
