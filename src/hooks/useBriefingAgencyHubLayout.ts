"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import {
    BRIEFING_AGENCY_HUB_USER_STORAGE_KEY,
    type AgencyHubUserWidgetId,
    type AgencyHubUserWidgetLayout,
    defaultAgencyHubUserLayout,
    loadAgencyHubUserLayoutFromStorage,
    parseAgencyHubUserLayoutJson,
    saveAgencyHubUserLayoutToStorage,
} from "@/lib/briefingAgencyHubUserLayout";

export function useBriefingAgencyHubLayout(): {
    layout: Record<AgencyHubUserWidgetId, AgencyHubUserWidgetLayout>;
    setLayout: Dispatch<SetStateAction<Record<AgencyHubUserWidgetId, AgencyHubUserWidgetLayout>>>;
    updateWidget: (id: AgencyHubUserWidgetId, patch: Partial<AgencyHubUserWidgetLayout>) => void;
    resetToDefaults: () => void;
    isLoading: boolean;
} {
    const [layout, setLayout] =
        useState<Record<AgencyHubUserWidgetId, AgencyHubUserWidgetLayout>>(defaultAgencyHubUserLayout);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setLayout(loadAgencyHubUserLayoutFromStorage());
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === BRIEFING_AGENCY_HUB_USER_STORAGE_KEY) {
                setLayout(parseAgencyHubUserLayoutJson(e.newValue));
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const updateWidget = useCallback((id: AgencyHubUserWidgetId, patch: Partial<AgencyHubUserWidgetLayout>) => {
        setLayout((prev) => {
            const next = { ...prev, [id]: { ...prev[id], ...patch } };
            saveAgencyHubUserLayoutToStorage(next);
            return next;
        });
    }, []);

    const resetToDefaults = useCallback(() => {
        const d = defaultAgencyHubUserLayout();
        saveAgencyHubUserLayoutToStorage(d);
        setLayout(d);
    }, []);

    return { layout, setLayout, updateWidget, resetToDefaults, isLoading: !isHydrated };
}
