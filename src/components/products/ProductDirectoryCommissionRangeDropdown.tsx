"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductDirectoryFilterSwitch } from "./ProductDirectoryFilterSwitch";

type Props = {
  commissionRange: [number, number];
  onCommissionRangeChange: (r: [number, number]) => void;
  commissionFilterActive: boolean;
  onCommissionFilterActiveChange: (v: boolean) => void;
  sortByCommission: boolean;
  onSortByCommissionChange: (v: boolean) => void;
};

const PRESETS: { label: string; range: [number, number] }[] = [
  { label: "5%+", range: [5, 25] },
  { label: "10%+", range: [10, 25] },
  { label: "10–15%", range: [10, 15] },
  { label: "15%+", range: [15, 25] },
];

export default function ProductDirectoryCommissionRangeDropdown({
  commissionRange,
  onCommissionRangeChange,
  commissionFilterActive,
  onCommissionFilterActiveChange,
  sortByCommission,
  onSortByCommissionChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const filterLabelId = useId();
  const sortLabelId = useId();

  const [lo, hi] = commissionRange;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleFilterToggle = () => {
    if (commissionFilterActive) {
      onCommissionRangeChange([0, 25]);
      onCommissionFilterActiveChange(false);
    } else {
      onCommissionFilterActiveChange(true);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors",
          commissionFilterActive
            ? "border-[rgba(184,151,110,0.20)] bg-[rgba(184,151,110,0.08)] text-[#B8976E]"
            : "border-border bg-popover text-muted-foreground hover:border-border"
        )}
      >
        {commissionFilterActive ? `${lo}% – ${hi}%` : "Commission"}
        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/65" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1 w-72 rounded-xl border border-border bg-popover p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span id={filterLabelId} className="text-xs font-medium text-foreground">
              Filter by range
            </span>
            <ProductDirectoryFilterSwitch
              checked={commissionFilterActive}
              onCheckedChange={handleFilterToggle}
              aria-labelledby={filterLabelId}
            />
          </div>

          <div className="relative mb-2 h-8">
            <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-white/[0.06]" />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full"
              style={{
                left: `${(lo / 25) * 100}%`,
                width: `${((hi - lo) / 25) * 100}%`,
                background: commissionFilterActive ? "#B8976E" : "rgba(184,151,110,0.30)",
              }}
            />
            <input
              type="range"
              min={0}
              max={25}
              step={1}
              value={lo}
              onChange={(e) => {
                const val = Number(e.target.value);
                const nextLo = Math.min(val, hi - 1);
                onCommissionRangeChange([Math.max(0, nextLo), hi]);
                if (!commissionFilterActive) onCommissionFilterActiveChange(true);
              }}
              className="absolute top-0 z-10 h-8 w-full cursor-pointer opacity-0"
            />
            <input
              type="range"
              min={0}
              max={25}
              step={1}
              value={hi}
              onChange={(e) => {
                const val = Number(e.target.value);
                const nextHi = Math.max(val, lo + 1);
                onCommissionRangeChange([lo, Math.min(25, nextHi)]);
                if (!commissionFilterActive) onCommissionFilterActiveChange(true);
              }}
              className="absolute top-0 z-20 h-8 w-full cursor-pointer opacity-0"
            />
            <div
              className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2"
              style={{
                left: `calc(${(lo / 25) * 100}% - 8px)`,
                background: "#0c0c12",
                borderColor: commissionFilterActive ? "#B8976E" : "rgba(184,151,110,0.30)",
              }}
            />
            <div
              className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2"
              style={{
                left: `calc(${(hi / 25) * 100}% - 8px)`,
                background: "#0c0c12",
                borderColor: commissionFilterActive ? "#B8976E" : "rgba(184,151,110,0.30)",
              }}
            />
          </div>

          <p className="mb-3 text-center text-compact font-medium tabular-nums text-[#B8976E]">
            {lo}% – {hi}%
          </p>

          <div className="mb-4 flex justify-between text-[9px] text-muted-foreground/65">
            <span>0%</span>
            <span>5%</span>
            <span>10%</span>
            <span>15%</span>
            <span>20%</span>
            <span>25%</span>
          </div>

          <div className="flex flex-wrap gap-1.5 border-t border-white/[0.04] pt-3">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  onCommissionRangeChange(p.range);
                  onCommissionFilterActiveChange(true);
                }}
                className="rounded-md bg-white/[0.03] px-2 py-1 text-[9px] text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-muted-foreground"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.04] pt-3">
            <span id={sortLabelId} className="text-2xs text-muted-foreground">
              Break ties by highest commission
            </span>
            <ProductDirectoryFilterSwitch
              checked={sortByCommission}
              onCheckedChange={onSortByCommissionChange}
              aria-labelledby={sortLabelId}
            />
          </div>
        </div>
      )}
    </div>
  );
}
