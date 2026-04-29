"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
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
import { FilePlus } from "lucide-react";
import type { DirectoryProduct } from "@/types/product-directory";
import type { Destination, DestinationDocument, EditorProductSlot } from "@/data/destinations";
import { getMockDocuments } from "@/components/knowledge-vault/knowledgeVaultMockData";
import { useBuildEditorOptional } from "@/components/destinations/editor/DestinationEditorForms";
import { ensureEditorWorkspace } from "@/lib/destinationEditorTabs";
import { applyDirectoryProductToDestination } from "@/lib/catalogProductMerge";
import { getDestinationCatalogBundles } from "@/lib/destinationUnifiedCatalog";
import type { ProductListItem } from "@/lib/destinationSectionModel";
import { searchCatalogProducts } from "@/lib/catalogPickerSource";
import { resolveAdvisorCatalogFromStorage } from "@/components/products/productDirectoryCatalogResolve";
import { useUser } from "@/contexts/UserContext";
import { useProductDirectoryCatalog } from "@/components/products/ProductDirectoryCatalogContext";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  workspaceIndex: number;
  sectionTitle: string;
  onClose: () => void;
};

/* ——— Product helpers ——— */

function resolveProductsForSection(
  d: Destination,
  slot?: EditorProductSlot,
): ProductListItem[] {
  if (!slot) return [];
  const cat = getDestinationCatalogBundles(d);
  if (slot === "dmc") {
    return cat.dmcPartners.map((p) => ({
      productId: p.productId,
      name: p.name,
      url: p.website,
      productKind: "dmc" as const,
    }));
  }
  if (slot === "hotels") {
    const items: ProductListItem[] = [];
    for (const list of Object.values(cat.hotels)) {
      for (const h of list) {
        items.push({
          productId: h.productId,
          name: h.name,
          url: h.url,
          productKind: "hotel" as const,
        });
      }
    }
    return items;
  }
  if (slot === "restaurants") {
    const items: ProductListItem[] = [];
    for (const list of Object.values(cat.restaurants)) {
      for (const r of list) {
        items.push({
          productId: r.productId,
          name: r.name,
          url: r.url,
          productKind: "restaurant" as const,
        });
      }
    }
    return items;
  }
  if (slot === "yachts") {
    return (cat.yachtCompanies ?? []).map((y) => ({
      productId: y.productId,
      name: y.name,
      url: y.url,
      productKind: "yacht" as const,
    }));
  }
  return [];
}

/* ——— Sortable product row ——— */

function SortableProductRow({
  id,
  name,
  onRemove,
}: {
  id: string;
  name: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/eprow flex items-center gap-2 rounded-md px-1.5 py-1.5",
        isDragging && "z-20 bg-muted/80 opacity-90",
      )}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab touch-none text-muted-foreground/30 hover:text-muted-foreground/60 active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" aria-hidden>
          <circle cx="2" cy="2" r="1.1" /><circle cx="6" cy="2" r="1.1" />
          <circle cx="2" cy="6" r="1.1" /><circle cx="6" cy="6" r="1.1" />
          <circle cx="2" cy="10" r="1.1" /><circle cx="6" cy="10" r="1.1" />
        </svg>
      </button>
      <span className="min-w-0 flex-1 truncate text-xs text-foreground">{name}</span>
      <button
        type="button"
        className="shrink-0 rounded p-0.5 text-muted-foreground/30 opacity-0 transition-opacity hover:text-destructive group-hover/eprow:opacity-100"
        aria-label={`Remove ${name}`}
        onClick={onRemove}
      >
        <X className="size-3" aria-hidden />
      </button>
    </div>
  );
}

/* ——— Advisor product pool (same as CatalogProductPicker) ——— */

function useAdvisorPool() {
  const { user, isLoading } = useUser();
  const { catalogRevision } = useProductDirectoryCatalog();
  return useMemo(() => {
    if (isLoading || !user) return undefined;
    const uid = String(user.id);
    const name = user.username?.trim() || user.email?.split("@")[0] || "You";
    return resolveAdvisorCatalogFromStorage(uid, name).products;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, catalogRevision]);
}

/* ——— Main component ——— */

export function SectionEditPanel({ workspaceIndex: wi, sectionTitle, onClose }: Props) {
  const ctx = useBuildEditorOptional();
  const [searchQ, setSearchQ] = useState("");
  const pool = useAdvisorPool();

  if (!ctx) return null;

  const ws = ensureEditorWorkspace(ctx.draft);
  const row = ws.sections[wi];
  if (!row) return null;

  const slot = row.productSlot;
  const products = resolveProductsForSection(ctx.draft, slot);
  const hasText = row.includeText;
  const hasFiles = row.includeDocuments;
  const files = row.sectionFiles ?? [];

  return (
    <div className="rounded-xl border border-border bg-card/80">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
        <button
          type="button"
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          onClick={onClose}
          aria-label="Back to sections"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </button>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {sectionTitle}
        </span>
        <button
          type="button"
          className="shrink-0 rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          onClick={onClose}
        >
          Done
        </button>
      </div>

      {/* Products */}
      <ProductsBlock
        products={products}
        slot={slot}
        workspaceIndex={wi}
        searchQ={searchQ}
        setSearchQ={setSearchQ}
        pool={pool}
      />

      {/* Text */}
      <TextBlock workspaceIndex={wi} hasText={hasText} textBody={row.textBody} />

      {/* Files */}
      <FilesBlock workspaceIndex={wi} hasFiles={hasFiles} files={files} />

      {/* Empty state: add content buttons if nothing exists */}
      {!row.includeProducts && !hasText && !hasFiles ? (
        <EmptyState workspaceIndex={wi} />
      ) : null}
    </div>
  );
}

/* ——— Products block ——— */

function ProductsBlock({
  products,
  slot,
  workspaceIndex: wi,
  searchQ,
  setSearchQ,
  pool,
}: {
  products: ProductListItem[];
  slot?: EditorProductSlot;
  workspaceIndex: number;
  searchQ: string;
  setSearchQ: (q: string) => void;
  pool: DirectoryProduct[] | undefined;
}) {
  const ctx = useBuildEditorOptional();
  const searchResults = useMemo(
    () => (searchQ.trim() ? searchCatalogProducts(searchQ, [], pool) : []),
    [searchQ, pool],
  );

  const productIds = useMemo(
    () => products.map((p, i) => p.productId ?? `idx-${i}`),
    [products],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!ctx || !slot) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = productIds.indexOf(String(active.id));
      const newIndex = productIds.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;

      ctx.setDraft((d) => {
        if (slot === "dmc") return { ...d, dmcPartners: arrayMove([...d.dmcPartners], oldIndex, newIndex) };
        if (slot === "yachts") return { ...d, yachtCompanies: arrayMove([...(d.yachtCompanies ?? [])], oldIndex, newIndex) };
        if (slot === "restaurants") {
          const flat: Array<{ region: string; item: (typeof d.restaurants)[string][number] }> = [];
          for (const [region, list] of Object.entries(d.restaurants)) {
            for (const item of list) flat.push({ region, item });
          }
          const moved = arrayMove(flat, oldIndex, newIndex);
          const next: typeof d.restaurants = {};
          for (const { region, item } of moved) {
            (next[region] ??= []).push(item);
          }
          return { ...d, restaurants: next };
        }
        if (slot === "hotels") {
          const flat: Array<{ group: string; item: (typeof d.hotels)[string][number] }> = [];
          for (const [group, list] of Object.entries(d.hotels)) {
            for (const item of list) flat.push({ group, item });
          }
          const moved = arrayMove(flat, oldIndex, newIndex);
          const next: typeof d.hotels = {};
          for (const { group, item } of moved) {
            (next[group] ??= []).push(item);
          }
          return { ...d, hotels: next };
        }
        return d;
      });
    },
    [ctx, slot, productIds],
  );

  const removeAt = useCallback(
    (flatIndex: number) => {
      if (!ctx || !slot) return;
      ctx.setDraft((d) => {
        if (slot === "dmc") return { ...d, dmcPartners: d.dmcPartners.filter((_, i) => i !== flatIndex) };
        if (slot === "yachts") return { ...d, yachtCompanies: (d.yachtCompanies ?? []).filter((_, i) => i !== flatIndex) };
        if (slot === "restaurants") {
          let idx = 0;
          const next: typeof d.restaurants = {};
          for (const [region, list] of Object.entries(d.restaurants)) {
            next[region] = list.filter(() => idx++ !== flatIndex);
          }
          return { ...d, restaurants: next };
        }
        if (slot === "hotels") {
          let idx = 0;
          const next: typeof d.hotels = {};
          for (const [group, list] of Object.entries(d.hotels)) {
            next[group] = list.filter(() => idx++ !== flatIndex);
          }
          return { ...d, hotels: next };
        }
        return d;
      });
    },
    [ctx, slot],
  );

  const addProduct = useCallback(
    (product: DirectoryProduct) => {
      if (!ctx) return;
      ctx.setDraft((d0) => {
        const { destination, slot: newSlot } = applyDirectoryProductToDestination(d0, product);
        // Ensure section points to the right slot
        const w = structuredClone(ensureEditorWorkspace(destination));
        const cur = w.sections[wi];
        if (cur) {
          w.sections[wi] = { ...cur, includeProducts: true, productSlot: newSlot || cur.productSlot };
        }
        return { ...destination, editorWorkspace: w };
      });
      setSearchQ("");
    },
    [ctx, wi, setSearchQ],
  );

  return (
    <div className="border-b border-border/40 px-3 py-3">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Products{products.length > 0 ? ` (${products.length})` : ""}
      </p>

      {/* Search to add */}
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" aria-hidden />
        <Input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search catalog to add…"
          className="h-8 pl-7 text-xs"
        />
      </div>

      {/* Search results dropdown */}
      {searchResults.length > 0 ? (
        <div className="mb-2 max-h-32 overflow-y-auto rounded-md border border-border/60 bg-background">
          {searchResults.slice(0, 8).map((p) => (
            <button
              key={p.id}
              type="button"
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted/60"
              onClick={() => addProduct(p)}
            >
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{p.name}</span>
              {p.location ? (
                <span className="shrink-0 truncate text-[10px] text-muted-foreground">{p.location}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {/* Current products list */}
      {products.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={productIds} strategy={verticalListSortingStrategy}>
            <div className="max-h-48 overflow-y-auto">
              {products.map((p, i) => (
                <SortableProductRow
                  key={p.productId ?? `idx-${i}`}
                  id={p.productId ?? `idx-${i}`}
                  name={p.name}
                  onRemove={() => removeAt(i)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="py-3 text-center text-xs text-muted-foreground/70">
          No products yet. Search above to add from your catalog.
        </p>
      )}
    </div>
  );
}

/* ——— Text block ——— */

function TextBlock({
  workspaceIndex: wi,
  hasText,
  textBody,
}: {
  workspaceIndex: number;
  hasText: boolean;
  textBody?: string;
}) {
  const ctx = useBuildEditorOptional();
  if (!ctx) return null;

  if (!hasText) {
    return (
      <div className="border-b border-border/40 px-3 py-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Text</p>
          <button
            type="button"
            className="text-[11px] font-medium text-brand-cta"
            onClick={() => ctx.patchSection(wi, { includeText: true, textBody: "" })}
          >
            + Add
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border/40 px-3 py-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Text</p>
        <button
          type="button"
          className="text-[11px] text-muted-foreground/60 hover:text-destructive"
          onClick={() => ctx.patchSection(wi, { includeText: false, textBody: undefined })}
        >
          Remove
        </button>
      </div>
      <textarea
        value={textBody ?? ""}
        onChange={(e) => ctx.patchSection(wi, { textBody: e.target.value })}
        rows={3}
        className="w-full resize-y rounded-md border border-border/60 bg-background px-2.5 py-2 text-xs leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-brand-cta/40"
        placeholder="Add descriptive text for this section…"
      />
    </div>
  );
}

/* ——— Files block ——— */

function fileTypeFromMime(fileType: string): DestinationDocument["type"] {
  const ft = fileType.toLowerCase();
  if (ft.includes("pdf")) return "pdf";
  if (ft.includes("spreadsheet") || ft.includes("xlsx") || ft.includes("excel")) return "xlsx";
  if (ft.includes("presentation") || ft.includes("pptx") || ft.includes("slide")) return "pptx";
  return "docx";
}

function FilesBlock({
  workspaceIndex: wi,
  hasFiles,
  files,
}: {
  workspaceIndex: number;
  hasFiles: boolean;
  files: Destination["documents"];
}) {
  const ctx = useBuildEditorOptional();
  const [fileSearchQ, setFileSearchQ] = useState("");

  const fileSearchResults = useMemo(() => {
    if (!fileSearchQ.trim()) return [];
    const q = fileSearchQ.toLowerCase();
    const existingIds = new Set(files.map((f) => f.kvDocumentId).filter(Boolean));
    return getMockDocuments()
      .filter(
        (d) =>
          !existingIds.has(d.id) &&
          (d.title.toLowerCase().includes(q) ||
            d.tags.some((t) => t.toLowerCase().includes(q))),
      )
      .slice(0, 8);
  }, [fileSearchQ, files]);

  if (!ctx) return null;

  if (!hasFiles) {
    return (
      <div className="px-3 py-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Files</p>
          <button
            type="button"
            className="text-[11px] font-medium text-brand-cta"
            onClick={() => ctx.patchSection(wi, { includeDocuments: true, sectionFiles: [] })}
          >
            + Add
          </button>
        </div>
      </div>
    );
  }

  const addFile = (doc: { id: string; title: string; file_type: string }) => {
    const entry: DestinationDocument = {
      name: doc.title,
      type: fileTypeFromMime(doc.file_type),
      kvDocumentId: doc.id,
    };
    ctx.patchSection(wi, { sectionFiles: [...files, entry] });
    setFileSearchQ("");
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    ctx.patchSection(wi, { sectionFiles: next });
  };

  return (
    <div className="px-3 py-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Files{files.length > 0 ? ` (${files.length})` : ""}
        </p>
        <button
          type="button"
          className="text-[11px] text-muted-foreground/60 hover:text-destructive"
          onClick={() => ctx.patchSection(wi, { includeDocuments: false, sectionFiles: undefined })}
        >
          Remove
        </button>
      </div>

      {/* Search to add files from Knowledge Vault */}
      <div className="relative mb-2">
        <FilePlus className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" aria-hidden />
        <Input
          value={fileSearchQ}
          onChange={(e) => setFileSearchQ(e.target.value)}
          placeholder="Search Knowledge Vault to attach…"
          className="h-8 pl-7 text-xs"
        />
      </div>

      {/* Search results dropdown */}
      {fileSearchResults.length > 0 ? (
        <div className="mb-2 max-h-32 overflow-y-auto rounded-md border border-border/60 bg-background">
          {fileSearchResults.map((d) => (
            <button
              key={d.id}
              type="button"
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted/60"
              onClick={() => addFile(d)}
            >
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{d.title}</span>
              <span className="shrink-0 text-[10px] uppercase text-muted-foreground/60">{d.file_type}</span>
            </button>
          ))}
        </div>
      ) : null}

      {/* Current files list */}
      {files.length > 0 ? (
        <div className="space-y-0.5">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="group/frow flex items-center gap-2 rounded-md px-1.5 py-1.5">
              <span className="min-w-0 flex-1 truncate text-xs text-foreground">{f.name}</span>
              <span className="shrink-0 text-[10px] uppercase text-muted-foreground/60">{f.type}</span>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-muted-foreground/30 opacity-0 transition-opacity hover:text-destructive group-hover/frow:opacity-100"
                onClick={() => removeFile(i)}
                aria-label={`Remove ${f.name}`}
              >
                <X className="size-3" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-2 text-center text-xs text-muted-foreground/70">
          No files attached. Search above to add from the Knowledge Vault.
        </p>
      )}
    </div>
  );
}

/* ——— Empty state ——— */

function EmptyState({ workspaceIndex: wi }: { workspaceIndex: number }) {
  const ctx = useBuildEditorOptional();
  if (!ctx) return null;

  return (
    <div className="px-3 py-6 text-center">
      <p className="mb-3 text-xs text-muted-foreground">
        This section is empty. Start adding content:
      </p>
      <div className="flex justify-center gap-2">
        <button
          type="button"
          className="rounded-md border border-dashed border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:border-border hover:text-foreground"
          onClick={() => ctx.patchSection(wi, { includeProducts: true })}
        >
          + Products
        </button>
        <button
          type="button"
          className="rounded-md border border-dashed border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:border-border hover:text-foreground"
          onClick={() => ctx.patchSection(wi, { includeText: true, textBody: "" })}
        >
          + Text
        </button>
        <button
          type="button"
          className="rounded-md border border-dashed border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:border-border hover:text-foreground"
          onClick={() => ctx.patchSection(wi, { includeDocuments: true, sectionFiles: [] })}
        >
          + Files
        </button>
      </div>
    </div>
  );
}
