"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { DestinationSummary } from "@/data/destinations";
import { productListingMetaLineClass } from "@/lib/productListingPrimitives";
import { DIRECTORY_BROWSE_CARD_SURFACE } from "@/lib/briefingSurface";
import { cn } from "@/lib/utils";
import { highlightMatch } from "./highlightSearch";
import { DestinationRemoteHeroImage } from "./DestinationRemoteHeroImage";
import { directoryHeroOrFallbackImageUrl } from "@/components/products/productDirectoryVisual";

type Props = {
  summary: DestinationSummary;
  /** Portal search query — highlights first match in title/tagline. */
  highlightQuery?: string;
};

/**
 * Listing tile aligned with `DirectoryProductCard` (browse grid): same shell + 140px top band.
 * Place name sits on the hero/gradient band; body shows tagline + stats only.
 */
export function DestinationCard({ summary, highlightQuery = "" }: Props) {
  const href = `/dashboard/products/destinations/${summary.slug}`;
  const heroResolved = directoryHeroOrFallbackImageUrl(summary.slug, summary.heroImage ?? null);
  const [heroSrc, setHeroSrc] = useState(heroResolved);
  const heroRetryRef = useRef(false);
  useEffect(() => {
    heroRetryRef.current = false;
    setHeroSrc(directoryHeroOrFallbackImageUrl(summary.slug, summary.heroImage ?? null));
  }, [summary.slug, summary.heroImage]);

  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        DIRECTORY_BROWSE_CARD_SURFACE,
        "rounded-xl",
        "group relative flex h-full min-h-0 cursor-pointer flex-col",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <div className="relative h-[140px] w-full shrink-0 overflow-hidden">
        <DestinationRemoteHeroImage
          src={heroSrc}
          alt=""
          className="absolute inset-0 size-full"
          sizes="(max-width: 768px) 100vw, 360px"
          onBroken={() => {
            if (heroRetryRef.current) return;
            heroRetryRef.current = true;
            setHeroSrc(directoryHeroOrFallbackImageUrl(`${summary.slug}-alt`, null));
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5 pt-8">
          <p
            className={cn(
              "line-clamp-2 text-left text-[13px] font-semibold leading-snug text-white",
              "drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]",
            )}
          >
            {highlightMatch(summary.name, highlightQuery)}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div className="min-w-0 flex-1">
          <p className={cn(productListingMetaLineClass, "line-clamp-2 text-foreground/95")}>
            {highlightMatch(summary.tagline, highlightQuery)}
          </p>
          <p className="mt-2 text-[8px] leading-relaxed text-muted-foreground">
            <span className="tabular-nums font-medium text-foreground/90">{summary.sectionCount ?? 0}</span> sections
            <span className="mx-1 text-muted-foreground/80">·</span>
            <span className="tabular-nums font-medium text-foreground/90">{summary.totalItemCount}</span> items
          </p>
          {summary.activityHint ? (
            <p className="mt-1.5 text-[8px] text-muted-foreground/90">{summary.activityHint}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
