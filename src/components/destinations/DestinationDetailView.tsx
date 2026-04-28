"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { List, Map as MapIcon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Destination } from "@/data/destinations";
import { useUser } from "@/contexts/UserContext";
import { resolveAdvisorCatalogFromStorage } from "@/components/products/productDirectoryCatalogResolve";
import { mergeDestinationWithCatalog } from "@/lib/destinationCatalogJoin";
import {
  buildDestinationItemSectionMap,
  buildVirtualSectionsFromDestination,
} from "@/lib/destinationSectionModel";
import {
  resolveDestinationItemIdFromHash,
  resolveDestinationSectionId,
} from "@/lib/destinationSectionUrl";
import { logDestinationEvent } from "@/lib/destinationAnalytics";
import { destinationMapCoverageRatio } from "@/lib/destinationMapCoverage";
import { buildDestinationMapPins } from "@/lib/destinationMapPins";
import { DestinationHero, type DestinationHeroInlineEdit } from "./DestinationHero";
import { DestinationSectionNav, type DestinationNavItem } from "./DestinationSectionNav";
import { SectionRenderer } from "./SectionRenderer";
import { TripReportBanner } from "./TripReportBanner";
import { destMuted, destPage } from "./destinationStyles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CatalogChromeNavRow } from "@/components/products/CatalogChromeNavRow";

const DestinationMapView = dynamic(
  () => import("./DestinationMapView").then((m) => m.DestinationMapView),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Loading map…</p> },
);

type Props = {
  destination: Destination;
  previewMode?: boolean;
  headerAside?: ReactNode;
  /**
   * Injected below the trip report and above section nav — e.g. destination block editor on the edit page.
   */
  sectionStructureEditor?: ReactNode;
  /**
   * Overview editor: edit name, tagline, hero URL, and description in the same layout as the published page.
   */
  inlineOverviewEdit?: {
    setDraft: Dispatch<SetStateAction<Destination>>;
  };
  /**
   * When the view sits inside a parent scroll region (e.g. editor split panel), disable the inner
   * overflow scroll so only the parent scrolls.
   */
  fillParentScroll?: boolean;
};

export function DestinationDetailView({
  destination,
  previewMode = false,
  headerAside,
  sectionStructureEditor,
  inlineOverviewEdit,
  fillParentScroll = false,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading: userLoading } = useUser();

  const [clientHash, setClientHash] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const displayDestination = useMemo(() => {
    if (userLoading || !user) return destination;
    const { products } = resolveAdvisorCatalogFromStorage(
      String(user.id),
      user.username ?? user.email?.split("@")[0] ?? "Advisor",
    );
    return mergeDestinationWithCatalog(destination, products);
  }, [destination, user, userLoading]);

  const sections = useMemo(
    () => buildVirtualSectionsFromDestination(displayDestination),
    [displayDestination],
  );

  const itemToSection = useMemo(
    () => buildDestinationItemSectionMap(displayDestination, sections),
    [displayDestination, sections],
  );

  const validIds = useMemo(() => sections.map((s) => s.id), [sections]);

  useEffect(() => {
    setClientHash(typeof window !== "undefined" ? window.location.hash : "");
    const onHash = () => setClientHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const active = useMemo(
    () =>
      resolveDestinationSectionId({
        destinationSlug: displayDestination.slug,
        querySection: searchParams.get("section"),
        hash: clientHash || null,
        validSectionIds: validIds,
        itemToSection,
      }),
    [displayDestination.slug, searchParams, clientHash, validIds, itemToSection],
  );

  const activeSection = useMemo(
    () => sections.find((s) => s.id === active) ?? sections[0],
    [sections, active],
  );

  const navItems: DestinationNavItem[] = useMemo(
    () =>
      sections.map((s) => ({
        id: s.id,
        label: s.title,
        iconKey: s.iconKey,
        count: s.count,
      })),
    [sections],
  );

  const mapRatio = useMemo(() => destinationMapCoverageRatio(displayDestination), [displayDestination]);
  const showMapToggle = mapRatio >= 0.3 && displayDestination.mapCenter != null;

  const mapPins = useMemo(
    () => buildDestinationMapPins(displayDestination, sections, activeSection?.id),
    [displayDestination, sections, activeSection?.id],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hash;
    if (h) {
      logDestinationEvent("destination_deep_link_open", { destination: displayDestination.slug, source: "hash" });
    }
  }, [displayDestination.slug]);

  useEffect(() => {
    logDestinationEvent(
      "destination_view",
      { destination: displayDestination.slug },
      user?.id != null ? String(user.id) : undefined,
    );
  }, [displayDestination.slug, user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const itemId = resolveDestinationItemIdFromHash(clientHash);
    if (!itemId) return;
    const t = window.setTimeout(() => {
      document.getElementById(`item-${itemId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [clientHash, activeSection?.id]);

  const setSection = useCallback(
    (id: string) => {
      logDestinationEvent("destination_section_nav", {
        destination: displayDestination.slug,
        section_id: id,
      });
      const p = new URLSearchParams(searchParams.toString());
      p.delete("section");
      const qs = p.toString();
      const base = qs ? `${pathname}?${qs}` : pathname;
      const nextHash = `#section-${id}`;
      window.history.replaceState(null, "", `${base}${nextHash}`);
      setClientHash(nextHash);
    },
    [pathname, searchParams, displayDestination.slug],
  );

  const onMapToggle = useCallback(
    (mode: "list" | "map") => {
      setViewMode(mode);
      logDestinationEvent("map_toggled", { destination: displayDestination.slug, on: mode === "map" });
    },
    [displayDestination.slug],
  );

  const heroInlineEdit: DestinationHeroInlineEdit | undefined = inlineOverviewEdit
    ? {
        onPatch: (patch) => {
          inlineOverviewEdit.setDraft((d) => ({ ...d, ...patch }));
        },
      }
    : undefined;

  const heroMode =
    inlineOverviewEdit ? "full" : previewMode ? "preview" : "full";

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col text-foreground",
        fillParentScroll ? "min-h-min w-full" : destPage,
      )}
    >
      <a
        href="#destination-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:ring-2 focus:ring-brand-cta/40"
      >
        Skip to destination content
      </a>
      <div className={cn("flex min-h-0 flex-col", !fillParentScroll && "flex-1")}>
        {!previewMode ? (
          <div className="sticky top-0 z-40 shrink-0 border-b border-border/60 bg-background/95 px-6 pb-3 pt-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/90">
            <CatalogChromeNavRow
              activeSegment="destinations"
              backNavigation={{
                href: "/dashboard/products/destinations",
                label: "All destinations",
              }}
            />
          </div>
        ) : null}
        <div
          className={cn(
            "px-6 pb-6 pt-4",
            fillParentScroll ? "w-full min-w-0" : "min-h-0 flex-1 overflow-y-auto",
          )}
        >
          <div className="w-full">
            <div className="relative">
              {headerAside ? (
                <div className="pointer-events-none absolute right-0 top-3 z-20 flex justify-end sm:right-1 [&>*]:pointer-events-auto">
                  {headerAside}
                </div>
              ) : null}
              <DestinationHero
                destination={displayDestination}
                mode={heroMode}
                inlineEdit={heroInlineEdit}
              />
            </div>

          {showMapToggle ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                View
              </span>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "list" ? "toolbarAccent" : "outline"}
                className="gap-1.5"
                onClick={() => onMapToggle("list")}
              >
                <List className="size-3.5" aria-hidden />
                List
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "map" ? "toolbarAccent" : "outline"}
                className="gap-1.5"
                onClick={() => onMapToggle("map")}
              >
                <MapIcon className="size-3.5" aria-hidden />
                Map
              </Button>
            </div>
          ) : null}

          {inlineOverviewEdit ? (
            <div className="mt-4">
              <label htmlFor="dest-inline-description" className="text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                id="dest-inline-description"
                value={displayDestination.description}
                onChange={(e) =>
                  inlineOverviewEdit.setDraft((d) => ({ ...d, description: e.target.value }))
                }
                rows={5}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground shadow-xs outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary/35 focus-visible:ring-[3px] focus-visible:ring-ring/30"
              />
            </div>
          ) : (
            <p className={cn("mt-4 text-sm leading-relaxed", destMuted)}>{displayDestination.description}</p>
          )}

          <div className="mt-4">
            <TripReportBanner
              destinationSlug={displayDestination.slug}
              destinationName={displayDestination.name}
              reports={displayDestination.tripReports ?? []}
            />
          </div>

          {sectionStructureEditor ? (
            <section
              id="destination-section-structure"
              className="mt-8 min-w-0"
              aria-labelledby="destination-section-structure-heading"
            >
              <h2
                id="destination-section-structure-heading"
                className="text-sm font-semibold text-foreground"
              >
                Guide editor
              </h2>
              <div className="mt-3">{sectionStructureEditor}</div>
            </section>
          ) : null}

          <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start lg:gap-8">
            <div className="min-w-0 space-y-5">
              {navItems.length > 0 ? (
                <div className="lg:hidden">
                  <DestinationSectionNav
                    variant="horizontal"
                    items={navItems}
                    activeId={active}
                    onChange={setSection}
                  />
                </div>
              ) : null}

              <main
                id="destination-main"
                tabIndex={-1}
                className="min-w-0 scroll-mt-24 outline-none"
                aria-labelledby="destination-section-title"
              >
                <h2 id="destination-section-title" className="sr-only">
                  {activeSection?.title ?? "Destination"}
                </h2>
                {activeSection ? (
                  <>
                    {viewMode === "map" && showMapToggle && displayDestination.mapCenter ? (
                      <DestinationMapView
                        pins={mapPins}
                        destinationSlug={displayDestination.slug}
                        center={displayDestination.mapCenter}
                      />
                    ) : (
                      <div id={`section-${activeSection.id}`} className="scroll-mt-28">
                        <SectionRenderer section={activeSection} destinationSlug={displayDestination.slug} />
                      </div>
                    )}
                  </>
                ) : (
                  <p className={cn("text-sm", destMuted)}>
                    No curated sections yet for this destination. Check back as content is added.
                  </p>
                )}
              </main>
            </div>

            {navItems.length > 0 ? (
              <aside className="hidden min-w-0 lg:block" aria-label="Section navigation">
                <div className="sticky top-4">
                  <DestinationSectionNav
                    variant="vertical"
                    items={navItems}
                    activeId={active}
                    onChange={setSection}
                  />
                </div>
              </aside>
            ) : null}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
