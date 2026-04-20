"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import type { DirectoryAmenityTag } from "@/types/product-directory";
import { cn } from "@/lib/utils";
import { AMENITY_LABELS, AMENITY_GROUPS } from "./productDirectoryFilterConfig";

type Props = {
  selected: DirectoryAmenityTag[];
  onChange: (tags: DirectoryAmenityTag[]) => void;
  /**
   * `partnerPanel` — neutral inset trigger and full-width popover, aligned with partner program
   * “Attach products” panels (vs default green-accent summary chip).
   */
  embedStyle?: "default" | "partnerPanel";
  /** Optional class for the trigger button (e.g. full width in forms). */
  triggerClassName?: string;
  /**
   * When set, free-text amenities (not in the catalog) can be added from search
   * and listed alongside catalog tags (e.g. partner program `customAmenities`).
   */
  customSelected?: string[];
  onCustomChange?: (tags: string[]) => void;
};

export default function ProductDirectoryAmenitiesDropdown({
  selected,
  onChange,
  embedStyle = "default",
  triggerClassName,
  customSelected = [],
  onCustomChange,
}: Props) {
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

  const hasCatalogMatch = filteredGroups.some((g) => g.tags.length > 0);
  const trimmedSearch = amenitySearch.trim();

  const isDuplicateCustom = useMemo(
    () =>
      Boolean(
        trimmedSearch &&
          customSelected.some((c) => c.toLowerCase() === trimmedSearch.toLowerCase())
      ),
    [trimmedSearch, customSelected]
  );

  const canAddAsCustom = useMemo(() => {
    if (!onCustomChange || !trimmedSearch) return false;
    if (isDuplicateCustom) return false;
    return !hasCatalogMatch;
  }, [onCustomChange, trimmedSearch, isDuplicateCustom, hasCatalogMatch]);

  /** Partner panel uses full catalog labels (match picker rows); default style keeps short chips. */
  const summaryLabels = useMemo(() => {
    const fromCatalog =
      embedStyle === "partnerPanel"
        ? selected.map((tid) => {
            for (const g of AMENITY_GROUPS) {
              const row = g.tags.find((t) => t.id === tid);
              if (row) return row.label;
            }
            return AMENITY_LABELS[tid];
          })
        : selected.map((t) => AMENITY_LABELS[t]);
    return [...fromCatalog, ...customSelected];
  }, [selected, customSelected, embedStyle]);

  const totalCount = selected.length + customSelected.length;

  const summary =
    totalCount === 0 ? (
      <span
        className={cn(
          embedStyle === "partnerPanel" ? "text-2xs" : "text-xs",
          "text-muted-foreground"
        )}
      >
        {embedStyle === "partnerPanel" ? "Search or select amenities…" : "Amenities"}
      </span>
    ) : (
      <span
        className={cn(
          "min-w-0 flex-1 text-foreground",
          embedStyle === "partnerPanel"
            ? "text-left text-2xs leading-snug"
            : "truncate text-xs"
        )}
      >
        {embedStyle === "partnerPanel" ? (
          summaryLabels.join(", ")
        ) : (
          <>
            {summaryLabels.slice(0, 2).join(", ")}
            {summaryLabels.length > 2 && ` +${summaryLabels.length - 2}`}
          </>
        )}
      </span>
    );

  const addCustom = useCallback(() => {
    if (!onCustomChange || !trimmedSearch) return;
    if (customSelected.some((c) => c.toLowerCase() === trimmedSearch.toLowerCase())) return;
    onCustomChange([...customSelected, trimmedSearch]);
    setAmenitySearch("");
  }, [onCustomChange, trimmedSearch, customSelected]);

  const removeCustom = useCallback(
    (label: string) => {
      if (!onCustomChange) return;
      onCustomChange(customSelected.filter((c) => c !== label));
    },
    [onCustomChange, customSelected]
  );

  const clearAll = useCallback(() => {
    onChange([]);
    onCustomChange?.([]);
  }, [onChange, onCustomChange]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={amenityDropdownOpen}
        onClick={() => setAmenityDropdownOpen((o) => !o)}
        className={cn(
          "flex gap-2 text-left transition-colors",
          embedStyle === "partnerPanel"
            ? "min-h-9 w-full max-w-none items-center rounded-md border border-border bg-inset px-2.5 py-2 hover:bg-white/[0.03]"
            : "max-w-[200px] items-center rounded-lg border px-3 py-1.5",
          embedStyle !== "partnerPanel" &&
            (totalCount > 0
              ? "border-[rgba(91,138,110,0.20)] bg-[rgba(91,138,110,0.08)] text-[#5B8A6E]"
              : "border-border bg-popover text-muted-foreground hover:border-border"),
          triggerClassName
        )}
      >
        {summary}
        <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/65" />
      </button>

      {amenityDropdownOpen && (
        <div
          className={cn(
            "absolute left-0 top-full z-[60] mt-1 max-h-80 overflow-hidden rounded-xl border border-border bg-popover shadow-xl",
            embedStyle === "partnerPanel"
              ? "right-0 w-full max-w-none"
              : "w-64 max-w-[min(100vw-2rem,20rem)]"
          )}
        >
          <div className="sticky top-0 z-[1] border-b border-border bg-popover p-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search amenities…"
              className="w-full rounded-lg border-none bg-foreground/[0.04] px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/35"
              value={amenitySearch}
              onChange={(e) => setAmenitySearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAddAsCustom) {
                  e.preventDefault();
                  addCustom();
                }
              }}
            />
          </div>

          {canAddAsCustom ? (
            <div className="border-b border-border px-2 py-1.5">
              <button
                type="button"
                className="w-full rounded-lg border border-dashed border-brand-cta/35 bg-[rgba(201,169,110,0.06)] px-2 py-2 text-left text-xs text-foreground transition-colors hover:bg-[rgba(201,169,110,0.10)]"
                onClick={addCustom}
              >
                Add &quot;{trimmedSearch}&quot; as custom
              </button>
            </div>
          ) : null}

          <div className="max-h-60 overflow-y-auto">
            {filteredGroups.map((group) => (
              <div key={group.label}>
                <div className="bg-foreground/[0.03] px-3 py-1.5">
                  <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/65">
                    {group.label}
                  </span>
                </div>
                {group.tags.map(({ id, label }) => {
                  const on = selected.includes(id);
                  if (embedStyle === "partnerPanel") {
                    return (
                      <label
                        key={id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-2 rounded-md border p-2 transition-colors",
                          on
                            ? "border-primary/30 bg-inset"
                            : "border-border bg-inset hover:bg-foreground/[0.04]",
                          "mx-2 mb-1.5 last:mb-0"
                        )}
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => toggle(id)}
                            className="checkbox-on-dark"
                          />
                          <span
                            className={cn(
                              "min-w-0 truncate text-2xs",
                              on ? "text-foreground" : "text-[#C8C0B8]"
                            )}
                          >
                            {label}
                          </span>
                        </span>
                        <span className="shrink-0 text-[9px] text-muted-foreground">{group.label}</span>
                      </label>
                    );
                  }
                  return (
                    <button
                      key={id}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.05]"
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
            {amenitySearch.trim() !== "" && !hasCatalogMatch && !canAddAsCustom ? (
              <p className="px-3 py-4 text-center text-2xs text-muted-foreground">
                {onCustomChange && isDuplicateCustom
                  ? "Already in custom amenities."
                  : "No catalog matches."}
              </p>
            ) : null}
          </div>

          {onCustomChange && customSelected.length > 0 ? (
            <div className="border-t border-border">
              <div className="bg-foreground/[0.03] px-3 py-1.5">
                <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/65">
                  Custom
                </span>
              </div>
              {customSelected.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between gap-2 text-left transition-colors",
                    embedStyle === "partnerPanel"
                      ? "mx-2 mb-1.5 rounded-md border border-primary/30 bg-inset p-2 text-2xs text-foreground last:mb-0 hover:bg-foreground/[0.04]"
                      : "px-3 py-1.5 text-xs text-muted-foreground hover:bg-foreground/[0.05]"
                  )}
                  onClick={() => removeCustom(c)}
                >
                  <span className="min-w-0 truncate">{c}</span>
                  <X className="h-3 w-3 shrink-0 text-muted-foreground/80" aria-hidden />
                </button>
              ))}
            </div>
          ) : null}

          {totalCount > 0 && (
            <div className="border-t border-border p-1">
              <button
                type="button"
                className="w-full py-1.5 text-2xs text-muted-foreground transition-colors hover:text-muted-foreground"
                onClick={clearAll}
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
