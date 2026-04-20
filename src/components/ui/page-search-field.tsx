"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Wrapper: primary row search — height matches `Button` `size="sm"` (`h-8`) in filter toolbars */
export const catalogSearchFieldWrapperClass =
  "flex h-8 min-h-8 w-full min-w-0 items-center gap-2 rounded-xl border border-border bg-white/[0.03] px-3";

export const catalogSearchInputClass =
  "min-w-0 flex-1 h-full bg-transparent text-sm leading-tight text-foreground placeholder:text-muted-foreground/60 outline-none";

/** Inline / panel search (e.g. attach picker) — one step denser than primary */
const compactSearchWrapperClass =
  "flex h-7 min-h-7 w-full min-w-0 items-center gap-1.5 rounded-lg border border-border bg-white/[0.03] px-2.5";

const compactSearchInputClass =
  "min-w-0 flex-1 h-full bg-transparent text-xs leading-tight text-foreground placeholder:text-muted-foreground/60 outline-none";

/** Shadcn SelectTrigger — use with cn(catalogSelectTriggerClass, "w-[…]") */
export const catalogSelectTriggerClass =
  "h-9 border-input bg-white/5 text-foreground shadow-none focus-visible:ring-1 focus-visible:ring-[#C9A96E]/35";

/** Compact text/date inputs beside catalog selects */
export const catalogCompactInputClass =
  "h-9 rounded-md border border-input bg-white/5 px-3 text-sm text-foreground placeholder:text-muted-foreground/65";

/**
 * Product Directory filter row — buttons, SelectTrigger, and compact inputs.
 * Use with SelectTrigger `className={cn(directoryFilterSelectTriggerClass, "w-[…]")}`.
 */
export const directoryFilterSelectTriggerClass = cn(
  "flex w-fit min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-popover px-3 py-1.5 text-xs text-muted-foreground shadow-none outline-none transition-colors",
  "hover:border-border focus-visible:border-border focus-visible:!ring-1 focus-visible:ring-[#C9A96E]/40 focus-visible:!ring-offset-0",
  "dark:!bg-popover dark:hover:!bg-popover",
  "data-[placeholder]:!text-muted-foreground",
  "data-[size=default]:!h-auto data-[size=default]:min-h-0 data-[size=sm]:!h-auto data-[size=sm]:min-h-0",
  "[&_svg]:!size-3 [&_svg]:shrink-0 [&_svg]:!text-muted-foreground/65 [&_svg]:!opacity-100",
  "[&_[data-slot=select-value]]:line-clamp-1 [&_[data-slot=select-value]]:text-left [&_[data-slot=select-value]]:text-inherit"
);

export const directoryFilterSelectContentClass =
  "rounded-xl border border-border bg-muted shadow-2xl";

/** Border/background when a compact filter field has a value (text/date inputs — keep `text-foreground`). */
export const directoryFilterInputActiveClass =
  "border-[rgba(201,169,110,0.20)] !bg-[rgba(201,169,110,0.08)]";

/** When a directory-style Select has a non-default value (matches Product Directory triggers). */
export const directoryFilterSelectTriggerActiveClass =
  "border-[rgba(201,169,110,0.20)] !bg-[rgba(201,169,110,0.08)] !text-brand-cta [&_[data-slot=select-value]]:!text-foreground";

/** SelectItem styling for directory filter dropdowns (Product Directory popover rhythm). */
export const directoryFilterSelectItemClass =
  "py-2 pl-2 pr-8 text-xs text-muted-foreground focus:bg-white/[0.04] focus:text-foreground data-[highlighted]:bg-white/[0.04] data-[highlighted]:text-foreground data-[state=checked]:text-brand-cta [&_[data-slot=select-item-indicator]_svg]:size-3 [&_[data-slot=select-item-indicator]_svg]:text-brand-cta";

/** Text / date inputs in the directory-style filter row */
export const directoryFilterTextInputClass =
  "h-auto min-h-8 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs text-foreground shadow-none transition-colors placeholder:text-muted-foreground/65 hover:border-border focus-visible:border-border focus-visible:!ring-1 focus-visible:ring-[#C9A96E]/40 focus-visible:!ring-offset-0 focus-visible:outline-none md:text-xs";

type PageSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  "aria-label"?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  /** `compact` — smaller type and radius for nested toolbars */
  variant?: "default" | "compact";
};

export function PageSearchField({
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
  disabled,
  className,
  inputClassName,
  variant = "default",
}: PageSearchFieldProps) {
  const isCompact = variant === "compact";
  return (
    <div className={cn(isCompact ? compactSearchWrapperClass : catalogSearchFieldWrapperClass, className)}>
      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/65" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(isCompact ? compactSearchInputClass : catalogSearchInputClass, inputClassName)}
        aria-label={ariaLabel ?? placeholder}
        disabled={disabled}
      />
    </div>
  );
}
