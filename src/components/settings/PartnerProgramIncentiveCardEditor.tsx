"use client";

import { Trash2 } from "lucide-react";
import { parseRateNumber } from "@/lib/partnerProgramMerge";
import { cn } from "@/lib/utils";
import type { Incentive, VolumeMetric } from "@/types/partner-programs";

function isoDay(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
}

function dayToIso(d: string): string | null {
  return d ? `${d}T12:00:00.000Z` : null;
}

function formatRateValue(n: number, rateType: "percentage" | "flat"): string {
  if (!Number.isFinite(n) || n < 0) return rateType === "flat" ? "0" : "0%";
  return rateType === "flat" ? String(n) : `${n}%`;
}

type Props = {
  incentive: Incentive;
  linkedProductIds: string[];
  productNameForId: (id: string) => string;
  onCommit: (next: Incentive) => void;
  onRemove: () => void;
  /** Brief emphasis after creating from Add incentive (scroll target uses `pp-incentive-${id}`). */
  highlight?: boolean;
};

/**
 * Matches the Partner programs “Temporary incentives” card in the product directory (step 3):
 * title, details, rate type, numeric effective rate, stacking, optional volume block, windows, scope.
 */
export function PartnerProgramIncentiveCardEditor({
  incentive: inc,
  linkedProductIds,
  productNameForId,
  onCommit,
  onRemove,
  highlight = false,
}: Props) {
  const rt = inc.rateType ?? "percentage";
  const effective = parseRateNumber(inc.rateValue) ?? 0;
  const scopeAll = inc.productIds === "all";
  const selected =
    inc.productIds === "all" ? [] : inc.productIds.filter((id) => linkedProductIds.includes(id));

  const patch = (partial: Partial<Incentive>) => {
    const now = new Date().toISOString();
    onCommit({
      ...inc,
      ...partial,
      updatedAt: now,
      updatedBy: "admin",
    });
  };

  const setEffective = (n: number) => {
    patch({ rateValue: formatRateValue(n, rt) });
  };

  const setScopeAll = (all: boolean) => {
    if (all || linkedProductIds.length === 0) {
      patch({ productIds: "all" });
    } else {
      patch({ productIds: selected.length > 0 ? selected : [linkedProductIds[0]] });
    }
  };

  const toggleProduct = (productId: string) => {
    if (inc.productIds === "all") return;
    const set = new Set(inc.productIds);
    if (set.has(productId)) {
      if (set.size <= 1) return;
      set.delete(productId);
    } else set.add(productId);
    patch({ productIds: [...set] });
  };

  const singleProductId =
    inc.productIds !== "all" && inc.productIds.length === 1 ? inc.productIds[0] : null;

  return (
    <div
      id={`pp-incentive-${inc.id}`}
      className={cn(
        "rounded-md border border-border bg-inset px-2.5 py-2 transition-shadow duration-500",
        highlight && "ring-2 ring-amber-400/45 shadow-[0_0_12px_rgba(251,191,36,0.12)]"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Incentive</span>
          {singleProductId ? (
            <p className="mt-0.5 text-[9px] text-amber-200/90">
              Scoped to {productNameForId(singleProductId)}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="rounded-md border border-border p-1 text-muted-foreground transition-colors hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300"
          aria-label="Remove incentive"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <label className="mb-2 block">
        <span className="mb-0.5 block text-[9px] text-muted-foreground">Title (optional)</span>
        <input
          value={inc.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="e.g. Q2 booking bonus"
          className="h-8 w-full rounded border border-border bg-background px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground/65"
        />
      </label>
      <label className="mb-2 block">
        <span className="mb-0.5 block text-[9px] text-muted-foreground">Details</span>
        <textarea
          rows={2}
          value={inc.eligibilityNotes ?? ""}
          onChange={(e) => patch({ eligibilityNotes: e.target.value.trim() ? e.target.value : null })}
          placeholder="Stacking rules, eligible room types, advisor notes…"
          className="w-full resize-none rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/65"
        />
      </label>
      <div className="mb-2 grid gap-2 sm:grid-cols-2 sm:items-end">
        <label className="flex min-h-0 flex-col gap-0.5">
          <span className="text-[9px] text-muted-foreground">Rate type</span>
          <select
            value={rt}
            onChange={(e) => {
              const nextRt = e.target.value as "percentage" | "flat";
              const n = parseRateNumber(inc.rateValue) ?? 0;
              patch({
                rateType: nextRt,
                rateValue: formatRateValue(n, nextRt),
              });
            }}
            className="h-8 w-full rounded border border-border bg-background px-2 text-2xs text-foreground outline-none"
          >
            <option value="percentage">Percentage</option>
            <option value="flat">Flat</option>
          </select>
        </label>
        <label className="flex min-h-0 flex-col gap-0.5">
          <span className="text-[9px] text-muted-foreground">
            {rt === "flat" ? "Flat amount" : "Effective rate"}
          </span>
          <div className="flex h-8 w-full min-w-0 items-center gap-1.5 rounded border border-border bg-background px-2">
            {rt === "flat" ? <span className="shrink-0 text-2xs text-muted-foreground">$</span> : null}
            <input
              type="number"
              min={0}
              step={rt === "flat" ? 1 : 0.1}
              value={effective}
              onChange={(e) => setEffective(Math.max(0, Number(e.target.value) || 0))}
              className="min-h-0 min-w-0 flex-1 border-0 bg-transparent p-0 text-2xs text-foreground outline-none"
            />
            {rt === "flat" ? null : <span className="shrink-0 text-2xs text-muted-foreground">%</span>}
          </div>
        </label>
      </div>
      <label className="mb-2 flex items-start gap-2 text-2xs text-muted-foreground">
        <input
          type="checkbox"
          checked={inc.stacksWithBase}
          onChange={(e) => patch({ stacksWithBase: e.target.checked })}
          className="mt-0.5 rounded border-border"
        />
        <span>Stacks with base commission (off = override / seasonal-style)</span>
      </label>
      <div className="mb-2 space-y-2 rounded-md border border-border bg-white/[0.03] p-2">
        <p className="text-[9px] font-medium uppercase text-muted-foreground">Volume incentive (optional)</p>
        <p className="text-[9px] leading-snug text-muted-foreground">
          Choose a metric to mark this as a volume incentive. Threshold is optional.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="mb-0.5 block text-[9px] text-muted-foreground">Volume metric</span>
            <select
              value={inc.volumeMetric ?? ""}
              onChange={(e) => {
                const v = e.target.value as VolumeMetric | "";
                patch({
                  volumeMetric: v === "" ? null : v,
                  volumeThreshold: v === "" ? null : inc.volumeThreshold,
                  volumeRetroactive: v === "" ? false : inc.volumeRetroactive,
                });
              }}
              className="h-8 w-full rounded border border-border bg-background px-2 text-2xs text-foreground outline-none"
            >
              <option value="">None (not volume)</option>
              <option value="room_nights">Room nights</option>
              <option value="bookings">Bookings</option>
              <option value="revenue">Revenue</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[9px] text-muted-foreground">Threshold (optional)</span>
            <input
              type="number"
              min={0}
              step={1}
              disabled={!inc.volumeMetric}
              value={inc.volumeThreshold != null && Number.isFinite(inc.volumeThreshold) ? inc.volumeThreshold : ""}
              onChange={(e) => {
                const raw = e.target.value;
                patch({
                  volumeThreshold: raw === "" ? null : Math.max(0, Number(raw) || 0),
                });
              }}
              className="h-8 w-full rounded border border-border bg-background px-2 text-2xs text-foreground outline-none disabled:opacity-50"
              placeholder="e.g. 10"
            />
          </label>
        </div>
        <label className="flex items-start gap-2 text-[9px] leading-snug text-muted-foreground">
          <input
            type="checkbox"
            disabled={!inc.volumeMetric}
            checked={inc.volumeRetroactive}
            onChange={(e) => patch({ volumeRetroactive: e.target.checked })}
            className="mt-0.5 rounded border-border disabled:opacity-50"
          />
          <span>Retroactive in window — informational (whether past bookings in the window count).</span>
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-[9px] text-muted-foreground">
          Booking window
          <div className="mt-0.5 flex items-center gap-1">
            <input
              type="date"
              value={isoDay(inc.bookingWindowStart)}
              onChange={(e) => patch({ bookingWindowStart: dayToIso(e.target.value) })}
              className="h-7 w-full rounded border border-border bg-background px-1.5 text-2xs text-foreground outline-none"
            />
            <span>→</span>
            <input
              type="date"
              value={isoDay(inc.bookingWindowEnd)}
              onChange={(e) => patch({ bookingWindowEnd: dayToIso(e.target.value) })}
              className="h-7 w-full rounded border border-border bg-background px-1.5 text-2xs text-foreground outline-none"
            />
          </div>
        </label>
        <label className="text-[9px] text-muted-foreground">
          Travel window
          <div className="mt-0.5 flex items-center gap-1">
            <input
              type="date"
              value={isoDay(inc.travelWindowStart)}
              onChange={(e) => patch({ travelWindowStart: dayToIso(e.target.value) })}
              className="h-7 w-full rounded border border-border bg-background px-1.5 text-2xs text-foreground outline-none"
            />
            <span>→</span>
            <input
              type="date"
              value={isoDay(inc.travelWindowEnd)}
              onChange={(e) => patch({ travelWindowEnd: dayToIso(e.target.value) })}
              className="h-7 w-full rounded border border-border bg-background px-1.5 text-2xs text-foreground outline-none"
            />
          </div>
        </label>
      </div>

      {linkedProductIds.length > 0 ? (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <p className="text-[9px] font-medium uppercase text-muted-foreground">Applies to</p>
          <label className="flex items-center gap-2 text-2xs text-muted-foreground">
            <input
              type="radio"
              className="border-border"
              checked={scopeAll}
              onChange={() => setScopeAll(true)}
            />
            All linked products
          </label>
          <label className="flex items-center gap-2 text-2xs text-muted-foreground">
            <input
              type="radio"
              className="border-border"
              checked={!scopeAll}
              onChange={() => setScopeAll(false)}
            />
            Specific linked products
          </label>
          {!scopeAll ? (
            <div className="ml-4 flex max-h-28 flex-col gap-1 overflow-y-auto">
              {linkedProductIds.map((pid) => (
                <label key={pid} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={inc.productIds !== "all" && inc.productIds.includes(pid)}
                    onChange={() => toggleProduct(pid)}
                  />
                  {productNameForId(pid)}
                </label>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
