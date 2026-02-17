"use client";

import { useCallback, useEffect, useState } from "react";
import type { DriveStatus } from "@/types/google-drive";

export function useGoogleDriveStatus(connectionType: "personal" | "agency") {
    const [status, setStatus] = useState<DriveStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
            if (!token) {
                setLoading(false);
                return;
            }
            const res = await fetch(
                `/api/integrations/google-drive/status?connection_type=${connectionType}`,
                {
                    cache: "no-store",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (res.status === 401) {
                setStatus(null);
                setLoading(false);
                return;
            }
            if (!res.ok) throw new Error("Failed to fetch Drive status");
            const data: DriveStatus = await res.json();
            setStatus(data);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load");
            setStatus(null);
        } finally {
            setLoading(false);
        }
    }, [connectionType]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    return { status, loading, error, refetch: fetchStatus };
}
