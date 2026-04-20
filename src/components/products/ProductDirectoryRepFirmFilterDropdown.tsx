"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type RepFirmFilterOption = { id: string; name: string };

type Props = {
  repFirms: RepFirmFilterOption[];
  selectedRepFirmIds: string[];
  onChange: (ids: string[]) => void;
};

export default function ProductDirectoryRepFirmFilterDropdown({
  repFirms,
  selectedRepFirmIds,
  onChange,
}: Props) {
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

  const filtered = repFirms.filter((r) =>
    r.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const summary =
    selectedRepFirmIds.length === 0 ? (
      <span className="text-xs text-muted-foreground">Rep firm</span>
    ) : (
      <span className="truncate text-xs text-foreground">
        {repFirms
          .filter((r) => selectedRepFirmIds.includes(r.id))
          .slice(0, 2)
          .map((r) => r.name)
          .join(", ")}
        {selectedRepFirmIds.length > 2 && ` +${selectedRepFirmIds.length - 2}`}
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
          selectedRepFirmIds.length > 0
            ? "border-[rgba(176,122,91,0.25)] bg-[rgba(176,122,91,0.10)] text-[#B07A5B]"
            : "border-border bg-popover text-muted-foreground hover:border-border"
        )}
      >
        {summary}
        <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/65" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1 w-64 rounded-xl border border-border bg-popover shadow-xl">
          <div className="sticky top-0 z-[1] border-b border-border bg-popover p-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search rep firms…"
              className="w-full rounded-lg border-none bg-foreground/[0.04] px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/35"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map((firm) => {
              const on = selectedRepFirmIds.includes(firm.id);
              return (
                <button
                  key={firm.id}
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-white/[0.04]"
                  onClick={() =>
                    onChange(
                      on ? selectedRepFirmIds.filter((id) => id !== firm.id) : [...selectedRepFirmIds, firm.id]
                    )
                  }
                >
                  <span className="truncate">{firm.name}</span>
                  {on ? <Check className="h-3 w-3 shrink-0 text-[#B07A5B]" /> : <span className="h-3 w-3 shrink-0" />}
                </button>
              );
            })}
          </div>
          {selectedRepFirmIds.length > 0 ? (
            <div className="border-t border-border p-1">
              <button
                type="button"
                className="w-full py-1.5 text-2xs text-muted-foreground transition-colors hover:text-muted-foreground"
                onClick={() => onChange([])}
              >
                Clear selection
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
