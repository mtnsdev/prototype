"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import type { CatalogSegment } from "./productDirectoryCatalogSegments";

type Props = {
  value: CatalogSegment;
  onChange: (segment: CatalogSegment) => void;
  className?: string;
  /** When false, hide the Partner Programs segment. Defaults true for chrome that does not pass permissions. */
  showPartnerPortal?: boolean;
};

export function ProductCatalogSectionTabs({
  value,
  onChange,
  className,
  showPartnerPortal = true,
}: Props) {
  const options = [
    { value: "browse" as const, label: "Products" },
    { value: "collections" as const, label: "Collections" },
    { value: "destinations" as const, label: "Destinations" },
    { value: "rep-firms" as const, label: "Rep Firms" },
    ...(showPartnerPortal ? [{ value: "partner-programs" as const, label: "Partner Programs" }] : []),
  ];

  return (
    <SegmentedControl<CatalogSegment>
      aria-label="Product directory section"
      value={value}
      onChange={onChange}
      activeTone="gold"
      className={cn("relative z-[60]", className)}
      options={options}
    />
  );
}
