"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] transition-colors",
          commissionFilterActive
            ? "border-[rgba(184,151,110,0.20)] bg-[rgba(184,151,110,0.08)] text-[#B8976E]"
            : "border-[rgba(255,255,255,0.03)] bg-[#0c0c12] text-[#9B9590] hover:border-[rgba(255,255,255,0.06)]"
        )}
      >
        {commissionFilterActive ? `${lo}% – ${hi}%` : "Commission"}
        <ChevronDown className="h-3 w-3 shrink-0 text-[#4A4540]" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1 w-72 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0c0c12] p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#F5F0EB]">Commission Range</span>
            <button
              type="button"
              role="switch"
              aria-checked={commissionFilterActive}
              onClick={() => {
                onCommissionFilterActiveChange(!commissionFilterActive);
                if (commissionFilterActive) onCommissionRangeChange([0, 25]);
              }}
              className={cn(
                "relative h-4 w-8 rounded-full transition-colors",
                commissionFilterActive ? "bg-[#B8976E]" : "bg-white/[0.06]"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform",
                  commissionFilterActive ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          <div className="mb-3">
            <span className="text-[20px] font-medium text-[#B8976E]">
              {lo}% – {hi}%
            </span>
          </div>

          <div className="relative mb-4 h-8">
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

          <div className="mb-4 flex justify-between text-[9px] text-[#4A4540]">
            <span>0%</span>
            <span>5%</span>
            <span>10%</span>
            <span>15%</span>
            <span>20%</span>
            <span>25%</span>
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.04] pt-3">
            <span className="text-[10px] text-[#9B9590]">Sort by highest commission</span>
            <button
              type="button"
              role="switch"
              aria-checked={sortByCommission}
              onClick={() => onSortByCommissionChange(!sortByCommission)}
              className={cn(
                "relative h-4 w-8 flex-shrink-0 rounded-full transition-colors",
                sortByCommission ? "bg-[#B8976E]" : "bg-white/[0.06]"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform",
                  sortByCommission ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  onCommissionRangeChange(p.range);
                  onCommissionFilterActiveChange(true);
                }}
                className="rounded-md bg-white/[0.03] px-2 py-1 text-[9px] text-[#6B6560] transition-colors hover:bg-white/[0.06] hover:text-[#9B9590]"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
