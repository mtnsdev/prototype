"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  filterLocationGroupsBySearch,
  isRegionFullySelected,
  LOCATION_GROUPS,
  toggleRegionSelection,
} from "./locationGroups";

type Props = {
  selectedCountries: string[];
  onChange: (countries: string[]) => void;
};

export default function ProductDirectoryLocationDropdown({ selectedCountries, onChange }: Props) {
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

  const filteredGroups = filterLocationGroupsBySearch(LOCATION_GROUPS, search);

  const toggleCountry = useCallback(
    (country: string) => {
      if (selectedCountries.includes(country)) onChange(selectedCountries.filter((c) => c !== country));
      else onChange([...selectedCountries, country]);
    },
    [selectedCountries, onChange]
  );

  const toggleRegion = useCallback(
    (region: string) => {
      onChange(toggleRegionSelection(region, selectedCountries));
    },
    [selectedCountries, onChange]
  );

  const summary =
    selectedCountries.length === 0 ? null : (
      <span className="truncate text-foreground">
        {selectedCountries.slice(0, 2).join(", ")}
        {selectedCountries.length > 2 && ` +${selectedCountries.length - 2}`}
      </span>
    );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex max-w-[220px] min-w-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-xs transition-colors",
          selectedCountries.length > 0
            ? "border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] text-brand-cta"
            : "border-border bg-popover text-muted-foreground hover:border-border"
        )}
      >
        {selectedCountries.length === 0 ? (
          <>
            <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/65" />
            <span className="text-xs text-muted-foreground">Location</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-foreground">{summary}</span>
        )}
        <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/65" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1 w-64 max-h-80 overflow-y-auto rounded-xl border border-border bg-popover shadow-xl">
          <div className="sticky top-0 z-[1] border-b border-border bg-popover p-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search countries…"
              className="w-full rounded-lg border-none bg-[rgba(255,255,255,0.03)] px-2 py-1.5 text-xs text-foreground placeholder-[#4A4540] focus:outline-none focus:ring-1 focus:ring-[#C9A96E]/40"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {filteredGroups.map((group) => (
            <div key={group.region}>
              <div className="flex items-center justify-between bg-[rgba(255,255,255,0.02)] px-3 py-1.5">
                <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/65">
                  {group.region}
                </span>
                <button
                  type="button"
                  className="text-[9px] text-muted-foreground transition-colors hover:text-muted-foreground"
                  onClick={() => toggleRegion(group.region)}
                >
                  {isRegionFullySelected(group.region, selectedCountries) ? "Clear" : "All"}
                </button>
              </div>
              {group.countries.map((country) => {
                const on = selectedCountries.includes(country);
                return (
                  <button
                    key={country}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                    onClick={() => toggleCountry(country)}
                  >
                    <span>{country}</span>
                    {on ? <Check className="h-3 w-3 shrink-0 text-brand-cta" /> : <span className="h-3 w-3 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
