"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    type BriefingUserGridWidgetId,
    type BriefingViewsState,
    type UserDashboardWidgetLayout,
    loadBriefingViewsFromStorage,
    normalizeUserDashboardLayout,
    saveBriefingViewsToStorage,
    newBriefingViewId,
    defaultBriefingViewsState,
    defaultUserDashboardLayout,
} from "@/lib/briefingDashboardUserLayout";

export function useBriefingDashboardLayout(): {
    layout: Record<BriefingUserGridWidgetId, UserDashboardWidgetLayout>;
    setLayout: Dispatch<SetStateAction<Record<BriefingUserGridWidgetId, UserDashboardWidgetLayout>>>;
    updateWidget: (id: BriefingUserGridWidgetId, patch: Partial<UserDashboardWidgetLayout>) => void;
    reorderWidgets: (leftIds: BriefingUserGridWidgetId[], rightIds: BriefingUserGridWidgetId[]) => void;
    resetToDefaults: () => void;
    isLoading: boolean;
    /** Named views */
    viewsState: BriefingViewsState;
    activeViewId: string;
    viewsList: { id: string; name: string }[];
    selectView: (id: string) => void;
    saveLayoutAsNewView: (name: string) => void;
    renameActiveView: (name: string) => void;
    deleteActiveView: () => void;
    canDeleteActiveView: boolean;
} {
    const [viewsState, setViewsState] = useState<BriefingViewsState>(defaultBriefingViewsState);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setViewsState(loadBriefingViewsFromStorage());
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === "briefing_user_dashboard_views_v1") {
                setViewsState(loadBriefingViewsFromStorage());
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const activeRecord = viewsState.views[viewsState.activeViewId];
    const layout = activeRecord?.layout ?? defaultUserDashboardLayout();

    const persist = useCallback((next: BriefingViewsState) => {
        saveBriefingViewsToStorage(next);
        setViewsState(next);
    }, []);

    const setLayout: Dispatch<SetStateAction<Record<BriefingUserGridWidgetId, UserDashboardWidgetLayout>>> = useCallback(
        (action) => {
            setViewsState((prev) => {
                const cur = prev.views[prev.activeViewId];
                if (!cur) return prev;
                const resolved = typeof action === "function" ? action(cur.layout) : action;
                const normalized = normalizeUserDashboardLayout(resolved);
                const next: BriefingViewsState = {
                    ...prev,
                    views: {
                        ...prev.views,
                        [prev.activeViewId]: { ...cur, layout: normalized },
                    },
                };
                saveBriefingViewsToStorage(next);
                return next;
            });
        },
        [],
    );

    const updateWidget = useCallback((id: BriefingUserGridWidgetId, patch: Partial<UserDashboardWidgetLayout>) => {
        setViewsState((prev) => {
            const cur = prev.views[prev.activeViewId];
            if (!cur) return prev;
            const nextLayout = normalizeUserDashboardLayout({
                ...cur.layout,
                [id]: { ...cur.layout[id], ...patch },
            });
            const next: BriefingViewsState = {
                ...prev,
                views: {
                    ...prev.views,
                    [prev.activeViewId]: { ...cur, layout: nextLayout },
                },
            };
            saveBriefingViewsToStorage(next);
            return next;
        });
    }, []);

    const reorderWidgets = useCallback(
        (leftIds: BriefingUserGridWidgetId[], rightIds: BriefingUserGridWidgetId[]) => {
            setViewsState((prev) => {
                const cur = prev.views[prev.activeViewId];
                if (!cur) return prev;
                const nextLayout: Record<BriefingUserGridWidgetId, UserDashboardWidgetLayout> = { ...cur.layout };
                leftIds.forEach((wid, i) => {
                    nextLayout[wid] = { ...nextLayout[wid], column: "left", order: i, visible: true };
                });
                rightIds.forEach((wid, i) => {
                    nextLayout[wid] = { ...nextLayout[wid], column: "right", order: i, visible: true };
                });
                const normalized = normalizeUserDashboardLayout(nextLayout);
                const next: BriefingViewsState = {
                    ...prev,
                    views: {
                        ...prev.views,
                        [prev.activeViewId]: { ...cur, layout: normalized },
                    },
                };
                saveBriefingViewsToStorage(next);
                return next;
            });
        },
        [],
    );

    const resetToDefaults = useCallback(() => {
        setViewsState((prev) => {
            const cur = prev.views[prev.activeViewId];
            if (!cur) return prev;
            const d = defaultUserDashboardLayout();
            const next: BriefingViewsState = {
                ...prev,
                views: {
                    ...prev.views,
                    [prev.activeViewId]: { ...cur, layout: d },
                },
            };
            saveBriefingViewsToStorage(next);
            return next;
        });
    }, []);

    const selectView = useCallback((id: string) => {
        setViewsState((prev) => {
            if (!prev.views[id]) return prev;
            const next = { ...prev, activeViewId: id };
            saveBriefingViewsToStorage(next);
            return next;
        });
    }, []);

    const saveLayoutAsNewView = useCallback((name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        setViewsState((prev) => {
            const cur = prev.views[prev.activeViewId];
            if (!cur) return prev;
            const layoutCopy = normalizeUserDashboardLayout({ ...cur.layout });
            const newId = newBriefingViewId();
            const next: BriefingViewsState = {
                activeViewId: newId,
                views: {
                    ...prev.views,
                    [newId]: { name: trimmed, layout: layoutCopy },
                },
            };
            saveBriefingViewsToStorage(next);
            return next;
        });
    }, []);

    const renameActiveView = useCallback((name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        setViewsState((prev) => {
            const cur = prev.views[prev.activeViewId];
            if (!cur) return prev;
            const next: BriefingViewsState = {
                ...prev,
                views: {
                    ...prev.views,
                    [prev.activeViewId]: { ...cur, name: trimmed },
                },
            };
            saveBriefingViewsToStorage(next);
            return next;
        });
    }, []);

    const deleteActiveView = useCallback(() => {
        setViewsState((prev) => {
            const ids = Object.keys(prev.views);
            if (ids.length <= 1) return prev;
            const { [prev.activeViewId]: _removed, ...rest } = prev.views;
            const nextActive = ids.find((id) => id !== prev.activeViewId) ?? Object.keys(rest)[0];
            const next: BriefingViewsState = {
                activeViewId: nextActive,
                views: rest,
            };
            saveBriefingViewsToStorage(next);
            return next;
        });
    }, []);

    const viewsList = useMemo(
        () =>
            Object.entries(viewsState.views).map(([id, v]) => ({
                id,
                name: v.name,
            })),
        [viewsState.views],
    );

    const canDeleteActiveView = Object.keys(viewsState.views).length > 1;

    return {
        layout,
        setLayout,
        updateWidget,
        reorderWidgets,
        resetToDefaults,
        isLoading: !isHydrated,
        viewsState,
        activeViewId: viewsState.activeViewId,
        viewsList,
        selectView,
        saveLayoutAsNewView,
        renameActiveView,
        deleteActiveView,
        canDeleteActiveView,
    };
}
