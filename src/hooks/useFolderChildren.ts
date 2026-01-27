"use client";

import { useEffect, useMemo, useState } from "react";
import type { FolderChildrenResponse, TLItem } from "@/lib/claromentis/types";
import { backendGet } from "@/lib/claromentis/backendApi";

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

    const enabled = opts?.enabled ?? true;

    const key = useMemo(
        () => `${id ?? "none"}:${metadata ?? ""}`,
        [id, metadata],
    );

    useEffect(() => {
        let cancelled = false;

        async function run() {
            if (!enabled) return;
            if (id === undefined || id === null) return;

            setLoading(true);
            setError(null);

            try {
                const data = await backendGet<FolderChildrenResponse>(
                    "/api/library/folders",
                    {
                        id,
                        metadata,
                    },
                );

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

    return { items, loading, error, setItems };
}
