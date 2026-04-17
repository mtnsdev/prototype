"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type IncentiveEditorFormClasses = {
  input: string;
  select: string;
  textarea: string;
};

type Props = {
  name: string;
  onNameChange: (v: string) => void;
  rateValue: string;
  onRateValueChange: (v: string) => void;
  rateType: "percentage" | "flat";
  onRateTypeChange: (v: "percentage" | "flat") => void;
  stacksWithBase: boolean;
  onStacksWithBaseChange: (v: boolean) => void;
  bookingStart: string;
  onBookingStartChange: (v: string) => void;
  bookingEnd: string;
  onBookingEndChange: (v: string) => void;
  travelStart: string;
  onTravelStartChange: (v: string) => void;
  travelEnd: string;
  onTravelEndChange: (v: string) => void;
  eligibilityNotes: string;
  onEligibilityNotesChange: (v: string) => void;
  scopeAll: boolean;
  onScopeAllChange: (v: boolean) => void;
  linkedProductIds: string[];
  selectedProducts: string[];
  onToggleProduct: (id: string) => void;
  productLabel: (id: string) => string;
  saveError: string | null;
  /** Compact styling for nested panels (Partner Program editor). */
  variant?: "dialog" | "inline";
};

const dialogClasses: IncentiveEditorFormClasses = {
  input: "rounded-lg border-border bg-inset",
  select: "h-10 w-full rounded-lg border border-border bg-inset px-2 text-sm",
  textarea: "w-full rounded-lg border border-border bg-inset px-2 py-1.5 text-sm",
};

const inlineClasses: IncentiveEditorFormClasses = {
  input:
    "h-8 w-full min-w-0 rounded-md border border-border bg-inset px-2 text-xs text-foreground outline-none transition-colors focus:border-[rgba(176,122,91,0.45)] focus:ring-1 focus:ring-[rgba(176,122,91,0.28)]",
  select:
    "h-8 w-full min-w-0 rounded-md border border-border bg-inset px-2 text-xs text-foreground outline-none transition-colors focus:border-[rgba(176,122,91,0.45)] focus:ring-1 focus:ring-[rgba(176,122,91,0.28)]",
  textarea:
    "min-h-[3.5rem] w-full resize-y rounded-md border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none transition-colors focus:border-[rgba(176,122,91,0.45)] focus:ring-1 focus:ring-[rgba(176,122,91,0.28)]",
};

export function IncentiveEditorForm({
  name,
  onNameChange,
  rateValue,
  onRateValueChange,
  rateType,
  onRateTypeChange,
  stacksWithBase,
  onStacksWithBaseChange,
  bookingStart,
  onBookingStartChange,
  bookingEnd,
  onBookingEndChange,
  travelStart,
  onTravelStartChange,
  travelEnd,
  onTravelEndChange,
  eligibilityNotes,
  onEligibilityNotesChange,
  scopeAll,
  onScopeAllChange,
  linkedProductIds,
  selectedProducts,
  onToggleProduct,
  productLabel,
  saveError,
  variant = "dialog",
}: Props) {
  const c = variant === "inline" ? inlineClasses : dialogClasses;
  const labelSm = variant === "inline" ? "text-[10px]" : "text-[11px]";

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Name</Label>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className={cn(c.input, variant === "inline" ? "px-2 py-1.5" : "px-2 py-1.5 text-sm")}
          placeholder="Q1 booking bonus"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Rate value</Label>
          <input
            value={rateValue}
            onChange={(e) => onRateValueChange(e.target.value)}
            className={cn(c.input, "w-full px-2 py-1.5")}
            placeholder={rateType === "flat" ? "e.g. €150" : "15% or +2%"}
          />
        </div>
        <div className="space-y-1">
          <Label>Rate type</Label>
          <select
            value={rateType}
            onChange={(e) => onRateTypeChange(e.target.value as "percentage" | "flat")}
            className={c.select}
          >
            <option value="percentage">Percentage</option>
            <option value="flat">Flat</option>
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-foreground">
        <input
          type="checkbox"
          checked={stacksWithBase}
          onChange={(e) => onStacksWithBaseChange(e.target.checked)}
          className="rounded border-border"
        />
        Stacks with base commission (bonus-style; off = override / seasonal-style)
      </label>
      <p className="text-[10px] text-muted-foreground">
        Seasonal vs rate override: when not stacking, travel window dates imply a seasonal shape; booking-only windows
        read as an override.
      </p>

      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Windows (optional)</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className={labelSm}>Book from</Label>
          <input
            type="date"
            value={bookingStart}
            onChange={(e) => onBookingStartChange(e.target.value)}
            className={c.input}
          />
        </div>
        <div className="space-y-1">
          <Label className={labelSm}>Book until</Label>
          <input
            type="date"
            value={bookingEnd}
            onChange={(e) => onBookingEndChange(e.target.value)}
            className={c.input}
          />
        </div>
        <div className="space-y-1">
          <Label className={labelSm}>Travel from</Label>
          <input
            type="date"
            value={travelStart}
            onChange={(e) => onTravelStartChange(e.target.value)}
            className={c.input}
          />
        </div>
        <div className="space-y-1">
          <Label className={labelSm}>Travel until</Label>
          <input
            type="date"
            value={travelEnd}
            onChange={(e) => onTravelEndChange(e.target.value)}
            className={c.input}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Eligibility notes</Label>
        <textarea
          value={eligibilityNotes}
          onChange={(e) => onEligibilityNotesChange(e.target.value)}
          rows={2}
          className={c.textarea}
          placeholder="Suite categories only, new bookings only…"
        />
      </div>

      <div className="space-y-2 rounded-lg border border-border bg-white/[0.02] p-3">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="radio"
            checked={scopeAll}
            onChange={() => onScopeAllChange(true)}
            className="border-border"
          />
          All products linked to this program
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="radio"
            checked={!scopeAll}
            onChange={() => onScopeAllChange(false)}
            className="border-border"
            disabled={linkedProductIds.length === 0}
          />
          Specific linked products
        </label>
        {!scopeAll && linkedProductIds.length > 0 ? (
          <div className="ml-6 flex max-h-32 flex-col gap-1 overflow-y-auto">
            {linkedProductIds.map((pid) => (
              <label key={pid} className="flex items-center gap-2 text-[11px]">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(pid)}
                  onChange={() => onToggleProduct(pid)}
                  className="rounded border-border"
                />
                {productLabel(pid)}
              </label>
            ))}
          </div>
        ) : null}
      </div>

      {saveError ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {saveError}
        </p>
      ) : null}
    </div>
  );
}
