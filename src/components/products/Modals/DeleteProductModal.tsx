"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { deleteProduct, getProductId } from "@/lib/products-api";
import { DestructiveConfirmDialog } from "@/components/ui/destructive-confirm-dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  productIds: string[] | null;
  onDeleted: () => void;
};

export default function DeleteProductModal({ open, onClose, product, productIds, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBulk = productIds != null && productIds.length > 0;
  const count = isBulk ? productIds.length : product ? 1 : 0;

  const handleConfirm = async () => {
    setError(null);
    setDeleting(true);
    try {
      if (isBulk && productIds) {
        await Promise.all(productIds.map((id) => deleteProduct(id)));
      } else if (product) {
        await deleteProduct(getProductId(product));
      }
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DestructiveConfirmDialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={count > 1 ? "Delete products" : "Delete product"}
      description={
        count > 1
          ? `Delete ${count} selected products?`
          : product
            ? `Delete "${product.name}"?`
            : "No product selected."
      }
      consequence="This cannot be undone."
      onConfirm={handleConfirm}
      loading={deleting}
      error={error}
      confirmLabel="Delete"
      confirmDisabled={count === 0}
      contentClassName="bg-background"
    />
  );
}
