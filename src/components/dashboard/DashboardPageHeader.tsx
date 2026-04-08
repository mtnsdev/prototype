"use client";

import type { ReactNode } from "react";
import { AppWindowHeader } from "@/components/ui/app-window-header";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Renders on the right (sync, filters export, etc.). */
  actions?: ReactNode;
  className?: string;
};

/** Page title row for dashboard list/index pages (window chrome). */
export default function DashboardPageHeader({ title, subtitle, actions, className }: Props) {
  return (
    <AppWindowHeader title={title} subtitle={subtitle} actions={actions} className={className} />
  );
}
