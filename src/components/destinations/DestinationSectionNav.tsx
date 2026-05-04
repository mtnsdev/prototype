"use client";

import type { KeyboardEvent, ReactElement } from "react";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { destMuted } from "./destinationStyles";
import { Input } from "@/components/ui/input";

export type DestinationNavItem = {
  id: string;
  label: string;
  count: number;
  /** Workspace index for editor operations. */
  workspaceIndex?: number;
};

type Props = {
  className?: string;
  items: DestinationNavItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Mobile: horizontal tabs. Desktop: vertical sidebar (~200px). */
  variant: "horizontal" | "vertical";
  /** Admin callback to add a new blank section. Shown only in vertical variant. */
  onAddSection?: (title: string) => void;
  /** Admin callback to rename a section by workspace index. */
  onRenameSection?: (workspaceIndex: number, newTitle: string) => void;
  /** Admin callback to delete a section by workspace index. */
  onDeleteSection?: (workspaceIndex: number) => void;
  /** Admin callback to reorder sections. */
  onReorderSections?: (oldIndex: number, newIndex: number) => void;
  /** Admin callback — open the section edit panel in the main content area. */
  onEditSection?: (workspaceIndex: number) => void;
};

/* ——— Sortable row wrapper ——— */

function SortableNavItem({
  id,
  children,
}: {
  id: string;
  children: (dragHandleProps: Record<string, unknown>, isDragging: boolean) => ReactElement;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "z-20 opacity-90")}>
      {children({ ...attributes, ...listeners }, isDragging)}
    </div>
  );
}

/* ——— Single nav row ——— */

function NavRow({
  item,
  isActive,
  isAdmin,
  isVertical,
  tabRef,
  onClick,
  onRename,
  onDelete,
  onEdit,
  dragHandleProps,
}: {
  item: DestinationNavItem;
  isActive: boolean;
  isAdmin: boolean;
  isVertical: boolean;
  tabRef?: React.Ref<HTMLButtonElement>;
  onClick: () => void;
  onRename?: (newTitle: string) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  dragHandleProps?: Record<string, unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.label);

  const startEdit = () => {
    setDraft(item.label);
    setEditing(true);
  };

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== item.label && onRename) {
      onRename(trimmed);
    }
    setEditing(false);
  };

  if (!isVertical) {
    // Horizontal mobile tab
    return (
      <button
        ref={tabRef}
        type="button"
        role="tab"
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
        title={`${item.label} · ${item.count} items`}
        onClick={onClick}
        className={cn(
          "relative flex min-w-0 shrink-0 items-center gap-2 rounded-lg px-2.5 pb-2.5 pt-1.5 text-left transition-colors",
          isActive ? "bg-muted/50 text-foreground" : cn(destMuted, "hover:bg-muted/30 hover:text-foreground/90"),
        )}
      >
        <span className="min-w-0 truncate text-xs font-medium">{item.label}</span>
        {isActive ? (
          <span className="pointer-events-none absolute inset-x-1 bottom-0 h-[2px] rounded-full bg-brand-cta sm:inset-x-2" aria-hidden />
        ) : null}
      </button>
    );
  }

  // Vertical desktop sidebar row
  return (
    <div
      className={cn(
        "group/navrow relative flex min-w-0 items-center gap-1 rounded-lg text-left transition-colors",
        isActive
          ? "border border-brand-cta/40 bg-brand-cta/12 text-foreground shadow-sm"
          : "hover:bg-muted/30",
      )}
    >
      {/* Drag handle — admin only, visible on hover */}
      {isAdmin && dragHandleProps ? (
        <button
          type="button"
          className="ml-1 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground/40 opacity-0 transition-opacity hover:text-muted-foreground/70 active:cursor-grabbing group-hover/navrow:opacity-100"
          aria-label="Drag to reorder"
          {...dragHandleProps}
        >
          <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor" aria-hidden>
            <circle cx="2" cy="2" r="1.2" /><circle cx="6" cy="2" r="1.2" />
            <circle cx="2" cy="7" r="1.2" /><circle cx="6" cy="7" r="1.2" />
            <circle cx="2" cy="12" r="1.2" /><circle cx="6" cy="12" r="1.2" />
          </svg>
        </button>
      ) : null}

      {/* Main clickable area */}
      <button
        ref={tabRef}
        type="button"
        role="tab"
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
        onClick={onClick}
        onDoubleClick={isAdmin && onRename ? startEdit : undefined}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 px-2 py-2",
          !isAdmin && "px-2.5",
          !isActive && destMuted,
        )}
      >
        <span className="flex min-w-0 flex-1 items-baseline gap-2">
          {editing ? (
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-6 border-0 bg-transparent p-0 text-xs font-medium shadow-none ring-1 ring-brand-cta/40 sm:text-sm"
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") setEditing(false);
              }}
            />
          ) : (
            <>
              <span className="min-w-0 truncate text-xs font-medium leading-snug">{item.label}</span>
              <span
                className={cn("shrink-0 tabular-nums text-[10px]", isActive ? "text-muted-foreground" : "text-muted-foreground/70")}
                aria-hidden
              >
                {item.count}
              </span>
            </>
          )}
        </span>
      </button>

      {/* Edit — admin only, visible on hover */}
      {isAdmin && onEdit && !editing ? (
        <button
          type="button"
          className="shrink-0 rounded p-1 text-muted-foreground/40 opacity-0 transition-opacity hover:text-foreground group-hover/navrow:opacity-100"
          aria-label={`Edit ${item.label}`}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="size-3" aria-hidden />
        </button>
      ) : null}

      {/* Delete — admin only, visible on hover */}
      {isAdmin && onDelete && !editing ? (
        <button
          type="button"
          className="mr-1.5 shrink-0 rounded p-1 text-muted-foreground/40 opacity-0 transition-opacity hover:text-destructive group-hover/navrow:opacity-100"
          aria-label={`Remove ${item.label}`}
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Remove "${item.label}" section and all its content?`)) {
              onDelete();
            }
          }}
        >
          <X className="size-3" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

/* ——— Main nav component ——— */

export function DestinationSectionNav({
  className,
  items,
  activeId,
  onChange,
  variant,
  onAddSection,
  onRenameSection,
  onDeleteSection,
  onReorderSections,
  onEditSection,
}: Props) {
  const activeTabRef = useRef<HTMLButtonElement | null>(null);
  const moveFocusToActive = useRef(false);

  useLayoutEffect(() => {
    if (!moveFocusToActive.current) return;
    moveFocusToActive.current = false;
    activeTabRef.current?.focus();
  }, [activeId]);

  const onNavKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const i = items.findIndex((x) => x.id === activeId);
    if (i < 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      moveFocusToActive.current = true;
      const next = items[(i + 1) % items.length]!;
      onChange(next.id);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      moveFocusToActive.current = true;
      const next = items[(i - 1 + items.length) % items.length]!;
      onChange(next.id);
    }
  };

  const isVertical = variant === "vertical";
  const isAdmin = !!(onAddSection || onRenameSection || onDeleteSection || onReorderSections);

  const itemIds = useMemo(() => items.map((it) => it.id), [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!onReorderSections) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIdx = items.findIndex((it) => it.id === String(active.id));
      const newIdx = items.findIndex((it) => it.id === String(over.id));
      if (oldIdx < 0 || newIdx < 0) return;
      const oldItem = items[oldIdx];
      const newItem = items[newIdx];
      if (oldItem?.workspaceIndex == null || newItem?.workspaceIndex == null) return;
      onReorderSections(oldItem.workspaceIndex, newItem.workspaceIndex);
    },
    [onReorderSections, items],
  );

  const navContent = (
    <nav
      role="tablist"
      aria-label="Destination sections"
      onKeyDown={onNavKeyDown}
      className={cn(
        isVertical ? "flex flex-col gap-0.5" : "flex gap-0.5 overflow-x-auto pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      )}
    >
      {items.map((item) => {
        const isActive = activeId === item.id;
        const editHandler =
          onEditSection && isVertical && item.workspaceIndex != null
            ? () => onEditSection(item.workspaceIndex!)
            : undefined;
        return isVertical && isAdmin && onReorderSections ? (
          <SortableNavItem key={item.id} id={item.id}>
            {(dragHandleProps) => (
              <NavRow
                item={item}
                isActive={isActive}
                isAdmin={isAdmin}
                isVertical
                tabRef={isActive ? activeTabRef : undefined}
                onClick={() => onChange(item.id)}
                onRename={
                  onRenameSection && item.workspaceIndex != null
                    ? (title) => onRenameSection(item.workspaceIndex!, title)
                    : undefined
                }
                onDelete={
                  onDeleteSection && item.workspaceIndex != null
                    ? () => onDeleteSection(item.workspaceIndex!)
                    : undefined
                }
                onEdit={editHandler}
                dragHandleProps={dragHandleProps}
              />
            )}
          </SortableNavItem>
        ) : (
          <NavRow
            key={item.id}
            item={item}
            isActive={isActive}
            isAdmin={isAdmin}
            isVertical={isVertical}
            tabRef={isActive ? activeTabRef : undefined}
            onClick={() => onChange(item.id)}
            onRename={
              onRenameSection && item.workspaceIndex != null
                ? (title) => onRenameSection(item.workspaceIndex!, title)
                : undefined
            }
            onDelete={
              onDeleteSection && item.workspaceIndex != null
                ? () => onDeleteSection(item.workspaceIndex!)
                : undefined
            }
            onEdit={editHandler}
          />
        );
      })}
    </nav>
  );

  return (
    <div
      className={cn(
        isVertical
          ? "rounded-xl border border-border bg-card/80 p-2"
          : "sticky top-0 z-20 -mx-1 border-b border-border/80 bg-background/90 px-1 py-1 backdrop-blur-md supports-[backdrop-filter]:bg-background/75",
        className,
      )}
    >
      {isVertical && isAdmin && onReorderSections ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {navContent}
          </SortableContext>
        </DndContext>
      ) : (
        navContent
      )}
      {isVertical && onAddSection ? (
        <AddSectionInline onAdd={onAddSection} />
      ) : null}
    </div>
  );
}

/* ——— Inline add section ——— */

function AddSectionInline({ onAdd }: { onAdd: (title: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");

  const submit = () => {
    onAdd(title.trim() || "New section");
    setTitle("");
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          "mt-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
          "border border-dashed border-border/60 text-muted-foreground hover:border-border hover:text-foreground",
        )}
      >
        <Plus className="size-3.5" aria-hidden />
        New section
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-1.5">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Section title…"
        className="h-8 text-xs"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") { setTitle(""); setEditing(false); }
        }}
      />
      <div className="flex gap-1">
        <button
          type="button"
          onClick={submit}
          className="rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium text-background"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => { setTitle(""); setEditing(false); }}
          className="rounded-md px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
