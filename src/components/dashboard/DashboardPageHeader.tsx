"use client";

import type { ReactNode } from "react";
import { AppWindowHeader } from "@/components/ui/app-window-header";
import type { AppPageHeroToolbarPlacement } from "@/components/ui/app-page-hero-header";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  /** Renders on the right of the title block (sync, filters, export, etc.). */
  actions?: ReactNode;
  belowSubtitle?: ReactNode;
  /** Search bars, filters, and control groups — placement via `toolbarPlacement`. */
  toolbar?: ReactNode;
  toolbarPlacement?: AppPageHeroToolbarPlacement;
  scrollRoot?: HTMLElement | null;
  collapseOnScroll?: boolean;
  className?: string;
};

/** Page title band for dashboard list/index pages (hero header). */
export default function DashboardPageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  belowSubtitle,
  toolbar,
  toolbarPlacement,
  scrollRoot,
  collapseOnScroll,
  className,
}: Props) {
  return (
    <AppWindowHeader
      title={title}
      subtitle={subtitle}
      eyebrow={eyebrow}
      actions={actions}
      belowSubtitle={belowSubtitle}
      toolbar={toolbar}
      toolbarPlacement={toolbarPlacement}
      scrollRoot={scrollRoot}
      collapseOnScroll={collapseOnScroll}
      className={className}
    />
  );
}
