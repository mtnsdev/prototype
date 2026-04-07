"use client";

import { cn } from "@/lib/utils";

/** Shared shape for agency hub popover (column + size). Dashboard grid uses order instead — see `briefingDashboardUserLayout`. */
export type BriefingCardLayoutPref = {
    visible: boolean;
    column: "left" | "right";
    size: "compact" | "default" | "expanded";
};

export const BRIEFING_LAYOUT_SIZE_ORDER: BriefingCardLayoutPref["size"][] = [
    "compact",
    "default",
    "expanded",
];

export const BRIEFING_LAYOUT_SIZE_LABELS: Record<BriefingCardLayoutPref["size"], string> = {
    compact: "S",
    default: "M",
    expanded: "L",
};

export function BriefingLayoutIOSSwitch({
    checked,
    onCheckedChange,
    disabled,
    id,
    "aria-label": ariaLabel,
}: {
    checked: boolean;
    onCheckedChange: (v: boolean) => void;
    disabled?: boolean;
    id?: string;
    "aria-label"?: string;
}) {
    return (
        <label
            htmlFor={id}
            className={cn(
                "relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors",
                "bg-foreground/15 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                checked && "bg-primary",
                disabled && "pointer-events-none opacity-40",
            )}
        >
            <input
                id={id}
                type="checkbox"
                role="switch"
                checked={checked}
                disabled={disabled}
                aria-label={ariaLabel}
                aria-checked={checked}
                className="peer sr-only"
                onChange={(e) => onCheckedChange(e.target.checked)}
            />
            <span
                className={cn(
                    "pointer-events-none block size-[27px] rounded-full bg-background shadow-md transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                    "translate-x-0 peer-checked:translate-x-5",
                )}
            />
        </label>
    );
}

export function BriefingLayoutSegmented<T extends string>({
    value,
    onChange,
    options,
    disabled,
    ariaLabel,
}: {
    value: T;
    onChange: (v: T) => void;
    options: { value: T; label: string }[];
    disabled?: boolean;
    ariaLabel: string;
}) {
    return (
        <div
            role="group"
            aria-label={ariaLabel}
            className={cn(
                "flex rounded-[10px] bg-foreground/[0.06] p-0.5",
                disabled && "pointer-events-none opacity-45",
            )}
        >
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    disabled={disabled}
                    aria-pressed={value === o.value}
                    onClick={() => onChange(o.value)}
                    className={cn(
                        "min-w-0 flex-1 rounded-[8px] py-2 text-[13px] font-medium transition-all duration-150",
                        value === o.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground/90",
                    )}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

/** Show + column + size (agency hub blocks). */
export function BriefingCardLayoutForm<K extends string>({
    widgetId,
    meta,
    pref,
    updateWidget,
    disabled,
    idSuffix,
    showToggleLabel,
    switchAriaScope = "dashboard",
}: {
    widgetId: K;
    meta: { label: string };
    pref: BriefingCardLayoutPref;
    updateWidget: (id: K, patch: Partial<BriefingCardLayoutPref>) => void;
    disabled?: boolean;
    idSuffix: string;
    showToggleLabel: string;
    /** Shown in switch aria-label, e.g. "dashboard" vs "agency briefing". */
    switchAriaScope?: string;
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">{showToggleLabel}</span>
                <BriefingLayoutIOSSwitch
                    id={`${idSuffix}-show-${String(widgetId)}`}
                    checked={pref.visible}
                    disabled={disabled}
                    aria-label={`Show ${meta.label} on ${switchAriaScope}`}
                    onCheckedChange={(v) => updateWidget(widgetId, { visible: v })}
                />
            </div>
            {pref.visible ? (
                <>
                    <div>
                        <p className="mb-1.5 text-[12px] font-medium text-muted-foreground/80">Column</p>
                        <BriefingLayoutSegmented
                            ariaLabel={`Column for ${meta.label}`}
                            value={pref.column}
                            disabled={disabled}
                            onChange={(column) => updateWidget(widgetId, { column })}
                            options={[
                                { value: "left" as const, label: "Left" },
                                { value: "right" as const, label: "Right" },
                            ]}
                        />
                    </div>
                    <div>
                        <p className="mb-1.5 text-[12px] font-medium text-muted-foreground/80">Size</p>
                        <BriefingLayoutSegmented
                            ariaLabel={`Size for ${meta.label}`}
                            value={pref.size}
                            disabled={disabled}
                            onChange={(size) => updateWidget(widgetId, { size })}
                            options={BRIEFING_LAYOUT_SIZE_ORDER.map((s) => ({
                                value: s,
                                label: BRIEFING_LAYOUT_SIZE_LABELS[s],
                            }))}
                        />
                        <p className="mt-1.5 text-[11px] text-muted-foreground/65">
                            Small, medium, or large card density.
                        </p>
                    </div>
                </>
            ) : null}
        </div>
    );
}
