"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Destination } from "@/data/destinations";
import { destinationHasYachtData } from "@/data/destinations";
import { parseDestinationSectionParam } from "@/lib/destinationSectionUrl";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { DestinationHero } from "./DestinationHero";
import { DestinationSectionNav, type DestinationSectionId } from "./DestinationSectionNav";
import { DMCPartnerCard } from "./DMCPartnerCard";
import { RestaurantSection } from "./RestaurantSection";
import { HotelSection } from "./HotelSection";
import { YachtSection } from "./YachtSection";
import { TourismSection } from "./TourismSection";
import { DocumentsSection } from "./DocumentsSection";
import { DestinationAgencyNotes } from "./DestinationAgencyNotes";
import { destMuted, destPage } from "./destinationStyles";
import { cn } from "@/lib/utils";

function countHotels(d: Destination) {
  return Object.values(d.hotels).reduce((n, list) => n + list.length, 0);
}

function countRestaurants(d: Destination) {
  return Object.values(d.restaurants).reduce((n, list) => n + list.length, 0);
}

type Props = {
  destination: Destination;
  /** When true, hero hides advisor actions (editor preview). */
  previewMode?: boolean;
  /** e.g. admin “Edit destination” control — aligned with breadcrumbs. */
  headerAside?: ReactNode;
};

export function DestinationDetailView({ destination, previewMode = false, headerAside }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const showYacht = destinationHasYachtData(destination);

  const active = useMemo(
    () => parseDestinationSectionParam(searchParams.get("section"), showYacht),
    [searchParams, showYacht],
  );

  const setSection = useCallback(
    (id: DestinationSectionId) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("section", id);
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const stats = useMemo(
    () => ({
      dmcs: destination.dmcPartners.length,
      restaurants: countRestaurants(destination),
      hotels: countHotels(destination),
      documents: destination.documents.length,
    }),
    [destination],
  );

  const sectionTitle = (id: DestinationSectionId) => {
    const map: Record<DestinationSectionId, string> = {
      dmc: "DMC partners",
      restaurants: "Restaurants",
      hotels: "Hotels",
      yacht: "Yacht charters",
      tourism: "Tourism & regional info",
      documents: "Documents",
    };
    return map[id];
  };

  return (
    <div className={cn(destPage)}>
      <a
        href="#destination-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:ring-2 focus:ring-brand-cta/40"
      >
        Skip to destination content
      </a>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
        <div className="mx-auto mb-4 flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Breadcrumbs
            items={[
              { label: "Products", href: "/dashboard/products" },
              { label: "Destinations", href: "/dashboard/products/destinations" },
              { label: destination.name },
            ]}
          />
          {headerAside ? <div className="shrink-0">{headerAside}</div> : null}
        </div>

        <Link
          href="/dashboard/products/destinations"
          className="mb-4 inline-flex text-sm font-medium text-brand-cta transition-colors hover:text-brand-cta-hover hover:underline"
        >
          ← All destinations
        </Link>
        <DestinationHero destination={destination} mode={previewMode ? "preview" : "full"} />

        <p className={cn("mx-auto mt-4 max-w-4xl text-sm leading-relaxed", destMuted)}>{destination.description}</p>

        <DestinationAgencyNotes destinationSlug={destination.slug} />

        <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <DestinationSectionNav
            active={active}
            onChange={setSection}
            showYacht={showYacht}
            stats={stats}
          />

          <main
            id="destination-main"
            tabIndex={-1}
            className="min-w-0 flex-1 rounded-xl border border-border bg-card p-4 outline-none md:p-6"
            aria-labelledby="destination-section-title"
          >
            <h2 id="destination-section-title" className="text-lg font-semibold text-foreground">
              {sectionTitle(active)}
            </h2>
            <div className="mt-4">
              {active === "dmc" ? (
                destination.dmcPartners.length === 0 ? (
                  <p className={cn("text-sm", destMuted)}>No DMC partners listed yet.</p>
                ) : (
                  <div className="space-y-3">
                    {destination.dmcPartners.map((p, i) => (
                      <DMCPartnerCard key={p.productId ?? p.name} partner={p} defaultOpen={i === 0} />
                    ))}
                  </div>
                )
              ) : null}

              {active === "restaurants" ? (
                <RestaurantSection byRegion={destination.restaurants} />
              ) : null}

              {active === "hotels" ? <HotelSection byGroup={destination.hotels} /> : null}

              {active === "yacht" ? (
                showYacht && destination.yachtCompanies?.length ? (
                  <YachtSection companies={destination.yachtCompanies} />
                ) : (
                  <p className={cn("text-sm", destMuted)}>No yacht charter partners listed for this destination.</p>
                )
              ) : null}

              {active === "tourism" ? <TourismSection regions={destination.tourismRegions} /> : null}

              {active === "documents" ? (
                <DocumentsSection documents={destination.documents} destinationSlug={destination.slug} />
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
