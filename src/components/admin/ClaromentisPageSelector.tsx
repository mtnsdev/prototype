"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSearchField } from "@/components/ui/page-search-field";

type ClaromentisPage = {
    id: number;
    title: string;
    parent_id: number | null;
    is_admin_only: boolean;
};

type Props = {
    token: string;
    selectedPageIds: number[];
    onSelectionChange: (ids: number[]) => void;
};

/**
 * Displays intranet page names (no content previews) for allow-list
 * selection in the admin permissions panel.
 */
export default function ClaromentisPageSelector({
    token,
    selectedPageIds,
    onSelectionChange,
}: Props) {
    const [pages, setPages] = useState<ClaromentisPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const fetchPages = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            const res = await fetch(`/api/admin/claromentis/pages?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to load pages");
            const data = await res.json();
            setPages(data.pages || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load pages");
        } finally {
            setLoading(false);
        }
    }, [token, search]);

    useEffect(() => {
        const debounce = setTimeout(() => fetchPages(), 300);
        return () => clearTimeout(debounce);
    }, [fetchPages]);

    const togglePage = (pageId: number) => {
        if (selectedPageIds.includes(pageId)) {
            onSelectionChange(selectedPageIds.filter((id) => id !== pageId));
        } else {
            onSelectionChange([...selectedPageIds, pageId]);
        }
    };

    return (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
            {/* Search */}
            <div className="px-3 py-2 border-b border-border">
                <PageSearchField
                    value={search}
                    onChange={setSearch}
                    placeholder="Search pages…"
                    aria-label="Search pages"
                />
            </div>

            {/* Page list */}
            <div className="max-h-[200px] overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 size={18} className="animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <p className="text-compact text-[var(--color-error)] px-3 py-4">{error}</p>
                ) : pages.length === 0 ? (
                    <p className="text-compact text-muted-foreground px-3 py-4 text-center">
                        {search ? "No pages match your search" : "No intranet pages found"}
                    </p>
                ) : (
                    <div className="py-1">
                        {pages.map((page) => {
                            const selected = selectedPageIds.includes(page.id);
                            return (
                                <Button
                                    key={page.id}
                                    type="button"
                                    variant="ghost"
                                    onClick={() => togglePage(page.id)}
                                    className={`w-full justify-start gap-2.5 px-3 py-2 font-normal h-auto ${selected ? "bg-[rgba(201,169,110,0.08)]" : ""}`}
                                >
                                    <input
                                        type="checkbox"
                                        readOnly
                                        checked={selected}
                                        className="checkbox-on-dark checkbox-on-dark-sm shrink-0 pointer-events-none"
                                    />
                                    <FileText size={14} className="text-brand-cta shrink-0" />
                                    <span className="text-sm text-foreground truncate">{page.title}</span>
                                    {page.is_admin_only && (
                                        <span className="ml-auto text-2xs px-1.5 py-0.5 rounded bg-amber-500/15 text-[var(--color-warning)] shrink-0">
                                            Admin only
                                        </span>
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Selection count */}
            {selectedPageIds.length > 0 && (
                <div className="px-3 py-2 border-t border-border text-sm text-muted-foreground/75">
                    {selectedPageIds.length} page{selectedPageIds.length !== 1 ? "s" : ""} selected
                </div>
            )}
        </div>
    );
}
