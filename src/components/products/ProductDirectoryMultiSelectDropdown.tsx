"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type MultiSelectOption = { value: string; label: string };

type Props = {
  fieldLabel: string;
  /** Shown in the trigger when nothing is selected (default &quot;All&quot;). */
  emptySummary?: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  footerAction?: { label: string; onClick: () => void };
  chipClassName?: string;
};

export default function ProductDirectoryMultiSelectDropdown({
  fieldLabel,
  emptySummary = "All",
  options,
  selected,
  onChange,
  footerAction,
  chipClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = useCallback(
    (value: string) => {
      if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
      else onChange([...selected, value]);
    },
    [selected, onChange]
  );

  const removeChip = useCallback(
    (value: string) => {
      onChange(selected.filter((v) => v !== value));
    },
    [selected, onChange]
  );

  const summary =
    selected.length === 0
      ? emptySummary
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label ?? selected[0]
        : `${selected.length} selected`;

  return (
    <div ref={rootRef} className={cn("relative flex flex-col gap-1", chipClassName)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.03)] bg-[#0c0c12] px-3 py-1.5 text-left transition-colors hover:border-[rgba(255,255,255,0.06)]"
      >
        <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-[#4A4540]">{fieldLabel}</span>
        <span className="max-w-[120px] truncate text-[11px] text-[#9B9590]">{summary}</span>
        <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-[#4A4540]" />
      </button>

      {selected.length > 0 && (
        <div className="flex max-w-[220px] flex-wrap gap-1">
          {selected.map((v) => {
            const label = options.find((o) => o.value === v)?.label ?? v;
            return (
              <span
                key={v}
                className="inline-flex items-center gap-0.5 rounded-md border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.04)] px-1.5 py-0.5 text-[9px] text-[#9B9590]"
              >
                <span className="max-w-[100px] truncate">{label}</span>
                <button
                  type="button"
                  className="rounded p-0.5 text-[#4A4540] hover:text-[#F5F0EB]"
                  aria-label={`Remove ${label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChip(v);
                  }}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 max-h-56 w-52 overflow-y-auto rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0c0c12] shadow-xl"
          role="listbox"
        >
          {options.map((opt) => {
            const isOn = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isOn}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-[11px] text-[#9B9590] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                onClick={() => toggle(opt.value)}
              >
                <span className="truncate pr-2">{opt.label}</span>
                {isOn ? <Check className="h-3 w-3 shrink-0 text-[#C9A96E]" /> : <span className="h-3 w-3 shrink-0" />}
              </button>
            );
          })}
          {footerAction && (
            <button
              type="button"
              className="w-full border-t border-[rgba(255,255,255,0.06)] px-3 py-2 text-left text-[11px] text-[#C9A96E] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
              onClick={() => {
                setOpen(false);
                footerAction.onClick();
              }}
            >
              {footerAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
