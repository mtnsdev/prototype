"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { DirectoryAmenityTag } from "@/types/product-directory";
import { cn } from "@/lib/utils";
import { AMENITY_LABELS, AMENITY_GROUPS } from "./productDirectoryFilterConfig";

type Props = {
  selected: DirectoryAmenityTag[];
  onChange: (tags: DirectoryAmenityTag[]) => void;
};

export default function ProductDirectoryAmenitiesDropdown({ selected, onChange }: Props) {
  const [amenityDropdownOpen, setAmenityDropdownOpen] = useState(false);
  const [amenitySearch, setAmenitySearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!amenityDropdownOpen) return;
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setAmenityDropdownOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAmenityDropdownOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(t);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [amenityDropdownOpen]);

  const toggle = useCallback(
    (tag: DirectoryAmenityTag) => {
      if (selected.includes(tag)) onChange(selected.filter((t) => t !== tag));
      else onChange([...selected, tag]);
    },
    [selected, onChange]
  );

  const q = amenitySearch.trim().toLowerCase();
  const filteredGroups = AMENITY_GROUPS.map((group) => ({
    ...group,
    tags: group.tags.filter((t) => t.label.toLowerCase().includes(q)),
  })).filter((group) => group.tags.length > 0);

  const summary =
    selected.length === 0 ? (
      <span className="text-[11px] text-[#9B9590]">Amenities</span>
    ) : (
      <span className="truncate text-[11px] text-[#F5F0EB]">
        {selected
          .slice(0, 2)
          .map((t) => AMENITY_LABELS[t])
          .join(", ")}
        {selected.length > 2 && ` +${selected.length - 2}`}
      </span>
    );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={amenityDropdownOpen}
        onClick={() => setAmenityDropdownOpen((o) => !o)}
        className={cn(
          "flex max-w-[200px] items-center gap-2 rounded-lg border px-3 py-1.5 text-left transition-colors",
          selected.length > 0
            ? "border-[rgba(91,138,110,0.20)] bg-[rgba(91,138,110,0.08)] text-[#5B8A6E]"
            : "border-[rgba(255,255,255,0.03)] bg-[#0c0c12] text-[#9B9590] hover:border-[rgba(255,255,255,0.06)]"
        )}
      >
        {summary}
        <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-[#4A4540]" />
      </button>

      {amenityDropdownOpen && (
        <div className="absolute left-0 top-full z-[60] mt-1 w-64 max-h-80 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0c0c12] shadow-xl">
          <div className="sticky top-0 z-[1] border-b border-[rgba(255,255,255,0.03)] bg-[#0c0c12] p-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search amenities…"
              className="w-full rounded-lg border-none bg-[rgba(255,255,255,0.03)] px-2 py-1.5 text-[11px] text-[#F5F0EB] placeholder-[#4A4540] focus:outline-none focus:ring-1 focus:ring-[#C9A96E]/40"
              value={amenitySearch}
              onChange={(e) => setAmenitySearch(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredGroups.map((group) => (
              <div key={group.label}>
                <div className="bg-[rgba(255,255,255,0.02)] px-3 py-1.5">
                  <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-[#4A4540]">
                    {group.label}
                  </span>
                </div>
                {group.tags.map(({ id, label }) => {
                  const on = selected.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] text-[#9B9590] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                      onClick={() => toggle(id)}
                    >
                      <span>{label}</span>
                      {on ? (
                        <Check className="h-3 w-3 shrink-0 text-[#5B8A6E]" />
                      ) : (
                        <span className="h-3 w-3 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          {selected.length > 0 && (
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
