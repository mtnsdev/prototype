"use client";

import { useCallback, useState, useEffect } from "react";
import { Folder, FileText, ChevronRight, ChevronDown, Loader2 } from "lucide-react";

export type FolderTreeNode = {
  id: number;
  external_id: number;
  title: string;
  parent_external_id: number | null;
  node_type: string;
  has_children: boolean | null;
  is_admin_only: boolean;
};

export type SelectedTarget = {
  external_id: number;
  node_type: string;
  title: string;
};

type FolderTreeSelectorProps = {
  /** Single-select mode callback (legacy) */
  onSelect?: (node: SelectedTarget) => void;
  selectedExternalId?: number | null;
  /** Multi-select mode */
  multiSelect?: boolean;
  selectedTargets?: SelectedTarget[];
  onSelectionChange?: (targets: SelectedTarget[]) => void;
  token: string;
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

async function fetchChildren(token: string, parentId: number | null): Promise<FolderTreeNode[]> {
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
}: {
  node: FolderTreeNode;
  depth: number;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
  onSelect?: (node: SelectedTarget) => void;
  selectedExternalId: number | null | undefined;
  multiSelect?: boolean;
  selectedIds?: Set<number>;
  onCheckToggle?: (node: SelectedTarget) => void;
  token: string;
  childCache: Record<number, FolderTreeNode[]>;
  setChildCache: (parentId: number, children: FolderTreeNode[]) => void;
}) {
  const isFolder = node.node_type === "folder";
  const isExpanded = isFolder && expandedIds.has(node.external_id);
  const [loading, setLoading] = useState(false);
  const cached = childCache[node.external_id];

  const loadChildren = useCallback(() => {
    if (cached) return;
    setLoading(true);
    fetchChildren(token, node.external_id)
      .then((children) => {
        setChildCache(node.external_id, children);
      })
      .finally(() => setLoading(false));
  }, [token, node.external_id, cached, setChildCache]);

  useEffect(() => {
    if (isFolder && isExpanded && !cached && !loading) loadChildren();
  }, [isFolder, isExpanded, cached, loading, loadChildren]);

  const handleExpand = useCallback(() => {
    if (!isFolder) return;
    onToggle(node.external_id);
    if (!cached && !loading) loadChildren();
  }, [isFolder, node.external_id, onToggle, cached, loading, loadChildren]);

  const handleClick = useCallback(() => {
    if (multiSelect && onCheckToggle) {
      onCheckToggle({
        external_id: node.external_id,
        node_type: node.node_type,
        title: node.title,
      });
    } else if (onSelect) {
      onSelect({
        external_id: node.external_id,
        node_type: node.node_type,
        title: node.title,
      });
    }
  }, [node, multiSelect, onCheckToggle, onSelect]);

  const paddingLeft = 12 + depth * 20;
  const isSelected = multiSelect
    ? selectedIds?.has(node.external_id) ?? false
    : selectedExternalId === node.external_id;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (isFolder) handleExpand();
          handleClick();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (isFolder) handleExpand();
            handleClick();
          }
        }}
        className={`flex items-center gap-2 py-1.5 pr-2 rounded-lg cursor-pointer transition-colors ${
          isSelected ? "bg-[rgba(255,255,255,0.12)]" : "hover:bg-[rgba(255,255,255,0.06)]"
        }`}
        style={{ paddingLeft }}
      >
        {isFolder ? (
          <button
            type="button"
            className="w-5 h-5 flex items-center justify-center text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5] shrink-0"
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
          </button>
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
          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
            isFolder ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
          }`}
        >
          {isFolder ? <Folder size={14} /> : <FileText size={14} />}
        </div>
        <span className="text-[14px] text-[#F5F5F5] truncate flex-1">{node.title}</span>
      </div>
      {isFolder && isExpanded && cached && (
        <div>
          {cached.map((child) => (
            <TreeNode
              key={child.external_id}
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTreeSelector({
  onSelect,
  selectedExternalId,
  multiSelect,
  selectedTargets,
  onSelectionChange,
  token,
}: FolderTreeSelectorProps) {
  const [rootNodes, setRootNodes] = useState<FolderTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [childCache, setChildCacheState] = useState<Record<number, FolderTreeNode[]>>({});

  const selectedIds = new Set((selectedTargets ?? []).map((t) => t.external_id));

  const setChildCache = useCallback((parentId: number, children: FolderTreeNode[]) => {
    setChildCacheState((prev) => ({ ...prev, [parentId]: children }));
  }, []);

  const loadRoot = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetchChildren(token, null)
      .then((children) => {
        setRootNodes(children);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    loadRoot();
  }, [loadRoot]);

  const toggleExpand = useCallback((id: number) => {
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
      const exists = current.some((t) => t.external_id === node.external_id);
      if (exists) {
        onSelectionChange(current.filter((t) => t.external_id !== node.external_id));
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
        Loading folder tree…
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-4">
        <p className="text-[14px] text-red-400 mb-2">{error}</p>
        <button
          type="button"
          onClick={loadRoot}
          className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.08)] text-[13px] text-[#F5F5F5] hover:bg-[rgba(255,255,255,0.12)]"
        >
          Retry
        </button>
      </div>
    );
  }
  if (rootNodes.length === 0) {
    return (
      <div className="py-4 text-[14px] text-[rgba(245,245,245,0.5)]">
        No folders yet. Sync the folder tree from the admin panel first.
      </div>
    );
  }

  return (
    <div className="max-h-[280px] overflow-y-auto rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0C0C0C] p-2">
      {rootNodes.map((node) => (
        <TreeNode
          key={node.external_id}
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
        />
      ))}
    </div>
  );
}
