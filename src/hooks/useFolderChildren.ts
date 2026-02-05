"use client";

import { useEffect, useMemo, useState } from "react";
import type { FolderChildrenResponse, TLItem } from "@/lib/claromentis/types";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

type UseFolderChildrenOpts = {
    initialItems?: TLItem[];
    enabled?: boolean;
    onSuccess?: (items: TLItem[]) => void;
};

export function useFolderChildren(
    id: number | undefined,
    metadata?: string,
    opts?: UseFolderChildrenOpts,
) {
    const [items, setItems] = useState<TLItem[]>(opts?.initialItems ?? []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Delayed loading to prevent flickering
    const showLoading = useDelayedLoading(loading);

    const enabled = opts?.enabled ?? true;

    const key = useMemo(
        () => `${id ?? "none"}:${metadata ?? ""}`,
        [id, metadata],
    );

    useEffect(() => {
        let cancelled = false;

        const getCookieValue = (name: string) => {
            const prefix = `${name}=`;
            for (const part of document.cookie.split(";")) {
                const trimmed = part.trim();
                if (trimmed.startsWith(prefix)) {
                    return decodeURIComponent(trimmed.slice(prefix.length));
                }
            }
            return "";
        };

        async function run() {
            if (!enabled) return;
            if (id === undefined || id === null) return;

            setLoading(true);
            setError(null);

            try {
                const url = new URL("/api/library/folders", window.location.origin);
                url.searchParams.set("id", String(id));
                if (metadata) url.searchParams.set("metadata", metadata);

                const token = getCookieValue("auth_token");
                const headers = token
                    ? { Authorization: `Bearer ${token}` }
                    : undefined;

                const res = await fetch(url.pathname + url.search, {
                    cache: "no-store",
                    headers,
                });

                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(`Backend error ${res.status}: ${text || res.statusText}`);
                }

                const data = (await res.json()) as FolderChildrenResponse;
                const next = data.items ?? [];

                if (!cancelled) {
                    setItems(next);
                    opts?.onSuccess?.(next);
                }
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Unknown error";
                if (!cancelled) setError(msg);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        run();
        return () => {
            cancelled = true;
        };
    }, [enabled, key, id, metadata, opts]); // opts callbacks assumed stable or inline safe

    return { items, loading, showLoading, error, setItems };
}
