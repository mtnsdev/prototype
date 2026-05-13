"use client";

import { useMemo } from "react";
import {
  Building,
  FileText,
  GripVertical,
  MoreVertical,
  Package,
  Paperclip,
  Sailboat,
  Trash2,
  Utensils,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { EditorProductSlot, EditorSliceKind, EditorTabSection } from "@/data/destinations";
import { useBuildEditorOptional } from "@/components/destinations/editor/DestinationEditorForms";
import { usePermissions } from "@/hooks/usePermissions";
import { ensureEditorWorkspace } from "@/lib/destinationEditorTabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function MenuSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pl-8 pr-2 pb-1 pt-1.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

/**
 * Unified content-row used inside the section kebab.
 *
 * - Not added: behaves like a normal menu item that adds the block.
 * - Added: shows an "Added" badge plus an inline remove (X) button. Clicking
 *   anywhere else on the row is a no-op.
 */
function ContentRow({
  icon: Icon,
  label,
  added,
  onAdd,
  onRemove,
}: {
  icon: LucideIcon;
  label: string;
  added: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  if (!added) {
    return (
      <DropdownMenuItem onSelect={onAdd}>
        <Icon className="size-3.5" aria-hidden />
        <span>{label}</span>
      </DropdownMenuItem>
    );
  }
  return (
    <DropdownMenuItem
      onSelect={(e) => e.preventDefault()}
      className="data-[highlighted]:bg-transparent"
    >
      <Icon className="size-3.5" aria-hidden />
      <span>{label}</span>
      <span className="ml-auto text-[10px] text-muted-foreground">Added</span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`Remove ${label}`}
        className="inline-flex size-5 items-center justify-center rounded text-muted-foreground/70 hover:bg-foreground/10 hover:text-destructive"
      >
        <X className="size-3" aria-hidden />
      </button>
    </DropdownMenuItem>
  );
}

const PRODUCT_SLOT_OPTIONS: Array<{ slot: EditorProductSlot; label: string; icon: LucideIcon }> = [
  { slot: "dmc", label: "DMC partners", icon: Building },
  { slot: "restaurants", label: "Restaurants", icon: Utensils },
  { slot: "hotels", label: "Hotels", icon: Building },
  { slot: "yachts", label: "Yacht companies", icon: Sailboat },
  { slot: "tourism", label: "Tourism contacts", icon: Users },
];

/**
 * Card-level admin controls (one per workspace row) — single kebab menu that
 * lets admins add or remove blocks (text / attachments / products) and remove
 * the whole section.
 *
 * Renders nothing when the viewer isn't admin or no editor context is available.
 */
export function RowCardAdminControls({
  workspaceIndex,
}: {
  workspaceIndex: number;
}) {
  const ctx = useBuildEditorOptional();
  const { isAdmin } = usePermissions();

  const row: EditorTabSection | null = useMemo(() => {
    if (!ctx) return null;
    return ensureEditorWorkspace(ctx.draft).sections[workspaceIndex] ?? null;
  }, [ctx, workspaceIndex]);

  if (!isAdmin || !ctx || !row) return null;

  const addText = () =>
    ctx.patchSection(workspaceIndex, {
      includeText: true,
      textBody: row.textBody ?? "",
      sliceOrder: appendSlice(row.sliceOrder, "text"),
    });

  const addFiles = () =>
    ctx.patchSection(workspaceIndex, {
      includeDocuments: true,
      sectionFiles: row.sectionFiles ?? [],
      sliceOrder: appendSlice(row.sliceOrder, "documents"),
    });

  const addProducts = (slot: EditorProductSlot) =>
    ctx.patchSection(workspaceIndex, {
      includeProducts: true,
      productSlot: slot,
      sliceOrder: appendSlice(row.sliceOrder, "products"),
    });

  const removeSection = () => {
    if (!window.confirm("Remove this section and all its content?")) return;
    ctx.patchSections((sections) => {
      if (workspaceIndex >= 0 && workspaceIndex < sections.length) {
        sections.splice(workspaceIndex, 1);
      }
    });
  };

  const removeText = () =>
    ctx.patchSection(workspaceIndex, {
      includeText: false,
      textBody: undefined,
      sliceOrder: dropSlice(row.sliceOrder, "text"),
    });

  const removeFiles = () =>
    ctx.patchSection(workspaceIndex, {
      includeDocuments: false,
      sectionFiles: undefined,
      documentIndices: undefined,
      sliceOrder: dropSlice(row.sliceOrder, "documents"),
    });

  const removeProducts = () =>
    ctx.patchSection(workspaceIndex, {
      includeProducts: false,
      productSlot: undefined,
      sliceOrder: dropSlice(row.sliceOrder, "products"),
    });

  const hasText = row.includeText;
  const hasFiles = row.includeDocuments;
  const hasProducts = row.includeProducts;

  return (
    <div className="flex shrink-0 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            aria-label="Section options"
          >
            <MoreVertical className="size-3.5" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <ContentRow
            icon={FileText}
            label="Text block"
            added={hasText}
            onAdd={addText}
            onRemove={removeText}
          />
          <ContentRow
            icon={Paperclip}
            label="Attachments"
            added={hasFiles}
            onAdd={addFiles}
            onRemove={removeFiles}
          />
          {hasProducts ? (
            <ContentRow
              icon={Package}
              label="Product list"
              added
              onAdd={() => {}}
              onRemove={removeProducts}
            />
          ) : (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Package className="size-3.5" aria-hidden />
                <span>Product list</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-52">
                <MenuSectionLabel>Pick a catalog</MenuSectionLabel>
                {PRODUCT_SLOT_OPTIONS.map(({ slot, label, icon: Icon }) => (
                  <DropdownMenuItem key={slot} onSelect={() => addProducts(slot)}>
                    <Icon className="size-3.5" aria-hidden />
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={removeSection} className="text-destructive focus:text-destructive">
            <Trash2 className="size-3.5" aria-hidden />
            Remove section
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Hover-revealed drag handle floating at the left edge of a slice. Bound to
 * dnd-kit listeners by the parent `SortableSlice`. Admin-only.
 */
export function SliceDragHandle({
  dragHandleProps,
}: {
  /** Attach dnd-kit `attributes` + `listeners` to make the handle draggable. */
  dragHandleProps: Record<string, unknown>;
}) {
  const ctx = useBuildEditorOptional();
  const { isAdmin } = usePermissions();
  if (!isAdmin || !ctx) return null;

  return (
    <button
      type="button"
      aria-label="Drag to reorder block"
      className="absolute -left-6 top-1 hidden cursor-grab rounded p-0.5 text-muted-foreground/50 transition-opacity hover:text-muted-foreground active:cursor-grabbing sm:flex sm:opacity-0 sm:group-hover/slice:opacity-100"
      {...dragHandleProps}
    >
      <GripVertical className="size-3.5" aria-hidden />
    </button>
  );
}

/**
 * Inline `+ Add content` menu used by the empty-state placeholder for workspace rows that have zero enabled slices
 * (e.g. just-created via the sidebar `+ New section` action).
 */
export function EmptySectionAddMenu({
  workspaceIndex,
  row,
}: {
  workspaceIndex: number;
  row: EditorTabSection;
}) {
  const ctx = useBuildEditorOptional();
  if (!ctx) return null;

  const addText = () =>
    ctx.patchSection(workspaceIndex, {
      includeText: true,
      textBody: row.textBody ?? "",
      sliceOrder: appendSlice(row.sliceOrder, "text"),
    });

  const addFiles = () =>
    ctx.patchSection(workspaceIndex, {
      includeDocuments: true,
      sectionFiles: row.sectionFiles ?? [],
      sliceOrder: appendSlice(row.sliceOrder, "documents"),
    });

  const addProducts = (slot: EditorProductSlot) =>
    ctx.patchSection(workspaceIndex, {
      includeProducts: true,
      productSlot: slot,
      sliceOrder: appendSlice(row.sliceOrder, "products"),
    });

  const remove = () => {
    if (!window.confirm("Remove this empty section?")) return;
    ctx.patchSections((sections) => {
      if (workspaceIndex >= 0 && workspaceIndex < sections.length) {
        sections.splice(workspaceIndex, 1);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        This section is empty. Add content to make it visible.
      </p>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={addText}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border/60 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
        >
          <FileText className="size-3.5" aria-hidden />
          Add a text block
        </button>
        <button
          type="button"
          onClick={addFiles}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border/60 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
        >
          <Paperclip className="size-3.5" aria-hidden />
          Attach files
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border/60 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              <Package className="size-3.5" aria-hidden />
              Add a product list
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <MenuSectionLabel>
              Pick a catalog
            </MenuSectionLabel>
            {PRODUCT_SLOT_OPTIONS.map(({ slot, label, icon: Icon }) => (
              <DropdownMenuItem key={slot} onSelect={() => addProducts(slot)}>
                <Icon className="size-3.5" aria-hidden />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          onClick={remove}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground/70 transition-colors hover:text-destructive"
        >
          <Trash2 className="size-3.5" aria-hidden />
          Delete section
        </button>
      </div>
    </div>
  );
}

/* ——— small helpers ——— */

function appendSlice(order: EditorSliceKind[] | undefined, k: EditorSliceKind): EditorSliceKind[] {
  const base = order ?? [];
  if (base.includes(k)) return base;
  return [...base, k];
}

function dropSlice(order: EditorSliceKind[] | undefined, k: EditorSliceKind): EditorSliceKind[] | undefined {
  if (!order) return undefined;
  const next = order.filter((x) => x !== k);
  return next.length === 0 ? undefined : next;
}
