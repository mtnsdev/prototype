"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import type { DirectoryProduct } from "@/types/product-directory";
import type { DirectoryProductCategory } from "@/types/product-directory";
import { getDirectoryProductById } from "@/components/products/productDirectoryMock";
import { resolveAdvisorCatalogFromStorage } from "@/components/products/productDirectoryCatalogResolve";
import { searchCatalogProducts } from "@/lib/catalogPickerSource";
import { buildDirectoryProductQuickCreate, newQuickCreateProductId, type DirectoryQuickCreateCategory } from "@/lib/directoryQuickCreateProduct";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useProductDirectoryCatalog } from "@/components/products/ProductDirectoryCatalogContext";
import { ProductDirectoryCategoryBadge } from "@/components/products/ProductDirectoryCategoryBadge";
import { useToast } from "@/contexts/ToastContext";

const QUICK_CATEGORIES: DirectoryQuickCreateCategory[] = [
  "Hotel",
  "DMC",
  "Restaurant",
  "Yacht Charter",
  "Tour Operator",
  "Villa",
  "Other",
];

function useAdvisorProductPool() {
  const { user, isLoading } = useUser();
  const { catalogRevision } = useProductDirectoryCatalog();
  return useMemo(() => {
    if (isLoading || !user) {
      return { pool: undefined as DirectoryProduct[] | undefined, catalogRevision };
    }
    const uid = String(user.id);
    const name = user.username?.trim() || user.email?.split("@")[0] || "You";
    return { pool: resolveAdvisorCatalogFromStorage(uid, name).products, catalogRevision };
  }, [user, isLoading, catalogRevision]);
}

function resolveProductById(id: string, pool: DirectoryProduct[] | undefined): DirectoryProduct | undefined {
  return pool?.find((p) => p.id === id) ?? getDirectoryProductById(id);
}

function CatalogCreateInlineBlock({
  initialName,
  onCreated,
}: {
  initialName: string;
  onCreated: (p: DirectoryProduct) => void;
}) {
  const toast = useToast();
  const { appendPersistedProduct } = useProductDirectoryCatalog();
  const [name, setName] = useState(initialName.trim());
  const [category, setCategory] = useState<DirectoryQuickCreateCategory>("Hotel");

  useEffect(() => {
    setName(initialName.trim());
  }, [initialName]);

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    const id = newQuickCreateProductId();
    const p = buildDirectoryProductQuickCreate(n, category, id);
    if (!appendPersistedProduct(p)) {
      toast({ title: "Could not add product", tone: "destructive" });
      return;
    }
    onCreated(p);
  };

  return (
    <div className="space-y-2 border-t border-border bg-popover p-2">
      <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Plus className="size-3.5 shrink-0 text-brand-cta" aria-hidden />
        Create new product
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="cat-create-name" className="text-2xs text-muted-foreground">
          Product name
        </Label>
        <Input
          id="cat-create-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-sm"
          placeholder="Partner or property name"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-2xs text-muted-foreground">Category</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as DirectoryQuickCreateCategory)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUICK_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" size="sm" className="w-full" onClick={submit} disabled={!name.trim()}>
        Create and link
      </Button>
    </div>
  );
}

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
  const { pool } = useAdvisorProductPool();
  const results = useMemo(() => searchCatalogProducts(q, allowedTypes, pool), [q, allowedTypes, pool]);
  const selected = value ? resolveProductById(value, pool) : undefined;

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
          <ul className="max-h-52 overflow-y-auto p-1" role="listbox" aria-label="Catalog products">
            {results.map((p) => (
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
                  {p.location ? <span className="text-2xs text-muted-foreground">{p.location}</span> : null}
                </button>
              </li>
            ))}
            {results.length === 0 ? (
              <li className="px-2 py-2 text-sm text-muted-foreground">No matches in catalog.</li>
            ) : null}
          </ul>
          {results.length === 0 ? (
            <CatalogCreateInlineBlock
              initialName={q}
              onCreated={(p) => {
                onSelect(p);
                setOpen(false);
                setQ("");
              }}
            />
          ) : null}
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
 *
 * Rendered inside a Dialog (from SectionBlockAppendRow). Search with icon, category badges,
 * polished checkboxes, and a solid "Add to guide" footer.
 */
export function CatalogSectionMultiPicker({
  onAddProducts,
}: {
  onAddProducts: (products: DirectoryProduct[]) => void;
}) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const { pool } = useAdvisorProductPool();
  const results = useMemo(() => searchCatalogProducts(q, [], pool), [q, pool]);

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
      const p = resolveProductById(id, pool);
      if (p) products.push(p);
    }
    if (products.length === 0) return;
    onAddProducts(products);
    setPicked(new Set());
    setQ("");
  };

  return (
    <div className="space-y-3">
      {/* Search field with icon */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" aria-hidden />
        <Input
          placeholder="Search by name or location…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-10 pl-9 text-sm"
          autoFocus
        />
      </div>

      {/* Results list */}
      <ul className="max-h-64 overflow-y-auto rounded-md border border-border" role="listbox" aria-label="Catalog products">
        {results.map((p, i) => {
          const on = picked.has(p.id);
          return (
            <li key={p.id} className={cn(i > 0 && "border-t border-border/40")}>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/60",
                  on && "bg-brand-cta/5",
                )}
              >
                {/* Custom checkbox */}
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                    on
                      ? "border-brand-cta bg-brand-cta text-white"
                      : "border-border bg-background",
                  )}
                >
                  {on ? <Check className="size-3" aria-hidden /> : null}
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  onChange={() => toggle(p.id)}
                />

                {/* Product info */}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{p.name}</span>
                    {p.types.length > 0 ? (
                      <ProductDirectoryCategoryBadge types={p.types} compact />
                    ) : null}
                  </span>
                  {p.location ? (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{p.location}</span>
                  ) : null}
                </span>
              </label>
            </li>
          );
        })}
        {results.length === 0 ? (
          <li className="px-3 py-4 text-center text-sm text-muted-foreground">
            No matches in your catalog.
          </li>
        ) : null}
      </ul>

      {/* Inline create when no results */}
      {results.length === 0 ? (
        <CatalogCreateInlineBlock
          initialName={q}
          onCreated={(p) => {
            onAddProducts([p]);
            setPicked(new Set());
            setQ("");
          }}
        />
      ) : null}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-muted-foreground">
          {picked.size > 0
            ? `${picked.size} selected`
            : "Select products above"}
        </span>
        <Button
          type="button"
          size="sm"
          disabled={picked.size === 0}
          onClick={addSelected}
          className="px-4"
        >
          {picked.size === 0
            ? "Add to guide"
            : `Add ${picked.size} product${picked.size === 1 ? "" : "s"} to guide`}
        </Button>
      </div>
    </div>
  );
}
