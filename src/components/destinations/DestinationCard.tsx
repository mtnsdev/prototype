"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, FileText, MapPin, Utensils, Users } from "lucide-react";
import type { DestinationSummary } from "@/data/destinations";
import { cn } from "@/lib/utils";
import { destCardClass, destMuted, destMuted2 } from "./destinationStyles";
import { highlightMatch } from "./highlightSearch";

const GRADIENTS = [
  "from-[#1a1a2e] to-[#16213e]",
  "from-[#2d132c] to-[#1f4068]",
  "from-[#0f3460] to-[#16213e]",
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

export function DestinationCard({ summary, highlightQuery = "" }: Props) {
  const href = `/dashboard/products/destinations/${summary.slug}`;
  const hasImage = Boolean(summary.heroImage?.trim());

  return (
    <Link
      href={href}
      className={cn(
        destCardClass("group flex min-h-[220px] flex-col overflow-hidden"),
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cta/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <div className="relative h-36 w-full shrink-0 overflow-hidden">
        {hasImage ? (
          <Image
            src={summary.heroImage}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width:768px) 100vw, (max-width:1280px) 33vw, 25vw"
          />
        ) : (
          <div
            className={cn("flex h-full w-full items-end bg-gradient-to-br p-4", gradientForSlug(summary.slug))}
            aria-hidden
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080c]/75 via-[#08080c]/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {highlightMatch(summary.name, highlightQuery)}
          </h2>
          <p className={cn("line-clamp-2 text-xs", destMuted2)}>{highlightMatch(summary.tagline, highlightQuery)}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-3">
        <div className={cn("flex flex-wrap gap-x-3 gap-y-1 text-xs", destMuted)}>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5 shrink-0 text-brand-cta" aria-hidden />
            {summary.dmcCount} DMCs
          </span>
          <span className="inline-flex items-center gap-1">
            <Building2 className="size-3.5 shrink-0 text-brand-cta" aria-hidden />
            {summary.hotelCount} hotels
          </span>
          <span className="inline-flex items-center gap-1">
            <Utensils className="size-3.5 shrink-0 text-brand-cta" aria-hidden />
            {summary.restaurantCount} restaurants
          </span>
          <span className="inline-flex items-center gap-1">
            <FileText className="size-3.5 shrink-0 text-brand-cta" aria-hidden />
            {summary.documentCount} documents
          </span>
        </div>
        <span className={cn("inline-flex items-center gap-1 text-xs font-medium text-brand-cta", destMuted)}>
          <MapPin className="size-3.5" aria-hidden />
          View guide
        </span>
      </div>
    </Link>
  );
}
