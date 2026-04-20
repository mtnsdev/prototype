import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Level 1 — page chrome (DashboardPageHeader, full-page titles). */
export const typographyPageTitleClass =
  "text-xl font-light tracking-[0.02em] text-foreground leading-tight";

/** Level 2 — sections within a page (cards, panels, settings blocks). */
export const typographySectionTitleClass =
  "text-lg font-medium tracking-wide text-foreground leading-snug";

/** Level 3 — table column headers, dense list labels, filter group labels. */
export const typographyListLabelClass =
  "text-compact font-medium uppercase tracking-[0.06em] text-muted-foreground/90";

export function PageTitle({
  children,
  className,
  as: Tag = "h1",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return <Tag className={cn(typographyPageTitleClass, className)}>{children}</Tag>;
}

export function SectionTitle({
  children,
  className,
  as: Tag = "h2",
}: {
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3";
}) {
  return <Tag className={cn(typographySectionTitleClass, className)}>{children}</Tag>;
}

export function ListLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn(typographyListLabelClass, className)}>{children}</span>;
}
