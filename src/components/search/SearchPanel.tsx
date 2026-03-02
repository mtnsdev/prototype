"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type TLItem =
    | { kind: "folder"; id: number; parent_id: number; title: string; has_children?: boolean; URI?: string }
    | { kind: "document"; doc_id: number; parent_id: number; title: string; version_num: number; URI?: string };

type TLSearchResult = {
    items: TLItem[];
    limit: number;
    offset: number;
    next_offset?: number | null;
    total?: number | null;
};

type ObjectType = "document,folder" | "document" | "folder";

type SearchFormState = {
    q: string;
    createdFrom: string;
    createdTo: string;
    limit: number;
    objectType: ObjectType;
};

const SEARCH_ENDPOINT = "/api/library/search";
const PROXY_ENDPOINT = "/api/library/proxy";

export default function ClaromentisSearchPanel() {
    const [form, setForm] = useState<SearchFormState>({
        q: "",
        createdFrom: "",
        createdTo: "",
        limit: 20,
        objectType: "document,folder",
    });

    const [submitted, setSubmitted] = useState<SearchFormState | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [pages, setPages] = useState<TLSearchResult[]>([]);
    const loadedItems = useMemo(() => pages.flatMap((p) => p.items), [pages]);
    const lastPage = pages.length ? pages[pages.length - 1] : null;

    const canSearch = useMemo(() => {
        const qOk = form.q.trim().length > 0;
        const dateOk = form.createdFrom.trim().length > 0 || form.createdTo.trim().length > 0;
        return qOk || dateOk;
    }, [form.q, form.createdFrom, form.createdTo]);

    const totalText = useMemo(() => {
        if (!lastPage) return "0";
        return lastPage.total != null ? `${loadedItems.length} / ${lastPage.total}` : `${loadedItems.length}`;
    }, [lastPage, loadedItems.length]);

    function buildSearchUrl(offset: number) {
        if (!submitted) throw new Error("Search not submitted");

        const url = new URL(SEARCH_ENDPOINT, window.location.origin);
        url.searchParams.set("limit", String(submitted.limit));
        url.searchParams.set("offset", String(offset));
        url.searchParams.set("object_type", submitted.objectType);

        const qq = submitted.q.trim();
        if (qq) url.searchParams.set("q", qq);

        // FE sends YYYY-MM-DD, backend should convert to YYYYMMDD for Claromentis
        if (submitted.createdFrom.trim()) url.searchParams.set("created_from", submitted.createdFrom.trim());
        if (submitted.createdTo.trim()) url.searchParams.set("created_to", submitted.createdTo.trim());

        return url.toString();
    }

    function buildProxyUrl(path: string, filename: string) {
        const url = new URL(PROXY_ENDPOINT, window.location.origin);
        url.searchParams.set("path", path);
        url.searchParams.set("filename", filename);
        return url.toString();
    }

    function getPreviewUrl(it: TLItem): string | null {
        if (it.kind !== "document") return null;

        // For search results, backend likely sets URI to view.url or href
        // which is already a valid intranet path (/intranet/...)
        if (it.URI && it.URI.startsWith("/")) {
            return buildProxyUrl(it.URI, it.title);
        }

        // For browse results (where version_num exists), we can build the REST file URL
        if (it.version_num > 0) {
            const path =
                `/intranet/rest/documents/document/${it.doc_id}/${it.version_num}/file` +
                `?parent_id=${it.parent_id}`;
            return buildProxyUrl(path, it.title);
        }

        return null;
    }

    async function fetchPage(offset: number, mode: "replace" | "append") {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(buildSearchUrl(offset), { method: "GET" });
            const text = await res.text();
            if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

            const data = JSON.parse(text) as TLSearchResult;

            setPages((prev) => (mode === "replace" ? [data] : [...prev, data]));
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Search failed";
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    function onSearchClick() {
        if (!canSearch) return;
        setPages([]);
        setSubmitted({ ...form });
    }

    function onNextPage() {
        if (!submitted) return;
        const next = lastPage?.next_offset ?? null;
        if (next === null) return;
        fetchPage(next, "append");
    }

    // Only runs when user clicks Search
    useEffect(() => {
        if (!submitted) return;
        fetchPage(0, "replace");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submitted]);

    return (
        <div className="h-full min-h-0 flex flex-col">
            {/* Controls */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 shrink-0">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row gap-2">
                        <input
                            value={form.q}
                            onChange={(e) => setForm((p) => ({ ...p, q: e.target.value }))}
                            placeholder="Search…"
                            className="flex-1 rounded-md border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
                        />

                        <Select
                            value={form.objectType}
                            onValueChange={(v) => setForm((p) => ({ ...p, objectType: v as ObjectType }))}
                        >
                            <SelectTrigger className="rounded-md border border-white/15 bg-black px-3 py-2 text-sm text-white focus:ring-2 focus:ring-white/40 w-fit">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="document,folder">Documents + Folders</SelectItem>
                                <SelectItem value="document">Documents only</SelectItem>
                                <SelectItem value="folder">Folders only</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={String(form.limit)}
                            onValueChange={(v) => setForm((p) => ({ ...p, limit: Number(v) }))}
                        >
                            <SelectTrigger className="rounded-md border border-white/15 bg-black px-3 py-2 text-sm text-white focus:ring-2 focus:ring-white/40 w-fit">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 / page</SelectItem>
                                <SelectItem value="20">20 / page</SelectItem>
                                <SelectItem value="50">50 / page</SelectItem>
                                <SelectItem value="100">100 / page</SelectItem>
                            </SelectContent>
                        </Select>

                        <button
                            type="button"
                            onClick={onSearchClick}
                            disabled={!canSearch || loading}
                            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-60 md:ml-auto"
                        >
                            Search
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-white/60 w-24">Created from</span>
                            <input
                                type="date"
                                value={form.createdFrom}
                                onChange={(e) => setForm((p) => ({ ...p, createdFrom: e.target.value }))}
                                className="rounded-md border border-white/15 bg-black px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-white/60 w-24">Created to</span>
                            <input
                                type="date"
                                value={form.createdTo}
                                onChange={(e) => setForm((p) => ({ ...p, createdTo: e.target.value }))}
                                className="rounded-md border border-white/15 bg-black px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                            />
                        </div>

                        <div className="flex-1" />

                        <p className="text-xs text-white/60 flex items-center">
                            Results loaded: <span className="ml-1 text-white/80">{totalText}</span>
                            {loading ? <span className="ml-2">Loading…</span> : null}
                        </p>
                    </div>

                    {error ? <div className="text-sm text-red-400">{error}</div> : null}
                </div>
            </div>

            {/* Results (scrollable) */}
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 min-h-0 flex-1 overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-end shrink-0">
                    <button
                        type="button"
                        onClick={onNextPage}
                        disabled={!lastPage?.next_offset || loading}
                        className="text-xs rounded-md border border-white/20 px-3 py-1 hover:bg-white/10 disabled:opacity-60"
                    >
                        Next page
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    {loadedItems.length === 0 && submitted && !loading && !error ? (
                        <div className="px-4 py-6 text-sm text-white/60">No results.</div>
                    ) : (
                        <ul className="divide-y divide-white/10">
                            {loadedItems.map((it) => {
                                const previewUrl = getPreviewUrl(it);

                                return (
                                    <li key={it.kind === "folder" ? `f-${it.id}` : `d-${it.doc_id}-${it.version_num}`}>
                                        <div className="w-full px-4 py-3 flex items-center justify-between gap-4 hover:bg-white/5">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm truncate">{it.title}</p>
                                                <p className="text-xs text-white/50">
                                                    {it.kind === "folder"
                                                        ? `Folder • id ${it.id}`
                                                        : `Document • id ${it.doc_id} • v${it.version_num}`}
                                                </p>
                                            </div>

                                            {it.kind === "document" ? (
                                                <button
                                                    type="button"
                                                    disabled={!previewUrl}
                                                    onClick={() => {
                                                        if (!previewUrl) return;
                                                        window.open(previewUrl, "_blank", "noopener,noreferrer");
                                                    }}
                                                    className="text-xs rounded-md border border-white/20 px-3 py-1 hover:bg-white/10 disabled:opacity-60"
                                                >
                                                    Preview
                                                </button>
                                            ) : (
                                                <span className="text-xs text-white/50">folder</span>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
