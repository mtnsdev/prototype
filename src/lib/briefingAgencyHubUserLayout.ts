/**
 * Per-user **agency briefing** layout (notes, news, announcements, incentives).
 * Content is authored by admins; this only controls how each user arranges those blocks.
 */

export const BRIEFING_AGENCY_HUB_USER_STORAGE_KEY = "briefing_agency_hub_user_layout_v1";

export const AGENCY_HUB_USER_WIDGET_IDS = [
    "hub-notes",
    "hub-alerts",
    "hub-announcements",
    "hub-incentives",
] as const;

export type AgencyHubUserWidgetId = (typeof AGENCY_HUB_USER_WIDGET_IDS)[number];

export type AgencyHubUserWidgetLayout = {
    visible: boolean;
    column: "left" | "right";
    size: "compact" | "default" | "expanded";
};

export const AGENCY_HUB_USER_WIDGET_META: Record<
    AgencyHubUserWidgetId,
    { label: string; description: string }
> = {
    "hub-notes": {
        label: "Agency notes",
        description: "Pinned message from your agency.",
    },
    "hub-alerts": {
        label: "News & alerts",
        description: "Industry and partner news with severity.",
    },
    "hub-announcements": {
        label: "Announcements",
        description: "Team updates from leadership.",
    },
    "hub-incentives": {
        label: "Partner incentives",
        description: "Active offers and bonuses.",
    },
};

export function defaultAgencyHubUserLayout(): Record<AgencyHubUserWidgetId, AgencyHubUserWidgetLayout> {
    return {
        "hub-notes": { visible: true, column: "left", size: "default" },
        "hub-alerts": { visible: true, column: "left", size: "default" },
        "hub-announcements": { visible: true, column: "right", size: "default" },
        "hub-incentives": { visible: true, column: "right", size: "default" },
    };
}

export function mergeAgencyHubUserLayout(
    partial: Partial<Record<AgencyHubUserWidgetId, Partial<AgencyHubUserWidgetLayout>>> | null,
): Record<AgencyHubUserWidgetId, AgencyHubUserWidgetLayout> {
    const base = defaultAgencyHubUserLayout();
    if (!partial) return base;
    for (const id of AGENCY_HUB_USER_WIDGET_IDS) {
        const p = partial[id];
        if (p) {
            base[id] = {
                visible: p.visible ?? base[id].visible,
                column: p.column ?? base[id].column,
                size: p.size ?? base[id].size,
            };
        }
    }
    return base;
}

export function parseAgencyHubUserLayoutJson(raw: string | null): Record<
    AgencyHubUserWidgetId,
    AgencyHubUserWidgetLayout
> {
    if (!raw) return defaultAgencyHubUserLayout();
    try {
        const j = JSON.parse(raw) as Record<string, unknown>;
        const partial: Partial<Record<AgencyHubUserWidgetId, Partial<AgencyHubUserWidgetLayout>>> = {};
        for (const id of AGENCY_HUB_USER_WIDGET_IDS) {
            const v = j[id];
            if (v && typeof v === "object" && v !== null) {
                const o = v as Record<string, unknown>;
                partial[id] = {
                    visible: typeof o.visible === "boolean" ? o.visible : undefined,
                    column: o.column === "left" || o.column === "right" ? o.column : undefined,
                    size:
                        o.size === "compact" || o.size === "default" || o.size === "expanded"
                            ? o.size
                            : undefined,
                };
            }
        }
        return mergeAgencyHubUserLayout(partial);
    } catch {
        return defaultAgencyHubUserLayout();
    }
}

export function loadAgencyHubUserLayoutFromStorage(): Record<
    AgencyHubUserWidgetId,
    AgencyHubUserWidgetLayout
> {
    if (typeof window === "undefined") return defaultAgencyHubUserLayout();
    return parseAgencyHubUserLayoutJson(localStorage.getItem(BRIEFING_AGENCY_HUB_USER_STORAGE_KEY));
}

export function saveAgencyHubUserLayoutToStorage(
    layout: Record<AgencyHubUserWidgetId, AgencyHubUserWidgetLayout>,
): void {
    try {
        localStorage.setItem(BRIEFING_AGENCY_HUB_USER_STORAGE_KEY, JSON.stringify(layout));
    } catch {
        /* quota / private mode */
    }
}
