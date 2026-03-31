"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { typographyPageTitleClass } from "@/components/ui/typography";
import {
  DASHBOARD_LIST_PAGE_HEADER,
  DASHBOARD_LIST_PAGE_HEADER_ACTIONS,
} from "@/lib/dashboardChrome";

type Props = {
  title: ReactNode;
  /** Renders on the right (sync, filters export, etc.). */
  actions?: ReactNode;
  className?: string;
};

/** Page title row for dashboard pages. */
export default function DashboardPageHeader({ title, actions, className }: Props) {
  return (
    <header className={cn(DASHBOARD_LIST_PAGE_HEADER, className)}>
      <div className={cn("min-w-0 line-clamp-1", typographyPageTitleClass)}>{title}</div>
      {actions ? (
        <div className={DASHBOARD_LIST_PAGE_HEADER_ACTIONS}>{actions}</div>
      ) : null}
    </header>
  );
}
