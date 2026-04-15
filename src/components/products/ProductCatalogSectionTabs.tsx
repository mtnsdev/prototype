"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import type { CatalogSegment } from "./productDirectoryCatalogSegments";

type Props = {
  value: CatalogSegment;
  onChange: (segment: CatalogSegment) => void;
  className?: string;
};

export function ProductCatalogSectionTabs({ value, onChange, className }: Props) {
  return (
    <SegmentedControl<CatalogSegment>
      aria-label="Product directory section"
      value={value}
      onChange={onChange}
      className={cn("relative z-[60]", className)}
      options={[
        { value: "browse", label: "Products" },
        { value: "collections", label: "Collections" },
        { value: "rep-firms", label: "Rep Firms" },
        { value: "partner-portal", label: "Partner portal" },
        { value: "destinations", label: "Destinations" },
      ]}
    />
  );
}
