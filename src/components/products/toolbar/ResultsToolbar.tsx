"use client";

import { CheckSquare, Grid2X2, List, Map } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list" | "map";

type Props = {
  count: number;
  /** Singular and plural unit labels, e.g. ["product", "products"]. */
  unit?: [string, string];
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  selectMode?: boolean;
  onSelectModeToggle?: () => void;
  /** When false, hides the grid/list/map view toggle group (used when toggles live elsewhere). */
  showViewControls?: boolean;
  className?: string;
};

/**
 * Bottom row of the catalog toolbar — result count, multi-select trigger, view mode.
 */
export function ResultsToolbar({
  count,
  unit = ["product", "products"],
  view,
  onViewChange,
  selectMode,
  onSelectModeToggle,
  showViewControls = true,
  className,
}: Props) {
  const label = `${count.toLocaleString()} ${count === 1 ? unit[0] : unit[1]}`;
  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 text-[12px] text-[color:var(--text-tertiary)]",
        className
      )}
    >
      <span>{label}</span>

      {onSelectModeToggle ? (
        <button
          type="button"
          onClick={onSelectModeToggle}
          aria-pressed={selectMode}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] transition-colors",
            selectMode
              ? "border-[rgba(58,89,56,0.35)] bg-[color:var(--surface-interactive)] text-[color:var(--brand-primary)]"
              : "border-[color:var(--border-default)] bg-[color:var(--surface-card)] text-[color:var(--text-secondary)] hover:border-[color:var(--border-strong)]"
          )}
        >
          <CheckSquare size={12} aria-hidden />
          Select
        </button>
      ) : null}

      {showViewControls ? (
        <div className="ml-auto inline-flex items-center gap-0.5">
          <ViewBtn icon={Grid2X2} label="Grid" active={view === "grid"} onClick={() => onViewChange("grid")} />
          <ViewBtn icon={List} label="List" active={view === "list"} onClick={() => onViewChange("list")} />
          <ViewBtn icon={Map} label="Map" active={view === "map"} onClick={() => onViewChange("map")} />
        </div>
      ) : null}
    </div>
  );
}

function ViewBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Grid2X2;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
        active
          ? "bg-[color:var(--surface-interactive)] text-[color:var(--brand-primary)]"
          : "text-[color:var(--chrome-icon-muted)] hover:bg-[color:var(--surface-interactive)] hover:text-[color:var(--text-secondary)]"
      )}
    >
      <Icon size={14} aria-hidden />
    </button>
  );
}
