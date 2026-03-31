"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    directoryFilterSelectContentClass,
    directoryFilterSelectItemClass,
    directoryFilterSelectTriggerClass,
    directoryFilterTextInputClass,
    PageSearchField,
} from "@/components/ui/page-search-field";

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

const OBJECT_TYPE_LABELS: Record<ObjectType, string> = {
    "document,folder": "Documents + folders",
    document: "Documents only",
    folder: "Folders only",
};

export default function IntranetSearchPanel() {
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

        // FE sends YYYY-MM-DD, backend should convert to YYYYMMDD for intranet API
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
            <div className="shrink-0 rounded-xl border border-border bg-popover p-4">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
                        <PageSearchField
                            value={form.q}
                            onChange={(value) => setForm((p) => ({ ...p, q: value }))}
                            placeholder="Search…"
                            aria-label="Search query"
                            className="min-w-0 flex-1 md:min-w-[200px]"
                        />

                        <Select
                            value={form.objectType}
                            onValueChange={(v) => setForm((p) => ({ ...p, objectType: v as ObjectType }))}
                        >
                            <SelectTrigger
                                className={cn(directoryFilterSelectTriggerClass, "w-[min(100%,200px)] max-w-[240px]")}
                            >
                                <SelectValue placeholder="Type">
                                    {OBJECT_TYPE_LABELS[form.objectType]}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className={directoryFilterSelectContentClass}>
                                <SelectItem className={directoryFilterSelectItemClass} value="document,folder">
                                    Documents + Folders
                                </SelectItem>
                                <SelectItem className={directoryFilterSelectItemClass} value="document">
                                    Documents only
                                </SelectItem>
                                <SelectItem className={directoryFilterSelectItemClass} value="folder">
                                    Folders only
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={String(form.limit)}
                            onValueChange={(v) => setForm((p) => ({ ...p, limit: Number(v) }))}
                        >
                            <SelectTrigger
                                className={cn(directoryFilterSelectTriggerClass, "w-[min(100%,120px)]")}
                            >
                                <SelectValue>{form.limit} / page</SelectValue>
                            </SelectTrigger>
                            <SelectContent className={directoryFilterSelectContentClass}>
                                <SelectItem className={directoryFilterSelectItemClass} value="10">
                                    10 / page
                                </SelectItem>
                                <SelectItem className={directoryFilterSelectItemClass} value="20">
                                    20 / page
                                </SelectItem>
                                <SelectItem className={directoryFilterSelectItemClass} value="50">
                                    50 / page
                                </SelectItem>
                                <SelectItem className={directoryFilterSelectItemClass} value="100">
                                    100 / page
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            type="button"
                            onClick={onSearchClick}
                            disabled={!canSearch || loading}
                            className="md:ml-auto"
                        >
                            Search
                        </Button>
                    </div>

                    <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
                        <div className="flex items-center gap-2">
                            <span className="w-24 text-xs text-muted-foreground">Created from</span>
                            <Input
                                type="date"
                                value={form.createdFrom}
                                onChange={(e) => setForm((p) => ({ ...p, createdFrom: e.target.value }))}
                                className={cn(directoryFilterTextInputClass, "w-[140px]")}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="w-24 text-xs text-muted-foreground">Created to</span>
                            <Input
                                type="date"
                                value={form.createdTo}
                                onChange={(e) => setForm((p) => ({ ...p, createdTo: e.target.value }))}
                                className={cn(directoryFilterTextInputClass, "w-[140px]")}
                            />
                        </div>

                        <div className="hidden flex-1 md:block" />

                        <p className="flex items-center text-xs text-muted-foreground">
                            Results loaded: <span className="ml-1 tabular-nums text-foreground">{totalText}</span>
                            {loading ? <span className="ml-2 text-muted-foreground">Loading…</span> : null}
                        </p>
                    </div>

                    {error ? (
                        <div className="text-sm text-[var(--muted-error-text)]">{error}</div>
                    ) : null}
                </div>
            </div>

            {/* Results (scrollable) */}
            <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex shrink-0 items-center justify-end border-b border-border px-4 py-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onNextPage}
                        disabled={!lastPage?.next_offset || loading}
                        className="text-xs"
                    >
                        Next page
                    </Button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    {loadedItems.length === 0 && submitted && !loading && !error ? (
                        <div className="px-4 py-6 text-sm text-muted-foreground">No results.</div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {loadedItems.map((it) => {
                                const previewUrl = getPreviewUrl(it);

                                return (
                                    <li key={it.kind === "folder" ? `f-${it.id}` : `d-${it.doc_id}-${it.version_num}`}>
                                        <div className="flex w-full items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm text-foreground">{it.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {it.kind === "folder"
                                                        ? `Folder · id ${it.id}`
                                                        : `Document · id ${it.doc_id} · v${it.version_num}`}
                                                </p>
                                            </div>

                                            {it.kind === "document" ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!previewUrl}
                                                    onClick={() => {
                                                        if (!previewUrl) return;
                                                        window.open(previewUrl, "_blank", "noopener,noreferrer");
                                                    }}
                                                    className="text-xs"
                                                >
                                                    Preview
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">folder</span>
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
