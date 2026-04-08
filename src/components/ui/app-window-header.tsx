"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  APP_WINDOW_TITLE_BAR,
  APP_WINDOW_TITLE_STACK,
  APP_WINDOW_TITLE,
  APP_WINDOW_SUBTITLE,
  APP_WINDOW_ACTIONS,
} from "@/lib/dashboardChrome";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/**
 * Standard window title row: document title + optional subtitle + trailing actions.
 */
export function AppWindowHeader({ title, subtitle, actions, className }: Props) {
  return (
    <header className={cn(APP_WINDOW_TITLE_BAR, className)}>
      <div className={APP_WINDOW_TITLE_STACK}>
        <div className={APP_WINDOW_TITLE}>{title}</div>
        {subtitle != null && subtitle !== "" ? (
          <div className={APP_WINDOW_SUBTITLE}>{subtitle}</div>
        ) : null}
      </div>
      {actions ? <div className={APP_WINDOW_ACTIONS}>{actions}</div> : null}
    </header>
  );
}
