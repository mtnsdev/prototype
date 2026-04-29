"use client";

import type { Dispatch, ReactNode, SetStateAction, RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { createBlankSection } from "@/lib/destinationEditorTabs";
import { logDestinationEvent } from "@/lib/destinationAnalytics";
import { destinationMapCoverageRatio } from "@/lib/destinationMapCoverage";
import { buildDestinationMapPins } from "@/lib/destinationMapPins";
import { DestinationHero, type DestinationHeroInlineEdit } from "./DestinationHero";
import { DestinationSectionNav, type DestinationNavItem } from "./DestinationSectionNav";
import { SectionRenderer } from "./SectionRenderer";
import { DestinationSectionChrome } from "./DestinationSectionChrome";
import { SectionEditPanel } from "./editor/SectionEditPanel";
import { destMuted, destPage } from "./destinationStyles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CatalogChromeNavRow } from "@/components/products/CatalogChromeNavRow";
import { DirectoryRoleToggle } from "@/components/products/DirectoryRoleToggle";
import { useProductDirectoryCatalogOptional } from "@/components/products/ProductDirectoryCatalogContext";
import { arrayMove } from "@dnd-kit/sortable";
import { useBuildEditorOptional } from "./editor/DestinationEditorForms";
import type { VirtualDestinationSection, ProductListItem } from "@/lib/destinationSectionModel";
import { collectTags } from "@/components/destinations/sections/ProductListSection";

const DestinationMapView = dynamic(
  () => import("./DestinationMapView").then((m) => m.DestinationMapView),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Loading map…</p> },
);

function SectionBlock({
  section,
  destinationSlug,
  activeTagFilters,
}: {
  section: VirtualDestinationSection;
  destinationSlug: string;
  activeTagFilters?: ReadonlySet<string>;
}) {
  return (
    <section
      id={`section-${section.id}`}
      className="scroll-mt-28"
      aria-labelledby={`section-heading-${section.id}`}
    >
      <DestinationSectionChrome
        section={section}
        headingId={`section-heading-${section.id}`}
      />
      <SectionRenderer section={section} destinationSlug={destinationSlug} activeTagFilters={activeTagFilters} />
    </section>
  );
}

/** Section list — drag reorder now lives in the sidebar nav. */
function SectionList({
  sections,
  destinationSlug,
  activeTagFilters,
}: {
  sections: VirtualDestinationSection[];
  destinationSlug: string;
  activeTagFilters?: ReadonlySet<string>;
}) {
  return (
    <div className="space-y-12">
      {sections.map((section) => (
        <SectionBlock key={section.id} section={section} destinationSlug={destinationSlug} activeTagFilters={activeTagFilters} />
      ))}
    </div>
  );
}

/** Condensed sticky hero bar — morphs in as the hero scrolls out. */
function StickyHeroBar({
  destination,
  allTags,
  activeTagFilters,
  onToggleTag,
  progress,
}: {
  destination: Destination;
  allTags: string[];
  activeTagFilters: Set<string>;
  onToggleTag: (tag: string) => void;
  /** 0 = hero fully visible (bar hidden), 1 = hero fully scrolled out (bar fully shown). */
  progress: number;
}) {
  const heroSrc = destination.heroImage?.trim() ?? "";
  const hasImage = heroSrc.length > 0;

  // Morph animation: bar slides down and fades in during the last 40% of scroll progress
  const barProgress = Math.max(0, Math.min(1, (progress - 0.6) / 0.4));
  // Ease-out cubic for smooth deceleration
  const eased = 1 - Math.pow(1 - barProgress, 3);
  const barTranslateY = (1 - eased) * -100; // -100% → 0%
  const barOpacity = eased;
  const isVisible = progress > 0.55;

  // Collapse entirely when not morphing — sticky elements occupy layout space even when visually hidden
  if (progress < 0.5) return null;

  return (
    <div
      className="sticky top-0 z-30 overflow-hidden border-b border-border/60"
      style={{
        transform: `translateY(${barTranslateY}%)`,
        opacity: barOpacity,
        pointerEvents: isVisible ? "auto" : "none",
      }}
      aria-hidden={!isVisible}
    >
      {hasImage ? (
        <div className="relative">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroSrc})` }}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90 backdrop-blur-[2px]"
            aria-hidden
          />
          <div className="relative px-6 pb-2.5 pt-3">
            <h2 className="text-sm font-bold tracking-tight text-foreground drop-shadow-sm">
              {destination.name}
            </h2>
            <p className={cn("mt-0.5 text-2xs leading-snug", destMuted)}>
              {destination.tagline}
            </p>
            {allTags.length >= 2 ? (
              <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Filter by sub-region">
                {allTags.map((tag) => {
                  const on = activeTagFilters.has(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onToggleTag(tag)}
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-2xs font-medium transition-colors",
                        on
                          ? "border-brand-cta/40 bg-brand-cta/10 text-brand-cta"
                          : "border-white/25 bg-background/65 text-foreground shadow-sm backdrop-blur-sm hover:bg-background/80",
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="bg-background/95 px-6 pb-2.5 pt-3 backdrop-blur-md">
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            {destination.name}
          </h2>
          <p className={cn("mt-0.5 text-2xs leading-snug", destMuted)}>
            {destination.tagline}
          </p>
          {allTags.length >= 2 ? (
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Filter by sub-region">
              {allTags.map((tag) => {
                const on = activeTagFilters.has(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onToggleTag(tag)}
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-2xs font-medium transition-colors",
                      on
                        ? "border-brand-cta/40 bg-brand-cta/10 text-brand-cta"
                        : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/60",
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * Hook: returns a 0→1 progress value tracking how much of the hero has scrolled
 * out of the scroll root. 0 = hero fully visible, 1 = hero fully scrolled past.
 * Uses requestAnimationFrame for buttery-smooth updates.
 */
function useHeroScrollProgress(heroRef: RefObject<HTMLElement | null>, scrollRootRef: RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const hero = heroRef.current;
    const root = scrollRootRef.current;
    if (!hero || !root) return;

    let raf = 0;
    const update = () => {
      const rootRect = root.getBoundingClientRect();
      const heroRect = hero.getBoundingClientRect();
      // How far the bottom of the hero is above the top of the scroll root
      const heroBottom = heroRect.bottom - rootRect.top;
      const heroHeight = heroRect.height;
      if (heroHeight <= 0) { setProgress(0); return; }
      // 0 when hero bottom is at or below the viewport top + heroHeight, 1 when fully scrolled out
      const p = Math.max(0, Math.min(1, 1 - heroBottom / heroHeight));
      setProgress(p);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      root.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [heroRef, scrollRootRef]);

  return progress;
}

type Props = {
  destination: Destination;
  previewMode?: boolean;
  headerAside?: ReactNode;
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
  inlineOverviewEdit,
  fillParentScroll = false,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading: userLoading } = useUser();
  const catalogCtx = useProductDirectoryCatalogOptional();
  const catalogRevision = catalogCtx?.catalogRevision ?? 0;
  const editorCtx = useBuildEditorOptional();

  const [clientHash, setClientHash] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [editingWi, setEditingWi] = useState<number | null>(null);

  const displayDestination = useMemo(() => {
    if (userLoading || !user) return destination;
    const { products } = resolveAdvisorCatalogFromStorage(
      String(user.id),
      user.username ?? user.email?.split("@")[0] ?? "Advisor",
    );
    return mergeDestinationWithCatalog(destination, products);
  }, [destination, user, userLoading, catalogRevision]);

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

  const resolvedNavId = useMemo(
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

  const [activeNavId, setActiveNavId] = useState(resolvedNavId);
  useEffect(() => {
    setActiveNavId(resolvedNavId);
  }, [resolvedNavId]);

  const scrollRootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroScrollProgress = useHeroScrollProgress(heroRef, scrollRootRef);

  useEffect(() => {
    const root = scrollRootRef.current;
    if (!root || sections.length === 0) return;
    const ids = sections.map((s) => s.id);
    const onScroll = () => {
      const rt = root.getBoundingClientRect().top;
      let best = ids[0]!;
      let bestVisible = 0;
      for (const id of ids) {
        const el = document.getElementById(`section-${id}`);
        if (!el) continue;
        const er = el.getBoundingClientRect();
        const vTop = Math.max(er.top, rt + 56);
        const vBot = Math.min(er.bottom, rt + root.clientHeight);
        const visible = Math.max(0, vBot - vTop);
        if (visible > bestVisible) {
          bestVisible = visible;
          best = id;
        }
      }
      if (bestVisible > 8) setActiveNavId(best);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => root.removeEventListener("scroll", onScroll);
  }, [sections]);

  /** Collect all unique tags from every product_list section on the page. */
  const allTags = useMemo(() => {
    const items: ProductListItem[] = [];
    for (const s of sections) {
      if (s.sectionType === "product_list") {
        for (const item of s.items) items.push(item);
      }
    }
    return collectTags(items);
  }, [sections]);

  const [activeTagFilters, setActiveTagFilters] = useState<Set<string>>(new Set());
  const toggleTagFilter = useCallback((tag: string) => {
    setActiveTagFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const navItems: DestinationNavItem[] = useMemo(
    () =>
      sections.map((s) => ({
        id: s.id,
        label: s.title,
        iconKey: s.iconKey,
        count: s.count,
        workspaceIndex: s.editorRef?.kind === "workspace" ? s.editorRef.workspaceIndex : undefined,
      })),
    [sections],
  );

  const mapFeatureEnabled =
    typeof process.env.NEXT_PUBLIC_DESTINATION_MAP === "undefined" ||
    process.env.NEXT_PUBLIC_DESTINATION_MAP !== "false";

  const mapRatio = useMemo(() => destinationMapCoverageRatio(displayDestination), [displayDestination]);
  const showMapToggle =
    mapFeatureEnabled && mapRatio >= 0.3 && displayDestination.mapCenter != null;

  const mapPins = useMemo(
    () => buildDestinationMapPins(displayDestination, sections, undefined),
    [displayDestination, sections],
  );

  const handleAddSection = useCallback(
    (title: string) => {
      if (!editorCtx) return;
      const section = createBlankSection(title);
      editorCtx.patchSections((rows) => {
        rows.push(section);
      });
    },
    [editorCtx],
  );

  const handleRenameSection = useCallback(
    (wi: number, newTitle: string) => {
      if (!editorCtx) return;
      editorCtx.patchSection(wi, { heading: newTitle.trim() || undefined });
    },
    [editorCtx],
  );

  const handleDeleteSection = useCallback(
    (wi: number) => {
      if (!editorCtx) return;
      editorCtx.patchSections((rows) => {
        if (wi >= 0 && wi < rows.length) rows.splice(wi, 1);
      });
    },
    [editorCtx],
  );

  const handleReorderSections = useCallback(
    (oldWi: number, newWi: number) => {
      if (!editorCtx) return;
      editorCtx.patchSections((rows) => {
        if (oldWi < 0 || oldWi >= rows.length || newWi < 0 || newWi >= rows.length) return;
        const next = arrayMove(rows, oldWi, newWi);
        rows.length = 0;
        rows.push(...next);
      });
    },
    [editorCtx],
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
  }, [clientHash, displayDestination.slug]);

  const scrollToSection = useCallback(
    (id: string) => {
      logDestinationEvent("destination_section_nav", {
        destination: displayDestination.slug,
        section_id: id,
      });
      document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      const p = new URLSearchParams(searchParams.toString());
      p.delete("section");
      const qs = p.toString();
      const base = qs ? `${pathname}?${qs}` : pathname;
      const nextHash = `#section-${id}`;
      window.history.replaceState(null, "", `${base}${nextHash}`);
      setClientHash(nextHash);
      setActiveNavId(id);
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
              trailing={<DirectoryRoleToggle />}
            />
          </div>
        ) : null}
        <div
          ref={scrollRootRef}
          className={cn(
            "pb-6",
            fillParentScroll ? "w-full min-w-0" : "min-h-0 flex-1 overflow-y-auto",
          )}
        >
          <StickyHeroBar
            destination={displayDestination}
            allTags={allTags}
            activeTagFilters={activeTagFilters}
            onToggleTag={toggleTagFilter}
            progress={previewMode ? 0 : heroScrollProgress}
          />
          <div className="w-full">
            <div
              ref={heroRef}
              className="relative"
              style={{
                opacity: 1 - heroScrollProgress * 0.35,
              }}
            >
              {headerAside ? (
                <div className="pointer-events-none absolute right-0 top-3 z-20 flex justify-end sm:right-1 [&>*]:pointer-events-auto">
                  {headerAside}
                </div>
              ) : null}
              <DestinationHero
                destination={displayDestination}
                mode={heroMode}
                inlineEdit={heroInlineEdit}
                allTags={allTags}
                activeTagFilters={activeTagFilters}
                onToggleTagFilter={toggleTagFilter}
              />
            </div>

          <div className="px-6">
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
              <label htmlFor="dest-inline-description" className="sr-only">
                Destination introduction (optional)
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
          ) : displayDestination.description.trim() ? (
            <p className={cn("mt-4 text-sm leading-relaxed", destMuted)}>{displayDestination.description}</p>
          ) : null}

          <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-8">
            <div className="min-w-0 space-y-5">
              {navItems.length > 0 ? (
                <div className="lg:hidden">
                  <DestinationSectionNav
                    variant="horizontal"
                    items={navItems}
                    activeId={activeNavId}
                    onChange={scrollToSection}
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
                  Destination sections
                </h2>
                {editingWi != null ? (
                  <SectionEditPanel
                    workspaceIndex={editingWi}
                    sectionTitle={
                      navItems.find((it) => it.workspaceIndex === editingWi)?.label ?? "Section"
                    }
                    onClose={() => setEditingWi(null)}
                  />
                ) : viewMode === "map" && showMapToggle && displayDestination.mapCenter ? (
                  <DestinationMapView
                    pins={mapPins}
                    destinationSlug={displayDestination.slug}
                    center={displayDestination.mapCenter}
                  />
                ) : sections.length > 0 ? (
                  <SectionList
                    sections={sections}
                    destinationSlug={displayDestination.slug}
                    activeTagFilters={activeTagFilters}
                  />
                ) : (
                  <p className={cn("text-sm", destMuted)}>
                    No curated sections yet for this destination. Check back as content is added.
                  </p>
                )}
              </main>
            </div>

            {navItems.length > 0 || editorCtx ? (
              <aside className="hidden min-w-0 lg:block" aria-label="Section navigation">
                <div className="sticky top-24">
                  <DestinationSectionNav
                    variant="vertical"
                    items={navItems}
                    activeId={activeNavId}
                    onChange={scrollToSection}
                    onAddSection={editorCtx ? handleAddSection : undefined}
                    onRenameSection={editorCtx ? handleRenameSection : undefined}
                    onDeleteSection={editorCtx ? handleDeleteSection : undefined}
                    onReorderSections={editorCtx ? handleReorderSections : undefined}
                    onEditSection={editorCtx ? setEditingWi : undefined}
                  />
                </div>
              </aside>
            ) : null}
          </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
