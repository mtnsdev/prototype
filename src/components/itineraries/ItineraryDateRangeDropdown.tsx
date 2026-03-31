"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarRange, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { directoryFilterTextInputClass } from "@/components/ui/page-search-field";

type Props = {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
};

function formatIsoForLabel(iso: string): string {
  if (!iso || iso.length < 10) return iso;
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${m}/${d}/${y}`;
}

export default function ItineraryDateRangeDropdown({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const hasRange = dateFrom !== "" || dateTo !== "";

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

  const summary =
    dateFrom && dateTo
      ? `${formatIsoForLabel(dateFrom)} – ${formatIsoForLabel(dateTo)}`
      : dateFrom
        ? `From ${formatIsoForLabel(dateFrom)}`
        : dateTo
          ? `Until ${formatIsoForLabel(dateTo)}`
          : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={
          hasRange
            ? `Trip dates: ${summary ?? "custom"}`
            : "Filter by trip start or end date"
        }
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex max-w-[240px] min-w-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-xs transition-colors",
          hasRange
            ? "border-brand-cta/20 bg-brand-cta/10 text-brand-cta"
            : "border-border bg-popover text-muted-foreground hover:border-border"
        )}
      >
        <CalendarRange className="h-3 w-3 shrink-0 text-muted-foreground/65" aria-hidden />
        {!hasRange ? (
          <span className="text-xs text-muted-foreground">Trip dates</span>
        ) : (
          <span className="min-w-0 flex-1 truncate text-foreground">{summary}</span>
        )}
        <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/65" aria-hidden />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-[60] mt-1 w-64 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/65">
            Trip window
          </p>
          <div className="space-y-2">
            <label className="block">
              <span className="mb-1 block text-2xs text-muted-foreground">Ends on or after</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className={cn(directoryFilterTextInputClass, "w-full")}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-2xs text-muted-foreground">Starts on or before</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className={cn(directoryFilterTextInputClass, "w-full")}
              />
            </label>
          </div>
          {hasRange ? (
            <button
              type="button"
              className="mt-3 w-full text-left text-2xs text-brand-cta transition-colors hover:text-brand-cta-hover hover:underline"
              onClick={() => {
                onDateFromChange("");
                onDateToChange("");
              }}
            >
              Clear dates
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
