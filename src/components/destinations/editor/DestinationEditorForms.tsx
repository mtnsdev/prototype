"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { type Destination, type EditorProductSlot, type EditorTabSection } from "@/data/destinations";
import {
  createEditorSectionFromPreset,
  DEFAULT_NEW_SECTION_PRODUCT_SLOT,
  editorProductSlotLabel,
  ensureEditorWorkspace,
  workspaceProductSlotsUsedByOtherRows,
  type EditorSectionPresetId,
} from "@/lib/destinationEditorTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CatalogSectionMultiPicker } from "@/components/destinations/editor/CatalogProductPicker";
import { KnowledgeVaultSectionFilePicker } from "@/components/destinations/editor/KnowledgeVaultSectionFilePicker";
import { applyDirectoryProductToDestination } from "@/lib/catalogProductMerge";
import { useToast } from "@/contexts/ToastContext";

const PRODUCT_SLOT_OPTIONS: { value: EditorProductSlot; label: string }[] = [
  { value: "dmc", label: "DMC partners" },
  { value: "restaurants", label: "Restaurants" },
  { value: "hotels", label: "Hotels" },
  { value: "yachts", label: "Yachts" },
  { value: "tourism", label: "Tourism" },
];

const inputAreaClass =
  "min-h-[88px] w-full rounded-md border border-input bg-inset px-3 py-2 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary/35 focus-visible:ring-[3px] focus-visible:ring-ring/30";

/** One flexible section: optional text, catalog picks, and file attachments — no fixed template. */
const PALETTE: {
  id: "palette-section";
  label: string;
  preset: EditorSectionPresetId;
  Icon: typeof Plus;
}[] = [{ id: "palette-section", label: "Section", preset: "full", Icon: Plus }];

function insertId(index: number) {
  return `insert-${index}` as const;
}

function palettePresetFromActiveId(activeId: string): EditorSectionPresetId | null {
  const row = PALETTE.find((p) => p.id === activeId);
  return row?.preset ?? null;
}

function PaletteBlock({
  item,
  onKeyboardAdd,
  layout = "row",
}: {
  item: (typeof PALETTE)[number];
  onKeyboardAdd: () => void;
  layout?: "row" | "stack";
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { kind: "palette", preset: item.preset },
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground shadow-none transition-colors",
        layout === "row" ? "flex-1 justify-center" : "w-full justify-start",
        "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        isDragging && "opacity-40",
      )}
      {...listeners}
      {...attributes}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onKeyboardAdd();
        }
      }}
    >
      <item.Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      {item.label}
    </button>
  );
}

function PaletteDragOverlayPreview({ item }: { item: (typeof PALETTE)[number] }) {
  const Icon = item.Icon;
  return (
    <div className="flex min-w-[8rem] items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium shadow-md">
      <Icon className="size-4 text-muted-foreground" aria-hidden />
      {item.label}
    </div>
  );
}

function InsertDropSlot({
  index,
  paletteDragging,
}: {
  index: number;
  paletteDragging: boolean;
}) {
  const id = insertId(index);
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { kind: "insert", index },
  });

  const show = paletteDragging || isOver;
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex min-h-[2px] items-center justify-center transition-all",
        show ? "min-h-10 py-1" : "min-h-[2px]",
      )}
    >
      <div
        className={cn(
          "w-full rounded-md border border-dashed transition-colors",
          isOver && paletteDragging
            ? "border-brand-cta bg-brand-cta/10"
            : show
              ? "border-border bg-muted/15"
              : "border-transparent",
        )}
      >
        {show ? (
          <span className="block py-2 text-center text-2xs text-muted-foreground">
            {index === 0 ? "Drop here to add at the start" : "Drop here to add"}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function SortableEditorSection({
  section: sec,
  sectionIndex: si,
  draft,
  setDraft,
  patchSection,
  patchSections,
}: {
  section: EditorTabSection;
  sectionIndex: number;
  draft: Destination;
  setDraft: Dispatch<SetStateAction<Destination>>;
  patchSection: (si: number, patch: Partial<EditorTabSection>) => void;
  patchSections: (fn: (sections: EditorTabSection[]) => void) => void;
}) {
  const toast = useToast();
  const wsSections = ensureEditorWorkspace(draft).sections;
  const slotsTakenElsewhere = useMemo(
    () => workspaceProductSlotsUsedByOtherRows(wsSections, si),
    [wsSections, si],
  );

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sec.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "z-10")}>
      <Card
        className={cn(
          "gap-0 overflow-hidden py-0 shadow-none",
          isDragging && "opacity-95 ring-1 ring-border",
        )}
      >
        <CardHeader className="flex flex-row flex-nowrap items-center gap-2 border-b border-border/80 bg-muted/15 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            className="shrink-0 cursor-grab touch-none rounded-md p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground active:cursor-grabbing"
            aria-label="Drag to reorder section"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
          <span
            className="hidden shrink-0 tabular-nums text-[10px] text-muted-foreground sm:inline"
            aria-hidden
          >
            {si + 1}
          </span>
          <div className="min-w-0 flex-1">
            <Label htmlFor={`sec-head-${sec.id}`} className="sr-only">
              Section title
            </Label>
            <Input
              id={`sec-head-${sec.id}`}
              value={sec.heading ?? ""}
              placeholder="Untitled section"
              onChange={(e) => patchSection(si, { heading: e.target.value || undefined })}
              className="h-8 border-transparent bg-transparent px-0 text-sm font-semibold text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            aria-label="Remove section"
            onClick={() =>
              patchSections((sections) => {
                const ix = sections.findIndex((s) => s.id === sec.id);
                if (ix >= 0) sections.splice(ix, 1);
              })
            }
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </CardHeader>

        <CardContent className="space-y-5 px-3 py-4 sm:px-4">
          <div className="space-y-3 rounded-lg border border-border/60 bg-background/50 p-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Catalog</Label>
              <p className="text-2xs text-muted-foreground">
                Search the product directory — items merge into this destination and surface in the advisor guide when
                this block lists them. Destination narrative is edited on the destination page (description under the
                hero).
              </p>
              <div className="space-y-1.5">
                <Label htmlFor={`sec-slot-${sec.id}`} className="text-2xs text-muted-foreground">
                  Primary list for this block
                </Label>
                <Select
                  value={sec.productSlot ?? DEFAULT_NEW_SECTION_PRODUCT_SLOT}
                  onValueChange={(value) => {
                    const next = value as EditorProductSlot;
                    const rows = ensureEditorWorkspace(draft).sections;
                    if (workspaceProductSlotsUsedByOtherRows(rows, si).has(next)) {
                      toast({
                        title: "List already in use",
                        description: `Another section already uses ${editorProductSlotLabel(next)}. Choose a different list or edit that section.`,
                        tone: "destructive",
                      });
                      return;
                    }
                    patchSection(si, { productSlot: next });
                  }}
                >
                  <SelectTrigger id={`sec-slot-${sec.id}`} className="h-9 w-full max-w-md text-sm">
                    <SelectValue placeholder="Choose list" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_SLOT_OPTIONS.map((o) => {
                      const locked =
                        slotsTakenElsewhere.has(o.value) && sec.productSlot !== o.value;
                      return (
                        <SelectItem key={o.value} value={o.value} disabled={locked}>
                          {o.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CatalogSectionMultiPicker
              onAddProducts={(products) => {
                setDraft((d0) => {
                  let d = d0;
                  let lastSlot: EditorProductSlot | undefined;
                  for (const product of products) {
                    const { destination, slot } = applyDirectoryProductToDestination(d, product);
                    d = destination;
                    lastSlot = slot;
                  }
                  const w = structuredClone(ensureEditorWorkspace(d));
                  if (lastSlot && workspaceProductSlotsUsedByOtherRows(w.sections, si).has(lastSlot)) {
                    toast({
                      title: "List already in use",
                      description: `Another section already uses ${editorProductSlotLabel(lastSlot)}.`,
                      tone: "destructive",
                    });
                    return d0;
                  }
                  const cur = w.sections[si];
                  if (cur) {
                    w.sections[si] = {
                      ...cur,
                      includeProducts: true,
                      ...(lastSlot ? { productSlot: lastSlot } : {}),
                    };
                  }
                  return { ...d, editorWorkspace: w };
                });
              }}
            />
          </div>

          <KnowledgeVaultSectionFilePicker
            value={sec.sectionFiles ?? []}
            onChange={(sectionFiles) => {
              patchSection(si, {
                sectionFiles,
                includeDocuments: sectionFiles.length > 0,
                ...(sectionFiles.length > 0 ? { documentIndices: undefined } : {}),
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export type BuildEditorContextValue = {
  draft: Destination;
  setDraft: Dispatch<SetStateAction<Destination>>;
  paletteDragging: boolean;
  appendPreset: (preset: EditorSectionPresetId) => void;
  patchSections: (fn: (sections: EditorTabSection[]) => void) => void;
  patchSection: (si: number, patch: Partial<EditorTabSection>) => void;
};

const BuildEditorContext = createContext<BuildEditorContextValue | null>(null);

function useBuildEditor() {
  const v = useContext(BuildEditorContext);
  if (!v) throw new Error("Build editor components must be used inside BuildEditorProvider");
  return v;
}

/** Safe for optional admin chrome on the destination page (returns null outside provider). */
export function useBuildEditorOptional(): BuildEditorContextValue | null {
  return useContext(BuildEditorContext);
}

/** Wraps sidebar palette + main guide; drag-and-drop connects both. */
export function BuildEditorProvider({
  draft,
  setDraft,
  children,
  /** When false, only React context is provided (no {@link DndContext}) — use for inline destination editing. */
  enableDndShell = true,
}: {
  draft: Destination;
  setDraft: Dispatch<SetStateAction<Destination>>;
  children: ReactNode;
  enableDndShell?: boolean;
}) {
  const [paletteDragging, setPaletteDragging] = useState(false);
  const [dragPaletteId, setDragPaletteId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const patchSections = useCallback(
    (fn: (sections: EditorTabSection[]) => void) => {
      setDraft((d) => {
        const w = structuredClone(ensureEditorWorkspace(d));
        fn(w.sections);
        return { ...d, editorWorkspace: w };
      });
    },
    [setDraft],
  );

  const patchSection = useCallback(
    (si: number, patch: Partial<EditorTabSection>) => {
      patchSections((sections) => {
        const cur = sections[si];
        if (cur) sections[si] = { ...cur, ...patch };
      });
    },
    [patchSections],
  );

  const appendPreset = useCallback(
    (preset: EditorSectionPresetId) => {
      patchSections((sections) => {
        sections.push(createEditorSectionFromPreset(preset));
      });
    },
    [patchSections],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setPaletteDragging(false);
      setDragPaletteId(null);

      const activeId = String(active.id);
      const overId = over ? String(over.id) : "";

      const preset = palettePresetFromActiveId(activeId);
      if (preset && overId.startsWith("insert-")) {
        const idx = parseInt(overId.slice("insert-".length), 10);
        if (!Number.isNaN(idx)) {
          patchSections((sections) => {
            sections.splice(idx, 0, createEditorSectionFromPreset(preset));
          });
        }
        return;
      }

      if (!over || activeId === overId) return;

      patchSections((sections) => {
        const ids = sections.map((s) => s.id);
        if (!ids.includes(activeId) || !ids.includes(overId)) return;
        const oldIndex = sections.findIndex((s) => s.id === activeId);
        const newIndex = sections.findIndex((s) => s.id === overId);
        if (oldIndex < 0 || newIndex < 0) return;
        const next = arrayMove(sections, oldIndex, newIndex);
        sections.length = 0;
        sections.push(...next);
      });
    },
    [patchSections],
  );

  const ctx = useMemo(
    (): BuildEditorContextValue => ({
      draft,
      setDraft,
      paletteDragging,
      appendPreset,
      patchSections,
      patchSection,
    }),
    [draft, setDraft, paletteDragging, appendPreset, patchSections, patchSection],
  );

  const dragOverlayItem = dragPaletteId ? PALETTE.find((p) => p.id === dragPaletteId) : undefined;

  if (!enableDndShell) {
    return <BuildEditorContext.Provider value={ctx}>{children}</BuildEditorContext.Provider>;
  }

  return (
    <BuildEditorContext.Provider value={ctx}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => {
          const id = String(active.id);
          if (id.startsWith("palette-")) {
            setPaletteDragging(true);
            setDragPaletteId(id);
          }
        }}
        onDragCancel={() => {
          setPaletteDragging(false);
          setDragPaletteId(null);
        }}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {dragOverlayItem ? <PaletteDragOverlayPreview item={dragOverlayItem} /> : null}
        </DragOverlay>
      </DndContext>
    </BuildEditorContext.Provider>
  );
}

/** Palette for adding blocks; must be inside BuildEditorProvider. */
export function BuildPaletteToolbar() {
  const { appendPreset } = useBuildEditor();
  return (
    <div className="space-y-2">
      <p className="text-2xs text-muted-foreground">Add a block, then set text, directory picks, and files as needed.</p>
      <div className="flex flex-row flex-wrap gap-2" role="toolbar" aria-label="Add section">
        {PALETTE.map((item) => (
          <PaletteBlock
            key={item.id}
            item={item}
            layout="row"
            onKeyboardAdd={() => appendPreset(item.preset)}
          />
        ))}
      </div>
    </div>
  );
}

/** Drop zones + section list; must be inside BuildEditorProvider. */
export function BuildGuideCanvas() {
  const { draft, setDraft, paletteDragging, patchSection, patchSections } = useBuildEditor();
  const ws = ensureEditorWorkspace(draft);
  const sectionIds = ws.sections.map((s) => s.id);

  return (
    <div className="rounded-xl border border-border/70 bg-background/30 p-2 sm:p-3">
      <InsertDropSlot index={0} paletteDragging={paletteDragging} />
      {ws.sections.length === 0 ? (
        <p className="px-2 py-4 text-center text-sm text-muted-foreground">
          Use <span className="font-medium text-foreground">Section</span> above or drop on a line to add a block.
        </p>
      ) : null}
      <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
        {ws.sections.map((sec, si) => (
          <div key={sec.id} className="space-y-1">
            <SortableEditorSection
              section={sec}
              sectionIndex={si}
              draft={draft}
              setDraft={setDraft}
              patchSection={patchSection}
              patchSections={patchSections}
            />
            <InsertDropSlot index={si + 1} paletteDragging={paletteDragging} />
          </div>
        ))}
      </SortableContext>
    </div>
  );
}

