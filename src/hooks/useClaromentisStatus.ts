"use client";

import { useCallback, useEffect, useState } from "react";

type ClaromentisStatus = {
    status: "active" | "error" | "disconnected";
    claromentis_username?: string | null;
    claromentis_base_url?: string | null;
    last_connected_at?: string | null;
};

export function useClaromentisStatus() {
    const [status, setStatus] = useState<ClaromentisStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
            if (!token) {
                setLoading(false);
                return;
            }
            const res = await fetch("/api/integrations/claromentis/status", {
                cache: "no-store",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                setStatus(null);
                return;
            }
            const data: ClaromentisStatus = await res.json();
            setStatus(data);
        } catch {
            setStatus(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    return { status, loading, refetch: fetchStatus };
}
