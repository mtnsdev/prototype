"use client";

import { cn } from "@/lib/utils";

export interface SupplierHeaderInfo {
  supplier_id: string;
  name: string;
  type?: string;
  property_count?: number;
  avg_commission?: number;
  key_contact?: string;
}

type Props = {
  supplier: SupplierHeaderInfo | null;
  className?: string;
};

/**
 * Shown at top of product list when filtering by supplier/group.
 * Section 9: Supplier Header Cards.
 */
export default function SupplierHeaderCard({ supplier, className }: Props) {
  if (!supplier) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-foreground/[0.04] p-4 flex flex-wrap items-center gap-4",
        className
      )}
    >
      <div>
        <h3 className="font-semibold text-foreground">{supplier.name}</h3>
        {supplier.type && (
          <p className="text-xs text-muted-foreground/75">{supplier.type}</p>
        )}
      </div>
      {supplier.property_count != null && (
        <span className="text-sm text-muted-foreground">
          {supplier.property_count} propert{supplier.property_count === 1 ? "y" : "ies"}
        </span>
      )}
      {supplier.avg_commission != null && (
        <span className="text-sm text-muted-foreground">
          Avg commission: {supplier.avg_commission}%
        </span>
      )}
      {supplier.key_contact && (
        <span className="text-sm text-muted-foreground">
          Contact: {supplier.key_contact}
        </span>
      )}
    </div>
  );
}
