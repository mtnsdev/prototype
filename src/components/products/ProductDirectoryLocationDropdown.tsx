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
      <span className="truncate text-[#F5F0EB]">
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
          "flex max-w-[220px] items-center gap-2 rounded-lg border px-3 py-1.5 text-left transition-colors",
          selectedCountries.length > 0
            ? "border-[rgba(201,169,110,0.15)] bg-[rgba(201,169,110,0.06)]"
            : "border-[rgba(255,255,255,0.03)] bg-[#0c0c12] hover:border-[rgba(255,255,255,0.06)]"
        )}
      >
        {selectedCountries.length === 0 ? (
          <>
            <MapPin className="h-3 w-3 shrink-0 text-[#4A4540]" />
            <span className="text-[11px] text-[#9B9590]">Location</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 text-[11px]">{summary}</span>
        )}
        <ChevronDown className="h-3 w-3 shrink-0 text-[#4A4540]" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1 w-64 max-h-80 overflow-y-auto rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0c0c12] shadow-xl">
          <div className="sticky top-0 z-[1] border-b border-[rgba(255,255,255,0.03)] bg-[#0c0c12] p-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search countries..."
              className="w-full rounded-lg border-none bg-[rgba(255,255,255,0.03)] px-2 py-1.5 text-[11px] text-[#F5F0EB] placeholder-[#4A4540] focus:outline-none focus:ring-1 focus:ring-[#C9A96E]/40"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {filteredGroups.map((group) => (
            <div key={group.region}>
              <div className="flex items-center justify-between bg-[rgba(255,255,255,0.02)] px-3 py-1.5">
                <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-[#4A4540]">
                  {group.region}
                </span>
                <button
                  type="button"
                  className="text-[9px] text-[#6B6560] transition-colors hover:text-[#9B9590]"
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
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] text-[#9B9590] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                    onClick={() => toggleCountry(country)}
                  >
                    <span>{country}</span>
                    {on ? <Check className="h-3 w-3 shrink-0 text-[#C9A96E]" /> : <span className="h-3 w-3 shrink-0" />}
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
