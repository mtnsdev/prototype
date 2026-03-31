"use client";

import { Package, Upload, Library, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyProducts, EmptySearchResults } from "@/components/ui/empty-states";
import type { ProductTab } from "./ProductTabBar";

type Props = {
  hasNoProducts: boolean;
  tab?: ProductTab;
  onAddProduct?: () => void;
  onImportCSV?: () => void;
  onClearFilters?: () => void;
};

export default function ProductsEmptyState({
  hasNoProducts,
  tab = "mine",
  onAddProduct,
  onImportCSV,
  onClearFilters,
}: Props) {
  if (hasNoProducts) {
    // For non-"mine" tabs, use custom UI with appropriate icons
    if (tab !== "mine") {
      const copy =
        tab === "agency"
          ? { title: "No products in Agency Library", body: "No agency-owned products yet. Add products or copy from Enable Directory." }
          : tab === "enable"
            ? { title: "No products in Enable Directory", body: "The Enable directory is empty or not loaded." }
            : { title: "No products yet", body: "Add your first product or import from CSV." };
      const Icon = tab === "agency" ? Library : tab === "enable" ? Globe : Package;

      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[280px]">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-muted-foreground/75" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">{copy.title}</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">{copy.body}</p>
        </div>
      );
    }

    // For "mine" tab, use the unified empty state system
    return (
      <div className="min-h-[280px] flex flex-col items-center justify-center">
        <EmptyProducts
          action={onAddProduct ? { label: "Add Product", onClick: onAddProduct } : undefined}
          className="w-full px-4"
        />
        {onImportCSV && (
          <Button variant="outline" onClick={onImportCSV} className="gap-2 mt-4">
            <Upload size={16} />
            Import CSV
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center px-4">
      <EmptySearchResults className="w-full" />
      {onClearFilters && (
        <Button variant="outline" onClick={onClearFilters} className="mt-4">
          Clear filters
        </Button>
      )}
    </div>
  );
}
