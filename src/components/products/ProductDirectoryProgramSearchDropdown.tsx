"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AGENCY_PROGRAM_OPTIONS } from "./productDirectoryFilterConfig";

type Props = {
  selectedProgramIds: string[];
  onChange: (ids: string[]) => void;
};

export default function ProductDirectoryProgramSearchDropdown({ selectedProgramIds, onChange }: Props) {
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

  const filtered = AGENCY_PROGRAM_OPTIONS.filter((p) =>
    p.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const summary =
    selectedProgramIds.length === 0 ? (
      <span className="text-xs text-muted-foreground">Program</span>
    ) : (
      <span className="truncate text-xs text-foreground">
        {AGENCY_PROGRAM_OPTIONS.filter((p) => selectedProgramIds.includes(p.id))
          .slice(0, 2)
          .map((p) => p.name)
          .join(", ")}
        {selectedProgramIds.length > 2 && ` +${selectedProgramIds.length - 2}`}
      </span>
    );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex max-w-[200px] items-center gap-2 rounded-lg border px-3 py-1.5 text-left transition-colors",
          selectedProgramIds.length > 0
            ? "border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] text-brand-cta"
            : "border-border bg-popover text-muted-foreground hover:border-border"
        )}
      >
        {summary}
        <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/65" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1 w-56 rounded-xl border border-border bg-popover shadow-xl">
          <div className="sticky top-0 z-[1] border-b border-border bg-popover p-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search programs..."
              className="w-full rounded-lg border-none bg-[rgba(255,255,255,0.03)] px-2 py-1.5 text-xs text-foreground placeholder-[#4A4540] focus:outline-none focus:ring-1 focus:ring-[#C9A96E]/40"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map((program) => {
              const on = selectedProgramIds.includes(program.id);
              return (
                <button
                  key={program.id}
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                  onClick={() =>
                    onChange(
                      on ? selectedProgramIds.filter((id) => id !== program.id) : [...selectedProgramIds, program.id]
                    )
                  }
                >
                  <span>{program.name}</span>
                  {on ? <Check className="h-3 w-3 shrink-0 text-brand-cta" /> : <span className="h-3 w-3 shrink-0" />}
                </button>
              );
            })}
          </div>
          {selectedProgramIds.length > 0 && (
            <div className="border-t border-border p-1">
              <button
                type="button"
                className="w-full py-1.5 text-2xs text-muted-foreground transition-colors hover:text-muted-foreground"
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
