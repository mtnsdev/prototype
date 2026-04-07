import type { ReactNode } from "react";

/** Combine widget header badges/links with the layout menu (popover trigger). */
export function mergeWidgetHeaderRight(a: ReactNode | undefined, b: ReactNode | undefined): ReactNode {
    if (a == null) return b ?? null;
    if (b == null) return a;
    return (
        <div className="flex items-center gap-2 shrink-0">
            {a}
            {b}
        </div>
    );
}
