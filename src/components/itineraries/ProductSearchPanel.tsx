"use client";

import { useState, useEffect } from "react";
import type { Product, ProductCategory } from "@/types/product";
import { fetchProductList } from "@/lib/products-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "accommodation", label: "Accommodation" },
  { value: "restaurant", label: "Restaurant" },
  { value: "activity", label: "Activity" },
  { value: "transportation", label: "Transportation" },
  { value: "dmc", label: "DMC" },
  { value: "cruise", label: "Cruise" },
  { value: "service_provider", label: "Service Provider" },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  eventCategory?: ProductCategory | null;
  onProductSelected: (product: Product) => void;
};

export function ProductSearchPanel({
  isOpen,
  onClose,
  eventCategory,
  onProductSelected,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "">(
    eventCategory || ""
  );
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update category when eventCategory changes
  useEffect(() => {
    if (eventCategory) {
      setSelectedCategory(eventCategory);
    }
  }, [eventCategory]);

  // Fetch products when search or category changes
  useEffect(() => {
    if (!searchQuery.trim() && !selectedCategory) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const params: any = { limit: 20 };
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (selectedCategory) params.category = selectedCategory;

    fetchProductList(params)
      .then((res) => {
        if (!cancelled) {
          setResults(res.products ?? []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch products"
          );
          setResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="border-t border-input pt-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-muted-foreground font-semibold">
          Search Products
        </Label>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search by name, city, or country…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-input text-foreground"
          />
        </div>

        <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as ProductCategory | "")}>
          <SelectTrigger className="bg-white/5 border-input text-foreground">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {PRODUCT_CATEGORIES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 rounded p-2">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Searching…
          </div>
        )}

        {results.length === 0 && !isLoading && (searchQuery.trim() || selectedCategory) && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No products found
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  onProductSelected(product);
                  onClose();
                }}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors",
                  "border-input bg-white/5 hover:bg-white/10 hover:border-white/30"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[product.city, product.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs px-2 py-1 rounded bg-white/10 text-muted-foreground capitalize">
                      {product.category}
                    </span>
                    {product.commission_rate != null && (
                      <span className="text-xs font-semibold text-emerald-400">
                        {product.commission_rate.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {results.length === 0 && !isLoading && !searchQuery.trim() && !selectedCategory && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Enter a search term or select a category to browse
          </p>
        )}
      </div>
    </div>
  );
}
