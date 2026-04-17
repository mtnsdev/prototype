"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DestinationSummary } from "@/data/destinations";
import { productListingMetaLineClass } from "@/lib/productListingPrimitives";
import { cn } from "@/lib/utils";
import { highlightMatch } from "./highlightSearch";
import { DestinationRemoteHeroImage } from "./DestinationRemoteHeroImage";

const GRADIENTS = [
  "from-[#242436] to-[#1c2434]",
  "from-[#2d132c] to-[#1f4068]",
  "from-[#1a3050] to-[#16213e]",
  "from-[#1b4332] to-[#2d6a4f]",
  "from-[#3c096c] to-[#240046]",
];

function gradientForSlug(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h + slug.charCodeAt(i) * (i + 1)) % GRADIENTS.length;
  return GRADIENTS[h]!;
}

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
  const hero = summary.heroImage?.trim() ?? "";
  const [heroFailed, setHeroFailed] = useState(false);
  useEffect(() => {
    setHeroFailed(false);
  }, [hero]);
  const showHero = hero.length > 0 && !heroFailed;

  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        "group relative flex h-full min-h-0 cursor-pointer flex-col overflow-hidden rounded-xl border transition-all",
        "border-white/[0.04] bg-white/[0.02] hover:border-border hover:bg-white/[0.04]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <div className="relative h-[140px] w-full shrink-0 overflow-hidden">
        {showHero ? (
          <DestinationRemoteHeroImage
            src={hero}
            alt=""
            className="absolute inset-0 size-full"
            sizes="(max-width: 768px) 100vw, 360px"
            onBroken={() => setHeroFailed(true)}
          />
        ) : (
          <div className={cn("h-full w-full bg-gradient-to-br", gradientForSlug(summary.slug))} aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080c]/85 via-[#08080c]/35 to-transparent" />
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
            <span className="tabular-nums font-medium text-foreground/90">{summary.totalItemCount}</span> curated items
            <span className="mx-1 text-muted-foreground/80">·</span>
            <span className="tabular-nums">{summary.dmcCount}</span> DMC ·{" "}
            <span className="tabular-nums">{summary.hotelCount}</span> hotels ·{" "}
            <span className="tabular-nums">{summary.restaurantCount}</span> restaurants ·{" "}
            <span className="tabular-nums">{summary.documentCount}</span> docs
            {summary.tripReportCount > 0 ? (
              <>
                <span className="mx-1 text-muted-foreground/80">·</span>
                <span className="tabular-nums">{summary.tripReportCount}</span> trip reports
              </>
            ) : null}
          </p>
          {summary.activityHint ? (
            <p className="mt-1.5 text-[8px] text-muted-foreground/90">{summary.activityHint}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
