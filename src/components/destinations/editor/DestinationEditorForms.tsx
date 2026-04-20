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
import { FileStack, FileText, GripVertical, Package, Trash2 } from "lucide-react";
import {
  type Destination,
  type DestinationDocument,
  type EditorProductSlot,
  type EditorTabSection,
} from "@/data/destinations";
import {
  createEditorSectionFromPreset,
  DEFAULT_NEW_SECTION_PRODUCT_SLOT,
  ensureEditorWorkspace,
  type EditorSectionPresetId,
} from "@/lib/destinationEditorTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CatalogSectionMultiPicker } from "@/components/destinations/editor/CatalogProductPicker";
import { applyDirectoryProductToDestination } from "@/lib/catalogProductMerge";

const inputAreaClass =
  "min-h-[88px] w-full rounded-md border border-input bg-inset px-3 py-2 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary/35 focus-visible:ring-[3px] focus-visible:ring-ring/30";

const PALETTE: {
  id: "palette-catalog" | "palette-text" | "palette-files";
  label: string;
  preset: EditorSectionPresetId;
  Icon: typeof Package;
}[] = [
  { id: "palette-catalog", label: "Catalog", preset: "catalog", Icon: Package },
  { id: "palette-text", label: "Text", preset: "text", Icon: FileText },
  { id: "palette-files", label: "Files", preset: "documents", Icon: FileStack },
];

function insertId(index: number) {
  return `insert-${index}` as const;
}

function palettePresetFromActiveId(activeId: string): EditorSectionPresetId | null {
  const row = PALETTE.find((p) => p.id === activeId);
  return row?.preset ?? null;
}

function sectionBlockKind(sec: EditorTabSection): "catalog" | "text" | "files" | "mixed" {
  const n = [sec.includeProducts, sec.includeText, sec.includeDocuments].filter(Boolean).length;
  if (n > 1) return "mixed";
  if (sec.includeProducts) return "catalog";
  if (sec.includeText) return "text";
  if (sec.includeDocuments) return "files";
  return "mixed";
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

function SectionDocumentPicker({
  documents,
  value,
  onChange,
}: {
  documents: DestinationDocument[];
  value: number[] | undefined;
  onChange: (next: number[] | undefined) => void;
}) {
  const raw = value;

  const isIncluded = (i: number) => {
    if (raw === undefined) return true;
    return raw.includes(i);
  };

  const toggle = (index: number) => {
    const nn = documents.length;
    let documentIndices: number[] | undefined;

    if (raw === undefined) {
      const next = documents.map((_, j) => j).filter((j) => j !== index);
      if (next.length === 0) documentIndices = [];
      else if (next.length === nn) documentIndices = undefined;
      else documentIndices = next;
    } else if (raw.length === 0) {
      documentIndices = [index];
    } else {
      const s = new Set(raw);
      if (s.has(index)) s.delete(index);
      else s.add(index);
      const arr = [...s].sort((a, b) => a - b);
      if (arr.length === 0) documentIndices = [];
      else if (arr.length === nn) documentIndices = undefined;
      else documentIndices = arr;
    }
    onChange(documentIndices);
  };

  if (documents.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
        Upload files on this destination first, then pick which appear in this section.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-foreground">Files in this section</p>
      <ul className="space-y-2">
        {documents.map((doc, i) => (
          <li key={`${doc.name}-${i}`}>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card/40 px-3 py-2">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 rounded border border-input bg-inset"
                checked={isIncluded(i)}
                onChange={() => toggle(i)}
              />
              <span className="min-w-0 flex-1 text-sm text-foreground">
                <span className="font-medium">{doc.name}</span>
                <span className="ml-2 text-2xs uppercase text-muted-foreground">{doc.type}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sec.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const kind = sectionBlockKind(sec);

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

        <CardContent className="space-y-4 px-3 py-4 sm:px-4">
          {(kind === "catalog" || kind === "mixed") && sec.includeProducts ? (
            <div className="space-y-3 rounded-lg border border-border/60 bg-background/50 p-3">
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
                    const cur = w.sections[si];
                    if (cur && lastSlot) {
                      w.sections[si] = { ...cur, productSlot: lastSlot };
                    }
                    return { ...d, editorWorkspace: w };
                  });
                }}
              />
            </div>
          ) : null}

          {(kind === "text" || kind === "mixed") && sec.includeText ? (
            <div className="space-y-1.5">
              <Label htmlFor={`sec-txt-${sec.id}`} className="text-xs text-muted-foreground">
                Text
              </Label>
              <textarea
                id={`sec-txt-${sec.id}`}
                className={inputAreaClass}
                rows={5}
                value={sec.textBody ?? ""}
                onChange={(e) => patchSection(si, { textBody: e.target.value })}
            />
          </div>
        ) : null}

          {(kind === "files" || kind === "mixed") && sec.includeDocuments ? (
            <SectionDocumentPicker
              documents={draft.documents}
              value={sec.documentIndices}
              onChange={(documentIndices) => patchSection(si, { documentIndices })}
            />
          ) : null}

        </CardContent>
      </Card>
    </div>
  );
}

type BuildEditorContextValue = {
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

/** Wraps sidebar palette + main guide; drag-and-drop connects both. */
export function BuildEditorProvider({
  draft,
  setDraft,
  children,
}: {
  draft: Destination;
  setDraft: Dispatch<SetStateAction<Destination>>;
  children: ReactNode;
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
      <p className="text-2xs leading-snug text-muted-foreground">
        Drag into the guide below, or press Enter on a control to add.
      </p>
      <div className="flex flex-row flex-wrap gap-2" role="toolbar" aria-label="Section blocks">
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
      <p className="mb-2 px-1 text-2xs font-medium uppercase tracking-wide text-muted-foreground">Guide</p>
      <InsertDropSlot index={0} paletteDragging={paletteDragging} />
      {ws.sections.length === 0 ? (
        <p className="px-2 py-4 text-center text-sm text-muted-foreground">
          Drop Catalog, Text, or Files on the dashed line to add a section.
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

export function EditorOverview({
  draft,
  setDraft,
}: {
  draft: Destination;
  setDraft: Dispatch<SetStateAction<Destination>>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dest-name">Destination name</Label>
        <Input
          id="dest-name"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dest-tagline">Tagline</Label>
        <Input
          id="dest-tagline"
          value={draft.tagline}
          onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dest-hero">Hero image URL</Label>
        <Input
          id="dest-hero"
          type="url"
          inputMode="url"
          placeholder="https://…"
          value={draft.heroImage}
          onChange={(e) => setDraft((d) => ({ ...d, heroImage: e.target.value }))}
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dest-desc">Description</Label>
        <textarea
          id="dest-desc"
          className={inputAreaClass}
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          rows={4}
        />
      </div>
    </div>
  );
}
