"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  showExpiringOnly: boolean;
  onShowExpiringOnlyChange: (v: boolean) => void;
  showMyEnrichedOnly: boolean;
  onShowMyEnrichedOnlyChange: (v: boolean) => void;
  enrichFilterTeam: boolean;
  onEnrichFilterTeamChange: (v: boolean) => void;
  enrichFilterPersonal: boolean;
  onEnrichFilterPersonalChange: (v: boolean) => void;
};

export default function ProductDirectoryMoreFiltersDropdown({
  showExpiringOnly,
  onShowExpiringOnlyChange,
  showMyEnrichedOnly,
  onShowMyEnrichedOnlyChange,
  enrichFilterTeam,
  onEnrichFilterTeamChange,
  enrichFilterPersonal,
  onEnrichFilterPersonalChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeCount = [showExpiringOnly, showMyEnrichedOnly].filter(Boolean).length;

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
          activeCount > 0
            ? "border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] text-[#C9A96E]"
            : "border-[rgba(255,255,255,0.03)] bg-[#0c0c12] text-[#9B9590] hover:border-[rgba(255,255,255,0.06)]"
        )}
      >
        More{activeCount > 0 ? ` (${activeCount})` : ""}
        <ChevronDown className="h-3 w-3 shrink-0 text-[#4A4540]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[60] mt-1 w-72 space-y-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0c0c12] p-3 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] text-[#F5F0EB]">Expiring Programs</p>
              <p className="text-[9px] text-[#6B6560]">Program expiring within 30 days</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showExpiringOnly}
              onClick={() => onShowExpiringOnlyChange(!showExpiringOnly)}
              className={cn(
                "relative h-4 w-8 flex-shrink-0 rounded-full transition-colors",
                showExpiringOnly ? "bg-[#B8976E]" : "bg-white/[0.06]"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform",
                  showExpiringOnly ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          <div className="h-px bg-white/[0.04]" />

          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] text-[#F5F0EB]">My Enriched Products</p>
              <p className="text-[9px] text-[#6B6560]">Personal notes or team data</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showMyEnrichedOnly}
              onClick={() => onShowMyEnrichedOnlyChange(!showMyEnrichedOnly)}
              className={cn(
                "relative h-4 w-8 flex-shrink-0 rounded-full transition-colors",
                showMyEnrichedOnly ? "bg-[rgba(160,140,180,0.70)]" : "bg-white/[0.06]"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform",
                  showMyEnrichedOnly ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          {showMyEnrichedOnly && (
            <div className="ml-1 space-y-1.5">
              <label className="flex cursor-pointer items-center gap-2 text-[10px] text-[#9B9590]">
                <input
                  type="checkbox"
                  checked={enrichFilterTeam}
                  onChange={() => onEnrichFilterTeamChange(!enrichFilterTeam)}
                  className="checkbox-on-dark checkbox-on-dark-sm"
                />
                Team data (notes, programs, contacts)
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-[10px] text-[#9B9590]">
                <input
                  type="checkbox"
                  checked={enrichFilterPersonal}
                  onChange={() => onEnrichFilterPersonalChange(!enrichFilterPersonal)}
                  className="checkbox-on-dark checkbox-on-dark-sm"
                />
                My personal notes
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
