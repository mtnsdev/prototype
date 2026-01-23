"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TLItem =
    | {
        kind: "folder";
        id: number;
        parent_id: number;
        title: string;
        has_children?: boolean;
        URI?: string;
    }
    | {
        kind: "document";
        doc_id: number;
        parent_id: number;
        title: string;
        version_num: number;
        URI?: string;
    };

type Crumb = { id: number; title: string };

export default function LibraryView({ initialRootId }: { initialRootId?: number }) {
    const [rootId, setRootId] = useState<number | undefined>(initialRootId);
    const [path, setPath] = useState<Crumb[]>([]);
    const [items, setItems] = useState<TLItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [draftRootId, setDraftRootId] = useState<string>("");

    // client cache: folderId -> children
    const clientCache = useRef<Map<number, TLItem[]>>(new Map());

    const currentId = useMemo(() => {
        if (rootId === undefined) return;
        if (path.length === 0) return rootId;
        return path[path.length - 1]!.id;
    }, [rootId, path]);

    function commitRootId() {
        const n = Number(draftRootId);

        // allow 0 (root)
        if (!Number.isFinite(n) || n < 0) {
            setErr("Please enter a valid folder id (0 or higher)");
            return;
        }

        setErr(null);
        setPath([]);
        setItems([]);
        setRootId(n);
    }

    const clickLockRef = useRef(false);

    function withClickLock(fn: () => void | Promise<void>) {
        if (clickLockRef.current) return;
        clickLockRef.current = true;

        Promise.resolve(fn())
            .catch(() => { })
            .finally(() => {
                setTimeout(() => {
                    clickLockRef.current = false;
                }, 300);
            });
    }

    async function onPreviewDocument(d: Extract<TLItem, { kind: "document" }>) {
        withClickLock(() => {
            const filePath =
                `/intranet/rest/documents/document/${d.doc_id}/${d.version_num}/file` +
                `?parent_id=${d.parent_id}`;

            const url =
                `/api/library/proxy?path=${encodeURIComponent(filePath)}` +
                `&filename=${encodeURIComponent(d.title)}`;

            window.open(url, "_blank", "noopener,noreferrer");
        });
    }

    async function loadChildren(folderId: number) {
        setErr(null);

        const cached = clientCache.current.get(folderId);
        if (cached) {
            setItems(cached);
            return;
        }

        setLoading(true);
        const res = await fetch(`/api/library/folders?id=${folderId}`, { method: "GET" });
        const data = await res.json().catch(() => null);
        setLoading(false);

        if (!res.ok) {
            setErr(data?.error || "Failed to load items");
            return;
        }

        const next = (data?.items ?? []) as TLItem[];
        clientCache.current.set(folderId, next);
        setItems(next);
    }

    // initial load + whenever root changes
    useEffect(() => {
        if (rootId === undefined) return;

        let cancelled = false;

        (async () => {
            setErr(null);

            const cached = clientCache.current.get(rootId);
            if (cached) {
                if (!cancelled) setItems(cached);
                return;
            }

            if (!cancelled) setLoading(true);

            const res = await fetch(`/api/library/folders?id=${rootId}`, { method: "GET" });
            const data = await res.json().catch(() => null);

            if (cancelled) return;

            setLoading(false);

            if (!res.ok) {
                setErr(data?.error || "Failed to load items");
                return;
            }

            const next = (data?.items ?? []) as TLItem[];
            clientCache.current.set(rootId, next);
            setItems(next);
        })();

        return () => {
            cancelled = true;
        };
    }, [rootId]);

    function onClickFolder(f: Extract<TLItem, { kind: "folder" }>) {
        withClickLock(async () => {
            setPath((prev) => [...prev, { id: f.id, title: f.title }]);
            await loadChildren(f.id);
        });
    }

    function onCrumbClick(index: number) {
        const nextPath = path.slice(0, index + 1);
        setPath(nextPath);

        const id = index < 0 ? rootId : nextPath[index]!.id;
        if (id !== undefined) loadChildren(id);
    }

    // If root is unknown, show a safe input
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
                            onKeyDown={(e) => {
                                if (e.key === "Enter") commitRootId();
                            }}
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

                    {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full p-6 flex flex-col min-h-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-white/70 shrink-0">
                <button type="button" className="hover:text-white" onClick={() => onCrumbClick(-1)}>
                    Root ({rootId})
                </button>

                {path.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-2">
                        <span className="text-white/30">/</span>
                        <button type="button" className="hover:text-white" onClick={() => onCrumbClick(i)}>
                            {c.title}
                        </button>
                    </div>
                ))}
            </div>

            {/* List */}
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 overflow-hidden flex flex-col min-h-0 flex-1">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
                    <div>
                        <p className="text-sm font-semibold">Library</p>
                        <p className="text-xs text-white/60">{currentId !== undefined ? `Folder ID: ${currentId}` : ""}</p>
                    </div>

                    {loading && <span className="text-xs text-white/60">Loading…</span>}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    {err ? (
                        <div className="px-4 py-4 text-sm text-red-400">{err}</div>
                    ) : items.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-white/60">No items found.</div>
                    ) : (
                        <ul className="divide-y divide-white/10">
                            {items.map((it) => (
                                <li key={it.kind === "folder" ? `f-${it.id}` : `d-${it.doc_id}`}>
                                    <div className="w-full px-4 py-3 flex items-center justify-between gap-4 hover:bg-white/5">
                                        <button
                                            type="button"
                                            disabled={it.kind === "document"}
                                            onClick={() => {
                                                if (it.kind === "folder") onClickFolder(it);
                                            }}
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
                                            <button
                                                type="button"
                                                onClick={() => onPreviewDocument(it)}
                                                className="text-xs rounded-md border border-white/20 px-3 py-1 hover:bg-white/10"
                                            >
                                                Preview
                                            </button>
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
