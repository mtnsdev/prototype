"use client";

import { useCallback, useState, useEffect } from "react";
import { Folder, FileText, ChevronRight, ChevronDown, Loader2, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";

export type FolderTreeNode = {
  id: number;
  external_id: number | string;
  title: string;
  parent_external_id: number | string | null;
  node_type: string;
  has_children: boolean | null;
  is_admin_only: boolean;
  /** Google Drive: real Drive ID */
  drive_id?: string | null;
  is_shared_drive?: boolean;
};

export type SelectedTarget = {
  external_id: number | string;
  node_type: string;
  title: string;
  /** Real Google Drive resource ID (for Drive rules) */
  drive_resource_id?: string;
};

type FolderTreeSelectorProps = {
  /** Source mode: "claromentis" uses folder-tree API, "google-drive" uses Drive tree API */
  mode?: "claromentis" | "google-drive";
  /** Single-select mode callback (legacy) */
  onSelect?: (node: SelectedTarget) => void;
  selectedExternalId?: number | string | null;
  /** Multi-select mode */
  multiSelect?: boolean;
  selectedTargets?: SelectedTarget[];
  onSelectionChange?: (targets: SelectedTarget[]) => void;
  token: string;
  /** Scoped root folder ID for Google Drive mode (restricts tree to this folder) */
  rootFolderId?: string | null;
};

const API_BASE = "/api";
const FETCH_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    if ((e as Error).name === "AbortError") throw new Error("Request timed out. Is the backend running?");
    throw e;
  }
}

async function fetchIntranetFolderChildren(token: string, parentId: number | null): Promise<FolderTreeNode[]> {
  const pid = parentId ?? 0;
  const res = await fetchWithTimeout(
    `${API_BASE}/admin/folder-tree?parent_id=${pid}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.status === 401) throw new Error("Unauthorized. Please sign in again.");
  if (res.status === 403) throw new Error("Admin access required.");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to load folder tree (${res.status}): ${text.slice(0, 100)}`);
  }
  const data = await res.json();
  return data.children ?? [];
}

async function fetchDriveChildren(
  token: string,
  parentId: string,
  driveId?: string | null,
  isRootLoad?: boolean,
): Promise<FolderTreeNode[]> {
  const params = new URLSearchParams({ parent_id: parentId });
  if (driveId) params.set("drive_id", driveId);
  const res = await fetchWithTimeout(
    `${API_BASE}/admin/google-drive/tree?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.status === 401) throw new Error("Unauthorized. Please sign in again.");
  if (res.status === 403) {
    const data = await res.json().catch(() => ({ detail: "Admin Drive not connected." }));
    throw new Error(data.detail || "Admin Drive not connected.");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to load Drive tree (${res.status}): ${text.slice(0, 100)}`);
  }
  const data = await res.json();
  const children = (data.children ?? []).map((c: Record<string, unknown>) => ({
    id: 0,
    external_id: c.external_id as string,
    title: c.title as string,
    parent_external_id: parentId,
    node_type: c.node_type as string,
    has_children: c.has_children as boolean,
    is_admin_only: false,
    drive_id: (c.drive_id as string) || null,
    is_shared_drive: (c.is_shared_drive as boolean) || false,
  }));

  // If the backend returned root folder metadata and there are no children,
  // show the root folder itself so the tree is never empty when connected.
  // Only apply this during the initial root load, not when expanding a node
  // (otherwise the root folder would appear as its own child in an infinite loop).
  if (isRootLoad && data.root_folder && children.length === 0) {
    const rf = data.root_folder as Record<string, unknown>;
    return [{
      id: 0,
      external_id: rf.external_id as string,
      title: rf.title as string,
      parent_external_id: null,
      node_type: rf.node_type as string,
      has_children: rf.has_children as boolean,
      is_admin_only: false,
      drive_id: (rf.drive_id as string) || null,
      is_shared_drive: (rf.is_shared_drive as boolean) || false,
    }];
  }

  return children;
}

/** Unified fetch dispatcher */
function fetchChildren(
  token: string,
  parentId: number | string | null,
  mode: "claromentis" | "google-drive",
  driveId?: string | null,
  isRootLoad?: boolean,
): Promise<FolderTreeNode[]> {
  if (mode === "google-drive") {
    return fetchDriveChildren(token, String(parentId ?? "root"), driveId, isRootLoad);
  }
  return fetchIntranetFolderChildren(token, parentId as number | null);
}

function TreeNode({
  node,
  depth,
  expandedIds,
  onToggle,
  onSelect,
  selectedExternalId,
  multiSelect,
  selectedIds,
  onCheckToggle,
  token,
  childCache,
  setChildCache,
  mode,
}: {
  node: FolderTreeNode;
  depth: number;
  expandedIds: Set<number | string>;
  onToggle: (id: number | string) => void;
  onSelect?: (node: SelectedTarget) => void;
  selectedExternalId: number | string | null | undefined;
  multiSelect?: boolean;
  selectedIds?: Set<number | string>;
  onCheckToggle?: (node: SelectedTarget) => void;
  token: string;
  childCache: Record<number | string, FolderTreeNode[]>;
  setChildCache: (parentId: number | string, children: FolderTreeNode[]) => void;
  mode: "claromentis" | "google-drive";
}) {
  const isExpandable = node.node_type === "folder" || node.node_type === "shared_drive";
  const isExpanded = isExpandable && expandedIds.has(node.external_id);
  const [loading, setLoading] = useState(false);
  const cached = childCache[node.external_id];

  const loadChildren = useCallback(() => {
    if (cached) return;
    setLoading(true);
    const driveId = node.is_shared_drive ? String(node.external_id) : node.drive_id;
    const parentId = node.is_shared_drive ? "root" : node.external_id;
    fetchChildren(token, parentId, mode, driveId)
      .then((children) => {
        setChildCache(node.external_id, children);
      })
      .finally(() => setLoading(false));
  }, [token, node.external_id, node.is_shared_drive, node.drive_id, cached, setChildCache, mode]);

  useEffect(() => {
    if (isExpandable && isExpanded && !cached && !loading) loadChildren();
  }, [isExpandable, isExpanded, cached, loading, loadChildren]);

  const handleExpand = useCallback(() => {
    if (!isExpandable) return;
    onToggle(node.external_id);
    if (!cached && !loading) loadChildren();
  }, [isExpandable, node.external_id, onToggle, cached, loading, loadChildren]);

  const handleClick = useCallback(() => {
    const target: SelectedTarget = {
      external_id: node.external_id,
      node_type: node.node_type === "shared_drive" ? "folder" : node.node_type,
      title: node.title,
    };
    if (mode === "google-drive") {
      target.drive_resource_id = String(node.external_id);
    }
    if (multiSelect && onCheckToggle) {
      onCheckToggle(target);
    } else if (onSelect) {
      onSelect(target);
    }
  }, [node, multiSelect, onCheckToggle, onSelect, mode]);

  const paddingLeft = 12 + depth * 20;
  const isSelected = multiSelect
    ? selectedIds?.has(node.external_id) ?? false
    : selectedExternalId === node.external_id;

  const getIcon = () => {
    if (node.is_shared_drive) return <HardDrive size={14} />;
    if (node.node_type === "folder" || node.node_type === "shared_drive") return <Folder size={14} />;
    return <FileText size={14} />;
  };

  const getIconClasses = () => {
    if (node.is_shared_drive) return "bg-purple-500/10 text-purple-400";
    if (node.node_type === "folder") return "bg-amber-500/10 text-amber-400";
    return "bg-blue-500/10 text-blue-400";
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (isExpandable) handleExpand();
          handleClick();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (isExpandable) handleExpand();
            handleClick();
          }
        }}
        className={`flex items-center gap-2 py-1.5 pr-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-[rgba(255,255,255,0.12)]" : "hover:bg-[rgba(255,255,255,0.06)]"
          }`}
        style={{ paddingLeft }}
      >
        {isExpandable ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="w-5 h-5 shrink-0 text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5]"
          onClick={(e) => {
            e.stopPropagation();
            handleExpand();
          }}
        >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </Button>
        ) : (
          <div className="w-5 shrink-0" />
        )}

        {/* Checkbox for multi-select */}
        {multiSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-3.5 h-3.5 rounded border-[rgba(255,255,255,0.2)] bg-[#0C0C0C] text-blue-500 focus:ring-0 focus:ring-offset-0 shrink-0 cursor-pointer"
          />
        )}

        <div
          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${getIconClasses()}`}
        >
          {getIcon()}
        </div>
        <span className="text-[14px] text-[#F5F5F5] truncate flex-1">{node.title}</span>
      </div>
      {isExpandable && isExpanded && cached && (
        <div>
          {cached.map((child) => (
            <TreeNode
              key={String(child.external_id)}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedExternalId={selectedExternalId}
              multiSelect={multiSelect}
              selectedIds={selectedIds}
              onCheckToggle={onCheckToggle}
              token={token}
              childCache={childCache}
              setChildCache={setChildCache}
              mode={mode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTreeSelector({
  mode = "claromentis",
  onSelect,
  selectedExternalId,
  multiSelect,
  selectedTargets,
  onSelectionChange,
  token,
  rootFolderId,
}: FolderTreeSelectorProps) {
  const [rootNodes, setRootNodes] = useState<FolderTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number | string>>(new Set());
  const [childCache, setChildCacheState] = useState<Record<number | string, FolderTreeNode[]>>({});

  const selectedIds = new Set((selectedTargets ?? []).map((t) => t.external_id));

  const setChildCache = useCallback((parentId: number | string, children: FolderTreeNode[]) => {
    setChildCacheState((prev) => ({ ...prev, [String(parentId)]: children }));
  }, []);

  const loadRoot = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    // For Google Drive mode, use scoped rootFolderId if available; backend will
    // also enforce this, but starting at the right folder avoids showing "root".
    const initialParent = mode === "google-drive"
      ? (rootFolderId || "root")
      : null;
    fetchChildren(token, initialParent, mode, undefined, true)
      .then((children) => {
        setRootNodes(children);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [token, mode, rootFolderId]);

  // Reset state when mode changes
  useEffect(() => {
    setRootNodes([]);
    setExpandedIds(new Set());
    setChildCacheState({});
    loadRoot();
  }, [loadRoot]);

  const toggleExpand = useCallback((id: number | string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCheckToggle = useCallback(
    (node: SelectedTarget) => {
      if (!onSelectionChange) return;
      const current = selectedTargets ?? [];
      const exists = current.some((t) => String(t.external_id) === String(node.external_id));
      if (exists) {
        onSelectionChange(current.filter((t) => String(t.external_id) !== String(node.external_id)));
      } else {
        onSelectionChange([...current, node]);
      }
    },
    [selectedTargets, onSelectionChange]
  );

  if (loading && rootNodes.length === 0) {
    return (
      <div className="flex items-center justify-center py-6 text-[rgba(245,245,245,0.5)] text-[14px]">
        <Loader2 size={18} className="animate-spin mr-2" />
        {mode === "google-drive" ? "Loading Google Drive folders…" : "Loading folder tree…"}
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-4">
        <p className="text-[14px] text-red-400 mb-2">{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={loadRoot}>
          Retry
        </Button>
      </div>
    );
  }
  if (rootNodes.length === 0) {
    return (
      <div className="py-4 text-[14px] text-[rgba(245,245,245,0.5)]">
        {mode === "google-drive"
          ? "No folders available. The connected root folder may be empty or inaccessible."
          : "No folders yet. Sync the folder tree from the admin panel first."}
      </div>
    );
  }

  return (
    <div className="max-h-[280px] overflow-y-auto rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0C0C0C] p-2">
      {rootNodes.map((node) => (
        <TreeNode
          key={String(node.external_id)}
          node={node}
          depth={0}
          expandedIds={expandedIds}
          onToggle={toggleExpand}
          onSelect={onSelect}
          selectedExternalId={selectedExternalId}
          multiSelect={multiSelect}
          selectedIds={selectedIds}
          onCheckToggle={handleCheckToggle}
          token={token}
          childCache={childCache}
          setChildCache={setChildCache}
          mode={mode}
        />
      ))}
    </div>
  );
}
