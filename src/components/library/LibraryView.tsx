"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useFolderChildren } from "@/hooks/useFolderChildren";
import { useProxyUrl } from "@/hooks/useProxyUrl";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { useDriveFiles } from "@/hooks/useDriveFiles";
import { usePages, type PageItem } from "@/hooks/usePages";
import { Folder, FileText, BookOpen, ChevronRight, ChevronDown, Eye, Loader2, Search, Cloud, Shield, Lock, Globe, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PdfModal from "@/components/dashboard/PdfModal";
import SyncStatusButton from "@/components/library/SyncStatusButton";
import type { DriveFile } from "@/types/google-drive";

// ---------------------------------------------------------------------------
// Intranet library types (existing)
// ---------------------------------------------------------------------------
type TLItem =
    | { kind: "folder"; id: number; parent_id: number; title: string; has_children?: boolean; URI?: string }
    | { kind: "document"; doc_id: number; parent_id: number; title: string; version_num: number; URI?: string }
    | PageItem;

type TLSearchResult = {
    documents: Exclude<TLItem, PageItem>[];
    pages: PageItem[];
    limit: number;
    offset: number;
    next_offset?: number | null;
    total?: number | null;
};

const SEARCH_ENDPOINT = "/api/library/search";
const PROXY_ENDPOINT = "/api/library/proxy";

type PdfModalState = {
    isOpen: boolean;
    filename: string;
    customUrl: string;
    pdfPath?: string; // S3 key for knowledge library pages (fetched via POST /api/document/pdf)
};

// ---------------------------------------------------------------------------
// Props for LibraryView
// ---------------------------------------------------------------------------
type LibraryViewProps = {
    initialRootId?: number;
    source?: "claromentis" | "google-drive";
    connectionType?: "personal" | "agency";
};

// ===========================================================================
// GOOGLE DRIVE: Virtual tree types and helpers
// ===========================================================================
type DriveTreeNode = {
    kind: "folder" | "file";
    name: string;
    path: string;
    uniqueKey: string; // stable unique key for React rendering
    file?: DriveFile;
    children: DriveTreeNode[];
};

/** Build a virtual folder tree from flat DriveFile[] using drive_path. */
function buildDriveTree(files: DriveFile[]): DriveTreeNode[] {
    const root: DriveTreeNode = { kind: "folder", name: "", path: "", uniqueKey: "folder-root", children: [] };

    for (const file of files) {
        const pathParts = (file.drive_path || "").split("/").filter(Boolean);
        let current = root;

        if (file.is_folder) {
            // Ensure folder path exists in tree
            for (let i = 0; i < pathParts.length; i++) {
                const part = pathParts[i];
                const partPath = pathParts.slice(0, i + 1).join("/");
                let child = current.children.find((c) => c.kind === "folder" && c.name === part && c.path === partPath);
                if (!child) {
                    child = { kind: "folder", name: part, path: partPath, uniqueKey: `folder-${partPath}`, children: [] };
                    current.children.push(child);
                }
                // Attach the DriveFile to the final folder node (use its DB id for key)
                if (i === pathParts.length - 1) {
                    child.file = file;
                    child.uniqueKey = `folder-${file.id}`;
                }
                current = child;
            }
        } else {
            // File: place into its parent folder
            const parentParts = pathParts.slice(0, -1);
            let parent = root;
            for (let i = 0; i < parentParts.length; i++) {
                const part = parentParts[i];
                const partPath = parentParts.slice(0, i + 1).join("/");
                let child = parent.children.find((c) => c.kind === "folder" && c.name === part && c.path === partPath);
                if (!child) {
                    child = { kind: "folder", name: part, path: partPath, uniqueKey: `folder-${partPath}`, children: [] };
                    parent.children.push(child);
                }
                parent = child;
            }
            parent.children.push({
                kind: "file",
                name: file.filename || pathParts[pathParts.length - 1] || "Untitled",
                path: file.drive_path || "",
                uniqueKey: `file-${file.id}`,
                file,
                children: [],
            });
        }
    }

    // Sort: folders first, then files, alphabetically
    function sortTree(nodes: DriveTreeNode[]) {
        nodes.sort((a, b) => {
            if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        for (const node of nodes) {
            if (node.children.length > 0) sortTree(node.children);
        }
    }
    sortTree(root.children);

    return root.children;
}

// Access level badge component
function AccessLevelBadge({ level }: { level?: string }) {
    if (!level) return null;

    const config: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
        public: {
            label: "Public",
            icon: <Globe size={10} />,
            className: "bg-green-500/15 text-green-400 border-green-500/25",
        },
        admin_only: {
            label: "Admin only",
            icon: <Lock size={10} />,
            className: "bg-amber-500/15 text-amber-400 border-amber-500/25",
        },
        user_specific: {
            label: "Restricted",
            icon: <Shield size={10} />,
            className: "bg-blue-500/15 text-blue-400 border-blue-500/25",
        },
        role_restricted: {
            label: "Role restricted",
            icon: <Shield size={10} />,
            className: "bg-purple-500/15 text-purple-400 border-purple-500/25",
        },
    };

    const c = config[level];
    if (!c) return null;

    return (
        <span
            className={[
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border",
                c.className,
            ].join(" ")}
        >
            {c.icon}
            {c.label}
        </span>
    );
}

// Drive preview button for files
function DrivePreviewButton({
    file,
    onPreview,
}: {
    file: DriveFile;
    onPreview: (fileId: number, filename: string) => void;
}) {
    if (file.is_folder) return null;
    if (file.sync_status !== "synced" && file.index_status !== "indexed") return null;

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onPreview(file.id, file.filename || "document");
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
            <Eye className="w-3 h-3" />
            Preview
        </button>
    );
}

// Drive tree node component
function DriveTreeNodeItem({
    node,
    depth,
    expandedPaths,
    onToggleExpand,
    showAccessLevel,
    onPreview,
}: {
    node: DriveTreeNode;
    depth: number;
    expandedPaths: Set<string>;
    onToggleExpand: (path: string) => void;
    showAccessLevel: boolean;
    onPreview: (fileId: number, filename: string) => void;
}) {
    const isFolder = node.kind === "folder";
    const isExpanded = isFolder && expandedPaths.has(node.path);
    const hasChildren = isFolder && node.children.length > 0;
    const paddingLeft = 20 + depth * 24;

    return (
        <div>
            <div
                className={[
                    "flex items-center gap-2 py-2 pr-4",
                    "transition-all duration-150",
                    isFolder && hasChildren ? "hover:bg-white/4 cursor-pointer" : "hover:bg-white/2",
                ].join(" ")}
                style={{ paddingLeft }}
                onClick={() => isFolder && hasChildren && onToggleExpand(node.path)}
            >
                {/* Expand/Collapse indicator */}
                {isFolder && hasChildren ? (
                    <button
                        type="button"
                        className="w-5 h-5 flex items-center justify-center text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5] transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(node.path);
                        }}
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                ) : (
                    <div className="w-5" />
                )}

                {/* Icon */}
                <div
                    className={[
                        "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                        isFolder
                            ? "bg-[rgba(122,163,200,0.1)] text-[#7AA3C8]"
                            : "bg-[rgba(245,245,245,0.06)] text-[rgba(245,245,245,0.5)]",
                    ].join(" ")}
                >
                    {isFolder ? <Folder size={14} /> : <FileText size={14} />}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                    <p
                        className={[
                            "text-[13px] truncate",
                            isFolder ? "text-[#F5F5F5] font-medium" : "text-[rgba(245,245,245,0.8)]",
                        ].join(" ")}
                    >
                        {node.name}
                    </p>
                </div>

                {/* Access level badge (agency only) */}
                {showAccessLevel && node.file && !isFolder && (
                    <AccessLevelBadge level={node.file.access_level} />
                )}

                {/* Sync status indicator */}
                {node.file && !isFolder && node.file.index_status === "pending" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">
                        Indexing...
                    </span>
                )}

                {/* Preview button for synced files */}
                {node.file && !isFolder && (
                    <DrivePreviewButton file={node.file} onPreview={onPreview} />
                )}
            </div>

            {/* Children */}
            {isFolder && isExpanded && node.children.length > 0 && (
                <div>
                    {node.children.map((child) => (
                        <DriveTreeNodeItem
                            key={child.uniqueKey}
                            node={child}
                            depth={depth + 1}
                            expandedPaths={expandedPaths}
                            onToggleExpand={onToggleExpand}
                            showAccessLevel={showAccessLevel}
                            onPreview={onPreview}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ===========================================================================
// GOOGLE DRIVE: Main content view
// ===========================================================================
/** Format timestamp to match SyncStatusButton (HH:MM DD/MM) for consistent refresh UI across integrations */
function formatRefreshTimestamp(date: Date): string {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${hours}:${minutes} ${day}/${month}`;
}

function DriveLibraryContent({
    connectionType = "personal",
}: {
    connectionType?: "personal" | "agency";
}) {
    const { files, loading, error, refetch } = useDriveFiles(connectionType, { includeFolders: true });
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
    const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
    const showAccessLevel = connectionType === "agency";

    const showLoading = useDelayedLoading(loading);

    const handleRefresh = useCallback(async () => {
        await refetch();
        setLastRefreshedAt(new Date());
    }, [refetch]);

    // Preview modal state
    const [previewModal, setPreviewModal] = useState<{
        isOpen: boolean;
        filename: string;
        blobUrl: string;
        loading: boolean;
        error: string | null;
    }>({ isOpen: false, filename: "", blobUrl: "", loading: false, error: null });
    const blobUrlRef = useRef<string | null>(null);

    const handlePreview = useCallback(async (fileId: number, filename: string) => {
        // Clean up old blob URL
        if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
        }

        setPreviewModal({ isOpen: true, filename, blobUrl: "", loading: true, error: null });

        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(
                `/api/integrations/google-drive/files/${fileId}/download`,
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Failed to load file (${res.status})`);
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            blobUrlRef.current = url;
            setPreviewModal((prev) => ({ ...prev, blobUrl: url, loading: false }));
        } catch (e) {
            setPreviewModal((prev) => ({
                ...prev,
                loading: false,
                error: e instanceof Error ? e.message : "Failed to load file",
            }));
        }
    }, []);

    const closePreview = useCallback(() => {
        if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
        }
        setPreviewModal({ isOpen: false, filename: "", blobUrl: "", loading: false, error: null });
    }, []);

    // Build virtual tree from flat files
    const tree = useMemo(() => buildDriveTree(files), [files]);

    // Client-side search filtering
    const filteredFiles = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return files;
        return files.filter(
            (f) =>
                (f.filename || "").toLowerCase().includes(q) ||
                (f.drive_path || "").toLowerCase().includes(q)
        );
    }, [files, searchQuery]);

    const isSearchMode = searchQuery.trim().length >= 2;

    function handleToggleExpand(path: string) {
        setExpandedPaths((prev) => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    }

    const headerLabel = connectionType === "personal" ? "My Google Drive" : "Agency Google Drive";
    const fileCount = files.filter((f) => !f.is_folder).length;
    const folderCount = files.filter((f) => f.is_folder).length;

    return (
        <div className="h-full p-6 flex flex-col min-h-0 bg-[#0C0C0C]">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] overflow-hidden flex flex-col min-h-0 flex-1">
                {/* Header */}
                <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center border border-white/10">
                            <Cloud size={16} className="text-[rgba(245,245,245,0.6)]" />
                        </div>
                        <div>
                            <h1 className="text-[15px] font-semibold text-[#F5F5F5]">{headerLabel}</h1>
                            <p className="text-[12px] text-[rgba(245,245,245,0.45)] mt-0.5">
                                {fileCount} files, {folderCount} folders
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={loading}
                            className="gap-2 text-[13px]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={14} className="animate-spin shrink-0" />
                                    <span>Refreshing…</span>
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={14} className="shrink-0" />
                                    <span>
                                        {lastRefreshedAt
                                            ? `Last update was at: ${formatRefreshTimestamp(lastRefreshedAt)}`
                                            : "Refresh"}
                                    </span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.08)] shrink-0">
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.4)]"
                        />
                        <Input
                            type="text"
                            placeholder="Search files and folders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg pl-10 bg-[#0C0C0C] border-[rgba(255,255,255,0.1)]"
                        />
                    </div>
                    {isSearchMode && (
                        <p className="text-[11px] text-[rgba(245,245,245,0.4)] mt-2">
                            {filteredFiles.length} result{filteredFiles.length !== 1 ? "s" : ""}
                        </p>
                    )}
                </div>

                {/* Content */}
                <div className="min-h-0 flex-1 overflow-y-auto py-2">
                    {error ? (
                        <div className="px-5 py-6 text-[14px] text-[#C87A7A] bg-[rgba(200,122,122,0.08)] border-b border-[rgba(200,122,122,0.15)]">
                            {error}
                        </div>
                    ) : showLoading && files.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={24} className="animate-spin text-[rgba(245,245,245,0.4)]" />
                                <span className="text-[13px] text-[rgba(245,245,245,0.5)]">Loading files...</span>
                            </div>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <div className="flex flex-col items-center gap-2">
                                <Cloud size={32} className="text-[rgba(245,245,245,0.2)]" />
                                <span className="text-[14px] text-[rgba(245,245,245,0.5)]">No available files</span>
                                <span className="text-[12px] text-[rgba(245,245,245,0.35)]">
                                    {connectionType === "agency"
                                        ? "No folders have been shared with you yet. Contact your admin for access."
                                        : "Files will appear here after syncing your Google Drive folder."}
                                </span>
                            </div>
                        </div>
                    ) : isSearchMode ? (
                        // Search results -- flat list
                        <div>
                            {filteredFiles.length === 0 ? (
                                <div className="px-5 py-10 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search size={32} className="text-[rgba(245,245,245,0.2)]" />
                                        <span className="text-[14px] text-[rgba(245,245,245,0.5)]">No results found</span>
                                        <span className="text-[12px] text-[rgba(245,245,245,0.35)]">
                                            Try a different search term
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                filteredFiles.map((file) => (
                                    <div
                                        key={`drive-${file.id}`}
                                        className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.06)] hover:bg-white/4 transition-colors"
                                    >
                                        <div
                                            className={[
                                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                                file.is_folder
                                                    ? "bg-[rgba(122,163,200,0.1)] text-[#7AA3C8]"
                                                    : "bg-[rgba(245,245,245,0.06)] text-[rgba(245,245,245,0.5)]",
                                            ].join(" ")}
                                        >
                                            {file.is_folder ? <Folder size={16} /> : <FileText size={16} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] text-[#F5F5F5] truncate font-medium">
                                                {file.filename || "Untitled"}
                                            </p>
                                            {file.drive_path && (
                                                <p className="text-[11px] text-[rgba(245,245,245,0.4)] mt-0.5 truncate">
                                                    {file.drive_path}
                                                </p>
                                            )}
                                        </div>
                                        {showAccessLevel && <AccessLevelBadge level={file.access_level} />}
                                        {!file.is_folder && (
                                            <DrivePreviewButton file={file} onPreview={handlePreview} />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        // Tree view
                        <div>
                            {tree.map((node) => (
                                <DriveTreeNodeItem
                                    key={node.uniqueKey}
                                    node={node}
                                    depth={0}
                                    expandedPaths={expandedPaths}
                                    onToggleExpand={handleToggleExpand}
                                    showAccessLevel={showAccessLevel}
                                    onPreview={handlePreview}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Drive file preview modal */}
            {previewModal.isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-200"
                    onClick={closePreview}
                >
                    <div
                        className="relative w-full h-full max-w-6xl max-h-[90vh] m-4 bg-[#F5F5F5] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,0,0,0.08)] bg-white">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-[rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
                                    <FileText size={20} className="text-[rgba(0,0,0,0.5)]" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-[15px] font-semibold text-[#0C0C0C] truncate">
                                        {previewModal.filename}
                                    </h2>
                                    <p className="text-[12px] text-[rgba(0,0,0,0.5)] mt-0.5">
                                        Google Drive Preview
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closePreview}
                                className="ml-4 w-9 h-9 flex items-center justify-center hover:bg-[rgba(0,0,0,0.05)] rounded-lg transition-colors duration-150"
                                aria-label="Close"
                            >
                                <span className="text-[rgba(0,0,0,0.5)] text-lg">&times;</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden bg-[#e5e5e5] relative">
                            {previewModal.loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-[#e5e5e5] z-10">
                                    <Loader2 className="w-10 h-10 animate-spin text-[rgba(0,0,0,0.4)]" />
                                </div>
                            )}
                            {previewModal.error && (
                                <div className="absolute inset-0 flex items-center justify-center p-6 bg-[#e5e5e5] z-10">
                                    <p className="text-[15px] text-[rgba(0,0,0,0.7)]">{previewModal.error}</p>
                                </div>
                            )}
                            {previewModal.blobUrl && !previewModal.error && (
                                <iframe
                                    src={previewModal.blobUrl}
                                    className="w-full h-full border-0"
                                    title={`Preview - ${previewModal.filename}`}
                                    style={{ minHeight: "600px" }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ===========================================================================
// CLAROMENTIS: Tree node component (existing, unchanged)
// ===========================================================================
function TreeNode({
    item,
    depth,
    expandedIds,
    onToggleExpand,
    clientCache,
    onOpenPreview,
}: {
    item: TLItem;
    depth: number;
    expandedIds: Set<number>;
    onToggleExpand: (id: number) => void;
    clientCache: React.MutableRefObject<Map<number, TLItem[]>>;
    onOpenPreview: (filename: string, proxyUrl: string) => void;
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
    const { items: children, showLoading: loading } = useFolderChildren(
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
                        {item.kind === "page" ? item.name : item.title}
                    </p>
                </div>

                {/* Preview button for documents only (not pages) */}
                {item.kind === "document" && (
                    <PreviewButton doc={item} onOpenPreview={onOpenPreview} />
                )}
            </div>

            {/* Render children if expanded */}
            {isFolder && isExpanded && displayChildren && displayChildren.length > 0 && (
                <div>
                    {displayChildren.map((child) => (
                        <TreeNode
                            key={child.kind === "folder" ? `f-${child.id}` : child.kind === "document" ? `d-${child.doc_id}-${child.version_num}` : `p-${child.key}`}
                            item={child}
                            depth={depth + 1}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                            clientCache={clientCache}
                            onOpenPreview={onOpenPreview}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function PreviewButton({
    doc,
    onOpenPreview
}: {
    doc: Extract<TLItem, { kind: "document" }>;
    onOpenPreview: (filename: string, proxyUrl: string) => void;
}) {
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
                    onOpenPreview(doc.title, proxyUrl);
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
            <Eye className="w-3 h-3" />
            Preview
        </button>
    );
}

// Helper to build proxy URL for search results
function buildProxyUrl(path: string, filename: string): string {
    const url = new URL(PROXY_ENDPOINT, window.location.origin);
    url.searchParams.set("path", path);
    url.searchParams.set("filename", filename);
    return url.toString();
}

// Search result item component — distinguishes documents (intranet) vs pages (knowledge library)
function SearchResultItem({
    item,
    onOpenPreview,
}: {
    item: TLItem;
    onOpenPreview: (filename: string, proxyUrl?: string, pdfPath?: string) => void;
}) {
    const isFolder = item.kind === "folder";
    const isPage = item.kind === "page";

    // Build preview URL for intranet documents (not for pages)
    const getPreviewUrl = (): string | null => {
        if (item.kind !== "document") return null;

        // Search results may have URI from the API
        if (item.URI && item.URI.startsWith("/")) {
            return buildProxyUrl(item.URI, item.title);
        }

        // Fallback to building REST URL if version_num exists
        if (item.version_num > 0) {
            const path = `/intranet/rest/documents/document/${item.doc_id}/${item.version_num}/file?parent_id=${item.parent_id}`;
            return buildProxyUrl(path, item.title);
        }

        return null;
    };

    const previewUrl = getPreviewUrl();

    // Get title based on item type
    const title = item.kind === "page" ? item.name : item.title;

    // Icon and styling: folder = folder icon; page = BookOpen (knowledge library); document = FileText (intranet)
    const iconEl = isFolder ? <Folder size={16} /> : isPage ? <BookOpen size={16} /> : <FileText size={16} />;
    const iconBg =
        isFolder
            ? "bg-[rgba(122,163,200,0.1)] text-[#7AA3C8]"
            : isPage
                ? "bg-[rgba(156,163,175,0.12)] text-[#9CA3AF]"
                : "bg-[rgba(245,245,245,0.06)] text-[rgba(245,245,245,0.5)]";

    return (
        <div
            className={[
                "flex items-center gap-3 px-5 py-3",
                "border-b border-[rgba(255,255,255,0.06)]",
                "hover:bg-white/4 transition-colors",
            ].join(" ")}
        >
            {/* Icon — folder / page (knowledge library) / document (intranet) */}
            <div className={["w-8 h-8 rounded-lg flex items-center justify-center shrink-0", iconBg].join(" ")}>
                {iconEl}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[#F5F5F5] truncate font-medium">
                    {title}
                </p>
                <p className="text-[11px] text-[rgba(245,245,245,0.45)] mt-0.5">
                    {item.kind === "folder"
                        ? `Folder • ID ${item.id}`
                        : item.kind === "page"
                            ? `Page • ${(item.size / 1024).toFixed(1)} KB`
                            : `Document • ID ${item.doc_id}`
                    }
                </p>
            </div>

            {/* Preview: intranet documents use proxy URL; pages use pdf_path */}
            {item.kind === "document" && previewUrl && (
                <button
                    type="button"
                    onClick={() => onOpenPreview(title, previewUrl)}
                    className={[
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md",
                        "text-[11px] font-medium",
                        "bg-[rgba(122,163,200,0.1)] hover:bg-[rgba(122,163,200,0.18)]",
                        "border border-[rgba(122,163,200,0.2)] hover:border-[rgba(122,163,200,0.35)]",
                        "text-[#7AA3C8] hover:text-[#9BBDD8]",
                        "transition-all duration-150",
                    ].join(" ")}
                >
                    <Eye className="w-3 h-3" />
                    Preview
                </button>
            )}
            {item.kind === "page" && item.pdf_path && (
                <button
                    type="button"
                    onClick={() => onOpenPreview(title, undefined, item.pdf_path ?? undefined)}
                    className={[
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md",
                        "text-[11px] font-medium",
                        "bg-[rgba(156,163,175,0.1)] hover:bg-[rgba(156,163,175,0.18)]",
                        "border border-[rgba(156,163,175,0.2)] hover:border-[rgba(156,163,175,0.35)]",
                        "text-[#9CA3AF] hover:text-[#D1D5DB]",
                        "transition-all duration-150",
                    ].join(" ")}
                >
                    <Eye className="w-3 h-3" />
                    Preview
                </button>
            )}
        </div>
    );
}

// ===========================================================================
// CLAROMENTIS: Content view (existing, extracted into sub-component)
// ===========================================================================
type NavigationMode = "knowledge-root" | "documents" | "pages";

type BreadcrumbItem = {
    label: string;
    path: NavigationMode;
};

function IntranetLibraryContent({ initialRootId }: { initialRootId?: number }) {
    // Navigation mode state
    const [navigationMode, setNavigationMode] = useState<NavigationMode>(initialRootId !== undefined ? "documents" : "knowledge-root");
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ label: "Knowledge", path: "knowledge-root" }]);
    
    const [rootId, setRootId] = useState<number | undefined>(initialRootId);
    const [draftRootId, setDraftRootId] = useState<string>("");
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [pdfModal, setPdfModal] = useState<PdfModalState>({
        isOpen: false,
        filename: "",
        customUrl: "",
        pdfPath: undefined,
    });

    // Search state — documents (intranet) and pages (knowledge library) kept separately
    const [searchDocuments, setSearchDocuments] = useState<Exclude<TLItem, PageItem>[]>([]);
    const [searchPages, setSearchPages] = useState<PageItem[]>([]);
    const [rootViewTab, setRootViewTab] = useState<"documents" | "pages">("documents");
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchTotal, setSearchTotal] = useState<number | null>(null);
    const [searchNextOffset, setSearchNextOffset] = useState<number | null>(null);

    // Delayed loading to prevent flickering
    const showSearchLoader = useDelayedLoading(searchLoading);

    const clientCache = useRef<Map<number, TLItem[]>>(new Map());

    const isSearchMode = searchQuery.trim().length >= 2;

    const [rootAccordionExpandedIds, setRootAccordionExpandedIds] = useState<Set<number>>(new Set());
    const rootAccordionCache = useRef<Map<number, TLItem[]>>(new Map());

    const handleRootAccordionToggle = useCallback((id: number) => {
        setRootAccordionExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); } else { next.add(id); }
            return next;
        });
    }, []);

    const accordionRootOptions = useMemo(() => ({
        enabled: navigationMode === "knowledge-root" && rootViewTab === "documents" && !isSearchMode,
        onSuccess: (items: TLItem[]) => { rootAccordionCache.current.set(0, items); },
    }), [navigationMode, rootViewTab, isSearchMode]);
    const { items: accordionRootItems, loading: accordionRootLoading } = useFolderChildren(
        navigationMode === "knowledge-root" && rootViewTab === "documents" && !isSearchMode ? 0 : undefined,
        undefined,
        accordionRootOptions
    );
    const accordionRootDisplay = rootAccordionCache.current.get(0) ?? accordionRootItems;

    // Pages data - fetch when in pages mode OR when on Pages tab in knowledge-root
    const { items: pagesItems, hasMore: pagesHasMore, isLoading: pagesLoading, error: pagesError, loadMore: loadMorePages } = usePages({ enabled: navigationMode === "pages" || (navigationMode === "knowledge-root" && rootViewTab === "pages") });

    // Debounced search effect
    useEffect(() => {
        const query = searchQuery.trim();

        // Reset search if query is too short
        if (query.length < 2) {
            setSearchDocuments([]);
            setSearchPages([]);
            setSearchError(null);
            setSearchTotal(null);
            setSearchNextOffset(null);
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(async () => {
            setSearchLoading(true);
            setSearchError(null);

            try {
                const url = new URL(SEARCH_ENDPOINT, window.location.origin);
                url.searchParams.set("q", query);
                url.searchParams.set("limit", "50");
                url.searchParams.set("offset", "0");
                url.searchParams.set("object_type", "document,folder");

                const res = await fetch(url.toString(), {
                    method: "GET",
                    signal: controller.signal
                });

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || `HTTP ${res.status}`);
                }

                const data: TLSearchResult = await res.json();
                setSearchDocuments(data.documents ?? []);
                setSearchPages(data.pages ?? []);
                setSearchTotal(data.total ?? null);
                setSearchNextOffset(data.next_offset ?? null);
            } catch (e: unknown) {
                if (e instanceof Error && e.name === "AbortError") return;
                const message = e instanceof Error ? e.message : "Search failed";
                setSearchError(message);
                setSearchDocuments([]);
                setSearchPages([]);
            } finally {
                setSearchLoading(false);
            }
        }, 300); // 300ms debounce

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [searchQuery]);

    // Load more search results
    const loadMoreResults = useCallback(async () => {
        if (searchNextOffset === null || searchLoading) return;

        const query = searchQuery.trim();
        if (query.length < 2) return;

        setSearchLoading(true);
        try {
            const url = new URL(SEARCH_ENDPOINT, window.location.origin);
            url.searchParams.set("q", query);
            url.searchParams.set("limit", "50");
            url.searchParams.set("offset", String(searchNextOffset));
            url.searchParams.set("object_type", "document,folder");

            const res = await fetch(url.toString(), { method: "GET" });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `HTTP ${res.status}`);
            }

            const data: TLSearchResult = await res.json();
            setSearchDocuments(prev => [...prev, ...(data.documents ?? [])]);
            setSearchNextOffset(data.next_offset ?? null);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to load more";
            setSearchError(message);
        } finally {
            setSearchLoading(false);
        }
    }, [searchNextOffset, searchLoading, searchQuery]);

    // PDF modal handlers
    const openPreview = useCallback((filename: string, customUrl?: string, pdfPath?: string) => {
        setPdfModal({ isOpen: true, filename, customUrl: customUrl ?? "", pdfPath });
    }, []);

    const closePreview = useCallback(() => {
        setPdfModal({ isOpen: false, filename: "", customUrl: "", pdfPath: undefined });
    }, []);

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

    const { items, showLoading, error } = useFolderChildren(rootId, undefined, rootHookOptions);

    const cachedItems = rootId !== undefined ? clientCache.current.get(rootId) : undefined;
    const rawDisplayItems = cachedItems ?? items;
    const showRootLoading = showLoading && !cachedItems;

    // Filter items by search query (case-insensitive)
    const displayItems = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return rawDisplayItems;
        return rawDisplayItems.filter((item) =>
            (item.kind === "page" ? item.name : item.title).toLowerCase().includes(query)
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

    // Navigation handlers
    const handleNavigateToKnowledgeRoot = useCallback(() => {
        setNavigationMode("knowledge-root");
        setBreadcrumbs([{ label: "Knowledge", path: "knowledge-root" }]);
        setSearchQuery("");
    }, []);

    const handleNavigateToDocuments = useCallback(() => {
        setNavigationMode("documents");
        setBreadcrumbs([
            { label: "Knowledge", path: "knowledge-root" },
            { label: "Documents", path: "documents" }
        ]);
        setRootId(0); // Load intranet root
        setExpandedIds(new Set());
        setSearchQuery("");
    }, []);

    const handleNavigateToPages = useCallback(() => {
        setNavigationMode("pages");
        setBreadcrumbs([
            { label: "Knowledge", path: "knowledge-root" },
            { label: "Pages", path: "pages" }
        ]);
        setSearchQuery("");
    }, []);

    const handleBreadcrumbClick = useCallback((path: NavigationMode) => {
        switch (path) {
            case "knowledge-root":
                handleNavigateToKnowledgeRoot();
                break;
            case "documents":
                handleNavigateToDocuments();
                break;
            case "pages":
                handleNavigateToPages();
                break;
        }
    }, [handleNavigateToKnowledgeRoot, handleNavigateToDocuments, handleNavigateToPages]);

    // Knowledge Root view — full-page tree with 2 root rows: Documents + Pages (and search)
    if (navigationMode === "knowledge-root") {
        return (
            <div className="h-full p-6 flex flex-col min-h-0 bg-[#0C0C0C]">
                <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] overflow-hidden flex flex-col min-h-0 flex-1">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.08)] shrink-0 flex items-center justify-between">
                        <div>
                            <h1 className="text-[15px] font-semibold text-[#F5F5F5]">Knowledge Library</h1>
                            <p className="text-[12px] text-[rgba(245,245,245,0.4)] mt-0.5">Knowledge</p>
                        </div>
                        <SyncStatusButton />
                    </div>

                    {/* Search bar for intranet */}
                    <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.08)] shrink-0">
                        <div className="relative">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.4)]"
                            />
                            <input
                                type="text"
                                placeholder="Search files and folders..."
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
                            {searchQuery.trim().length < 2
                                ? "Type at least 2 characters to search all documents and folders."
                                : `Searching documents and pages${searchDocuments.length + searchPages.length > 0 ? ` • ${searchDocuments.length} document(s), ${searchPages.length} page(s)` : searchTotal !== null ? ` • ${searchTotal} document(s)` : ""}`}
                        </p>
                    </div>

                    {/* Tree content or search results */}
                    <div className="min-h-0 flex-1 overflow-y-auto py-2">
                        {isSearchMode ? (
                            <>
                                {searchError ? (
                                    <div className="px-5 py-6 text-[14px] text-[#C87A7A] bg-[rgba(200,122,122,0.08)] border-b border-[rgba(200,122,122,0.15)]">
                                        {searchError}
                                    </div>
                                ) : showSearchLoader && searchDocuments.length === 0 && searchPages.length === 0 ? (
                                    <div className="px-5 py-10 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 size={24} className="animate-spin text-[rgba(245,245,245,0.4)]" />
                                            <span className="text-[13px] text-[rgba(245,245,245,0.5)]">Searching...</span>
                                        </div>
                                    </div>
                                ) : searchDocuments.length === 0 && searchPages.length === 0 ? (
                                    <div className="px-5 py-10 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search size={32} className="text-[rgba(245,245,245,0.2)]" />
                                            <span className="text-[14px] text-[rgba(245,245,245,0.5)]">No results found</span>
                                            <span className="text-[12px] text-[rgba(245,245,245,0.35)]">Try a different search term</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full min-h-0">
                                        {/* Tabs */}
                                        <div className="flex shrink-0 border-b border-[rgba(255,255,255,0.08)]">
                                            <button
                                                type="button"
                                                onClick={() => setRootViewTab("documents")}
                                                className={[
                                                    "flex-1 px-4 py-3 text-[13px] font-medium transition-colors",
                                                    rootViewTab === "documents"
                                                        ? "text-[#7AA3C8] border-b-2 border-[#7AA3C8] bg-[rgba(122,163,200,0.06)]"
                                                        : "text-[rgba(245,245,245,0.5)] hover:text-[rgba(245,245,245,0.8)] hover:bg-[rgba(255,255,255,0.03)]",
                                                ].join(" ")}
                                            >
                                                Documents ({searchDocuments.length}{searchTotal != null && searchTotal > searchDocuments.length ? ` of ${searchTotal}` : ""})
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRootViewTab("pages")}
                                                className={[
                                                    "flex-1 px-4 py-3 text-[13px] font-medium transition-colors",
                                                    rootViewTab === "pages"
                                                        ? "text-[#9CA3AF] border-b-2 border-[#9CA3AF] bg-[rgba(156,163,175,0.06)]"
                                                        : "text-[rgba(245,245,245,0.5)] hover:text-[rgba(245,245,245,0.8)] hover:bg-[rgba(255,255,255,0.03)]",
                                                ].join(" ")}
                                            >
                                                Pages ({searchPages.length})
                                            </button>
                                        </div>
                                        {/* Tab content */}
                                        <div className="min-h-0 flex-1 overflow-y-auto">
                                            {rootViewTab === "documents" ? (
                                                <>
                                                    {searchDocuments.length === 0 ? (
                                                        <div className="px-5 py-8 text-center text-[12px] text-[rgba(245,245,245,0.4)]">No documents match your search.</div>
                                                    ) : (
                                                        <>
                                                            {searchDocuments.map((item) => (
                                                                <SearchResultItem
                                                                    key={item.kind === "folder" ? `sf-${item.id}` : `sd-${item.doc_id}-${item.version_num}`}
                                                                    item={item}
                                                                    onOpenPreview={openPreview}
                                                                />
                                                            ))}
                                                            {searchNextOffset !== null && (
                                                                <div className="px-5 py-4 flex justify-center border-t border-[rgba(255,255,255,0.06)]">
                                                                    <button
                                                                        type="button"
                                                                        onClick={loadMoreResults}
                                                                        disabled={searchLoading}
                                                                        className={[
                                                                            "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                                                                            "text-[12px] font-medium",
                                                                            "bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)]",
                                                                            "border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.15)]",
                                                                            "text-[rgba(245,245,245,0.7)] hover:text-[#F5F5F5]",
                                                                            "transition-all duration-150",
                                                                            "disabled:opacity-50 disabled:cursor-not-allowed",
                                                                        ].join(" ")}
                                                                    >
                                                                        {searchLoading ? (
                                                                            <>
                                                                                <Loader2 size={14} className="animate-spin" />
                                                                                Loading...
                                                                            </>
                                                                        ) : (
                                                                            "Load more documents"
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    {searchPages.length === 0 ? (
                                                        <div className="px-5 py-8 text-center text-[12px] text-[rgba(245,245,245,0.4)]">No pages match your search.</div>
                                                    ) : (
                                                        searchPages.map((page) => (
                                                            <SearchResultItem
                                                                key={`sp-${page.id}`}
                                                                item={page}
                                                                onOpenPreview={openPreview}
                                                            />
                                                        ))
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                                    <div className="flex flex-col h-full min-h-0">
                                        <div className="flex shrink-0 border-b border-[rgba(255,255,255,0.08)]">
                                            <button
                                                type="button"
                                                onClick={() => setRootViewTab("documents")}
                                                className={[
                                                    "flex-1 px-4 py-3 text-[13px] font-medium transition-colors",
                                                    rootViewTab === "documents"
                                                        ? "text-[#7AA3C8] border-b-2 border-[#7AA3C8] bg-[rgba(122,163,200,0.06)]"
                                                        : "text-[rgba(245,245,245,0.5)] hover:text-[rgba(245,245,245,0.8)] hover:bg-[rgba(255,255,255,0.03)]",
                                                ].join(" ")}
                                            >
                                                Documents ({accordionRootDisplay.length})
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRootViewTab("pages")}
                                                className={[
                                                    "flex-1 px-4 py-3 text-[13px] font-medium transition-colors",
                                                    rootViewTab === "pages"
                                                        ? "text-[#9CA3AF] border-b-2 border-[#9CA3AF] bg-[rgba(156,163,175,0.06)]"
                                                        : "text-[rgba(245,245,245,0.5)] hover:text-[rgba(245,245,245,0.8)] hover:bg-[rgba(255,255,255,0.03)]",
                                                ].join(" ")}
                                            >
                                                Pages ({pagesItems.length}{pagesHasMore ? "+" : ""})
                                            </button>
                                        </div>
                                        <div className="min-h-0 flex-1 overflow-y-auto">
                                            {rootViewTab === "documents" ? (
                                                <>
                                                    {accordionRootLoading && accordionRootDisplay.length === 0 ? (
                                                        <div className="px-5 py-10 text-center">
                                                            <Loader2 size={24} className="animate-spin text-[rgba(245,245,245,0.4)] mx-auto" />
                                                            <span className="text-[13px] text-[rgba(245,245,245,0.5)] block mt-3">Loading documents...</span>
                                                        </div>
                                                    ) : accordionRootDisplay.length === 0 ? (
                                                        <div className="px-5 py-10 text-center">
                                                            <Folder size={32} className="text-[rgba(245,245,245,0.2)] mx-auto" />
                                                            <span className="text-[14px] text-[rgba(245,245,245,0.5)] block mt-3">No documents in root folder</span>
                                                        </div>
                                                    ) : (
                                                        accordionRootDisplay.map((item) => (
                            <TreeNode
                                key={item.kind === "folder" ? `f-${item.id}` : item.kind === "document" ? `d-${item.doc_id}-${item.version_num}` : `p-${item.key}`}
                                item={item}
                                depth={1}
                                expandedIds={rootAccordionExpandedIds}
                                onToggleExpand={handleRootAccordionToggle}
                                clientCache={rootAccordionCache}
                                onOpenPreview={openPreview}
                            />
                                                        ))
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    {pagesLoading && pagesItems.length === 0 ? (
                                                        <div className="px-5 py-10 text-center">
                                                            <Loader2 size={24} className="animate-spin text-[rgba(245,245,245,0.4)] mx-auto" />
                                                            <span className="text-[13px] text-[rgba(245,245,245,0.5)] block mt-3">Loading pages...</span>
                                                        </div>
                                                    ) : pagesItems.length === 0 ? (
                                                        <div className="px-5 py-10 text-center">
                                                            <FileText size={32} className="text-[rgba(245,245,245,0.2)] mx-auto" />
                                                            <span className="text-[14px] text-[rgba(245,245,245,0.5)] block mt-3">No pages</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {pagesItems.map((page) => (
                                                                <div
                                                                    key={page.id}
                                                                    className="flex items-center gap-2 py-2 pr-4 hover:bg-white/2 transition-all duration-150 px-5"
                                                                >
                                                                    <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-[rgba(245,245,245,0.06)] text-[rgba(245,245,245,0.5)]">
                                                                        <FileText size={14} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[13px] text-[rgba(245,245,245,0.8)] truncate">{page.name}</p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const path = page.pdf_path ?? page.key;
                                                                            if (path) openPreview(page.name, undefined, path);
                                                                        }}
                                                                        className={[
                                                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md",
                                                                            "text-[11px] font-medium",
                                                                            "bg-[rgba(122,163,200,0.1)] hover:bg-[rgba(122,163,200,0.18)]",
                                                                            "border border-[rgba(122,163,200,0.2)] hover:border-[rgba(122,163,200,0.35)]",
                                                                            "text-[#7AA3C8] hover:text-[#9BBDD8]",
                                                                        ].join(" ")}
                                                                    >
                                                                        <Eye className="w-3 h-3" />
                                                                        Preview
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {pagesHasMore && (
                                                                <div className="px-5 py-4 flex justify-center border-t border-[rgba(255,255,255,0.06)]">
                                                                    <button
                                                                        type="button"
                                                                        onClick={loadMorePages}
                                                                        disabled={pagesLoading}
                                                                        className="w-full max-w-xs py-2 rounded-lg text-[12px] text-[rgba(245,245,245,0.5)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.06)] disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                                                                    >
                                                                        {pagesLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                                                                        Load more
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                    </div>
                </div>

                {/* PDF Preview Modal */}
                <PdfModal
                    isOpen={pdfModal.isOpen}
                    onClose={() => setPdfModal({ isOpen: false, filename: "", customUrl: "", pdfPath: undefined })}
                    filename={pdfModal.filename}
                    customUrl={pdfModal.customUrl || undefined}
                    pdfPath={pdfModal.pdfPath}
                />
            </div>
        );
    }

    // If in documents mode but no root ID set, show folder ID input
    if (navigationMode === "documents" && rootId === undefined) {
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
                        <Input
                            type="number"
                            placeholder="Folder ID (e.g., 0)"
                            value={draftRootId}
                            className="flex-1 rounded-xl bg-[#0C0C0C] border-[rgba(255,255,255,0.1)]"
                            onChange={(e) => setDraftRootId(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && commitRootId()}
                        />
                        <Button
                            type="button"
                            onClick={commitRootId}
                            disabled={!draftRootId.trim()}
                            className="bg-[#F5F5F5] hover:bg-white text-[#0C0C0C]"
                        >
                            Load
                        </Button>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleNavigateToKnowledgeRoot}
                        className="mt-4 text-[12px] text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5]"
                    >
                        ← Back to Knowledge
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full p-6 flex flex-col min-h-0 bg-[#0C0C0C]">
            {/* Main Content Card */}
            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] overflow-hidden flex flex-col min-h-0 flex-1">
                {/* Header with Breadcrumbs */}
                <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.08)] shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h1 className="text-[15px] font-semibold text-[#F5F5F5]">Knowledge Library</h1>
                            {/* Breadcrumbs */}
                            <div className="flex items-center gap-2 mt-1.5">
                                {breadcrumbs.map((crumb, idx) => (
                                    <div key={crumb.path} className="flex items-center gap-2">
                                        {idx > 0 && <ChevronRight size={12} className="text-[rgba(245,245,245,0.3)]" />}
                                        <button
                                            type="button"
                                            onClick={() => handleBreadcrumbClick(crumb.path)}
                                            className={[
                                                "text-[12px] transition-colors",
                                                idx === breadcrumbs.length - 1
                                                    ? "text-[#7AA3C8] font-medium cursor-default"
                                                    : "text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5]",
                                            ].join(" ")}
                                            disabled={idx === breadcrumbs.length - 1}
                                        >
                                            {crumb.label}
                                        </button>
                                    </div>
                                ))}
                                {navigationMode === "documents" && rootId !== undefined && (
                                    <span className="text-[12px] text-[rgba(245,245,245,0.4)]">
                                        {" "} • Folder {rootId}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {((navigationMode === "documents" && showRootLoading) || (navigationMode === "pages" && pagesLoading)) && (
                                <div className="flex items-center gap-2 text-[12px] text-[rgba(245,245,245,0.5)]">
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Loading...</span>
                                </div>
                            )}
                            <SyncStatusButton />
                        </div>
                    </div>
                </div>

                {/* Search Input - Only show for documents mode */}
                {navigationMode === "documents" && (
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
                            {searchQuery.trim().length < 2
                                ? "Type at least 2 characters to search all documents and folders."
                                : `Searching documents and pages${searchDocuments.length + searchPages.length > 0 ? ` • ${searchDocuments.length} document(s), ${searchPages.length} page(s)` : searchTotal !== null ? ` • ${searchTotal} document(s)` : ""}`
                            }
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
                )}

                {/* Content Area */}
                <div className="min-h-0 flex-1 overflow-y-auto py-2">
                    {navigationMode === "pages" ? (
                        // Pages Mode
                        <>
                            {pagesError ? (
                                <div className="px-5 py-6 text-[14px] text-[#C87A7A] bg-[rgba(200,122,122,0.08)] border-b border-[rgba(200,122,122,0.15)]">
                                    Failed to load pages: {(pagesError as Error).message}
                                </div>
                            ) : pagesLoading ? (
                                <div className="px-5 py-10 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 size={24} className="animate-spin text-[rgba(245,245,245,0.4)]" />
                                        <span className="text-[13px] text-[rgba(245,245,245,0.5)]">Loading pages...</span>
                                    </div>
                                </div>
                            ) : pagesItems.length === 0 ? (
                                <div className="px-5 py-10 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText size={32} className="text-[rgba(245,245,245,0.2)]" />
                                        <span className="text-[14px] text-[rgba(245,245,245,0.5)]">No pages available</span>
                                        <span className="text-[12px] text-[rgba(245,245,245,0.35)]">Pages will appear here when uploaded to S3</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {pagesItems.map((page) => (
                                        <div
                                            key={page.id}
                                            className={[
                                                "flex items-center gap-3 px-5 py-3 transition-all duration-150",
                                                "hover:bg-white/2",
                                            ].join(" ")}
                                        >
                                            <div className="w-5 flex items-center justify-center">
                                                <FileText size={16} className="text-[rgba(245,245,245,0.4)]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[13px] text-[#F5F5F5] truncate">
                                                    {page.name}
                                                </div>
                                                <div className="text-[11px] text-[rgba(245,245,245,0.4)] mt-0.5">
                                                    {(page.size / 1024).toFixed(1)} KB • {new Date(page.last_modified).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const path = page.pdf_path ?? page.key;
                                                    if (path) openPreview(page.name, undefined, path);
                                                }}
                                                className={[
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md shrink-0",
                                                    "text-[11px] font-medium",
                                                    "bg-[rgba(122,163,200,0.1)] hover:bg-[rgba(122,163,200,0.18)]",
                                                    "border border-[rgba(122,163,200,0.2)] hover:border-[rgba(122,163,200,0.35)]",
                                                    "text-[#7AA3C8] hover:text-[#9BBDD8]",
                                                ].join(" ")}
                                            >
                                                <Eye className="w-3 h-3" />
                                                Preview
                                            </button>
                                        </div>
                                    ))}
                                    {pagesHasMore && (
                                        <div className="px-5 py-3">
                                            <button
                                                type="button"
                                                onClick={loadMorePages}
                                                disabled={pagesLoading}
                                                className="w-full py-2 rounded-xl text-[13px] text-[rgba(245,245,245,0.6)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {pagesLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                                                Load more
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : isSearchMode ? (
                        // Search Results Mode (Documents)
                        <>
                            {searchError ? (
                                <div className="px-5 py-6 text-[14px] text-[#C87A7A] bg-[rgba(200,122,122,0.08)] border-b border-[rgba(200,122,122,0.15)]">
                                    {searchError}
                                </div>
                            ) : showSearchLoader && searchDocuments.length === 0 && searchPages.length === 0 ? (
                                <div className="px-5 py-10 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 size={24} className="animate-spin text-[rgba(245,245,245,0.4)]" />
                                        <span className="text-[13px] text-[rgba(245,245,245,0.5)]">Searching...</span>
                                    </div>
                                </div>
                            ) : searchDocuments.length === 0 && searchPages.length === 0 ? (
                                <div className="px-5 py-10 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search size={32} className="text-[rgba(245,245,245,0.2)]" />
                                        <span className="text-[14px] text-[rgba(245,245,245,0.5)]">No results found</span>
                                        <span className="text-[12px] text-[rgba(245,245,245,0.35)]">Try a different search term</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full min-h-0">
                                    {/* Tabs */}
                                    <div className="flex shrink-0 border-b border-[rgba(255,255,255,0.08)]">
                                        <button
                                            type="button"
                                            onClick={() => setRootViewTab("documents")}
                                            className={[
                                                "flex-1 px-4 py-3 text-[13px] font-medium transition-colors",
                                                rootViewTab === "documents"
                                                    ? "text-[#7AA3C8] border-b-2 border-[#7AA3C8] bg-[rgba(122,163,200,0.06)]"
                                                    : "text-[rgba(245,245,245,0.5)] hover:text-[rgba(245,245,245,0.8)] hover:bg-[rgba(255,255,255,0.03)]",
                                            ].join(" ")}
                                        >
                                            Documents ({searchDocuments.length}{searchTotal != null && searchTotal > searchDocuments.length ? ` of ${searchTotal}` : ""})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRootViewTab("pages")}
                                            className={[
                                                "flex-1 px-4 py-3 text-[13px] font-medium transition-colors",
                                                rootViewTab === "pages"
                                                    ? "text-[#9CA3AF] border-b-2 border-[#9CA3AF] bg-[rgba(156,163,175,0.06)]"
                                                    : "text-[rgba(245,245,245,0.5)] hover:text-[rgba(245,245,245,0.8)] hover:bg-[rgba(255,255,255,0.03)]",
                                            ].join(" ")}
                                        >
                                            Pages ({searchPages.length})
                                        </button>
                                    </div>
                                    {/* Tab content */}
                                    <div className="min-h-0 flex-1 overflow-y-auto">
                                        {rootViewTab === "documents" ? (
                                            <>
                                                {searchDocuments.length === 0 ? (
                                                    <div className="px-5 py-8 text-center text-[12px] text-[rgba(245,245,245,0.4)]">No documents match your search.</div>
                                                ) : (
                                                    <>
                                                        {searchDocuments.map((item) => (
                                                            <SearchResultItem
                                                                key={item.kind === "folder" ? `sf-${item.id}` : `sd-${item.doc_id}-${item.version_num}`}
                                                                item={item}
                                                                onOpenPreview={openPreview}
                                                            />
                                                        ))}
                                                        {searchNextOffset !== null && (
                                                            <div className="px-5 py-4 flex justify-center border-t border-[rgba(255,255,255,0.06)]">
                                                                <button
                                                                    type="button"
                                                                    onClick={loadMoreResults}
                                                                    disabled={searchLoading}
                                                                    className={[
                                                                        "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                                                                        "text-[12px] font-medium",
                                                                        "bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)]",
                                                                        "border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.15)]",
                                                                        "text-[rgba(245,245,245,0.7)] hover:text-[#F5F5F5]",
                                                                        "transition-all duration-150",
                                                                        "disabled:opacity-50 disabled:cursor-not-allowed",
                                                                    ].join(" ")}
                                                                >
                                                                    {showSearchLoader ? (
                                                                        <>
                                                                            <Loader2 size={14} className="animate-spin" />
                                                                            Loading...
                                                                        </>
                                                                    ) : (
                                                                        "Load more documents"
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {searchPages.length === 0 ? (
                                                    <div className="px-5 py-8 text-center text-[12px] text-[rgba(245,245,245,0.4)]">No pages match your search.</div>
                                                ) : (
                                                    searchPages.map((page) => (
                                                        <SearchResultItem
                                                            key={`sp-${page.id}`}
                                                            item={page}
                                                            onOpenPreview={openPreview}
                                                        />
                                                    ))
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        // Tree View Mode
                        <>
                            {error ? (
                                <div className="px-5 py-6 text-[14px] text-[#C87A7A] bg-[rgba(200,122,122,0.08)] border-b border-[rgba(200,122,122,0.15)]">
                                    {error}
                                </div>
                            ) : displayItems.length === 0 ? (
                                <div className="px-5 py-10 text-center">
                                    {showRootLoading ? (
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
                                            key={item.kind === "folder" ? `f-${item.id}` : item.kind === "document" ? `d-${item.doc_id}-${item.version_num}` : `p-${item.key}`}
                                            item={item}
                                            depth={0}
                                            expandedIds={expandedIds}
                                            onToggleExpand={handleToggleExpand}
                                            clientCache={clientCache}
                                            onOpenPreview={openPreview}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* PDF Preview Modal */}
            <PdfModal
                isOpen={pdfModal.isOpen}
                onClose={closePreview}
                filename={pdfModal.filename}
                customUrl={pdfModal.customUrl || undefined}
                pdfPath={pdfModal.pdfPath}
            />
        </div>
    );
}

// ===========================================================================
// LibraryView: Main export -- delegates to intranet or Drive content
// ===========================================================================
export default function LibraryView({ initialRootId, source = "claromentis", connectionType }: LibraryViewProps) {
    if (source === "google-drive") {
        return <DriveLibraryContent connectionType={connectionType} />;
    }

    return <IntranetLibraryContent initialRootId={initialRootId} />;
}
