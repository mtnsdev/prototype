"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommissionBracketId } from "./productDirectoryFilterConfig";
import { COMMISSION_BRACKETS } from "./productDirectoryFilterConfig";

type Props = {
  /** `null` = any commission (no bracket filter). */
  bracketId: CommissionBracketId | null;
  onBracketChange: (id: CommissionBracketId | null) => void;
  sortByCommission: boolean;
  onSortByCommissionChange: (v: boolean) => void;
};

export default function ProductDirectoryCommissionDropdown({
  bracketId,
  onBracketChange,
  sortByCommission,
  onSortByCommissionChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const active = bracketId != null && bracketId !== "any";
  const label = active ? (COMMISSION_BRACKETS.find((b) => b.id === bracketId)?.label ?? "Commission") : "Commission";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-border bg-popover px-3 py-1.5 text-left transition-colors hover:border-border"
      >
        <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/65">Commission</span>
        <span className={cn("text-xs", active ? "text-[#B8976E]" : "text-muted-foreground")}>{label}</span>
        <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/65" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[60] mt-1 w-52 rounded-xl border border-border bg-popover py-1 shadow-xl">
          {COMMISSION_BRACKETS.map((b) => {
            const selected = b.id === "any" ? bracketId == null : bracketId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-xs transition-colors hover:bg-[rgba(255,255,255,0.04)]",
                  selected ? "text-brand-cta" : "text-muted-foreground"
                )}
                onClick={() => {
                  onBracketChange(b.id === "any" ? null : b.id);
                }}
              >
                {b.label}
              </button>
            );
          })}
          <div className="border-t border-border px-3 py-2">
            <label className="flex cursor-pointer items-center gap-2 text-2xs text-muted-foreground">
              <input
                type="checkbox"
                className="checkbox-on-dark checkbox-on-dark-sm"
                checked={sortByCommission}
                onChange={(e) => onSortByCommissionChange(e.target.checked)}
              />
              Sort by highest rate
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
