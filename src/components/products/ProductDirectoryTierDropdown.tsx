"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { DirectoryTierLevel } from "@/components/products/productDirectoryDetailMeta";
import { cn } from "@/lib/utils";
import { DIRECTORY_TIER_FILTER_UI } from "./productDirectoryFilterConfig";

type Props = {
  selectedTiers: DirectoryTierLevel[];
  onChange: (tiers: DirectoryTierLevel[]) => void;
};

export default function ProductDirectoryTierDropdown({ selectedTiers, onChange }: Props) {
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

  const filtered = DIRECTORY_TIER_FILTER_UI.filter((x) =>
    x.label.toLowerCase().includes(search.trim().toLowerCase())
  );

  const label =
    selectedTiers.length === 0
      ? "Tier"
      : selectedTiers.length === 1
        ? DIRECTORY_TIER_FILTER_UI.find((x) => x.id === selectedTiers[0])?.label
        : `${selectedTiers.length} tiers`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex max-w-[160px] items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-[11px] transition-colors",
          selectedTiers.length > 0
            ? "border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] text-[#C9A96E]"
            : "border-[rgba(255,255,255,0.03)] bg-[#0c0c12] text-[#9B9590] hover:border-[rgba(255,255,255,0.06)]"
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-[#4A4540]" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1 w-56 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0c0c12] shadow-xl">
          <div className="sticky top-0 z-[1] border-b border-[rgba(255,255,255,0.03)] bg-[#0c0c12] p-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search tiers..."
              className="w-full rounded-lg border-none bg-[rgba(255,255,255,0.03)] px-2 py-1.5 text-[11px] text-[#F5F0EB] placeholder-[#4A4540] focus:outline-none focus:ring-1 focus:ring-[#C9A96E]/40"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.map((tier) => {
              const on = selectedTiers.includes(tier.id);
              return (
                <button
                  key={tier.id}
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-[11px] text-[#9B9590] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                  onClick={() =>
                    onChange(on ? selectedTiers.filter((t) => t !== tier.id) : [...selectedTiers, tier.id])
                  }
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: tier.stars }, (_, i) => (
                        <span key={i} className="text-[8px]" style={{ color: tier.color }}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span>{tier.label}</span>
                  </div>
                  {on ? <Check className="h-3 w-3 shrink-0 text-[#C9A96E]" /> : <span className="h-3 w-3 shrink-0" />}
                </button>
              );
            })}
          </div>
          {selectedTiers.length > 0 && (
            <div className="border-t border-[rgba(255,255,255,0.03)] p-1">
              <button
                type="button"
                className="w-full py-1.5 text-[10px] text-[#6B6560] transition-colors hover:text-[#9B9590]"
                onClick={() => onChange([])}
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
