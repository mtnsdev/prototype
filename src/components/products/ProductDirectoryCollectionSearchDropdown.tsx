"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { DirectoryCollectionOption } from "@/types/product-directory";
import { cn } from "@/lib/utils";

type Props = {
  collections: DirectoryCollectionOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

function collectionMatchesQuery(c: DirectoryCollectionOption, q: string) {
  if (!q) return true;
  if (c.name.toLowerCase().includes(q)) return true;
  if (c.teamName?.toLowerCase().includes(q)) return true;
  return false;
}

function secondaryLine(c: DirectoryCollectionOption): string | null {
  if (c.scope === "private") return "Private";
  if (c.teamName) return c.teamName;
  return null;
}

export default function ProductDirectoryCollectionSearchDropdown({
  collections,
  selectedIds,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }
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

  const q = search.trim().toLowerCase();
  const filtered = collections.filter((c) => collectionMatchesQuery(c, q));
  const systemFiltered = filtered.filter((c) => c.isSystem);
  const userFiltered = filtered.filter((c) => !c.isSystem);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  };

  const summary =
    selectedIds.length === 0 ? (
      <span className="text-xs text-muted-foreground">Collection</span>
    ) : (
      <span className="truncate text-xs text-foreground">
        {selectedIds.length === 1
          ? collections.find((c) => c.id === selectedIds[0])?.name ?? "Collection"
          : `${selectedIds.length} collections`}
      </span>
    );

  const renderCollectionRow = (col: DirectoryCollectionOption) => {
    const on = selectedIds.includes(col.id);
    const sub = secondaryLine(col);
    const count = col.productIds?.length ?? 0;
    return (
      <button
        key={col.id}
        type="button"
        className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-[rgba(255,255,255,0.04)]"
        onClick={() => toggle(col.id)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-xs text-[#E8E4DF]">{col.name}</span>
            <span className="shrink-0 tabular-nums text-2xs text-muted-foreground">{count}</span>
          </div>
          {sub ? <div className="truncate text-2xs text-muted-foreground">{sub}</div> : null}
        </div>
        {on ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-cta" /> : <span className="h-3.5 w-3.5 shrink-0" />}
      </button>
    );
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex max-w-[220px] items-center gap-2 rounded-lg border px-3 py-1.5 text-left transition-colors",
          selectedIds.length > 0
            ? "border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] text-brand-cta"
            : "border-border bg-popover text-muted-foreground hover:border-border"
        )}
      >
        {summary}
        <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/65" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1 w-[min(100vw-2rem,18rem)] max-h-[min(24rem,70vh)] overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
          <div className="border-b border-border p-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search collections…"
              className="w-full rounded-lg border-none bg-[rgba(255,255,255,0.03)] px-2 py-1.5 text-xs text-foreground placeholder-[#4A4540] focus:outline-none focus:ring-1 focus:ring-[#C9A96E]/40"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-[min(16rem,50vh)] overflow-y-auto">
            <button
              type="button"
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-[rgba(255,255,255,0.04)]",
                selectedIds.length === 0 ? "text-foreground" : "text-muted-foreground"
              )}
              onClick={() => onChange([])}
            >
              <span>All Products</span>
              {selectedIds.length === 0 ? <Check className="h-3.5 w-3.5 shrink-0 text-brand-cta" /> : null}
            </button>

            {systemFiltered.length > 0 ? <>{systemFiltered.map(renderCollectionRow)}</> : null}

            {systemFiltered.length > 0 && userFiltered.length > 0 ? (
              <div className="mx-3 border-t border-border" role="separator" />
            ) : null}

            {userFiltered.length > 0 ? <>{userFiltered.map(renderCollectionRow)}</> : null}

            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">No collections match.</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
