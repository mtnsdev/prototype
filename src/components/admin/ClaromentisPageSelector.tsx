"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, Search } from "lucide-react";

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
 * Displays Claromentis page names (no content previews) for allow-list
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
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0C0C0C] overflow-hidden">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[rgba(255,255,255,0.06)]">
                <Search size={14} className="text-[rgba(245,245,245,0.4)] shrink-0" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search pages..."
                    className="flex-1 bg-transparent text-[13px] text-[#F5F5F5] placeholder-[rgba(245,245,245,0.3)] outline-none"
                />
            </div>

            {/* Page list */}
            <div className="max-h-[200px] overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 size={18} className="animate-spin text-[rgba(245,245,245,0.4)]" />
                    </div>
                ) : error ? (
                    <p className="text-[13px] text-[#C87A7A] px-3 py-4">{error}</p>
                ) : pages.length === 0 ? (
                    <p className="text-[13px] text-[rgba(245,245,245,0.4)] px-3 py-4 text-center">
                        {search ? "No pages match your search" : "No Claromentis pages found"}
                    </p>
                ) : (
                    <div className="py-1">
                        {pages.map((page) => {
                            const selected = selectedPageIds.includes(page.id);
                            return (
                                <button
                                    key={page.id}
                                    type="button"
                                    onClick={() => togglePage(page.id)}
                                    className={[
                                        "w-full flex items-center gap-2.5 px-3 py-2 text-left",
                                        "hover:bg-[rgba(255,255,255,0.04)] transition-colors",
                                        selected ? "bg-[rgba(168,85,247,0.08)]" : "",
                                    ].join(" ")}
                                >
                                    <input
                                        type="checkbox"
                                        readOnly
                                        checked={selected}
                                        className="w-3.5 h-3.5 rounded border-[rgba(255,255,255,0.2)] bg-[#0C0C0C] text-purple-500 shrink-0 pointer-events-none"
                                    />
                                    <FileText size={14} className="text-purple-400 shrink-0" />
                                    <span className="text-[13px] text-[#F5F5F5] truncate">{page.title}</span>
                                    {page.is_admin_only && (
                                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 shrink-0">
                                            Admin only
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Selection count */}
            {selectedPageIds.length > 0 && (
                <div className="px-3 py-2 border-t border-[rgba(255,255,255,0.06)] text-[12px] text-[rgba(245,245,245,0.5)]">
                    {selectedPageIds.length} page{selectedPageIds.length !== 1 ? "s" : ""} selected
                </div>
            )}
        </div>
    );
}
