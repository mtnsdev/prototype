"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Pill label, e.g. "Location" or "Sort". */
  label: string;
  /** Optional active value rendered after the label, e.g. "Tokyo". */
  value?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  /** When true, pill renders as the moss-tinted active style. */
  active?: boolean;
  /** When true, pill is currently expanded (rotates the chevron). */
  open?: boolean;
  /** When true, swap the chevron for a toggle switch. Use for boolean filters. */
  toggle?: boolean;
  toggleOn?: boolean;
  onToggle?: (on: boolean) => void;
  className?: string;
};

/**
 * Single filter pill in the catalog filter row.
 * Independent — owns its own dropdown (rendered by parent in a Popover).
 */
export function FilterPill({
  label,
  value,
  icon: Icon,
  onClick,
  active,
  open,
  toggle,
  toggleOn,
  onToggle,
  className,
}: Props) {
  const isActive = active || Boolean(value);
  return (
    <button
      type="button"
      onClick={() => {
        if (toggle) {
          onToggle?.(!toggleOn);
        } else {
          onClick?.();
        }
      }}
      aria-expanded={open}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap",
        "rounded-full border px-3 py-1.5 text-[12px] transition-colors",
        toggle ? "pr-1.5" : "",
        isActive
          ? "border-[rgba(58,89,56,0.35)] bg-[color:var(--surface-interactive)] text-[color:var(--brand-primary)]"
          : "border-[color:var(--border-default)] bg-[color:var(--surface-card)] text-[color:var(--text-secondary)] hover:border-[color:var(--border-strong)]",
        className
      )}
    >
      {Icon ? (
        <Icon
          size={12}
          className={cn(
            isActive ? "text-[color:var(--brand-primary)]" : "text-[color:var(--chrome-icon)]"
          )}
          aria-hidden
        />
      ) : null}
      <span>
        {label}
        {value ? <span className="ml-1 font-medium">: {value}</span> : null}
      </span>
      {toggle ? (
        <ToggleSwitch on={Boolean(toggleOn)} />
      ) : (
        <ChevronDown
          size={11}
          className={cn(
            "transition-transform",
            open && "rotate-180",
            isActive ? "text-[color:var(--brand-primary)]" : "text-[color:var(--chrome-icon-muted)]"
          )}
          aria-hidden
        />
      )}
    </button>
  );
}

function ToggleSwitch({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-block h-4 w-7 rounded-full transition-colors",
        on ? "bg-[color:var(--brand-primary)]" : "bg-[color:var(--surface-sunken)]"
      )}
      aria-hidden
    >
      <span
        className={cn(
          "absolute top-0.5 h-3 w-3 rounded-full bg-[color:var(--brand-cta-foreground)] transition-transform",
          on ? "translate-x-3" : "translate-x-0.5"
        )}
      />
    </span>
  );
}
