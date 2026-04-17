"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown } from "lucide-react";
import type { DirectoryProduct } from "@/types/product-directory";
import type { DirectoryProductCategory } from "@/types/product-directory";
import { getDirectoryProductById } from "@/components/products/productDirectoryMock";
import { searchCatalogProducts } from "@/lib/catalogPickerSource";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  /** When empty, search the full directory (default). */
  allowedTypes?: DirectoryProductCategory[];
  onSelect: (product: DirectoryProduct) => void;
  label?: string;
  /** When false, the field label is omitted (use inside a labeled group). */
  showLabel?: boolean;
  className?: string;
};

export function CatalogProductPicker({
  value,
  allowedTypes = [],
  onSelect,
  label = "Catalog product",
  showLabel = true,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const selected = value ? getDirectoryProductById(value) : undefined;

  const results = useMemo(() => searchCatalogProducts(q, allowedTypes), [q, allowedTypes]);

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel ? <Label>{label}</Label> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-auto min-h-9 w-full justify-between py-2 text-left font-normal"
          >
            <span className="line-clamp-2">
              {selected ? (
                <span className="font-medium text-foreground">{selected.name}</span>
              ) : value ? (
                <span className="text-muted-foreground">Unknown product</span>
              ) : (
                <span className="text-muted-foreground">Search catalog…</span>
              )}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,22rem)] p-0" align="start">
          <div className="border-b border-border p-2">
            <Input
              placeholder="Search by name or location…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>
          <ul
            className="max-h-64 overflow-y-auto p-1"
            role="listbox"
            aria-label="Catalog products"
          >
            {results.length === 0 ? (
              <li className="px-2 py-3 text-sm text-muted-foreground">No matches.</li>
            ) : (
              results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={p.id === value}
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted/80",
                      p.id === value && "bg-muted",
                    )}
                    onClick={() => {
                      onSelect(p);
                      setOpen(false);
                      setQ("");
                    }}
                  >
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      {p.id === value ? <Check className="size-3.5 shrink-0 text-brand-cta" aria-hidden /> : null}
                      {p.name}
                    </span>
                    {p.location ? (
                      <span className="text-2xs text-muted-foreground">{p.location}</span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </PopoverContent>
      </Popover>
      {value ? (
        <p className="text-2xs text-muted-foreground">
          <Link
            href={`/dashboard/products?selected=${encodeURIComponent(value)}`}
            className="text-brand-cta underline-offset-4 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Open in Product Directory
          </Link>
        </p>
      ) : null}
    </div>
  );
}

/**
 * Search the full product directory, multi-select rows, and add — each product is merged into the
 * correct destination list (`inferEditorProductSlot` in catalog merge).
 */
export function CatalogSectionMultiPicker({
  onAddProducts,
}: {
  onAddProducts: (products: DirectoryProduct[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(() => new Set());

  const results = useMemo(() => searchCatalogProducts(q, []), [q]);

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addSelected = () => {
    const products: DirectoryProduct[] = [];
    for (const id of picked) {
      const p = getDirectoryProductById(id);
      if (p) products.push(p);
    }
    if (products.length === 0) return;
    onAddProducts(products);
    setPicked(new Set());
    setOpen(false);
    setQ("");
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-auto min-h-9 w-full justify-between py-2 text-left font-normal"
          >
            <span className="line-clamp-2 text-sm">
              <span className="font-medium text-foreground">Add products</span>
              <span className="mt-0.5 block text-2xs text-muted-foreground">
                Search all directory rows — lists update automatically
              </span>
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,24rem)] p-0" align="start">
          <div className="border-b border-border p-2">
            <Input
              placeholder="Search by name or location…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>
          <ul
            className="max-h-56 overflow-y-auto p-1"
            role="listbox"
            aria-label="Catalog products"
          >
            {results.length === 0 ? (
              <li className="px-2 py-3 text-sm text-muted-foreground">No matches.</li>
            ) : (
              results.map((p) => {
                const on = picked.has(p.id);
                return (
                  <li key={p.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted/80",
                        on && "bg-muted/60",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 rounded border border-input bg-inset"
                        checked={on}
                        onChange={() => toggle(p.id)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium text-foreground">{p.name}</span>
                        {p.location ? (
                          <span className="mt-0.5 block text-2xs text-muted-foreground">{p.location}</span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              disabled={picked.size === 0}
              onClick={() => setPicked(new Set())}
            >
              Clear selection
            </Button>
            <Button type="button" size="sm" disabled={picked.size === 0} onClick={addSelected}>
              {picked.size === 0
                ? "Add selected"
                : `Add ${picked.size} product${picked.size === 1 ? "" : "s"}`}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
