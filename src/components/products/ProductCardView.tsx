"use client";

import type { Product } from "@/types/product";
import ProductCard from "./ProductCard";
import { canEditProduct, canDeleteProduct } from "@/utils/productPermissions";
import type { CurrentUser } from "@/utils/productPermissions";

type Props = {
  products: Product[];
  isLoading: boolean;
  user: CurrentUser | null;
  isEnableTab?: boolean;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onCopyToAgency?: (p: Product) => void;
  compact?: boolean;
  searchQuery?: string;
};

export default function ProductCardView({
  products,
  isLoading,
  user,
  isEnableTab = false,
  onEdit,
  onDelete,
  onCopyToAgency,
  compact = false,
  searchQuery,
}: Props) {
  if (isLoading && products.length === 0) {
    return (
      <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border border-input bg-white/5 h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3"
          : "p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      }
    >
      {products.map((p) => (
        <ProductCard
          key={p.id ?? (p as { _id?: string })._id}
          product={p}
          canEdit={canEditProduct(user, p)}
          canDelete={canDeleteProduct(user, p)}
          isEnableTab={isEnableTab}
          compact={compact}
          searchQuery={searchQuery}
          onEdit={() => onEdit(p)}
          onDelete={() => onDelete(p)}
          onCopyToAgency={onCopyToAgency ? () => onCopyToAgency(p) : undefined}
        />
      ))}
    </div>
  );
}
