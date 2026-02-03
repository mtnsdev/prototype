"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { useFolderChildren } from "@/hooks/useFolderChildren";
import { useProxyUrl } from "@/hooks/useProxyUrl";
import { Folder, FileText, ChevronRight, ChevronDown, ExternalLink, Loader2, Search } from "lucide-react";

type TLItem =
    | { kind: "folder"; id: number; parent_id: number; title: string; has_children?: boolean; URI?: string }
    | { kind: "document"; doc_id: number; parent_id: number; title: string; version_num: number; URI?: string };

// Tree node component for recursive rendering
function TreeNode({
    item,
    depth,
    expandedIds,
    onToggleExpand,
    clientCache,
}: {
    item: TLItem;
    depth: number;
    expandedIds: Set<number>;
    onToggleExpand: (id: number) => void;
    clientCache: React.MutableRefObject<Map<number, TLItem[]>>;
}) {
    const isFolder = item.kind === "folder";
    const folderId = isFolder ? item.id : null;
    const isExpanded = folderId !== null && expandedIds.has(folderId);

    // Memoize the onSuccess callback to prevent re-renders
    const handleSuccess = useCallback((next: TLItem[]) => {
        if (folderId !== null) {
            clientCache.current.set(folderId, next);
        }
    }, [folderId, clientCache]);

    // Create stable options object
    const hookOptions = useMemo(() => ({
        enabled: isExpanded && folderId !== null,
        onSuccess: handleSuccess,
    }), [isExpanded, folderId, handleSuccess]);

    // Fetch children only for expanded folders
    const { items: children, loading } = useFolderChildren(
        isExpanded ? folderId : undefined,
        undefined,
        hookOptions
    );

    const cachedChildren = folderId !== null ? clientCache.current.get(folderId) : undefined;
    const displayChildren = cachedChildren ?? children;

    const paddingLeft = 20 + depth * 24; // Base padding + indent per level

    return (
        <div>
            <div
                className={[
                    "flex items-center gap-2 py-2 pr-4",
                    "transition-all duration-150",
                    isFolder ? "hover:bg-white/4 cursor-pointer" : "hover:bg-white/2",
                ].join(" ")}
                style={{ paddingLeft }}
                onClick={() => isFolder && onToggleExpand(item.id)}
            >
                {/* Expand/Collapse indicator for folders */}
                {isFolder ? (
                    <button
                        type="button"
                        className="w-5 h-5 flex items-center justify-center text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5] transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(item.id);
                        }}
                    >
                        {loading ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : isExpanded ? (
                            <ChevronDown size={14} />
                        ) : (
                            <ChevronRight size={14} />
                        )}
                    </button>
                ) : (
                    <div className="w-5" /> // Spacer for documents
                )}

                {/* Icon */}
                <div className={[
                    "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                    isFolder
                        ? "bg-[rgba(122,163,200,0.1)] text-[#7AA3C8]"
                        : "bg-[rgba(245,245,245,0.06)] text-[rgba(245,245,245,0.5)]",
                ].join(" ")}>
                    {isFolder ? <Folder size={14} /> : <FileText size={14} />}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                    <p className={[
                        "text-[13px] truncate",
                        isFolder ? "text-[#F5F5F5] font-medium" : "text-[rgba(245,245,245,0.8)]",
                    ].join(" ")}>
                        {item.title}
                    </p>
                </div>

                {/* Preview button for documents */}
                {item.kind === "document" && (
                    <PreviewButton doc={item} />
                )}
            </div>

            {/* Render children if expanded */}
            {isFolder && isExpanded && displayChildren && displayChildren.length > 0 && (
                <div>
                    {displayChildren.map((child) => (
                        <TreeNode
                            key={child.kind === "folder" ? `f-${child.id}` : `d-${child.doc_id}-${child.version_num}`}
                            item={child}
                            depth={depth + 1}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                            clientCache={clientCache}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function PreviewButton({ doc }: { doc: Extract<TLItem, { kind: "document" }> }) {
    const filePath =
        `/intranet/rest/documents/document/${doc.doc_id}/${doc.version_num}/file` +
        `?parent_id=${doc.parent_id}`;

    const proxyUrl = useProxyUrl({ path: filePath, filename: doc.title });

    const clickLockRef = useRef(false);
    function withClickLock(fn: () => void | Promise<void>) {
        if (clickLockRef.current) return;
        clickLockRef.current = true;
        Promise.resolve(fn()).finally(() => setTimeout(() => (clickLockRef.current = false), 300));
    }

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                withClickLock(() => {
                    if (!proxyUrl) return;
                    window.open(proxyUrl, "_blank", "noopener,noreferrer");
                });
            }}
            className={[
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md",
                "text-[11px] font-medium",
                "bg-[rgba(122,163,200,0.1)] hover:bg-[rgba(122,163,200,0.18)]",
                "border border-[rgba(122,163,200,0.2)] hover:border-[rgba(122,163,200,0.35)]",
                "text-[#7AA3C8] hover:text-[#9BBDD8]",
                "transition-all duration-150",
            ].join(" ")}
        >
            <ExternalLink className="w-3 h-3" />
            Preview
        </button>
    );
}

export default function LibraryView({ initialRootId }: { initialRootId?: number }) {
    const [rootId, setRootId] = useState<number | undefined>(initialRootId);
    const [draftRootId, setDraftRootId] = useState<string>("");
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState<string>("");

    const clientCache = useRef<Map<number, TLItem[]>>(new Map());

    // Memoize the onSuccess callback to prevent re-renders
    const handleRootSuccess = useCallback((next: TLItem[]) => {
        if (rootId !== undefined) {
            clientCache.current.set(rootId, next);
        }
    }, [rootId]);

    // Create stable options object
    const rootHookOptions = useMemo(() => ({
        enabled: rootId !== undefined,
        onSuccess: handleRootSuccess,
    }), [rootId, handleRootSuccess]);

    const { items, loading, error } = useFolderChildren(rootId, undefined, rootHookOptions);

    const cachedItems = rootId !== undefined ? clientCache.current.get(rootId) : undefined;
    const rawDisplayItems = cachedItems ?? items;
    const showLoading = loading && !cachedItems;

    // Filter items by search query (case-insensitive)
    const displayItems = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return rawDisplayItems;
        return rawDisplayItems.filter((item) =>
            item.title.toLowerCase().includes(query)
        );
    }, [rawDisplayItems, searchQuery]);

    function commitRootId() {
        const n = Number(draftRootId);
        if (!Number.isFinite(n) || n < 0) return;
        setExpandedIds(new Set());
        setRootId(n);
    }

    function handleToggleExpand(id: number) {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    if (rootId === undefined) {
        return (
            <div className="h-full flex items-center justify-center bg-[#0C0C0C] p-6">
                <div className="w-full max-w-md rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] p-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center mb-5 border border-white/10">
                        <Folder size={22} className="text-[rgba(245,245,245,0.6)]" />
                    </div>
                    <h2 className="text-[18px] font-semibold text-[#F5F5F5]">Knowledge Library</h2>
                    <p className="mt-2 text-[14px] text-[rgba(245,245,245,0.5)] leading-relaxed">
                        Enter a folder ID to start browsing your documents.
                    </p>

                    <div className="mt-6 flex gap-3">
                        <input
                            type="number"
                            placeholder="Folder ID (e.g., 0)"
                            value={draftRootId}
                            className={[
                                "flex-1 rounded-xl px-4 py-2.5 text-[14px]",
                                "bg-[#0C0C0C] text-[#F5F5F5] placeholder-[rgba(245,245,245,0.35)]",
                                "border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.15)]",
                                "focus:outline-none focus:border-[rgba(255,255,255,0.25)] focus:ring-1 focus:ring-[rgba(255,255,255,0.1)]",
                                "transition-all duration-150",
                            ].join(" ")}
                            onChange={(e) => setDraftRootId(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && commitRootId()}
                        />
                        <button
                            type="button"
                            className={[
                                "px-5 py-2.5 rounded-xl text-[14px] font-medium",
                                "bg-[#F5F5F5] hover:bg-white text-[#0C0C0C]",
                                "disabled:opacity-40 disabled:cursor-not-allowed",
                                "transition-all duration-150",
                            ].join(" ")}
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
        <div className="h-full p-6 flex flex-col min-h-0 bg-[#0C0C0C]">
            {/* Main Content Card */}
            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] overflow-hidden flex flex-col min-h-0 flex-1">
                {/* Header */}
                <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-[15px] font-semibold text-[#F5F5F5]">Knowledge Library</h1>
                        <p className="text-[12px] text-[rgba(245,245,245,0.45)] mt-0.5">
                            {rootId !== undefined ? `Folder ID: ${rootId}` : "Browse documents"}
                        </p>
                    </div>
                    {showLoading && (
                        <div className="flex items-center gap-2 text-[12px] text-[rgba(245,245,245,0.5)]">
                            <Loader2 size={14} className="animate-spin" />
                            <span>Loading...</span>
                        </div>
                    )}
                </div>

                {/* Search Input */}
                <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.08)] shrink-0">
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.4)]"
                        />
                        <input
                            type="text"
                            placeholder="Search documents and folders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={[
                                "w-full rounded-lg pl-10 pr-4 py-2.5 text-[13px]",
                                "bg-[#0C0C0C] text-[#F5F5F5] placeholder-[rgba(245,245,245,0.4)]",
                                "border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.15)]",
                                "focus:outline-none focus:border-[rgba(255,255,255,0.25)] focus:ring-1 focus:ring-[rgba(255,255,255,0.1)]",
                                "transition-all duration-150",
                            ].join(" ")}
                        />
                    </div>
                    <p className="text-[11px] text-[rgba(245,245,245,0.4)] mt-2">
                        Searches within the current folder.
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[12px]">
                        <button
                            type="button"
                            onClick={() => {
                                setRootId(initialRootId ?? 0);
                                setExpandedIds(new Set());
                                setSearchQuery("");
                            }}
                            className="text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5] transition-colors"
                        >
                            Back to root
                        </button>
                        <span className="text-[rgba(245,245,245,0.3)]">|</span>
                        <span className="text-[rgba(245,245,245,0.6)] font-medium">
                            Root ({displayItems.length})
                        </span>
                    </div>
                </div>

                {/* Tree View */}
                <div className="min-h-0 flex-1 overflow-y-auto py-2">
                    {error ? (
                        <div className="px-5 py-6 text-[14px] text-[#C87A7A] bg-[rgba(200,122,122,0.08)] border-b border-[rgba(200,122,122,0.15)]">
                            {error}
                        </div>
                    ) : displayItems.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            {showLoading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 size={24} className="animate-spin text-[rgba(245,245,245,0.4)]" />
                                    <span className="text-[13px] text-[rgba(245,245,245,0.5)]">Loading items...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Folder size={32} className="text-[rgba(245,245,245,0.2)]" />
                                    <span className="text-[14px] text-[rgba(245,245,245,0.5)]">This folder is empty</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            {displayItems.map((item) => (
                                <TreeNode
                                    key={item.kind === "folder" ? `f-${item.id}` : `d-${item.doc_id}-${item.version_num}`}
                                    item={item}
                                    depth={0}
                                    expandedIds={expandedIds}
                                    onToggleExpand={handleToggleExpand}
                                    clientCache={clientCache}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
