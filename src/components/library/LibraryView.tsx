"use client";

import { useMemo, useRef, useState } from "react";
import { useFolderChildren } from "@/hooks/useFolderChildren";
import { useProxyUrl } from "@/hooks/useProxyUrl";

type TLItem =
    | { kind: "folder"; id: number; parent_id: number; title: string; has_children?: boolean; URI?: string }
    | { kind: "document"; doc_id: number; parent_id: number; title: string; version_num: number; URI?: string };

type Crumb = { id: number; title: string };

export default function LibraryView({ initialRootId }: { initialRootId?: number }) {
    const [rootId, setRootId] = useState<number | undefined>(initialRootId);
    const [path, setPath] = useState<Crumb[]>([]);
    const [draftRootId, setDraftRootId] = useState<string>("");

    const clientCache = useRef<Map<number, TLItem[]>>(new Map());

    const currentId = useMemo(() => {
        if (rootId === undefined) return undefined;
        if (path.length === 0) return rootId;
        return path[path.length - 1]!.id;
    }, [rootId, path]);

    const getCachedItems = (id: number | undefined) => {
        if (id === undefined) return undefined;
        return clientCache.current.get(id);
    };

    const cachedForCurrent = getCachedItems(currentId);

    const { items, loading, error } = useFolderChildren(currentId, undefined, {
        // keep this if your hook supports it, but we won't rely on it
        initialItems: cachedForCurrent,
        enabled: currentId !== undefined && cachedForCurrent === undefined,
        onSuccess: (next) => {
            if (currentId !== undefined) clientCache.current.set(currentId, next as TLItem[]);
        },
    });

    // Use currentId as dependency to force recalculation when navigating
    const visibleItems = useMemo(() => {
        const cached = getCachedItems(currentId);
        return cached ?? items;
    }, [currentId, items]);

    // Optional: only show "Loading…" when we have nothing to show yet
    const showLoading = loading && !cachedForCurrent;

    const clickLockRef = useRef(false);
    function withClickLock(fn: () => void | Promise<void>) {
        if (clickLockRef.current) return;
        clickLockRef.current = true;
        Promise.resolve(fn()).finally(() => setTimeout(() => (clickLockRef.current = false), 300));
    }

    function commitRootId() {
        const n = Number(draftRootId);
        if (!Number.isFinite(n) || n < 0) return;
        setPath([]);
        setRootId(n);
    }

    function onClickFolder(f: Extract<TLItem, { kind: "folder" }>) {
        withClickLock(() => {
            setPath((prev) => [...prev, { id: f.id, title: f.title }]);
        });
    }

    function onCrumbClick(index: number) {
        const nextPath = index < 0 ? [] : path.slice(0, index + 1);
        setPath(nextPath);
    }

    function PreviewButton({ doc }: { doc: Extract<TLItem, { kind: "document" }> }) {
        const filePath =
            `/intranet/rest/documents/document/${doc.doc_id}/${doc.version_num}/file` +
            `?parent_id=${doc.parent_id}`;

        const proxyUrl = useProxyUrl({ path: filePath, filename: doc.title });

        return (
            <button
                type="button"
                onClick={() =>
                    withClickLock(() => {
                        if (!proxyUrl) return;
                        window.open(proxyUrl, "_blank", "noopener,noreferrer");
                    })
                }
                className="text-xs rounded-md border border-white/20 px-3 py-1 hover:bg-white/10"
            >
                Preview
            </button>
        );
    }

    if (rootId === undefined) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-130 rounded-xl border border-white/10 bg-white/5 p-6">
                    <h2 className="text-lg font-semibold">Library</h2>
                    <p className="mt-2 text-sm text-white/60">
                        Root folder id is missing. Enter a folder id to start browsing.
                    </p>

                    <div className="mt-4 flex gap-2">
                        <input
                            type="number"
                            placeholder="Root folder at → 0"
                            value={draftRootId}
                            className="flex-1 rounded-md border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
                            onChange={(e) => setDraftRootId(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && commitRootId()}
                        />
                        <button
                            type="button"
                            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
                            onClick={commitRootId}
                            disabled={!draftRootId.trim()}
                        >
                            Load
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full p-6 flex flex-col min-h-0">
            <div className="flex items-center gap-2 text-sm text-white/70 shrink-0">
                <button type="button" className="hover:text-white" onClick={() => onCrumbClick(-1)}>
                    Root ({rootId})
                </button>
                {path.map((c, i) => (
                    <div key={`${c.id}-${i}`} className="flex items-center gap-2">
                        <span className="text-white/30">/</span>
                        <button type="button" className="hover:text-white" onClick={() => onCrumbClick(i)}>
                            {c.title}
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 overflow-hidden flex flex-col min-h-0 flex-1">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
                    <div>
                        <p className="text-sm font-semibold">Library</p>
                        <p className="text-xs text-white/60">{currentId !== undefined ? `Folder ID: ${currentId}` : ""}</p>
                    </div>
                    {showLoading && <span className="text-xs text-white/60">Loading…</span>}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    {error ? (
                        <div className="px-4 py-4 text-sm text-red-400">{error}</div>
                    ) : visibleItems.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-white/60">
                            {showLoading ? <span className="text-xs text-white/60">Loading…</span> : "No items."}
                        </div>
                    ) : (
                        <ul className="divide-y divide-white/10">
                            {visibleItems.map((it) => (
                                <li key={it.kind === "folder" ? `f-${it.id}` : `d-${it.doc_id}-${it.version_num}`}>
                                    <div className="w-full px-4 py-3 flex items-center justify-between gap-4 hover:bg-white/5">
                                        <button
                                            type="button"
                                            disabled={it.kind === "document"}
                                            onClick={() => it.kind === "folder" && onClickFolder(it)}
                                            className={[
                                                "text-left flex-1 min-w-0 flex items-center gap-3",
                                                it.kind === "document" ? "cursor-default text-white/70" : "hover:text-white",
                                            ].join(" ")}
                                        >
                                            <span className="text-white/40 text-xs w-16 shrink-0">
                                                {it.kind === "folder" ? "Folder" : "Document"}
                                            </span>
                                            <p className="text-sm truncate">{it.title}</p>
                                        </button>

                                        {it.kind === "document" ? (
                                            <PreviewButton doc={it} />
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => onClickFolder(it)}
                                                className="text-xs rounded-md border border-white/20 px-3 py-1 hover:bg-white/10"
                                            >
                                                Open
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
