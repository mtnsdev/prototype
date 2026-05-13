"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical, Trash2 } from "lucide-react";
import type { DirectoryProduct } from "@/types/product-directory";
import type { VirtualProductListSection, ProductListItem } from "@/lib/destinationSectionModel";
import type { BuildEditorContextValue } from "@/components/destinations/editor/DestinationEditorForms";
import { useBuildEditorOptional } from "@/components/destinations/editor/DestinationEditorForms";
import { usePermissions } from "@/hooks/usePermissions";
import { stableItemId } from "@/lib/stableDestinationIds";
import { logDestinationEvent } from "@/lib/destinationAnalytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { directoryHeroOrFallbackImageUrl } from "@/components/products/productDirectoryVisual";
import { DIRECTORY_EXTERNAL_COLLECTION_ID } from "@/components/products/productDirectoryMock";
import DirectoryProductCard from "@/components/products/DirectoryProductCard";
import { DirectoryProductRow } from "./DirectoryProductRow";

type Props = {
  section: VirtualProductListSection;
  destinationSlug: string;
  /** Page-level active tag filters (union: show items matching any). Empty set = show all. */
  activeTagFilters?: ReadonlySet<string>;
  /**
   * Page-level destination-property filter. When defined, only items whose
   * `productId` is in the set are kept. `null`/undefined = no property filter.
   */
  allowedProductIds?: ReadonlySet<string> | null;
  /** Rich cards (directory style grid) vs richer directory-style list rows. */
  viewMode?: "cards" | "list";
  /** Resolve `productId` → `DirectoryProduct` for catalog-rich rendering. */
  productLookup?: Map<string, DirectoryProduct>;
  /** Open the Product Directory detail for a given product. */
  onOpenProduct?: (productId: string) => void;
  /** Open the Product Directory collection picker for a given product. */
  onAddToCollection?: (productId: string) => void;
};

/** Collect all unique tags across every item in the section (for autocomplete). */
export function collectTags(items: ProductListItem[]): string[] {
  const seen = new Set<string>();
  for (const item of items) {
    if (item.tags) {
      for (const t of item.tags) seen.add(t);
    }
  }
  return [...seen].sort();
}

/**
 * Only render inside {@link SortableContext} — owns {@link useSortable}.
 * Drag handle is absolutely positioned (left edge, hover-revealed) so admin
 * rows occupy the exact same horizontal space as advisor rows.
 */
function SortableProductRowShell({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={cn("relative", isDragging && "z-20 opacity-95")}>
      <button
        type="button"
        className="absolute left-0 top-1/2 z-10 flex size-7 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-md bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm opacity-0 transition-opacity hover:bg-background hover:text-foreground active:cursor-grabbing group-hover/prow:opacity-100 focus-visible:opacity-100"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" aria-hidden />
      </button>
      {children}
    </div>
  );
}

/** Extract a favicon/logo URL from a product website URL. */
function productThumbnailUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
}

function ProductThumbnail({
  image,
  url,
  imageSeedKey,
}: {
  image?: string;
  url?: string;
  imageSeedKey: string;
}) {
  const [failedIdx, setFailedIdx] = useState(0);
  const explicit = (image ?? "").trim();
  const fav = productThumbnailUrl(url);
  const pool = directoryHeroOrFallbackImageUrl(imageSeedKey, null);
  const candidates = [explicit, fav, pool].filter((u, i, a) => u && a.indexOf(u) === i);
  const src = candidates[Math.min(failedIdx, Math.max(0, candidates.length - 1))] ?? pool;
  const isPhoto = Boolean(explicit && src === explicit);

  return (
    <div className="size-9 shrink-0 overflow-hidden rounded-md bg-muted/40">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className={isPhoto ? "size-full object-cover" : "size-full object-contain p-1"}
        onError={() => setFailedIdx((i) => Math.min(i + 1, candidates.length - 1))}
      />
    </div>
  );
}

/** Compact one-line row — used for items without a catalog match (custom advisor entries). */
function FallbackProductRow({
  item,
  itemId,
  destinationSlug,
  isLast,
  admin,
  onRemove,
}: {
  item: ProductListItem;
  itemId: string;
  destinationSlug: string;
  isLast: boolean;
  admin: boolean;
  onRemove?: () => void;
}) {
  return (
    <li
      id={`item-${itemId}`}
      className={cn(
        "group/prow relative flex scroll-mt-28 items-center gap-2.5 px-1 py-1.5",
        !isLast && "border-b border-border/40",
      )}
    >
      <ProductThumbnail
        image={item.image}
        url={item.url}
        imageSeedKey={item.productId ?? `${destinationSlug}:${item.name}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-x-1.5">
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                logDestinationEvent("destination_product_open", {
                  destination: destinationSlug,
                  product_id: item.productId ?? "",
                  surface: `${item.productKind}_link`,
                })
              }
              className="inline-flex items-baseline gap-1 truncate text-[13px] font-medium text-foreground underline-offset-4 hover:text-brand-cta hover:underline"
            >
              {item.name}
              <ExternalLink className="size-2.5 shrink-0 translate-y-px opacity-0 transition-opacity group-hover/prow:opacity-60" aria-hidden />
            </a>
          ) : (
            <span className="truncate text-[13px] font-medium text-foreground">{item.name}</span>
          )}
          {item.meta ? (
            <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">{item.meta}</span>
          ) : null}
          {item.pill ? (
            <span className="shrink-0 rounded-full border border-border/60 bg-muted/30 px-1.5 py-px text-[10px] text-muted-foreground">
              {item.pill}
            </span>
          ) : null}
          {item.tags?.map((tag) => (
            <span
              key={tag}
              className="hidden shrink-0 rounded-full border border-border/40 px-1.5 py-px text-[10px] text-muted-foreground/80 sm:inline"
            >
              {tag}
            </span>
          ))}
          {item.catalogUnavailable ? (
            <span className="text-[10px] text-muted-foreground/70">Unavailable</span>
          ) : null}
        </div>
        {item.note ? <p className="truncate text-[11px] text-muted-foreground/70">{item.note}</p> : null}
      </div>

      {admin && onRemove ? (
        <div
          className={cn(
            "pointer-events-none absolute right-1 top-1.5 z-10 flex items-center gap-0 opacity-0 transition-opacity",
            "group-hover/prow:pointer-events-auto group-hover/prow:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100",
          )}
        >
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7 text-muted-foreground/60 hover:text-destructive"
            title="Remove"
            onClick={onRemove}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </div>
      ) : null}
    </li>
  );
}

/** Card fallback for items without a catalog match — keeps grid layout consistent with DirectoryProductCard. */
function FallbackProductCard({
  item,
  destinationSlug,
}: {
  item: ProductListItem;
  destinationSlug: string;
}) {
  const seedKey = item.productId ?? `${destinationSlug}:${item.name}`;
  const src = (item.image ?? "").trim() || directoryHeroOrFallbackImageUrl(seedKey, null);
  const handleClick = () => {
    if (!item.url) return;
    logDestinationEvent("destination_product_open", {
      destination: destinationSlug,
      product_id: item.productId ?? "",
      surface: `${item.productKind}_link`,
    });
    window.open(item.url, "_blank", "noopener,noreferrer");
  };
  const clickable = Boolean(item.url);
  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? handleClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition-colors",
        clickable && "cursor-pointer hover:border-border",
      )}
    >
      <div className="relative h-[140px] w-full shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-transparent to-transparent" />
      </div>
      <div className="flex flex-1 flex-col p-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="truncate text-sm font-medium leading-tight text-foreground">{item.name}</h3>
          {item.url ? (
            <ExternalLink className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden />
          ) : null}
        </div>
        {item.meta ? (
          <p className="mt-0.5 truncate text-2xs text-muted-foreground">{item.meta}</p>
        ) : null}
        {item.note ? (
          <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground/80">{item.note}</p>
        ) : null}
        <div className="mt-auto flex flex-wrap gap-1 pt-2">
          {item.pill ? (
            <span className="rounded-full border border-border/60 bg-muted/30 px-1.5 py-px text-[10px] text-muted-foreground">
              {item.pill}
            </span>
          ) : null}
          {item.tags?.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border/40 px-1.5 py-px text-[10px] text-muted-foreground/80"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

type AdminDragShellProps = {
  section: VirtualProductListSection;
  destinationSlug: string;
  activeTagFilters?: ReadonlySet<string>;
  allowedProductIds?: ReadonlySet<string> | null;
  items: ProductListItem[];
  filteredItems: ProductListItem[];
  productLookup?: Map<string, DirectoryProduct>;
  onOpenProduct?: (productId: string) => void;
  onAddToCollection?: (productId: string) => void;
  canViewCommissions: boolean;
  ctx: BuildEditorContextValue;
  removeAt: (flatIndex: number) => void;
};

/**
 * Isolated so {@link useSensors} / {@link DndContext} hooks only run when admin drag mode is active.
 * Calling those hooks in the parent while returning early when `!admin` breaks hook ordering with dnd-kit + React.
 */
function AdminProductListDragShell({
  section,
  destinationSlug,
  activeTagFilters,
  allowedProductIds,
  items,
  filteredItems,
  productLookup,
  onOpenProduct,
  onAddToCollection,
  canViewCommissions,
  ctx,
  removeAt,
}: AdminDragShellProps) {
  const sortIds = useMemo(
    () =>
      items.map((item, i) => {
        const key = item.productId ?? `${item.name}-${i}`;
        return stableItemId(destinationSlug, section.id, key);
      }),
    [items, destinationSlug, section.id],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = sortIds.indexOf(String(active.id));
      const newIndex = sortIds.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;

      ctx.setDraft((d) => {
        const slice = section.editorRef?.slice;
        if (!slice) return d;
        if (slice === "dmc") {
          return { ...d, dmcPartners: arrayMove([...d.dmcPartners], oldIndex, newIndex) };
        }
        if (slice === "yachts") {
          return { ...d, yachtCompanies: arrayMove([...(d.yachtCompanies ?? [])], oldIndex, newIndex) };
        }
        return d;
      });
    },
    [ctx, sortIds, section.editorRef?.slice],
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={sortIds} strategy={verticalListSortingStrategy}>
        <div className="overflow-hidden">
          <ul>
            {filteredItems.map((item, i) => {
              const key = item.productId ?? `${item.name}-${i}`;
              const itemId = stableItemId(destinationSlug, section.id, key);
              const isLast = i === filteredItems.length - 1;
              const flatIndex = items.indexOf(item);
              const product = item.productId ? productLookup?.get(item.productId) : undefined;

              return (
                <SortableProductRowShell key={itemId} id={itemId}>
                  {product && onOpenProduct ? (
                    <li
                      id={`item-${itemId}`}
                      className={cn(
                        "group/prow relative scroll-mt-28 list-none",
                        !isLast && "border-b border-border/40",
                      )}
                    >
                      <DirectoryProductRow
                        product={product}
                        canViewCommissions={canViewCommissions}
                        bookmarked={product.collectionIds.length > 0}
                        showSavedFromSearch={product.collectionIds.includes(DIRECTORY_EXTERNAL_COLLECTION_ID)}
                        onAddToCollectionClick={(e) => {
                          e.stopPropagation();
                          if (onAddToCollection) onAddToCollection(product.id);
                        }}
                        onClick={() => {
                          logDestinationEvent("destination_product_open", {
                            destination: destinationSlug,
                            product_id: product.id,
                            surface: `${item.productKind}_card`,
                          });
                          onOpenProduct(product.id);
                        }}
                      />
                      <div
                        className={cn(
                          "pointer-events-none absolute right-1 top-1.5 z-10 flex items-center gap-0 opacity-0 transition-opacity",
                          "group-hover/prow:pointer-events-auto group-hover/prow:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100",
                        )}
                      >
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground/60 hover:text-destructive"
                          title="Remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAt(flatIndex);
                          }}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </Button>
                      </div>
                    </li>
                  ) : (
                    <FallbackProductRow
                      item={item}
                      itemId={itemId}
                      destinationSlug={destinationSlug}
                      isLast={isLast}
                      admin
                      onRemove={() => removeAt(flatIndex)}
                    />
                  )}
                </SortableProductRowShell>
              );
            })}
          </ul>
          {((activeTagFilters && activeTagFilters.size > 0) ||
            (allowedProductIds && allowedProductIds.size > 0)) &&
            filteredItems.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No items match the selected filters.
            </p>
          ) : null}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/** Wraps a single card with a sortable handle (grip in top-left corner, hover-revealed). */
function SortableCardShell({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("group/card relative", isDragging && "z-20 opacity-95")}
    >
      <button
        type="button"
        className="absolute left-1.5 top-1.5 z-20 flex size-6 cursor-grab touch-none items-center justify-center rounded-md bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm opacity-0 transition-opacity hover:bg-background hover:text-foreground active:cursor-grabbing group-hover/card:opacity-100 focus-visible:opacity-100"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" aria-hidden />
      </button>
      {children}
    </div>
  );
}

type AdminCardsShellProps = {
  section: VirtualProductListSection;
  destinationSlug: string;
  items: ProductListItem[];
  filteredItems: ProductListItem[];
  productLookup?: Map<string, DirectoryProduct>;
  onOpenProduct?: (productId: string) => void;
  onAddToCollection?: (productId: string) => void;
  canViewCommissions: boolean;
  ctx: BuildEditorContextValue;
  removeAt: (flatIndex: number) => void;
};

/**
 * Cards-view admin shell — mirrors {@link AdminProductListDragShell} but with a 2D grid
 * (uses `rectSortingStrategy`) and a hover Remove button per card.
 */
function AdminProductCardsDragShell({
  section,
  destinationSlug,
  items,
  filteredItems,
  productLookup,
  onOpenProduct,
  onAddToCollection,
  canViewCommissions,
  ctx,
  removeAt,
}: AdminCardsShellProps) {
  const sortIds = useMemo(
    () =>
      items.map((item, i) => {
        const key = item.productId ?? `${item.name}-${i}`;
        return stableItemId(destinationSlug, section.id, key);
      }),
    [items, destinationSlug, section.id],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = sortIds.indexOf(String(active.id));
      const newIndex = sortIds.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;

      ctx.setDraft((d) => {
        const slice = section.editorRef?.slice;
        if (!slice) return d;
        if (slice === "dmc") {
          return { ...d, dmcPartners: arrayMove([...d.dmcPartners], oldIndex, newIndex) };
        }
        if (slice === "yachts") {
          return { ...d, yachtCompanies: arrayMove([...(d.yachtCompanies ?? [])], oldIndex, newIndex) };
        }
        return d;
      });
    },
    [ctx, sortIds, section.editorRef?.slice],
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={sortIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item, i) => {
            const key = item.productId ?? `${item.name}-${i}`;
            const itemId = stableItemId(destinationSlug, section.id, key);
            const flatIndex = items.indexOf(item);
            const product = item.productId ? productLookup?.get(item.productId) : undefined;

            return (
              <SortableCardShell key={itemId} id={itemId}>
                <div id={`item-${itemId}`} className="scroll-mt-28">
                  {product && onOpenProduct ? (
                    <DirectoryProductCard
                      product={product}
                      canViewCommissions={canViewCommissions}
                      bookmarked={product.collectionIds.length > 0}
                      showRepFirmLinks={false}
                      showSavedFromSearch={product.collectionIds.includes(DIRECTORY_EXTERNAL_COLLECTION_ID)}
                      onProductClick={() => {
                        logDestinationEvent("destination_product_open", {
                          destination: destinationSlug,
                          product_id: product.id,
                          surface: `${item.productKind}_card`,
                        });
                        onOpenProduct(product.id);
                      }}
                      onAddToCollectionClick={(e) => {
                        e.stopPropagation();
                        if (onAddToCollection) onAddToCollection(product.id);
                      }}
                    />
                  ) : (
                    <FallbackProductCard item={item} destinationSlug={destinationSlug} />
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    title="Remove from guide"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAt(flatIndex);
                    }}
                    className="absolute right-1.5 top-1.5 z-20 size-7 rounded-md bg-background/80 text-muted-foreground/80 shadow-sm backdrop-blur-sm opacity-0 transition-opacity hover:bg-background hover:text-destructive group-hover/card:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </div>
              </SortableCardShell>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function ProductListSection({
  section,
  destinationSlug,
  activeTagFilters,
  allowedProductIds,
  viewMode = "list",
  productLookup,
  onOpenProduct,
  onAddToCollection,
}: Props) {
  const ctx = useBuildEditorOptional();
  const { isAdmin, canViewCommissions } = usePermissions();
  const admin = isAdmin && ctx != null;

  const items = section.items;

  const filteredItems = useMemo(() => {
    let next = items;
    if (allowedProductIds && allowedProductIds.size > 0) {
      next = next.filter((item) => item.productId != null && allowedProductIds.has(item.productId));
    }
    if (activeTagFilters && activeTagFilters.size > 0) {
      next = next.filter((item) => item.tags?.some((t) => activeTagFilters.has(t)));
    }
    return next;
  }, [items, activeTagFilters, allowedProductIds]);

  const removeAt = useCallback(
    (flatIndex: number) => {
      if (!ctx || !window.confirm("Remove this product from the guide?")) return;
      ctx.setDraft((d) => {
        const slice = section.editorRef?.slice;
        if (!slice) return d;
        if (slice === "dmc") {
          return { ...d, dmcPartners: d.dmcPartners.filter((_, i) => i !== flatIndex) };
        }
        if (slice === "yachts") {
          return { ...d, yachtCompanies: (d.yachtCompanies ?? []).filter((_, i) => i !== flatIndex) };
        }
        if (slice === "restaurants") {
          let idx = 0;
          const nextRest: typeof d.restaurants = {};
          for (const [region, list] of Object.entries(d.restaurants)) {
            nextRest[region] = list.filter(() => idx++ !== flatIndex);
          }
          return { ...d, restaurants: nextRest };
        }
        if (slice === "hotels") {
          let idx = 0;
          const nextHotels: typeof d.hotels = {};
          for (const [group, list] of Object.entries(d.hotels)) {
            nextHotels[group] = list.filter(() => idx++ !== flatIndex);
          }
          return { ...d, hotels: nextHotels };
        }
        return d;
      });
    },
    [ctx, section.editorRef?.slice],
  );

  /** Cards grid view — supports admin drag-to-reorder + hover Remove. */
  if (viewMode === "cards") {
    if (filteredItems.length === 0) {
      return ((activeTagFilters && activeTagFilters.size > 0) ||
        (allowedProductIds && allowedProductIds.size > 0)) ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          No items match the selected filters.
        </p>
      ) : null;
    }
    if (admin && ctx) {
      return (
        <AdminProductCardsDragShell
          section={section}
          destinationSlug={destinationSlug}
          items={items}
          filteredItems={filteredItems}
          productLookup={productLookup}
          onOpenProduct={onOpenProduct}
          onAddToCollection={onAddToCollection}
          canViewCommissions={canViewCommissions}
          ctx={ctx}
          removeAt={removeAt}
        />
      );
    }
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map((item, i) => {
          const key = item.productId ?? `${item.name}-${i}`;
          const itemId = stableItemId(destinationSlug, section.id, key);
          const product = item.productId ? productLookup?.get(item.productId) : undefined;

          if (product && onOpenProduct) {
            return (
              <div key={itemId} id={`item-${itemId}`} className="scroll-mt-28">
                <DirectoryProductCard
                  product={product}
                  canViewCommissions={canViewCommissions}
                  bookmarked={product.collectionIds.length > 0}
                  showRepFirmLinks={false}
                  showSavedFromSearch={product.collectionIds.includes(DIRECTORY_EXTERNAL_COLLECTION_ID)}
                  onProductClick={() => {
                    logDestinationEvent("destination_product_open", {
                      destination: destinationSlug,
                      product_id: product.id,
                      surface: `${item.productKind}_card`,
                    });
                    onOpenProduct(product.id);
                  }}
                  onAddToCollectionClick={(e) => {
                    e.stopPropagation();
                    if (onAddToCollection) onAddToCollection(product.id);
                  }}
                />
              </div>
            );
          }

          return (
            <div key={itemId} id={`item-${itemId}`} className="scroll-mt-28">
              <FallbackProductCard item={item} destinationSlug={destinationSlug} />
            </div>
          );
        })}
      </div>
    );
  }

  /** List view — directory-style rows for catalog matches, compact rows for fallback. */
  if (!admin || !ctx) {
    return (
      <div className="overflow-hidden">
        <ul className="space-y-1">
          {filteredItems.map((item, i) => {
            const key = item.productId ?? `${item.name}-${i}`;
            const itemId = stableItemId(destinationSlug, section.id, key);
            const isLast = i === filteredItems.length - 1;
            const product = item.productId ? productLookup?.get(item.productId) : undefined;

            if (product && onOpenProduct) {
              return (
                <li key={itemId} id={`item-${itemId}`} className="scroll-mt-28 list-none">
                  <DirectoryProductRow
                    product={product}
                    canViewCommissions={canViewCommissions}
                    bookmarked={product.collectionIds.length > 0}
                    showSavedFromSearch={product.collectionIds.includes(DIRECTORY_EXTERNAL_COLLECTION_ID)}
                    onAddToCollectionClick={(e) => {
                      e.stopPropagation();
                      if (onAddToCollection) onAddToCollection(product.id);
                    }}
                    onClick={() => {
                      logDestinationEvent("destination_product_open", {
                        destination: destinationSlug,
                        product_id: product.id,
                        surface: `${item.productKind}_card`,
                      });
                      onOpenProduct(product.id);
                    }}
                  />
                </li>
              );
            }

            return (
              <FallbackProductRow
                key={itemId}
                item={item}
                itemId={itemId}
                destinationSlug={destinationSlug}
                isLast={isLast}
                admin={false}
              />
            );
          })}
        </ul>
        {((activeTagFilters && activeTagFilters.size > 0) ||
          (allowedProductIds && allowedProductIds.size > 0)) &&
        filteredItems.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No items match the selected filters.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <AdminProductListDragShell
      section={section}
      destinationSlug={destinationSlug}
      activeTagFilters={activeTagFilters}
      allowedProductIds={allowedProductIds}
      items={items}
      filteredItems={filteredItems}
      productLookup={productLookup}
      onOpenProduct={onOpenProduct}
      onAddToCollection={onAddToCollection}
      canViewCommissions={canViewCommissions}
      ctx={ctx}
      removeAt={removeAt}
    />
  );
}
