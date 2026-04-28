"use client";

import type { DirectoryProduct } from "@/types/product-directory";
import { directoryProductTypeShortLabel } from "@/components/products/directoryProductTypeHelpers";
import { EntityChip } from "@/components/ui/entity-link";
import { Package } from "lucide-react";

interface RepFirmProductGridProps {
  products: DirectoryProduct[];
}

export function RepFirmProductGrid({ products }: RepFirmProductGridProps) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#161616] p-6">
      <div className="mb-4 flex items-center gap-2">
        <Package className="h-4 w-4 text-[#C9A96E]" />
        <h2 className="text-sm font-semibold text-[#F5F0EB]">Linked Products</h2>
        <span className="ml-auto text-2xs text-[#9B9590]">{products.length} product{products.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <EntityChip
            key={product.id}
            type="product"
            id={product.id}
            name={product.name}
            meta={directoryProductTypeShortLabel(product)}
            className="bg-[#0a0a0f] border-white/[0.05] hover:border-white/[0.1] hover:bg-[#0f0f14]"
          />
        ))}
      </div>
    </div>
  );
}
