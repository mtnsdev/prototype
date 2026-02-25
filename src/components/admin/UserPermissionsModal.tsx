"use client";

import { useEffect, useState, useCallback } from "react";
import {
    X,
    Folder,
    FileText,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Loader2,
    ChevronRight,
    ChevronDown,
    AlertCircle,
} from "lucide-react";

type PermissionItem = {
    content_id: number;
    content_type: string;
    can_view: boolean;
    ancestors: number[] | null;
    title: string | null;
    synced_at: string | null;
};

type PermissionsResponse = {
    user_id: number;
    source: string;
    items: PermissionItem[];
    total: number;
};

type TreeNode = {
    item: PermissionItem;
    children: TreeNode[];
};

function buildTree(items: PermissionItem[]): TreeNode[] {
    const byId = new Map<number, TreeNode>();
    for (const item of items) {
        byId.set(item.content_id, { item, children: [] });
    }

    const roots: TreeNode[] = [];

    for (const item of items) {
        const node = byId.get(item.content_id)!;
        const parentId = item.ancestors && item.ancestors.length > 0 ? item.ancestors[0] : null;
        if (parentId !== null && byId.has(parentId)) {
            byId.get(parentId)!.children.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
}

function PermissionTreeNode({
    node,
    depth = 0,
}: {
    node: TreeNode;
    depth?: number;
}) {
    const [expanded, setExpanded] = useState(depth < 2);
    const { item, children } = node;
    const hasChildren = children.length > 0;
    const isFolder = item.content_type === "folder";
    const label = item.title ?? `${item.content_type} #${item.content_id}`;

    return (
        <div>
            <div
                className={`flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] cursor-pointer select-none`}
                style={{ paddingLeft: `${8 + depth * 20}px` }}
                onClick={() => hasChildren && setExpanded((e) => !e)}
            >
                {/* Expand toggle */}
                <span className="w-4 shrink-0">
                    {hasChildren ? (
                        expanded ? (
                            <ChevronDown size={14} className="text-[rgba(245,245,245,0.4)]" />
                        ) : (
                            <ChevronRight size={14} className="text-[rgba(245,245,245,0.4)]" />
                        )
                    ) : null}
                </span>

                {/* Type icon */}
                {isFolder ? (
                    <Folder size={14} className="text-amber-400 shrink-0" />
                ) : (
                    <FileText size={14} className="text-blue-400 shrink-0" />
                )}

                {/* Label */}
                <span className="flex-1 text-[13px] text-[rgba(245,245,245,0.8)] truncate">
                    {label}
                </span>

                {/* can_view badge */}
                {item.can_view ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 shrink-0">
                        <CheckCircle2 size={12} />
                        Allowed
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-[11px] text-red-400 shrink-0">
                        <XCircle size={12} />
                        Denied
                    </span>
                )}
            </div>

            {expanded && hasChildren && (
                <div>
                    {children.map((child) => (
                        <PermissionTreeNode
                            key={child.item.content_id}
                            node={child}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function UserPermissionsModal({
    userId,
    userEmail,
    onClose,
}: {
    userId: number;
    userEmail: string;
    onClose: () => void;
}) {
    const [data, setData] = useState<PermissionsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);

    const fetchPermissions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(
                `/api/admin/users/${userId}/claromentis-permissions`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            if (!res.ok) throw new Error("Failed to load permissions");
            const json: PermissionsResponse = await res.json();
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load permissions");
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncMessage(null);
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(
                `/api/admin/users/${userId}/claromentis-permissions/sync`,
                { method: "POST", headers: { Authorization: `Bearer ${token}` } },
            );
            if (!res.ok) throw new Error("Failed to queue sync");
            setSyncMessage("Sync queued. Results will appear after the task completes.");
        } catch (err) {
            setSyncMessage(err instanceof Error ? err.message : "Sync failed");
        } finally {
            setIsSyncing(false);
        }
    };

    const treeRoots = data ? buildTree(data.items) : [];
    const syncedAt = data?.items[0]?.synced_at
        ? new Date(data.items[0].synced_at).toLocaleString()
        : null;

    const allowedCount = data?.items.filter((i) => i.can_view).length ?? 0;
    const deniedCount = (data?.total ?? 0) - allowedCount;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.1)] overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-[16px] font-semibold text-[#F5F5F5]">
                            Claromentis Access
                        </h2>
                        <p className="text-[12px] text-[rgba(245,245,245,0.45)] mt-0.5">
                            {userEmail}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.06)]"
                    >
                        <X size={18} className="text-[rgba(245,245,245,0.5)]" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4 text-[12px]">
                        {data && (
                            <>
                                <span className="text-emerald-400">
                                    {allowedCount} allowed
                                </span>
                                <span className="text-red-400">{deniedCount} denied</span>
                                {syncedAt && (
                                    <span className="text-[rgba(245,245,245,0.35)]">
                                        Last synced {syncedAt}
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchPermissions}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-[rgba(245,245,245,0.5)] disabled:opacity-40"
                            title="Refresh"
                        >
                            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                        </button>
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.08)] text-[12px] font-medium text-[rgba(245,245,245,0.8)] disabled:opacity-50 transition-colors"
                        >
                            {isSyncing ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <RefreshCw size={12} />
                            )}
                            {isSyncing ? "Queuing..." : "Sync Now"}
                        </button>
                    </div>
                </div>

                {/* Sync message */}
                {syncMessage && (
                    <div className="px-6 py-2 bg-[rgba(251,191,36,0.08)] border-b border-[rgba(251,191,36,0.15)] shrink-0">
                        <p className="text-[12px] text-amber-400 flex items-center gap-2">
                            <AlertCircle size={12} />
                            {syncMessage}
                        </p>
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-[rgba(245,245,245,0.4)]" />
                        </div>
                    ) : error ? (
                        <div className="py-8 text-center">
                            <p className="text-[13px] text-[#C87A7A]">{error}</p>
                        </div>
                    ) : treeRoots.length === 0 ? (
                        <div className="py-12 text-center">
                            <Folder
                                size={40}
                                className="mx-auto text-[rgba(245,245,245,0.2)] mb-3"
                            />
                            <p className="text-[14px] text-[rgba(245,245,245,0.5)]">
                                No synced permissions yet
                            </p>
                            <p className="text-[12px] text-[rgba(245,245,245,0.35)] mt-1">
                                Click &quot;Sync Now&quot; to fetch this user&apos;s Claromentis access.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {treeRoots.map((node) => (
                                <PermissionTreeNode key={node.item.content_id} node={node} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
