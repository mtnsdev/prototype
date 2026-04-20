"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type Density = "menu" | "comfortable";

type Props = {
    label: string;
    checked: boolean;
    onCheckedChange: (next: boolean) => void;
    srDescription: string;
    /** @deprecated No longer used; parent wrappers handle dividers. */
    showBorderTop?: boolean;
    className?: string;
    density?: Density;
};

export function DemoAdminSwitchRow({
    label,
    checked,
    onCheckedChange,
    srDescription,
    className,
    density = "menu",
}: Props) {
    const id = useId();

    return (
        <button
            id={id}
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={`${label}. ${srDescription}`}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                "flex w-full min-w-0 items-center gap-3 rounded-none text-left transition-colors",
                "hover:bg-foreground/[0.04] active:bg-foreground/[0.06]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                density === "menu" ? "min-h-10 px-2.5 py-2" : "min-h-12 px-3 py-2.5",
                className
            )}
        >
            <span
                className={cn(
                    "min-w-0 flex-1 select-none text-2xs font-medium leading-snug text-muted-foreground",
                    density === "comfortable" && "text-xs text-foreground/90"
                )}
            >
                {label}
            </span>
            <span
                aria-hidden
                className={cn(
                    "pointer-events-none relative h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors duration-200",
                    checked
                        ? "bg-blue-500/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                        : "bg-foreground/[0.08] shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)]"
                )}
            >
                <span
                    className={cn(
                        "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-card shadow-sm ring-1 ring-border/60 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
                        checked ? "translate-x-4" : "translate-x-0"
                    )}
                />
            </span>
        </button>
    );
}
