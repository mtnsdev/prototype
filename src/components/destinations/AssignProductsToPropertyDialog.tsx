"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import type { DestinationProperty } from "@/data/destinations";
import type { ProductListItem } from "@/lib/destinationSectionModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: DestinationProperty | null;
  /** Flattened products from the unified destination list. */
  allProducts: ProductListItem[];
  /** Toggle the assignment for a given productId. */
  onToggleProduct: (propertyId: string, productId: string) => void;
};

/**
 * Admin-only dialog for choosing which products in a destination carry a
 * given property. Stateless wrapper around `toggleProductOnProperty` — the
 * caller persists the change.
 */
export function AssignProductsToPropertyDialog({
  open,
  onOpenChange,
  property,
  allProducts,
  onToggleProduct,
}: Props) {
  const [query, setQuery] = useState("");

  const assigned = useMemo(
    () => new Set(property?.productIds ?? []),
    [property?.productIds],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter((p) =>
      (p.name ?? "").toLowerCase().includes(q),
    );
  }, [allProducts, query]);

  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign products to &ldquo;{property.label}&rdquo;</DialogTitle>
          <DialogDescription>
            Pick which products in this destination carry this property. Used
            as a filter chip on the destination page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
          />

          <div className="max-h-80 overflow-y-auto rounded-md border border-border divide-y divide-border/70">
            {filtered.length === 0 ? (
              <p className="p-3 text-center text-sm text-muted-foreground">
                No products match.
              </p>
            ) : (
              filtered.map((p) => {
                const id = p.productId ?? p.name;
                const on = !!p.productId && assigned.has(p.productId);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      if (p.productId)
                        onToggleProduct(property.id, p.productId);
                    }}
                    disabled={!p.productId}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                      on
                        ? "bg-brand-cta/10 text-foreground"
                        : "text-foreground/90 hover:bg-muted/40",
                      !p.productId && "opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border",
                        on
                          ? "border-brand-cta bg-brand-cta text-background"
                          : "border-input bg-background",
                      )}
                      aria-hidden
                    >
                      {on ? <Check className="size-3" /> : null}
                    </span>
                    <span className="truncate">{p.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
