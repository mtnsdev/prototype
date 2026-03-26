"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import type { DirectoryCollectionOption } from "@/types/product-directory";
import { cn } from "@/lib/utils";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import type { Team } from "@/types/teams";
import { TEAM_EVERYONE_ID } from "@/types/teams";

type Props = {
  collections: DirectoryCollectionOption[];
  teams: Team[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onRequestNewCollection: () => void;
};

function scopeForBadge(c: DirectoryCollectionOption) {
  return c.scope === "private" ? "private" : (c.teamId ?? TEAM_EVERYONE_ID);
}

export default function ProductDirectoryCollectionSearchDropdown({
  collections,
  teams,
  selectedIds,
  onChange,
  onRequestNewCollection,
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

  const filtered = collections.filter((c) => {
    const label = c.teamName ? `[${c.teamName}] ${c.name}` : c.name;
    return label.toLowerCase().includes(search.trim().toLowerCase());
  });

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  };

  const summary =
    selectedIds.length === 0 ? (
      <span className="text-[11px] text-[#9B9590]">Collection</span>
    ) : (
      <span className="truncate text-[11px] text-[#F5F0EB]">
        {selectedIds.length === 1
          ? collections.find((c) => c.id === selectedIds[0])?.name ?? "Collection"
          : `${selectedIds.length} collections`}
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
          selectedIds.length > 0
            ? "border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] text-[#C9A96E]"
            : "border-[rgba(255,255,255,0.03)] bg-[#0c0c12] text-[#9B9590] hover:border-[rgba(255,255,255,0.06)]"
        )}
      >
        {summary}
        <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-[#4A4540]" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1 w-64 max-h-72 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0c0c12] shadow-xl">
          <div className="sticky top-0 z-[1] border-b border-[rgba(255,255,255,0.03)] bg-[#0c0c12] p-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search collections..."
              className="w-full rounded-lg border-none bg-[rgba(255,255,255,0.03)] px-2 py-1.5 text-[11px] text-[#F5F0EB] placeholder-[#4A4540] focus:outline-none focus:ring-1 focus:ring-[#C9A96E]/40"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button
              type="button"
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-[11px] transition-colors hover:bg-[rgba(255,255,255,0.04)]",
                selectedIds.length === 0 ? "text-[#F5F0EB]" : "text-[#9B9590]"
              )}
              onClick={() => onChange([])}
            >
              <span>All Products</span>
              {selectedIds.length === 0 ? <Check className="h-3 w-3 shrink-0 text-[#C9A96E]" /> : null}
            </button>
            <div className="border-t border-[rgba(255,255,255,0.03)]" />
            {filtered.map((col) => {
              const on = selectedIds.includes(col.id);
              const label = col.teamName ? `[${col.teamName}] ${col.name}` : col.name;
              return (
                <button
                  key={col.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[11px] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                  onClick={() => toggle(col.id)}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate text-[#9B9590]">{label}</span>
                    <ScopeBadge scope={scopeForBadge(col)} teams={teams} className="shrink-0" />
                  </div>
                  {on ? <Check className="h-3 w-3 shrink-0 text-[#C9A96E]" /> : null}
                </button>
              );
            })}
          </div>
          <div className="border-t border-[rgba(255,255,255,0.03)] p-1">
            <button
              type="button"
              className="flex w-full items-center gap-1 px-3 py-2 text-left text-[11px] text-[#C9A96E] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
              onClick={() => {
                setOpen(false);
                onRequestNewCollection();
              }}
            >
              <Plus className="h-3 w-3 shrink-0" /> New Collection
            </button>
          </div>
          {selectedIds.length > 0 && (
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
