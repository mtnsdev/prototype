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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical, Trash2, ImageOff } from "lucide-react";
import type { VirtualProductListSection, ProductListItem } from "@/lib/destinationSectionModel";
import { useBuildEditorOptional } from "@/components/destinations/editor/DestinationEditorForms";
import { usePermissions } from "@/hooks/usePermissions";
import { stableItemId } from "@/lib/stableDestinationIds";
import { logDestinationEvent } from "@/lib/destinationAnalytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
// destMuted/destMuted2 no longer needed — colors inlined for tighter control

type Props = {
  section: VirtualProductListSection;
  destinationSlug: string;
  /** Page-level active tag filters (union: show items matching any). Empty set = show all. */
  activeTagFilters?: ReadonlySet<string>;
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

function SortableRow({ id, admin, children }: { id: string; admin: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={cn("relative flex", isDragging && "z-20 opacity-95")}>
      {admin ? (
        <button
          type="button"
          className="mt-2 shrink-0 cursor-grab touch-none px-0.5 text-muted-foreground/30 opacity-0 transition-opacity hover:text-muted-foreground/60 active:cursor-grabbing group-hover/prow:opacity-100"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Extract a favicon/logo URL from a product website URL. */
function productThumbnailUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const domain = new URL(url).hostname;
    // Google S2 favicon service — returns high-res favicons
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
}

/** Extract initials from a product name (first letter of first two words). */
function productInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0]![0]! + words[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function ProductThumbnail({ url, name }: { url?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const src = productThumbnailUrl(url);

  if (!src || failed) {
    return (
      <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-muted/60 text-sm font-medium text-muted-foreground/70">
        {productInitials(name)}
      </div>
    );
  }

  return (
    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted/40">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="size-full object-contain p-1.5"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function ProductRow({
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
        "group/prow relative flex scroll-mt-28 items-start gap-3 px-1 py-3",
        !isLast && "border-b border-border/50",
      )}
    >
      <ProductThumbnail url={item.url} name={item.name} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
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
              className="inline-flex items-baseline gap-1 text-sm font-medium text-foreground underline-offset-4 hover:text-brand-cta hover:underline"
            >
              {item.name}
              <ExternalLink className="size-3 shrink-0 translate-y-px opacity-0 transition-opacity group-hover/prow:opacity-60" aria-hidden />
            </a>
          ) : (
            <span className="text-sm font-medium text-foreground">{item.name}</span>
          )}
          {item.pill ? (
            <span className="rounded-full border border-border/60 bg-muted/30 px-1.5 py-px text-[11px] text-muted-foreground">
              {item.pill}
            </span>
          ) : null}
          {item.tags?.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border/40 px-1.5 py-px text-[11px] text-muted-foreground/80"
            >
              {tag}
            </span>
          ))}
          {item.catalogUnavailable ? (
            <span className="text-[10px] text-muted-foreground/70">
              Unavailable
            </span>
          ) : null}
        </div>
        {item.meta ? <p className="mt-0.5 text-xs text-muted-foreground">{item.meta}</p> : null}
        {item.note ? <p className="mt-0.5 text-xs text-muted-foreground/80 line-clamp-2">{item.note}</p> : null}
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

export function ProductListSection({ section, destinationSlug, activeTagFilters }: Props) {
  const ctx = useBuildEditorOptional();
  const { isAdmin } = usePermissions();
  const admin = isAdmin && ctx != null;

  const items = section.items;

  const filteredItems = useMemo(() => {
    if (!activeTagFilters || activeTagFilters.size === 0) return items;
    return items.filter((item) => item.tags?.some((t) => activeTagFilters.has(t)));
  }, [items, activeTagFilters]);

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

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!ctx) return;
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

  const content = (
    <div className="overflow-hidden">
      <ul>
        {filteredItems.map((item, i) => {
          const key = item.productId ?? `${item.name}-${i}`;
          const itemId = stableItemId(destinationSlug, section.id, key);
          const isLast = i === filteredItems.length - 1;
          const flatIndex = items.indexOf(item);

          const row = (
            <ProductRow
              item={item}
              itemId={itemId}
              destinationSlug={destinationSlug}
              isLast={isLast}
              admin={admin}
              onRemove={admin ? () => removeAt(flatIndex) : undefined}
            />
          );

          if (admin) {
            return (
              <SortableRow key={itemId} id={itemId} admin>
                {row}
              </SortableRow>
            );
          }
          return <div key={itemId}>{row}</div>;
        })}
      </ul>
      {activeTagFilters && activeTagFilters.size > 0 && filteredItems.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          No items match the selected filters.
        </p>
      ) : null}
    </div>
  );

  if (!admin) return content;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={sortIds} strategy={verticalListSortingStrategy}>
        {content}
      </SortableContext>
    </DndContext>
  );
}
