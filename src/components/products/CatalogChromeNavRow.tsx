"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductCatalogSectionTabs } from "@/components/products/ProductCatalogSectionTabs";
import {
  hrefForCatalogTab,
  type CatalogSegment,
} from "@/components/products/productDirectoryCatalogSegments";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  /** Highlighted catalog segment (matches Product Directory chrome). */
  activeSegment: CatalogSegment;
  className?: string;
  /**
   * When true, catalog segment tabs are omitted here (e.g. shown above the destination hero).
   * Back navigation / trailing still render when provided.
   */
  omitSegmentTabs?: boolean;
  /**
   * Second row under tabs — primary back control on destination detail
   * (replaces the old muted inline “All destinations” link).
   */
  backNavigation?: { href: string; label?: string };
  /** Optional actions on the second row (right), e.g. rare admin shortcuts. */
  trailing?: ReactNode;
};

/**
 * Full Product Directory tab strip. Optional second row for back navigation on destination detail.
 */
export function CatalogChromeNavRow({
  activeSegment,
  omitSegmentTabs = false,
  backNavigation,
  trailing,
  className,
}: Props) {
  const router = useRouter();
  const hasSecondRow = Boolean(backNavigation) || Boolean(trailing);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {!omitSegmentTabs ? (
        <div className="min-w-0 max-w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ProductCatalogSectionTabs
            value={activeSegment}
            onChange={(segment) => router.push(hrefForCatalogTab(segment))}
          />
        </div>
      ) : null}
      {hasSecondRow ? (
        <div className="flex min-h-[36px] items-center justify-between gap-2">
          <div className="min-w-0">
            {backNavigation ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 px-2 text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href={backNavigation.href}>
                  <ArrowLeft className="size-4 shrink-0" aria-hidden />
                  {backNavigation.label ?? "Back"}
                </Link>
              </Button>
            ) : null}
          </div>
          {trailing ? <div className="flex shrink-0 items-center gap-1">{trailing}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
