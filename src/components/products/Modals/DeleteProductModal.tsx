"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { deleteProduct, getProductId } from "@/lib/products-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const count = isBulk ? productIds.length : (product ? 1 : 0);

  const handleDelete = async () => {
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

  if (!open) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#1a1a1a] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-[#F5F5F5]">Delete product{count > 1 ? "s" : ""}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[rgba(245,245,245,0.8)]">
          {count > 1
            ? `Delete ${count} selected products? This cannot be undone.`
            : product
              ? `Delete "${product.name}"? This cannot be undone.`
              : "No product selected."}
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/10 text-[#F5F5F5]">
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting || count === 0}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
