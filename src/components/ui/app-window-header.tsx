"use client";

import type { ReactNode } from "react";
import {
  AppPageHeroHeader,
  type AppPageHeroToolbarPlacement,
} from "@/components/ui/app-page-hero-header";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  belowSubtitle?: ReactNode;
  toolbar?: ReactNode;
  toolbarPlacement?: AppPageHeroToolbarPlacement;
  scrollRoot?: HTMLElement | null;
  collapseOnScroll?: boolean;
  className?: string;
};

export function AppWindowHeader({
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
    <AppPageHeroHeader
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      aside={actions}
      belowSubtitle={belowSubtitle}
      toolbar={toolbar}
      toolbarPlacement={toolbarPlacement}
      scrollRoot={scrollRoot}
      collapseOnScroll={collapseOnScroll}
      className={className}
    />
  );
}
