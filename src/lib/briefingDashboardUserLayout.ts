/**
 * Per-user briefing **grid** layout (VIC intel, actions, activity, trips, calendar).
 * Agency briefing blocks above the grid have a separate per-user layout (`briefingAgencyHubUserLayout`).
 */

export const BRIEFING_USER_DASHBOARD_STORAGE_KEY = "briefing_user_dashboard_layout_v2";

/** Legacy key — read once to migrate stored layout. */
const BRIEFING_USER_DASHBOARD_STORAGE_KEY_V1 = "briefing_user_dashboard_layout_v1";

export const BRIEFING_USER_GRID_WIDGET_IDS = [
    "w-client-intel",
    "w-actions",
    "w-activity",
    "w-trips",
    "w-calendar",
] as const;

export type BriefingUserGridWidgetId = (typeof BRIEFING_USER_GRID_WIDGET_IDS)[number];

export type UserDashboardWidgetLayout = {
    visible: boolean;
    column: "left" | "right";
    /** Order within the widget's column (0-based). */
    order: number;
};

const STABLE_INDEX: Record<BriefingUserGridWidgetId, number> = Object.fromEntries(
    BRIEFING_USER_GRID_WIDGET_IDS.map((id, i) => [id, i]),
) as Record<BriefingUserGridWidgetId, number>;

export const USER_GRID_WIDGET_META: Record<
    BriefingUserGridWidgetId,
    { label: string; description: string }
> = {
    "w-client-intel": {
        label: "VIC intelligence",
        description: "Client reminders: birthdays, passport, departures, loyalty, and more.",
    },
    "w-actions": {
        label: "Action items",
        description: "Your tasks and follow-ups with due dates and pipeline context.",
    },
    "w-activity": {
        label: "Recent activity",
        description: "What changed across VICs, products, and itineraries.",
    },
    "w-trips": {
        label: "Upcoming trips",
        description: "Departures, confirmations, and trip status at a glance.",
    },
    "w-calendar": {
        label: "Calendar",
        description: "Meetings, deadlines, trips, and reminders on your schedule.",
    },
};

export function defaultUserDashboardLayout(): Record<BriefingUserGridWidgetId, UserDashboardWidgetLayout> {
    return {
        "w-client-intel": { visible: true, column: "left", order: 0 },
        "w-actions": { visible: true, column: "left", order: 1 },
        "w-activity": { visible: true, column: "left", order: 2 },
        "w-trips": { visible: true, column: "right", order: 0 },
        "w-calendar": { visible: true, column: "right", order: 1 },
    };
}

/** Renumber `order` per column for visible widgets; hidden widgets keep trailing orders in that column. */
export function normalizeUserDashboardLayout(
    layout: Record<BriefingUserGridWidgetId, UserDashboardWidgetLayout>,
): Record<BriefingUserGridWidgetId, UserDashboardWidgetLayout> {
    const next: Record<BriefingUserGridWidgetId, UserDashboardWidgetLayout> = { ...layout };
    for (const col of ["left", "right"] as const) {
        const visibleInCol = BRIEFING_USER_GRID_WIDGET_IDS.filter(
            (id) => next[id].column === col && next[id].visible,
        );
        visibleInCol.sort((a, b) => {
            const oa = next[a].order;
            const ob = next[b].order;
            if (oa !== ob) return oa - ob;
            return STABLE_INDEX[a] - STABLE_INDEX[b];
        });
        visibleInCol.forEach((id, i) => {
            next[id] = { ...next[id], order: i };
        });
        const hiddenInCol = BRIEFING_USER_GRID_WIDGET_IDS.filter(
            (id) => next[id].column === col && !next[id].visible,
        );
        const base = visibleInCol.length;
        hiddenInCol.forEach((id, i) => {
            next[id] = { ...next[id], order: base + i };
        });
    }
    return next;
}

export function mergeUserDashboardLayout(
    partial: Partial<Record<BriefingUserGridWidgetId, Partial<UserDashboardWidgetLayout>>> | null,
): Record<BriefingUserGridWidgetId, UserDashboardWidgetLayout> {
    const base = defaultUserDashboardLayout();
    if (!partial) return normalizeUserDashboardLayout(base);
    for (const id of BRIEFING_USER_GRID_WIDGET_IDS) {
        const p = partial[id];
        if (p) {
            base[id] = {
                visible: p.visible ?? base[id].visible,
                column: p.column ?? base[id].column,
                order: typeof p.order === "number" && Number.isFinite(p.order) ? p.order : base[id].order,
            };
        }
    }
    return normalizeUserDashboardLayout(base);
}

export function parseUserDashboardLayoutJson(raw: string | null): Record<
    BriefingUserGridWidgetId,
    UserDashboardWidgetLayout
> {
    if (!raw) return defaultUserDashboardLayout();
    try {
        const j = JSON.parse(raw) as Record<string, unknown>;
        const partial: Partial<Record<BriefingUserGridWidgetId, Partial<UserDashboardWidgetLayout>>> = {};
        for (const id of BRIEFING_USER_GRID_WIDGET_IDS) {
            const v = j[id];
            if (v && typeof v === "object" && v !== null) {
                const o = v as Record<string, unknown>;
                partial[id] = {
                    visible: typeof o.visible === "boolean" ? o.visible : undefined,
                    column: o.column === "left" || o.column === "right" ? o.column : undefined,
                    order: typeof o.order === "number" && Number.isFinite(o.order) ? o.order : undefined,
                };
            }
        }
        return mergeUserDashboardLayout(partial);
    } catch {
        return defaultUserDashboardLayout();
    }
}

function migrateV1LayoutIfPresent(): Record<BriefingUserGridWidgetId, UserDashboardWidgetLayout> | null {
    if (typeof window === "undefined") return null;
    const v1 = localStorage.getItem(BRIEFING_USER_DASHBOARD_STORAGE_KEY_V1);
    if (!v1) return null;
    try {
        const j = JSON.parse(v1) as Record<string, unknown>;
        const partial: Partial<Record<BriefingUserGridWidgetId, Partial<UserDashboardWidgetLayout>>> = {};
        for (const id of BRIEFING_USER_GRID_WIDGET_IDS) {
            const v = j[id];
            if (v && typeof v === "object" && v !== null) {
                const o = v as Record<string, unknown>;
                partial[id] = {
                    visible: typeof o.visible === "boolean" ? o.visible : undefined,
                    column: o.column === "left" || o.column === "right" ? o.column : undefined,
                };
            }
        }
        const merged = mergeUserDashboardLayout(partial);
        try {
            localStorage.removeItem(BRIEFING_USER_DASHBOARD_STORAGE_KEY_V1);
            localStorage.setItem(BRIEFING_USER_DASHBOARD_STORAGE_KEY, JSON.stringify(merged));
        } catch {
            /* ignore */
        }
        return merged;
    } catch {
        return null;
    }
}

export function loadUserDashboardLayoutFromStorage(): Record<
    BriefingUserGridWidgetId,
    UserDashboardWidgetLayout
> {
    if (typeof window === "undefined") return defaultUserDashboardLayout();
    const migrated = migrateV1LayoutIfPresent();
    if (migrated) return migrated;
    return parseUserDashboardLayoutJson(localStorage.getItem(BRIEFING_USER_DASHBOARD_STORAGE_KEY));
}

export function saveUserDashboardLayoutToStorage(
    layout: Record<BriefingUserGridWidgetId, UserDashboardWidgetLayout>,
): void {
    try {
        const normalized = normalizeUserDashboardLayout(layout);
        localStorage.setItem(BRIEFING_USER_DASHBOARD_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
        /* quota / private mode */
    }
}
