"use client";

import { ListChecks, X } from "lucide-react";
import type { DestinationProperty } from "@/data/destinations";
import { cn } from "@/lib/utils";

type Props = {
  properties: DestinationProperty[];
  /** Currently active property filters (by id). */
  activeFilters: ReadonlySet<string>;
  /** Toggle a property filter on/off. */
  onToggleFilter: (propertyId: string) => void;
  /**
   * When provided, the admin "+ Add" affordance + per-chip remove buttons are
   * rendered. Omit for read-only renderings.
   */
  admin?: {
    onAdd: (label: string) => void;
    onRemove: (propertyId: string) => void;
    /** Open the assign-products dialog for the given property. */
    onManageProducts: (propertyId: string) => void;
  };
  /** Visual variant — overlay sits on top of the hero photo, plain sits below. */
  variant?: "overlay" | "plain";
};

/**
 * Notion-style pill cluster for destination-scoped properties.
 *
 * Each pill is a filter chip; admins additionally see add/remove affordances.
 * Rendered inside the destination hero, beneath the existing sub-region tags.
 */
export function DestinationPropertyChips({
  properties,
  activeFilters,
  onToggleFilter,
  admin,
  variant = "overlay",
}: Props) {
  const isAdmin = !!admin;

  if (!isAdmin && properties.length === 0) return null;

  const baseOverlay =
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-2xs font-medium shadow-sm backdrop-blur-sm transition-colors";
  const basePlain =
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-2xs font-medium transition-colors";
  const activeClass = "border-brand-cta/40 bg-brand-cta/10 text-brand-cta";
  const inactiveOverlay =
    "border-white/25 bg-background/65 text-foreground hover:bg-background/80";
  const inactivePlain =
    "border-border bg-muted/40 text-muted-foreground hover:bg-muted/60";

  return (
    <div
      className="mt-2 flex flex-wrap gap-1.5"
      role="group"
      aria-label="Filter by destination property"
    >
      {properties.map((p) => {
        const on = activeFilters.has(p.id);
        return (
          <span
            key={p.id}
            className={cn(
              variant === "overlay" ? baseOverlay : basePlain,
              on
                ? activeClass
                : variant === "overlay"
                  ? inactiveOverlay
                  : inactivePlain,
            )}
          >
            <button
              type="button"
              onClick={() => onToggleFilter(p.id)}
              className="outline-none"
              aria-pressed={on}
            >
              {p.label}
              {p.productIds.length > 0 ? (
                <span className="ml-1 opacity-60">· {p.productIds.length}</span>
              ) : null}
            </button>
            {isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => admin!.onManageProducts(p.id)}
                  aria-label={`Assign products to "${p.label}"`}
                  className="-mr-0.5 ml-0.5 inline-flex size-4 items-center justify-center rounded-full opacity-60 hover:bg-foreground/10 hover:opacity-100"
                >
                  <ListChecks className="size-3" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => admin!.onRemove(p.id)}
                  aria-label={`Remove "${p.label}"`}
                  className="-mr-0.5 inline-flex size-4 items-center justify-center rounded-full opacity-60 hover:bg-foreground/10 hover:opacity-100"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </>
            ) : null}
          </span>
        );
      })}

    </div>
  );
}
