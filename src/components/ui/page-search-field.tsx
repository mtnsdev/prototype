"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Wrapper: matches product directory primary search */
export const catalogSearchFieldWrapperClass =
  "flex min-w-0 w-full items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2";

const catalogSearchInputClass =
  "min-w-0 flex-1 bg-transparent text-[12px] text-[#F5F0EB] placeholder-[#4A4540] outline-none";

/** Inline / panel search (e.g. attach picker) */
const compactSearchWrapperClass =
  "flex min-w-0 w-full items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5";

const compactSearchInputClass =
  "min-w-0 flex-1 bg-transparent text-[11px] text-[#F5F0EB] placeholder-[#4A4540] outline-none";

/** Shadcn SelectTrigger — use with cn(catalogSelectTriggerClass, "w-[…]") */
export const catalogSelectTriggerClass =
  "h-9 border-white/10 bg-white/5 text-[#F5F5F5] shadow-none focus-visible:ring-1 focus-visible:ring-[#C9A96E]/35";

/** Compact text/date inputs beside catalog selects */
export const catalogCompactInputClass =
  "h-9 rounded-md border border-white/10 bg-white/5 px-3 text-[12px] text-[#F5F5F5] placeholder:text-[#4A4540]";

/**
 * Product Directory filter row — buttons, SelectTrigger, and compact inputs.
 * Use with SelectTrigger `className={cn(directoryFilterSelectTriggerClass, "w-[…]")}`.
 */
export const directoryFilterSelectTriggerClass = cn(
  "flex w-fit min-w-0 items-center justify-between gap-1.5 rounded-lg border border-[rgba(255,255,255,0.03)] bg-[#0c0c12] px-2.5 py-1.5 text-[11px] text-[#9B9590] shadow-none outline-none transition-colors",
  "hover:border-[rgba(255,255,255,0.06)] focus-visible:border-[rgba(255,255,255,0.06)] focus-visible:!ring-1 focus-visible:ring-[#C9A96E]/40 focus-visible:!ring-offset-0",
  "dark:!bg-[#0c0c12] dark:hover:!bg-[#0c0c12]",
  "data-[placeholder]:!text-[#9B9590]",
  "data-[size=default]:!h-auto data-[size=default]:min-h-0 data-[size=sm]:!h-auto data-[size=sm]:min-h-0",
  "[&_svg]:!size-3 [&_svg]:shrink-0 [&_svg]:!text-[#4A4540] [&_svg]:!opacity-100",
  "[&_[data-slot=select-value]]:line-clamp-1 [&_[data-slot=select-value]]:text-left [&_[data-slot=select-value]]:!text-[#F5F0EB]"
);

export const directoryFilterSelectContentClass =
  "rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0e0e14] shadow-2xl";

/** When a directory-style filter has a non-default value (matches Product Directory / VIC). */
export const directoryFilterSelectTriggerActiveClass =
  "border-[rgba(201,169,110,0.15)] !bg-[rgba(201,169,110,0.06)]";

/** SelectItem styling for directory filter dropdowns (Product Directory popover rhythm). */
export const directoryFilterSelectItemClass =
  "py-2 pl-2 pr-8 text-[11px] text-[#9B9590] focus:bg-white/[0.04] focus:text-[#F5F0EB] data-[highlighted]:bg-white/[0.04] data-[highlighted]:text-[#F5F0EB] data-[state=checked]:text-[#C9A96E] [&_[data-slot=select-item-indicator]_svg]:size-3 [&_[data-slot=select-item-indicator]_svg]:text-[#C9A96E]";

/** Text / date inputs in the directory-style filter row */
export const directoryFilterTextInputClass =
  "h-auto min-h-8 rounded-lg border border-[rgba(255,255,255,0.03)] bg-[#0c0c12] px-2.5 py-1.5 text-[11px] text-[#F5F0EB] shadow-none transition-colors placeholder:text-[#4A4540] hover:border-[rgba(255,255,255,0.06)] focus-visible:border-[rgba(255,255,255,0.06)] focus-visible:!ring-1 focus-visible:ring-[#C9A96E]/40 focus-visible:!ring-offset-0 focus-visible:outline-none md:text-[11px]";

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
      <Search
        className={cn("shrink-0 text-[#4A4540]", isCompact ? "h-3.5 w-3.5" : "h-4 w-4")}
        aria-hidden
      />
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
