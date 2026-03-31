"use client";

import { Package, Upload, Library, Globe, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        {tab === "mine" && (
          <div className="flex flex-wrap gap-3 justify-center">
            {onAddProduct && (
              <Button variant="toolbarAccent" size="sm" onClick={onAddProduct}>
                <Package size={16} />
                Add product
              </Button>
            )}
            {onImportCSV && (
              <Button variant="outline" onClick={onImportCSV} className="gap-2">
                <Upload size={16} />
                Import CSV
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[200px]">
      <Search className="w-10 h-10 text-muted-foreground/55 mb-4" />
      <p className="text-sm text-muted-foreground mb-4">
        No products match your search. Try different keywords or clear your filters.
      </p>
      {onClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
