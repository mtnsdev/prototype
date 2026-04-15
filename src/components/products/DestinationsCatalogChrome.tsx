"use client";

import { useRouter } from "next/navigation";
import { ProductCatalogSectionTabs } from "@/components/products/ProductCatalogSectionTabs";
import { DirectoryRoleToggle } from "@/components/products/DirectoryRoleToggle";
import { hrefForCatalogTab } from "@/components/products/productDirectoryCatalogSegments";
import type { CatalogSegment } from "@/components/products/productDirectoryCatalogSegments";
import { APP_TOOLBAR_ROW } from "@/lib/dashboardChrome";
import { cn } from "@/lib/utils";

/**
 * Same segmented tabs as Product Directory, with Destinations selected — used on `/dashboard/products/destinations/*`.
 */
export function DestinationsCatalogChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const onSegment = (v: CatalogSegment) => {
    if (v === "destinations") return;
    router.push(hrefForCatalogTab(v));
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-inset text-foreground">
      <div
        className={cn(
          APP_TOOLBAR_ROW,
          "relative z-50 min-w-0 justify-between gap-3 pl-5 pr-5 md:pl-6 md:pr-6"
        )}
      >
        <div className="min-w-0 max-w-full flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ProductCatalogSectionTabs value="destinations" onChange={onSegment} />
        </div>
        <DirectoryRoleToggle className="shrink-0" />
      </div>
      {children}
    </div>
  );
}
