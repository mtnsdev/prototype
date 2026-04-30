"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type CategoryItem<T extends string = string> = {
  id: T;
  label: string;
  icon?: LucideIcon;
};

type Props<T extends string> = {
  items: CategoryItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
};

/**
 * Horizontal category strip — top-level axis for the catalog.
 * Active chip uses --surface-interactive (moss tint) + --brand-primary text.
 * Inactive chips have no background or border — just icon + text.
 */
export function CategoryStrip<T extends string>({ items, active, onChange, className }: Props<T>) {
  return (
    <div
      role="tablist"
      aria-label="Product category"
      className={cn(
        "flex w-full items-center gap-1 overflow-x-auto pb-0.5",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {items.map((item) => {
        const isActive = item.id === active;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap",
              "rounded-full px-3 py-1.5 text-[13px] transition-colors",
              "border border-transparent",
              isActive
                ? "border-[rgba(58,89,56,0.30)] bg-[color:var(--surface-interactive)] font-medium text-[color:var(--brand-primary)]"
                : "text-[color:var(--text-tertiary)] hover:bg-[color:var(--surface-card-hover)] hover:text-[color:var(--text-secondary)]"
            )}
          >
            {Icon ? (
              <Icon
                size={14}
                className={cn(
                  isActive
                    ? "text-[color:var(--brand-primary)]"
                    : "text-[color:var(--chrome-icon-muted)]"
                )}
                aria-hidden
              />
            ) : null}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
