"use client";

/**
 * EntityLink — clickable cross-reference between VICs, Products, Itineraries, and Rep Firms.
 *
 * This is the primary UI primitive for entity cross-linking (Fix #3).
 * It renders as an inline link styled to match the design system, with
 * an icon indicating the entity type. Used throughout detail panels,
 * tabs, and briefing widgets to make the prototype feel like a connected
 * intelligence graph rather than separate CRUD modules.
 */

import Link from "next/link";
import { cn } from "@/lib/utils";
import { User, Package, Route, Building2, Sparkles } from "lucide-react";

export type EntityType = "vic" | "product" | "itinerary" | "rep_firm" | "acuity";

const ENTITY_CONFIG: Record<EntityType, { icon: typeof User; basePath: string; color: string }> = {
  vic:       { icon: User,      basePath: "/dashboard/vics",         color: "text-blue-400 hover:text-blue-300" },
  product:   { icon: Package,   basePath: "/dashboard/products",     color: "text-emerald-400 hover:text-emerald-300" },
  itinerary: { icon: Route,     basePath: "/dashboard/itineraries",  color: "text-purple-400 hover:text-purple-300" },
  rep_firm:  { icon: Building2, basePath: "/dashboard/settings/rep-firms", color: "text-amber-400 hover:text-amber-300" },
  acuity:    { icon: Sparkles,  basePath: "/dashboard/vics",         color: "text-[#C9A96E] hover:text-[#d4b87e]" },
};

interface EntityLinkProps {
  type: EntityType;
  id: string;
  name: string;
  /** Optional subtitle shown after the name in muted text */
  subtitle?: string;
  /** Show icon before name (default: true) */
  showIcon?: boolean;
  /** Size variant */
  size?: "sm" | "md";
  className?: string;
}

export function EntityLink({
  type,
  id,
  name,
  subtitle,
  showIcon = true,
  size = "sm",
  className,
}: EntityLinkProps) {
  const config = ENTITY_CONFIG[type];
  const Icon = config.icon;
  const href = `${config.basePath}/${id}`;

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm transition-colors underline-offset-2 hover:underline",
        config.color,
        size === "sm" ? "text-xs" : "text-sm",
        className,
      )}
    >
      {showIcon && <Icon className={cn("shrink-0", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />}
      <span className="truncate">{name}</span>
      {subtitle && <span className="text-muted-foreground/75 truncate">{subtitle}</span>}
    </Link>
  );
}

/**
 * EntityChip — a pill-style entity reference for use in lists and cards.
 * Slightly more prominent than EntityLink, used in overview tabs and
 * relationship sections.
 */
export function EntityChip({
  type,
  id,
  name,
  meta,
  className,
}: {
  type: EntityType;
  id: string;
  name: string;
  /** Optional metadata line (e.g. "2 stays · Last: Mar 2026") */
  meta?: string;
  className?: string;
}) {
  const config = ENTITY_CONFIG[type];
  const Icon = config.icon;
  const href = `${config.basePath}/${id}`;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm transition-colors hover:bg-muted/40",
        className,
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", config.color)} />
      <div className="min-w-0">
        <p className="text-foreground truncate">{name}</p>
        {meta && <p className="text-2xs text-muted-foreground truncate">{meta}</p>}
      </div>
    </Link>
  );
}
