"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useFolderChildren } from "@/hooks/useFolderChildren";
import { useProxyUrl } from "@/hooks/useProxyUrl";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { useDriveFiles } from "@/hooks/useDriveFiles";
import { Folder, FileText, ChevronRight, ChevronDown, Eye, Loader2, Search, Cloud, Shield, Lock, Globe } from "lucide-react";
import PdfModal from "@/components/dashboard/PdfModal";
import SyncStatusButton from "@/components/library/SyncStatusButton";
import type { DriveFile } from "@/types/google-drive";

// ---------------------------------------------------------------------------
// Claromentis types (existing)
// ---------------------------------------------------------------------------
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

const SEARCH_ENDPOINT = "/api/library/search";
const PROXY_ENDPOINT = "/api/library/proxy";

type PdfModalState = {
    isOpen: boolean;
    filename: string;
    customUrl: string;
};

// ---------------------------------------------------------------------------
// Props for LibraryView
// ---------------------------------------------------------------------------
type LibraryViewProps = {
    initialRootId?: number;
    source?: "claromentis" | "google-drive" | "google-drive-shared";
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
function DriveLibraryContent({
    connectionType = "personal",
}: {
    connectionType?: "personal" | "agency";
}) {
    const { files, loading, error, refetch } = useDriveFiles(connectionType, { includeFolders: true });
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
    const showAccessLevel = connectionType === "agency";

    const showLoading = useDelayedLoading(loading);

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
                    <div className="flex items-center gap-2">
                        {showLoading && (
                            <div className="flex items-center gap-2 text-[12px] text-[rgba(245,245,245,0.5)]">
                                <Loader2 size={14} className="animate-spin" />
                                <span>Loading...</span>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={refetch}
                            className="text-[12px] text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5] transition-colors px-2 py-1 rounded-md hover:bg-white/6"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Search */}
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
                                <span className="text-[14px] text-[rgba(245,245,245,0.5)]">No synced files yet</span>
                                <span className="text-[12px] text-[rgba(245,245,245,0.35)]">
                                    Files will appear here after syncing your Google Drive folder.
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
                        {item.title}
                    </p>
                </div>

                {/* Preview button for documents */}
                {item.kind === "document" && (
                    <PreviewButton doc={item} onOpenPreview={onOpenPreview} />
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

// Search result item component
function SearchResultItem({
    item,
    onOpenPreview,
}: {
    item: TLItem;
    onOpenPreview: (filename: string, proxyUrl: string) => void;
}) {
    const isFolder = item.kind === "folder";

    // Build preview URL for documents
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

    return (
        <div
            className={[
                "flex items-center gap-3 px-5 py-3",
                "border-b border-[rgba(255,255,255,0.06)]",
                "hover:bg-white/4 transition-colors",
            ].join(" ")}
        >
            {/* Icon */}
            <div className={[
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                isFolder
                    ? "bg-[rgba(122,163,200,0.1)] text-[#7AA3C8]"
                    : "bg-[rgba(245,245,245,0.06)] text-[rgba(245,245,245,0.5)]",
            ].join(" ")}>
                {isFolder ? <Folder size={16} /> : <FileText size={16} />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[#F5F5F5] truncate font-medium">
                    {item.title}
                </p>
                <p className="text-[11px] text-[rgba(245,245,245,0.45)] mt-0.5">
                    {isFolder
                        ? `Folder • ID ${item.id}`
                        : `Document • ID ${item.doc_id}`
                    }
                </p>
            </div>

            {/* Preview button for documents */}
            {item.kind === "document" && previewUrl && (
                <button
                    type="button"
                    onClick={() => onOpenPreview(item.title, previewUrl)}
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
        </div>
    );
}

// ===========================================================================
// CLAROMENTIS: Content view (existing, extracted into sub-component)
// ===========================================================================
function ClaromentisLibraryContent({ initialRootId }: { initialRootId?: number }) {
    const [rootId, setRootId] = useState<number | undefined>(initialRootId);
    const [draftRootId, setDraftRootId] = useState<string>("");
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [pdfModal, setPdfModal] = useState<PdfModalState>({
        isOpen: false,
        filename: "",
        customUrl: "",
    });

    // Search state
    const [searchResults, setSearchResults] = useState<TLItem[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchTotal, setSearchTotal] = useState<number | null>(null);
    const [searchNextOffset, setSearchNextOffset] = useState<number | null>(null);

    // Delayed loading to prevent flickering
    const showSearchLoader = useDelayedLoading(searchLoading);

    const clientCache = useRef<Map<number, TLItem[]>>(new Map());

    // Debounced search effect
    useEffect(() => {
        const query = searchQuery.trim();

        // Reset search if query is too short
        if (query.length < 2) {
            setSearchResults([]);
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
                setSearchResults(data.items);
                setSearchTotal(data.total ?? null);
                setSearchNextOffset(data.next_offset ?? null);
            } catch (e: unknown) {
                if (e instanceof Error && e.name === "AbortError") return;
                const message = e instanceof Error ? e.message : "Search failed";
                setSearchError(message);
                setSearchResults([]);
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
            setSearchResults(prev => [...prev, ...data.items]);
            setSearchNextOffset(data.next_offset ?? null);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to load more";
            setSearchError(message);
        } finally {
            setSearchLoading(false);
        }
    }, [searchNextOffset, searchLoading, searchQuery]);

    // Check if we're in search mode
    const isSearchMode = searchQuery.trim().length >= 2;

    // PDF modal handlers
    const openPreview = useCallback((filename: string, customUrl: string) => {
        setPdfModal({ isOpen: true, filename, customUrl });
    }, []);

    const closePreview = useCallback(() => {
        setPdfModal({ isOpen: false, filename: "", customUrl: "" });
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

    const { items, loading, showLoading, error } = useFolderChildren(rootId, undefined, rootHookOptions);

    const cachedItems = rootId !== undefined ? clientCache.current.get(rootId) : undefined;
    const rawDisplayItems = cachedItems ?? items;
    const showRootLoading = showLoading && !cachedItems;

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
                    <div className="flex items-center gap-4">
                        {showRootLoading && (
                            <div className="flex items-center gap-2 text-[12px] text-[rgba(245,245,245,0.5)]">
                                <Loader2 size={14} className="animate-spin" />
                                <span>Loading...</span>
                            </div>
                        )}
                        <SyncStatusButton />
                    </div>
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
                        {searchQuery.trim().length < 2
                            ? "Type at least 2 characters to search all documents and folders."
                            : `Searching across all folders${searchTotal !== null ? ` • ${searchResults.length}${searchTotal > searchResults.length ? ` of ${searchTotal}` : ""} results` : ""}`
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

                {/* Tree View / Search Results */}
                <div className="min-h-0 flex-1 overflow-y-auto py-2">
                    {isSearchMode ? (
                        // Search Results Mode
                        <>
                            {searchError ? (
                                <div className="px-5 py-6 text-[14px] text-[#C87A7A] bg-[rgba(200,122,122,0.08)] border-b border-[rgba(200,122,122,0.15)]">
                                    {searchError}
                                </div>
                            ) : showSearchLoader && searchResults.length === 0 ? (
                                <div className="px-5 py-10 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 size={24} className="animate-spin text-[rgba(245,245,245,0.4)]" />
                                        <span className="text-[13px] text-[rgba(245,245,245,0.5)]">Searching...</span>
                                    </div>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="px-5 py-10 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search size={32} className="text-[rgba(245,245,245,0.2)]" />
                                        <span className="text-[14px] text-[rgba(245,245,245,0.5)]">No results found</span>
                                        <span className="text-[12px] text-[rgba(245,245,245,0.35)]">Try a different search term</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {searchResults.map((item) => (
                                        <SearchResultItem
                                            key={item.kind === "folder" ? `sf-${item.id}` : `sd-${item.doc_id}-${item.version_num}`}
                                            item={item}
                                            onOpenPreview={openPreview}
                                        />
                                    ))}
                                    {/* Load more button */}
                                    {searchNextOffset !== null && (
                                        <div className="px-5 py-4 flex justify-center">
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
                                                    "Load more results"
                                                )}
                                            </button>
                                        </div>
                                    )}
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
                                            key={item.kind === "folder" ? `f-${item.id}` : `d-${item.doc_id}-${item.version_num}`}
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
                customUrl={pdfModal.customUrl}
            />
        </div>
    );
}

// ===========================================================================
// GOOGLE DRIVE SHARED: Types
// ===========================================================================
type SharedRoot = {
    id: string;
    name: string;
    rule_id: number;
    shared_by: number | null;
    shared_at: string | null;
};

type SharedDriveItem = {
    id: string;
    name: string;
    mime_type: string;
    is_folder: boolean;
    modified_time?: string;
    size?: string;
    drive_id?: string;
};

type SharedBreadcrumb = {
    id: string;
    name: string;
};

// ===========================================================================
// GOOGLE DRIVE SHARED: Main content view
// ===========================================================================
function SharedDriveLibraryContent() {
    const [roots, setRoots] = useState<SharedRoot[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [items, setItems] = useState<SharedDriveItem[]>([]);
    const [breadcrumbs, setBreadcrumbs] = useState<SharedBreadcrumb[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SharedDriveItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Preview modal
    const [previewModal, setPreviewModal] = useState<{
        isOpen: boolean;
        filename: string;
        blobUrl: string;
        loading: boolean;
        error: string | null;
    }>({ isOpen: false, filename: "", blobUrl: "", loading: false, error: null });
    const blobUrlRef = useRef<string | null>(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Fetch shared roots
    const fetchRoots = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/knowledge/google-drive/shared/roots", { headers });
            if (!res.ok) throw new Error("Failed to load shared folders");
            const data = await res.json();
            setRoots(data.roots);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch folder contents
    const fetchFolder = useCallback(async (folderId: string, pageToken?: string) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ parent_id: folderId });
            if (pageToken) params.set("page_token", pageToken);
            const res = await fetch(`/api/knowledge/google-drive/shared/list?${params}`, { headers });
            if (res.status === 403) {
                setError("Access denied to this folder.");
                setItems([]);
                return;
            }
            if (!res.ok) throw new Error("Failed to load folder contents");
            const data = await res.json();
            setItems(data.items);
            setBreadcrumbs(data.breadcrumbs || []);
            setNextPageToken(data.next_page_token || null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (currentFolderId) {
            fetchFolder(currentFolderId);
        } else {
            fetchRoots();
        }
    }, [currentFolderId]);

    // Search with debounce
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        const q = searchQuery.trim();
        if (q.length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        searchTimerRef.current = setTimeout(async () => {
            try {
                const params = new URLSearchParams({ q });
                if (currentFolderId) params.set("root_id", currentFolderId);
                const res = await fetch(`/api/knowledge/google-drive/shared/search?${params}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data.items);
                }
            } catch {
                /* ignore search errors */
            } finally {
                setIsSearching(false);
            }
        }, 300);
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, [searchQuery, currentFolderId]);

    // Navigation
    const navigateTo = (folderId: string) => {
        setSearchQuery("");
        setCurrentFolderId(folderId);
    };

    const navigateToRoots = () => {
        setSearchQuery("");
        setCurrentFolderId(null);
        setItems([]);
        setBreadcrumbs([]);
    };

    // Preview
    const handlePreview = useCallback(async (fileId: string, filename: string) => {
        if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
        }
        setPreviewModal({ isOpen: true, filename, blobUrl: "", loading: true, error: null });
        try {
            const res = await fetch(`/api/knowledge/google-drive/shared/file/${fileId}/preview`, { headers });
            if (!res.ok) throw new Error(`Failed to load file (${res.status})`);
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

    const isSearchMode = searchQuery.trim().length >= 2;
    const displayItems = isSearchMode ? searchResults : (currentFolderId ? items : []);

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
                            <h1 className="text-[15px] font-semibold text-[#F5F5F5]">Google Drive Shared</h1>
                            <p className="text-[12px] text-[rgba(245,245,245,0.45)] mt-0.5">
                                {currentFolderId ? "Browsing shared folder" : `${roots.length} shared folder${roots.length !== 1 ? "s" : ""}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {loading && (
                            <div className="flex items-center gap-2 text-[12px] text-[rgba(245,245,245,0.5)]">
                                <Loader2 size={14} className="animate-spin" />
                                <span>Loading...</span>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => currentFolderId ? fetchFolder(currentFolderId) : fetchRoots()}
                            className="text-[12px] text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5] transition-colors px-2 py-1 rounded-md hover:bg-white/6"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Breadcrumbs */}
                {breadcrumbs.length > 0 && (
                    <div className="px-5 py-2.5 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-1 text-[12px] shrink-0 overflow-x-auto">
                        <button
                            type="button"
                            onClick={navigateToRoots}
                            className="text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5] transition-colors shrink-0"
                        >
                            Shared
                        </button>
                        {breadcrumbs.map((crumb, idx) => (
                            <span key={crumb.id} className="flex items-center gap-1 shrink-0">
                                <ChevronRight size={12} className="text-[rgba(245,245,245,0.3)]" />
                                {idx === breadcrumbs.length - 1 ? (
                                    <span className="text-[#F5F5F5] font-medium">{crumb.name}</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => navigateTo(crumb.id)}
                                        className="text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5] transition-colors"
                                    >
                                        {crumb.name}
                                    </button>
                                )}
                            </span>
                        ))}
                    </div>
                )}

                {/* Search */}
                <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.08)] shrink-0">
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.4)]"
                        />
                        <input
                            type="text"
                            placeholder="Search shared files and folders..."
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
                    {isSearchMode && (
                        <p className="text-[11px] text-[rgba(245,245,245,0.4)] mt-2">
                            {isSearching ? "Searching..." : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""}`}
                        </p>
                    )}
                </div>

                {/* Content */}
                <div className="min-h-0 flex-1 overflow-y-auto py-2">
                    {error ? (
                        <div className="px-5 py-6 text-[14px] text-[#C87A7A] bg-[rgba(200,122,122,0.08)] border-b border-[rgba(200,122,122,0.15)]">
                            {error}
                        </div>
                    ) : loading && !currentFolderId && roots.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={24} className="animate-spin text-[rgba(245,245,245,0.4)]" />
                                <span className="text-[13px] text-[rgba(245,245,245,0.5)]">Loading shared folders...</span>
                            </div>
                        </div>
                    ) : !currentFolderId && !isSearchMode ? (
                        // Show roots list
                        roots.length === 0 ? (
                            <div className="px-5 py-10 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Cloud size={32} className="text-[rgba(245,245,245,0.2)]" />
                                    <span className="text-[14px] text-[rgba(245,245,245,0.5)]">No shared folders</span>
                                    <span className="text-[12px] text-[rgba(245,245,245,0.35)]">
                                        Ask your admin to share a Google Drive folder with you.
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {roots.map((root) => (
                                    <div
                                        key={root.id}
                                        className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.06)] hover:bg-white/4 transition-colors cursor-pointer"
                                        onClick={() => navigateTo(root.id)}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-[rgba(122,163,200,0.1)] text-[#7AA3C8] flex items-center justify-center shrink-0">
                                            <Folder size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] text-[#F5F5F5] truncate font-medium">
                                                {root.name}
                                            </p>
                                            {root.shared_at && (
                                                <p className="text-[11px] text-[rgba(245,245,245,0.4)] mt-0.5">
                                                    Shared {new Date(root.shared_at).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <ChevronRight size={16} className="text-[rgba(245,245,245,0.3)]" />
                                    </div>
                                ))}
                            </div>
                        )
                    ) : isSearchMode ? (
                        // Search results
                        <div>
                            {searchResults.length === 0 && !isSearching ? (
                                <div className="px-5 py-10 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search size={32} className="text-[rgba(245,245,245,0.2)]" />
                                        <span className="text-[14px] text-[rgba(245,245,245,0.5)]">No results found</span>
                                    </div>
                                </div>
                            ) : (
                                searchResults.map((item) => (
                                    <SharedDriveItemRow
                                        key={item.id}
                                        item={item}
                                        onNavigate={navigateTo}
                                        onPreview={handlePreview}
                                    />
                                ))
                            )}
                        </div>
                    ) : (
                        // Folder contents
                        <div>
                            {items.length === 0 && !loading ? (
                                <div className="px-5 py-10 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Folder size={32} className="text-[rgba(245,245,245,0.2)]" />
                                        <span className="text-[14px] text-[rgba(245,245,245,0.5)]">Empty folder</span>
                                    </div>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <SharedDriveItemRow
                                        key={item.id}
                                        item={item}
                                        onNavigate={navigateTo}
                                        onPreview={handlePreview}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview modal */}
            {previewModal.isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-200"
                    onClick={closePreview}
                >
                    <div
                        className="relative w-full h-full max-w-6xl max-h-[90vh] m-4 bg-[#F5F5F5] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,0,0,0.08)] bg-white">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-[rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
                                    <FileText size={20} className="text-[rgba(0,0,0,0.5)]" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-[15px] font-semibold text-[#0C0C0C] truncate">
                                        {previewModal.filename}
                                    </h2>
                                    <p className="text-[12px] text-[rgba(0,0,0,0.5)] mt-0.5">Google Drive Shared Preview</p>
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

// Shared Drive item row
function SharedDriveItemRow({
    item,
    onNavigate,
    onPreview,
}: {
    item: SharedDriveItem;
    onNavigate: (folderId: string) => void;
    onPreview: (fileId: string, filename: string) => void;
}) {
    return (
        <div
            className={[
                "flex items-center gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.06)] hover:bg-white/4 transition-colors",
                item.is_folder ? "cursor-pointer" : "",
            ].join(" ")}
            onClick={() => item.is_folder && onNavigate(item.id)}
        >
            <div
                className={[
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    item.is_folder
                        ? "bg-[rgba(122,163,200,0.1)] text-[#7AA3C8]"
                        : "bg-[rgba(245,245,245,0.06)] text-[rgba(245,245,245,0.5)]",
                ].join(" ")}
            >
                {item.is_folder ? <Folder size={16} /> : <FileText size={16} />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[#F5F5F5] truncate font-medium">
                    {item.name}
                </p>
                {item.modified_time && (
                    <p className="text-[11px] text-[rgba(245,245,245,0.4)] mt-0.5">
                        Modified {new Date(item.modified_time).toLocaleDateString()}
                    </p>
                )}
            </div>
            {!item.is_folder && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPreview(item.id, item.name);
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
            )}
            {item.is_folder && (
                <ChevronRight size={16} className="text-[rgba(245,245,245,0.3)]" />
            )}
        </div>
    );
}

// ===========================================================================
// LibraryView: Main export -- delegates to Claromentis or Drive content
// ===========================================================================
export default function LibraryView({ initialRootId, source = "claromentis", connectionType }: LibraryViewProps) {
    if (source === "google-drive-shared") {
        return <SharedDriveLibraryContent />;
    }

    if (source === "google-drive") {
        return <DriveLibraryContent connectionType={connectionType} />;
    }

    return <ClaromentisLibraryContent initialRootId={initialRootId} />;
}
