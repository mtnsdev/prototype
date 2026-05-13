"use client";

import type { Dispatch, ReactNode, SetStateAction, RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { LayoutGrid, List, Map as MapIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Destination, EditorTabSection } from "@/data/destinations";
import type { DirectoryProduct } from "@/types/product-directory";
import { ensureEditorWorkspace } from "@/lib/destinationEditorTabs";
import { EmptySectionAddMenu, RowCardAdminControls, SliceDragHandle } from "./SectionAdminMenu";
import { useUser } from "@/contexts/UserContext";
import { usePermissions } from "@/hooks/usePermissions";
import { resolveAdvisorCatalogFromStorage } from "@/components/products/productDirectoryCatalogResolve";
import { mergeDestinationWithCatalog } from "@/lib/destinationCatalogJoin";
import {
  buildDestinationItemSectionMap,
  buildDestinationRowAnchors,
  buildSliceToRowAnchorMap,
  buildVirtualSectionsFromDestination,
  getRowSliceOrder,
  type DestinationRowAnchor,
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
import { destCard, destMuted, destPage } from "./destinationStyles";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { CatalogChromeNavRow } from "@/components/products/CatalogChromeNavRow";
import { DirectoryRoleToggle } from "@/components/products/DirectoryRoleToggle";
import { useProductDirectoryCatalogOptional } from "@/components/products/ProductDirectoryCatalogContext";
import { directoryHeroOrFallbackImageUrl } from "@/components/products/productDirectoryVisual";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useBuildEditorOptional } from "./editor/DestinationEditorForms";
import type {
  VirtualDestinationSection,
  ProductListItem,
} from "@/lib/destinationSectionModel";
import type { EditorSliceKind } from "@/data/destinations";
import { DestinationPropertyChips } from "./DestinationPropertyChips";
import { AssignProductsToPropertyDialog } from "./AssignProductsToPropertyDialog";
import {
  addProperty,
  getProperties,
  removeProperty,
  toggleProductOnProperty,
} from "@/lib/destinationProperties";

const DestinationMapView = dynamic(
  () => import("./DestinationMapView").then((m) => m.DestinationMapView),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Loading map…</p> },
);

/* ------------------------------------------------------------------ *
 *  Row-card rendering: one card per workspace row, slices stacked    *
 *  inside with hover-revealed admin affordances (drag + kebab).      *
 * ------------------------------------------------------------------ */

type RowCardCommonProps = {
  destinationSlug: string;
  /** Page-level destination-property filter (product-id allowlist). */
  allowedProductIds?: ReadonlySet<string> | null;
  productViewMode?: "cards" | "list";
  productLookup?: Map<string, DirectoryProduct>;
  onOpenProduct?: (productId: string) => void;
  onAddToCollection?: (productId: string) => void;
};

/** Editable heading + admin controls for one row card. */
function RowCardHeader({
  workspaceIndex,
  row,
  fallbackLabel,
  destinationSlug,
  anchorId,
  headingId,
}: {
  workspaceIndex: number;
  row: EditorTabSection;
  fallbackLabel: string;
  destinationSlug: string;
  anchorId: string;
  headingId: string;
}) {
  const ctx = useBuildEditorOptional();
  const { isAdmin } = usePermissions();
  const editing = !!ctx && isAdmin;

  const heading = row.heading?.trim() ?? "";

  return (
    <div className="mb-3 flex items-start gap-2">
      {editing ? (
        <Input
          id={headingId}
          value={heading}
          placeholder={fallbackLabel}
          onChange={(e) =>
            ctx!.patchSection(workspaceIndex, { heading: e.target.value || undefined })
          }
          className="h-7 min-w-0 flex-1 border-0 bg-transparent px-0 font-display text-sm font-medium tracking-tight text-foreground shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-brand-cta/40"
          aria-label="Section heading"
        />
      ) : (
        <h3
          id={headingId}
          className="min-w-0 flex-1 truncate font-display text-sm font-medium tracking-tight text-foreground"
        >
          {heading || fallbackLabel}
        </h3>
      )}
      <RowCardAdminControls workspaceIndex={workspaceIndex} />
    </div>
  );
}

/** Slice container — hover-reveals a left-edge drag handle when reorderable. */
function SortableSlice({
  sliceKind,
  reorderable,
  children,
}: {
  sliceKind: EditorSliceKind;
  reorderable: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sliceKind,
    disabled: !reorderable,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("group/slice relative", isDragging && "z-10 opacity-90")}
    >
      {reorderable ? <SliceDragHandle dragHandleProps={{ ...attributes, ...listeners }} /> : null}
      {children}
    </div>
  );
}

/** Renders one workspace row as a single card with stacked slices and dividers. */
function RowCard({
  row,
  workspaceIndex,
  rowSections,
  anchor,
  ...common
}: RowCardCommonProps & {
  row: EditorTabSection;
  workspaceIndex: number;
  rowSections: VirtualDestinationSection[];
  anchor: DestinationRowAnchor;
}) {
  const ctx = useBuildEditorOptional();
  const { isAdmin } = usePermissions();
  const editing = !!ctx && isAdmin;
  const headingId = `section-heading-row-${anchor.anchorId}`;

  const order = useMemo(() => getRowSliceOrder(row), [row]);

  // Map slice kind → matching virtual section emitted by the builder for this row.
  const slicesByKind = useMemo(() => {
    const m = new Map<EditorSliceKind, VirtualDestinationSection>();
    for (const s of rowSections) {
      if (s.editorRef?.kind !== "workspace") continue;
      const slot = s.editorRef.slice;
      if (slot === "text") m.set("text", s);
      else if (slot === "documents") m.set("documents", s);
      else if (slot === "dmc" || slot === "restaurants" || slot === "hotels" || slot === "yachts" || slot === "tourism") {
        m.set("products", s);
      }
    }
    return m;
  }, [rowSections]);

  const visibleOrder = order.filter((k) => slicesByKind.has(k));
  const reorderable = editing && visibleOrder.length > 1;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!ctx || !reorderable) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIdx = visibleOrder.indexOf(String(active.id) as EditorSliceKind);
      const newIdx = visibleOrder.indexOf(String(over.id) as EditorSliceKind);
      if (oldIdx < 0 || newIdx < 0) return;
      const nextVisible = arrayMove(visibleOrder, oldIdx, newIdx);
      // Preserve positions of disabled slices in the order array, only reshuffle the visible ones.
      const enabledSet = new Set(visibleOrder);
      const disabled = (row.sliceOrder ?? []).filter((k) => !enabledSet.has(k));
      ctx.patchSection(workspaceIndex, { sliceOrder: [...nextVisible, ...disabled] });
    },
    [ctx, reorderable, visibleOrder, row.sliceOrder, workspaceIndex],
  );

  const isEmpty = rowSections.length === 0;

  return (
    <section id={`section-row-${anchor.anchorId}`} aria-labelledby={headingId}>
      <div className={cn(destCard, "px-4 py-3", editing && "pl-9")}>
        <RowCardHeader
          workspaceIndex={workspaceIndex}
          row={row}
          fallbackLabel={anchor.label}
          destinationSlug={common.destinationSlug}
          anchorId={anchor.anchorId}
          headingId={headingId}
        />

        {isEmpty ? (
          <EmptySectionAddMenu workspaceIndex={workspaceIndex} row={row} />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={visibleOrder} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-border/60">
                {visibleOrder.map((kind) => {
                  const s = slicesByKind.get(kind)!;
                  return (
                    <SortableSlice key={kind} sliceKind={kind} reorderable={reorderable}>
                      <div className="py-3 first:pt-0 last:pb-0">
                        <SectionRenderer
                          section={s}
                          destinationSlug={common.destinationSlug}
                          allowedProductIds={common.allowedProductIds}
                          productViewMode={common.productViewMode}
                          productLookup={common.productLookup}
                          onOpenProduct={common.onOpenProduct}
                          onAddToCollection={common.onAddToCollection}
                        />
                      </div>
                    </SortableSlice>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </section>
  );
}

/** All section cards stacked vertically — sidebar highlights as you scroll. */
function RowCardList({
  destination,
  sections,
  editorRows,
  ...common
}: RowCardCommonProps & {
  destination: Destination;
  sections: VirtualDestinationSection[];
  /** Workspace rows in display order — required so empty rows still render with their `+ Add` placeholder. */
  editorRows: EditorTabSection[];
}) {
  const byRow = useMemo(() => {
    const m = new Map<number, VirtualDestinationSection[]>();
    for (const s of sections) {
      if (s.editorRef?.kind !== "workspace") continue;
      const wi = s.editorRef.workspaceIndex;
      const list = m.get(wi) ?? [];
      list.push(s);
      m.set(wi, list);
    }
    return m;
  }, [sections]);

  const anchors = useMemo(() => buildDestinationRowAnchors(destination), [destination]);
  const anchorByWi = useMemo(() => new Map(anchors.map((a) => [a.workspaceIndex, a])), [anchors]);

  return (
    <div className="space-y-3">
      {editorRows.map((row, wi) => {
        const rowSections = byRow.get(wi) ?? [];
        const anchor = anchorByWi.get(wi);
        if (!anchor) return null;
        return (
          <RowCard
            key={row.id}
            row={row}
            workspaceIndex={wi}
            rowSections={rowSections}
            anchor={anchor}
            {...common}
          />
        );
      })}
    </div>
  );
}

/**
 * Compact icon-only segmented control used in the hero overlay and the
 * collapsed sticky bar. Kept in one place so both renderings stay in sync.
 */
function ViewToggle({
  viewMode,
  productViewMode,
  onMapToggle,
  onProductViewModeChange,
  showMapToggle,
}: {
  viewMode: "list" | "map";
  productViewMode: "cards" | "list";
  onMapToggle: (mode: "list" | "map") => void;
  onProductViewModeChange: (mode: "cards" | "list") => void;
  showMapToggle: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-white/25 bg-background/70 p-0.5 shadow-sm backdrop-blur-sm">
      <button
        type="button"
        title="Card view"
        aria-label="Card view"
        aria-pressed={viewMode === "list" && productViewMode === "cards"}
        className={cn(
          "rounded-md p-1.5 transition-colors",
          viewMode === "list" && productViewMode === "cards"
            ? "bg-[rgba(201,169,110,0.12)] text-brand-cta"
            : "text-muted-foreground/80 hover:text-foreground",
        )}
        onClick={() => {
          onMapToggle("list");
          onProductViewModeChange("cards");
        }}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        title="List view"
        aria-label="List view"
        aria-pressed={viewMode === "list" && productViewMode === "list"}
        className={cn(
          "rounded-md p-1.5 transition-colors",
          viewMode === "list" && productViewMode === "list"
            ? "bg-[rgba(201,169,110,0.12)] text-brand-cta"
            : "text-muted-foreground/80 hover:text-foreground",
        )}
        onClick={() => {
          onMapToggle("list");
          onProductViewModeChange("list");
        }}
      >
        <List className="h-4 w-4" aria-hidden />
      </button>
      {showMapToggle ? (
        <button
          type="button"
          title="Map view"
          aria-label="Map view"
          aria-pressed={viewMode === "map"}
          className={cn(
            "rounded-md p-1.5 transition-colors",
            viewMode === "map"
              ? "bg-[rgba(201,169,110,0.12)] text-brand-cta"
              : "text-muted-foreground/80 hover:text-foreground",
          )}
          onClick={() => onMapToggle("map")}
        >
          <MapIcon className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

/** Condensed sticky hero bar — morphs in as the hero scrolls out. */
function StickyHeroBar({
  destination,
  progress,
  viewToggle,
}: {
  destination: Destination;
  /** 0 = hero fully visible (bar hidden), 1 = hero fully scrolled out (bar fully shown). */
  progress: number;
  /** Rendered on the right side of the collapsed bar (mirrors the hero overlay). */
  viewToggle?: ReactNode;
}) {
  const heroSrc = directoryHeroOrFallbackImageUrl(destination.slug, destination.heroImage ?? null);

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
        <div className="relative flex items-center justify-between gap-4 px-6 pb-3.5 pt-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold tracking-tight text-foreground drop-shadow-sm md:text-xl">
              {destination.name}
            </h2>
            <p className={cn("mt-1 truncate text-sm leading-snug", destMuted)}>
              {destination.tagline}
            </p>
          </div>
          {viewToggle ? <div className="shrink-0">{viewToggle}</div> : null}
        </div>
      </div>
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

    // Some layouts (e.g. advisor view of the destination page) end up scrolling on
    // the window/body rather than on the inner scroll root. Listening on both keeps
    // the sticky hero bar in sync regardless of which element actually scrolls.
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
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
   * Overview editor: edit name, tagline, and hero URL in the same layout as the published page.
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
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const catalogCtx = useProductDirectoryCatalogOptional();
  const catalogRevision = catalogCtx?.catalogRevision ?? 0;
  const editorCtx = useBuildEditorOptional();

  const [clientHash, setClientHash] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  /** Cards (grid of DirectoryProductCards) vs List (compact directory-style rows). Persisted globally. */
  const [productViewMode, setProductViewMode] = useState<"cards" | "list">("cards");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("destination-product-view");
    if (saved === "cards" || saved === "list") setProductViewMode(saved);
  }, []);
  const handleProductViewModeChange = useCallback((next: "cards" | "list") => {
    setProductViewMode(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("destination-product-view", next);
    }
  }, []);

  const { products: directoryProducts } = useMemo(() => {
    if (userLoading || !user) return { products: [] as DirectoryProduct[] };
    return resolveAdvisorCatalogFromStorage(
      String(user.id),
      user.username ?? user.email?.split("@")[0] ?? "Advisor",
    );
  }, [user, userLoading, catalogRevision]);

  const productLookup = useMemo(() => {
    const m = new Map<string, DirectoryProduct>();
    for (const p of directoryProducts) m.set(p.id, p);
    return m;
  }, [directoryProducts]);

  const displayDestination = useMemo(() => {
    if (userLoading || !user) return destination;
    return mergeDestinationWithCatalog(destination, directoryProducts);
  }, [destination, user, userLoading, directoryProducts]);

  const openProductDetail = useCallback(
    (productId: string) => {
      router.push(`/dashboard/products?selected=${encodeURIComponent(productId)}`);
    },
    [router],
  );

  const openAddToCollection = useCallback(
    (productId: string) => {
      router.push(`/dashboard/products?selected=${encodeURIComponent(productId)}&action=add`);
    },
    [router],
  );

  const sections = useMemo(
    () => buildVirtualSectionsFromDestination(displayDestination),
    [displayDestination],
  );

  /** Row anchors drive the sidebar nav and scroll-spy (one entry per workspace row). */
  const rowAnchors = useMemo(
    () => buildDestinationRowAnchors(displayDestination),
    [displayDestination],
  );

  /** Item id (deep links) → owning row anchor id. Composes item→slice and slice→row maps. */
  const itemToSection = useMemo(() => {
    const itemToSlice = buildDestinationItemSectionMap(displayDestination, sections);
    const sliceToRow = buildSliceToRowAnchorMap(displayDestination);
    const m = new Map<string, string>();
    for (const [itemId, sliceId] of itemToSlice) {
      const row = sliceToRow.get(sliceId);
      if (row) m.set(itemId, row);
    }
    return m;
  }, [displayDestination, sections]);

  /** Legacy `#section-<sliceId>` bookmarks → owning row anchor id. */
  const sliceToSection = useMemo(
    () => buildSliceToRowAnchorMap(displayDestination),
    [displayDestination],
  );

  const validIds = useMemo(() => rowAnchors.map((a) => a.anchorId), [rowAnchors]);

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
        sliceToSection,
      }),
    [displayDestination.slug, searchParams, clientHash, validIds, itemToSection, sliceToSection],
  );

  const [activeNavId, setActiveNavId] = useState(resolvedNavId);
  useEffect(() => {
    setActiveNavId(resolvedNavId);
  }, [resolvedNavId]);

  const scrollRootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroScrollProgress = useHeroScrollProgress(heroRef, scrollRootRef);

  // Scroll-spy: highlight the sidebar nav item for whichever row card is most visible.
  useEffect(() => {
    if (rowAnchors.length === 0) return;
    const els = rowAnchors
      .map((a) => document.getElementById(`section-row-${a.anchorId}`))
      .filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        let best: { id: string; ratio: number } | null = null;
        for (const e of entries) {
          const id = e.target.id.replace("section-row-", "");
          if (!best || e.intersectionRatio > best.ratio) {
            best = { id, ratio: e.intersectionRatio };
          }
        }
        if (best && best.ratio > 0) {
          setActiveNavId(best.id);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, [rowAnchors]);

  /** Flat list of all product items across product_list sections (for property assignment). */
  const allProductItems = useMemo(() => {
    const items: ProductListItem[] = [];
    for (const s of sections) {
      if (s.sectionType === "product_list") {
        for (const item of s.items) items.push(item);
      }
    }
    return items;
  }, [sections]);

  const properties = useMemo(() => getProperties(displayDestination), [displayDestination]);

  const [activePropertyFilters, setActivePropertyFilters] = useState<Set<string>>(new Set());
  const togglePropertyFilter = useCallback((propertyId: string) => {
    setActivePropertyFilters((prev) => {
      const next = new Set(prev);
      if (next.has(propertyId)) next.delete(propertyId);
      else next.add(propertyId);
      return next;
    });
  }, []);

  /**
   * Translate active property filters into the union of product ids those
   * properties carry. Returns null when no filter is active (= show all).
   */
  const allowedProductIds = useMemo<ReadonlySet<string> | null>(() => {
    if (activePropertyFilters.size === 0) return null;
    const ids = new Set<string>();
    for (const p of properties) {
      if (activePropertyFilters.has(p.id)) {
        for (const id of p.productIds) ids.add(id);
      }
    }
    return ids;
  }, [activePropertyFilters, properties]);

  const [manageProperty, setManageProperty] = useState<string | null>(null);
  const propertyAdmin = editorCtx
    ? {
        onAdd: (label: string) => {
          editorCtx.setDraft((d) => {
            const result = addProperty(d, label);
            return result ? result.destination : d;
          });
        },
        onRemove: (id: string) => {
          editorCtx.setDraft((d) => removeProperty(d, id));
          setActivePropertyFilters((prev) => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        },
        onManageProducts: (id: string) => setManageProperty(id),
      }
    : undefined;
  const managedProperty = manageProperty
    ? properties.find((p) => p.id === manageProperty) ?? null
    : null;

  const navItems: DestinationNavItem[] = useMemo(
    () =>
      rowAnchors.map((a) => ({
        id: a.anchorId,
        label: a.label,
        count: a.count,
        workspaceIndex: a.workspaceIndex,
      })),
    [rowAnchors],
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

  const scrollToSection = useCallback(
    (id: string) => {
      logDestinationEvent("destination_section_nav", {
        destination: displayDestination.slug,
        section_id: id,
      });
      setActiveNavId(id);
      // Smooth-scroll to the row card
      document.getElementById(`section-row-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      // Update URL hash (row anchor format — `#section-<rowAnchorId>`)
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
              omitSegmentTabs
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
            progress={previewMode ? 0 : heroScrollProgress}
            viewToggle={
              <ViewToggle
                viewMode={viewMode}
                productViewMode={productViewMode}
                onMapToggle={onMapToggle}
                onProductViewModeChange={handleProductViewModeChange}
                showMapToggle={showMapToggle}
              />
            }
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
              />
              <div className="absolute bottom-4 right-4 z-10 md:bottom-5 md:right-5">
                <ViewToggle
                  viewMode={viewMode}
                  productViewMode={productViewMode}
                  onMapToggle={onMapToggle}
                  onProductViewModeChange={handleProductViewModeChange}
                  showMapToggle={showMapToggle}
                />
              </div>
            </div>

          <div className="px-6">

          {/* Destination-scoped property pills (free-form, per-destination). */}
          {(properties.length > 0 || editorCtx) ? (
            <div className="mt-3">
              <DestinationPropertyChips
                properties={properties}
                activeFilters={activePropertyFilters}
                onToggleFilter={togglePropertyFilter}
                admin={propertyAdmin}
                variant="plain"
              />
            </div>
          ) : null}

          <div className="mt-6 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
            {/* Sidebar nav — left column on desktop, horizontal tabs on mobile */}
            {navItems.length > 0 || editorCtx ? (
              <>
                <div className="lg:hidden">
                  <DestinationSectionNav
                    variant="horizontal"
                    items={navItems}
                    activeId={activeNavId}
                    onChange={scrollToSection}
                  />
                </div>
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
                    />
                  </div>
                </aside>
              </>
            ) : null}

            {/* Main content — right column */}
            <div className="min-w-0 space-y-5">
              <main
                id="destination-main"
                tabIndex={-1}
                className="min-w-0 scroll-mt-24 outline-none"
                aria-labelledby="destination-section-title"
              >
                <h2 id="destination-section-title" className="sr-only">
                  Destination sections
                </h2>
                {viewMode === "map" && showMapToggle && displayDestination.mapCenter ? (
                  <DestinationMapView
                    pins={mapPins}
                    destinationSlug={displayDestination.slug}
                    center={displayDestination.mapCenter}
                  />
                ) : sections.length > 0 || editorCtx ? (
                  <RowCardList
                    destination={displayDestination}
                    sections={sections}
                    destinationSlug={displayDestination.slug}
                    allowedProductIds={allowedProductIds}
                    productViewMode={productViewMode}
                    productLookup={productLookup}
                    onOpenProduct={openProductDetail}
                    onAddToCollection={openAddToCollection}
                    editorRows={ensureEditorWorkspace(displayDestination).sections}
                  />
                ) : (
                  <p className={cn("text-sm", destMuted)}>
                    No curated sections yet for this destination. Check back as content is added.
                  </p>
                )}
              </main>
            </div>
          </div>
          </div>
        </div>
        </div>
      </div>
      {editorCtx ? (
        <AssignProductsToPropertyDialog
          open={managedProperty != null}
          onOpenChange={(open) => {
            if (!open) setManageProperty(null);
          }}
          property={managedProperty}
          allProducts={allProductItems}
          onToggleProduct={(propertyId, productId) => {
            editorCtx.setDraft((d) => toggleProductOnProperty(d, propertyId, productId));
          }}
        />
      ) : null}
    </div>
  );
}
