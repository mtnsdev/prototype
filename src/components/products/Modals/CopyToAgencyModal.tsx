"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { copyFromEnable, getProductId } from "@/lib/products-api";
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
  onCopied: () => void;
};

export default function CopyToAgencyModal({ open, onClose, product, onCopied }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    if (!product) return;
    setError(null);
    setLoading(true);
    try {
      await copyFromEnable(getProductId(product));
      onCopied();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to copy");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-accent border-input">
        <DialogHeader>
          <DialogTitle className="text-foreground">Copy to Agency</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Creates an agency copy you can customize. The original stays linked for updates.
        </p>
        {product && (
          <p className="text-sm text-muted-foreground">
            Product: <strong className="text-foreground">{product.name}</strong>
          </p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-input text-foreground">
            Cancel
          </Button>
          <Button onClick={handleCopy} disabled={loading || !product}>
            {loading ? "Copying…" : "Copy to Agency"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
