"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import {
    BRIEFING_USER_DASHBOARD_STORAGE_KEY,
    type BriefingUserGridWidgetId,
    type UserDashboardWidgetLayout,
    defaultUserDashboardLayout,
    loadUserDashboardLayoutFromStorage,
    normalizeUserDashboardLayout,
    parseUserDashboardLayoutJson,
    saveUserDashboardLayoutToStorage,
} from "@/lib/briefingDashboardUserLayout";

export function useBriefingDashboardLayout(): {
    layout: Record<BriefingUserGridWidgetId, UserDashboardWidgetLayout>;
    setLayout: Dispatch<SetStateAction<Record<BriefingUserGridWidgetId, UserDashboardWidgetLayout>>>;
    updateWidget: (id: BriefingUserGridWidgetId, patch: Partial<UserDashboardWidgetLayout>) => void;
    reorderWidgets: (leftIds: BriefingUserGridWidgetId[], rightIds: BriefingUserGridWidgetId[]) => void;
    resetToDefaults: () => void;
    /** True until localStorage has been read on the client (avoid flashing wrong defaults). */
    isLoading: boolean;
} {
    const [layout, setLayout] =
        useState<Record<BriefingUserGridWidgetId, UserDashboardWidgetLayout>>(defaultUserDashboardLayout);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setLayout(loadUserDashboardLayoutFromStorage());
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === BRIEFING_USER_DASHBOARD_STORAGE_KEY) {
                setLayout(parseUserDashboardLayoutJson(e.newValue));
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const updateWidget = useCallback((id: BriefingUserGridWidgetId, patch: Partial<UserDashboardWidgetLayout>) => {
        setLayout((prev) => {
            const next = normalizeUserDashboardLayout({ ...prev, [id]: { ...prev[id], ...patch } });
            saveUserDashboardLayoutToStorage(next);
            return next;
        });
    }, []);

    const reorderWidgets = useCallback(
        (leftIds: BriefingUserGridWidgetId[], rightIds: BriefingUserGridWidgetId[]) => {
            setLayout((prev) => {
                const next: Record<BriefingUserGridWidgetId, UserDashboardWidgetLayout> = { ...prev };
                leftIds.forEach((wid, i) => {
                    next[wid] = { ...next[wid], column: "left", order: i, visible: true };
                });
                rightIds.forEach((wid, i) => {
                    next[wid] = { ...next[wid], column: "right", order: i, visible: true };
                });
                const normalized = normalizeUserDashboardLayout(next);
                saveUserDashboardLayoutToStorage(normalized);
                return normalized;
            });
        },
        [],
    );

    const resetToDefaults = useCallback(() => {
        const d = defaultUserDashboardLayout();
        saveUserDashboardLayoutToStorage(d);
        setLayout(d);
    }, []);

    return { layout, setLayout, updateWidget, reorderWidgets, resetToDefaults, isLoading: !isHydrated };
}
