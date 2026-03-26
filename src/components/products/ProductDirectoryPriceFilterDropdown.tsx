"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { DirectoryPriceTier } from "@/components/products/productDirectoryDetailMeta";
import { cn } from "@/lib/utils";
import { DIRECTORY_PRICE_FILTER_OPTIONS } from "./productDirectoryFilterConfig";

type Props = {
  selectedPriceTiers: DirectoryPriceTier[];
  onChange: (tiers: DirectoryPriceTier[]) => void;
};

export default function ProductDirectoryPriceFilterDropdown({ selectedPriceTiers, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(t);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const q = search.trim().toLowerCase();
  const filteredOptions = DIRECTORY_PRICE_FILTER_OPTIONS.filter(
    (tier) =>
      tier.label.toLowerCase().includes(q) ||
      tier.description.toLowerCase().includes(q) ||
      tier.id.toLowerCase().includes(q)
  );

  const summary =
    selectedPriceTiers.length === 0 ? (
      <span className="text-[11px] text-[#9B9590]">Price</span>
    ) : (
      <span className="truncate text-[11px] text-[#F5F0EB]">{selectedPriceTiers.join(", ")}</span>
    );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex max-w-[180px] items-center gap-2 rounded-lg border px-3 py-1.5 text-left transition-colors",
          selectedPriceTiers.length > 0
            ? "border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] text-[#C9A96E]"
            : "border-[rgba(255,255,255,0.03)] bg-[#0c0c12] text-[#9B9590] hover:border-[rgba(255,255,255,0.06)]"
        )}
      >
        {summary}
        <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-[#4A4540]" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1 max-h-80 w-56 overflow-y-auto rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0c0c12] py-1 shadow-xl">
          <div className="sticky top-0 z-[1] border-b border-[rgba(255,255,255,0.03)] bg-[#0c0c12] p-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search price tiers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border-none bg-[rgba(255,255,255,0.03)] px-2 py-1.5 text-[11px] text-[#F5F0EB] placeholder-[#4A4540] outline-none"
            />
          </div>
          {filteredOptions.map((tier) => {
            const on = selectedPriceTiers.includes(tier.id);
            return (
              <button
                key={tier.id}
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-[11px] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                onClick={() =>
                  onChange(
                    on ? selectedPriceTiers.filter((t) => t !== tier.id) : [...selectedPriceTiers, tier.id]
                  )
                }
              >
                <div>
                  <span className="font-medium text-[#C9A96E]">{tier.label}</span>
                  <span className="ml-2 text-[10px] text-[#6B6560]">{tier.description}</span>
                </div>
                {on ? <Check className="h-3 w-3 shrink-0 text-[#C9A96E]" /> : <span className="h-3 w-3 shrink-0" />}
              </button>
            );
          })}
          {selectedPriceTiers.length > 0 && (
            <div className="border-t border-[rgba(255,255,255,0.03)] p-1">
              <button
                type="button"
                className="w-full py-1.5 text-[10px] text-[#6B6560] transition-colors hover:text-[#9B9590]"
                onClick={() => onChange([])}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
