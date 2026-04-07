"use client";

import { useMemo } from "react";
import { Package, TrendingDown, TrendingUp } from "lucide-react";
import type { ProductUpdate, ProductUpdateType } from "@/types/briefing-room";
import { formatBriefingRelativeTime, useProductIntel } from "@/hooks/useBriefingRoom";
import { WidgetShell } from "../WidgetShell";

const TYPE_LABEL: Record<ProductUpdateType, string> = {
  new: "New",
  "rate-change": "Rate changes",
  "program-update": "Program updates",
  amenity: "Amenities",
};

const TYPE_ORDER: ProductUpdateType[] = ["new", "rate-change", "program-update", "amenity"];

export function ProductIntelWidget() {
  const { data, isPending, isError, error } = useProductIntel();
  const items = data ?? [];

  const grouped = useMemo(() => {
    const map = new Map<ProductUpdateType, ProductUpdate[]>();
    for (const t of TYPE_ORDER) map.set(t, []);
    for (const item of items) {
      const list = map.get(item.updateType) ?? [];
      list.push(item);
      map.set(item.updateType, list);
    }
    return map;
  }, [items]);

  return (
    <WidgetShell
      title="Product intelligence"
      icon={Package}
      loading={isPending}
      error={isError ? (error?.message ?? "Could not load product intel") : undefined}
      skeletonRows={4}
    >
      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No product updates this week.</p>
      ) : (
        <div className="space-y-5">
          {TYPE_ORDER.map((type) => {
            const list = grouped.get(type) ?? [];
            if (!list.length) return null;
            return (
              <div key={type}>
                <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  {TYPE_LABEL[type]}
                </p>
                <ul className="space-y-2">
                  {list.map((u) => (
                    <li
                      key={u.id}
                      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-base)]/40 px-3 py-2"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-[var(--text-primary)]">{u.productName}</span>
                            {u.updateType === "new" ? (
                              <span className="rounded-md border border-[var(--color-success-muted)] bg-[var(--color-success-muted)] px-2 py-0.5 text-2xs font-semibold text-[var(--color-success)]">
                                New
                              </span>
                            ) : null}
                            {u.updateType === "rate-change" && u.rateDirection ? (
                              <span
                                className="inline-flex items-center gap-0.5 text-2xs text-[var(--text-secondary)]"
                                aria-label={u.rateDirection === "up" ? "Rates increased" : "Rates decreased"}
                              >
                                {u.rateDirection === "up" ? (
                                  <TrendingUp className="h-3.5 w-3.5 text-[var(--color-error)]" aria-hidden />
                                ) : (
                                  <TrendingDown className="h-3.5 w-3.5 text-[var(--color-success)]" aria-hidden />
                                )}
                              </span>
                            ) : null}
                          </div>
                          {u.programName ? (
                            <p className="mt-1 text-2xs text-[var(--text-tertiary)]">{u.programName}</p>
                          ) : null}
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">{u.summary}</p>
                          <p className="mt-1 text-2xs text-[var(--text-quaternary)]">
                            {formatBriefingRelativeTime(u.date)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </WidgetShell>
  );
}
