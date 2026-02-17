"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Share2,
    Plus,
    Trash2,
    Folder,
    Users,
    User,
    Building2,
    LayoutGrid,
    Shield,
    Loader2,
    X,
    Cloud,
} from "lucide-react";
import { FolderTreeSelector, SelectedTarget } from "@/components/admin/FolderTreeSelector";

type SharedFolderRule = {
    id: number;
    folder_id: string;
    folder_name: string;
    scope_type: string;
    scope_value: string;
    created_by_id: number | null;
    created_at: string | null;
};

type UserItem = {
    id: number;
    email: string;
    username: string;
    role: string;
    status: string;
    agency_id?: string;
};

const SCOPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
    user: { label: "User", icon: <User size={14} /> },
    role: { label: "Role", icon: <Shield size={14} /> },
    agency: { label: "Agency", icon: <Building2 size={14} /> },
    workspace: { label: "Workspace", icon: <LayoutGrid size={14} /> },
};

export default function SharedFoldersPage() {
    const [rules, setRules] = useState<SharedFolderRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [users, setUsers] = useState<UserItem[]>([]);

    const fetchRules = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch("/api/admin/google-drive/shared-folders/", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch shared folders");
            const data = await res.json();
            setRules(data.rules);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch("/api/admin/users?page_size=100", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        fetchRules();
        fetchUsers();
    }, [fetchRules, fetchUsers]);

    const handleDelete = async (ruleId: number) => {
        if (!confirm("Delete this shared folder rule?")) return;
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(`/api/admin/google-drive/shared-folders/${ruleId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to delete");
            }
            fetchRules();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete");
        }
    };

    const getScopeLabel = (rule: SharedFolderRule) => {
        if (rule.scope_type === "role") {
            return rule.scope_value === "admin" ? "All Admins" : "All Users";
        }
        if (rule.scope_type === "user") {
            const u = users.find((u) => u.id.toString() === rule.scope_value);
            return u ? u.email : `User #${rule.scope_value}`;
        }
        if (rule.scope_type === "agency") {
            return `Agency: ${rule.scope_value}`;
        }
        if (rule.scope_type === "workspace") {
            return `Workspace: ${rule.scope_value}`;
        }
        return rule.scope_value;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[18px] font-semibold text-[#F5F5F5]">Shared Folders</h2>
                    <p className="text-[13px] text-[rgba(245,245,245,0.5)] mt-1">
                        Share Google Drive folders with specific users, roles, agencies, or workspaces.
                        Shared folders appear under Knowledge &rarr; Google Drive Shared.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.1)] text-[14px] font-medium text-[#F5F5F5] transition-colors"
                >
                    <Plus size={16} />
                    Share Folder
                </button>
            </div>

            {/* Info */}
            <div className="rounded-2xl bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.2)] p-4">
                <div className="flex items-start gap-3">
                    <Share2 size={20} className="text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-[13px] text-[rgba(245,245,245,0.7)] space-y-1">
                        <p><strong>How shared folders work:</strong></p>
                        <ul className="list-disc ml-4 space-y-1">
                            <li>Select a folder from the Admin Google Drive to share</li>
                            <li>Choose who can see it: specific user, role, agency, or workspace</li>
                            <li>Users will see the folder under Knowledge &rarr; Google Drive Shared</li>
                            <li>Users can browse the folder and its subfolders/files</li>
                            <li>Access is enforced server-side &mdash; unauthorized users receive 403</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Rules Table */}
            <div className="rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.08)] overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-[rgba(245,245,245,0.4)]" />
                    </div>
                ) : error ? (
                    <div className="p-6 text-center">
                        <p className="text-[14px] text-[#C87A7A]">{error}</p>
                    </div>
                ) : rules.length === 0 ? (
                    <div className="p-12 text-center">
                        <Share2 size={48} className="mx-auto text-[rgba(245,245,245,0.2)] mb-4" />
                        <p className="text-[14px] text-[rgba(245,245,245,0.5)]">No shared folder rules yet</p>
                        <p className="text-[13px] text-[rgba(245,245,245,0.4)] mt-1">
                            Share a Google Drive folder to make it visible to specific users or groups
                        </p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[rgba(255,255,255,0.08)]">
                                <th className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                                    Folder
                                </th>
                                <th className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                                    Shared With
                                </th>
                                <th className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                                    Scope Type
                                </th>
                                <th className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rules.map((rule) => (
                                <tr
                                    key={rule.id}
                                    className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <Folder size={16} className="text-amber-400" />
                                            <div>
                                                <p className="text-[14px] text-[#F5F5F5]">
                                                    {rule.folder_name || "Untitled"}
                                                </p>
                                                <p className="text-[11px] text-[rgba(245,245,245,0.35)] font-mono">
                                                    {rule.folder_id}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-[14px] text-[#F5F5F5]">
                                            {getScopeLabel(rule)}
                                        </p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.06)] text-[12px] text-[rgba(245,245,245,0.7)]">
                                            {SCOPE_LABELS[rule.scope_type]?.icon}
                                            {SCOPE_LABELS[rule.scope_type]?.label || rule.scope_type}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-[13px] text-[rgba(245,245,245,0.5)]">
                                        {rule.created_at
                                            ? new Date(rule.created_at).toLocaleDateString()
                                            : "—"}
                                    </td>
                                    <td className="px-2 py-4">
                                        <button
                                            onClick={() => handleDelete(rule.id)}
                                            className="p-2 rounded-lg hover:bg-[rgba(200,122,122,0.1)] text-[rgba(245,245,245,0.5)] hover:text-[#C87A7A] transition-colors"
                                            title="Delete rule"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateSharedFolderModal
                    users={users}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        fetchRules();
                    }}
                />
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Create Shared Folder Modal
// ---------------------------------------------------------------------------
function CreateSharedFolderModal({
    users,
    onClose,
    onCreated,
}: {
    users: UserItem[];
    onClose: () => void;
    onCreated: () => void;
}) {
    const [scopeType, setScopeType] = useState<"user" | "role" | "agency" | "workspace">("role");
    const [scopeValue, setScopeValue] = useState("user");
    const [selectedFolder, setSelectedFolder] = useState<SelectedTarget | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasAgencyConnection, setHasAgencyConnection] = useState<boolean | null>(null);
    const [rootFolderId, setRootFolderId] = useState<string | null>(null);
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null;

    useEffect(() => {
        if (!token) return;
        fetch("/api/admin/google-drive/connection-status", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setHasAgencyConnection(data.connected === true);
                setRootFolderId(data.root_folder_id || null);
            })
            .catch(() => {
                setHasAgencyConnection(false);
            });
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFolder || !token) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/admin/google-drive/shared-folders/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    folder_id: selectedFolder.drive_resource_id || String(selectedFolder.external_id),
                    folder_name: selectedFolder.title,
                    scope_type: scopeType,
                    scope_value: scopeValue,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to create");
            }
            onCreated();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to create");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.1)] overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between shrink-0">
                    <h2 className="text-[16px] font-semibold text-[#F5F5F5]">Share a Folder</h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.06)]">
                        <X size={18} className="text-[rgba(245,245,245,0.5)]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {/* Scope Type */}
                    <div>
                        <label className="block text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider mb-2">
                            Share With
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(["role", "user", "agency", "workspace"] as const).map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => {
                                        setScopeType(st);
                                        if (st === "role") setScopeValue("user");
                                        else if (st === "user") setScopeValue(users[0]?.id.toString() || "");
                                        else setScopeValue("");
                                    }}
                                    className={[
                                        "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-colors",
                                        scopeType === st
                                            ? "bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.15)] text-[#F5F5F5]"
                                            : "bg-transparent border-[rgba(255,255,255,0.08)] text-[rgba(245,245,245,0.5)]",
                                    ].join(" ")}
                                >
                                    {SCOPE_LABELS[st].icon}
                                    {SCOPE_LABELS[st].label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scope Value */}
                    <div>
                        <label className="block text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider mb-2">
                            {scopeType === "role" ? "Select Role" : scopeType === "user" ? "Select User" : scopeType === "agency" ? "Agency ID" : "Workspace ID"}
                        </label>
                        {scopeType === "role" ? (
                            <select
                                value={scopeValue}
                                onChange={(e) => setScopeValue(e.target.value)}
                                style={{ colorScheme: "dark" }}
                                className="w-full px-4 py-2.5 rounded-xl bg-[#0C0C0C] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                            >
                                <option value="user">All Users</option>
                                <option value="admin">All Admins</option>
                            </select>
                        ) : scopeType === "user" ? (
                            <select
                                value={scopeValue}
                                onChange={(e) => setScopeValue(e.target.value)}
                                style={{ colorScheme: "dark" }}
                                className="w-full px-4 py-2.5 rounded-xl bg-[#0C0C0C] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                            >
                                {users.map((u) => (
                                    <option key={u.id} value={u.id.toString()}>
                                        {u.email}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={scopeValue}
                                onChange={(e) => setScopeValue(e.target.value)}
                                placeholder={scopeType === "agency" ? "Enter agency ID" : "Enter workspace ID"}
                                className="w-full px-4 py-2.5 rounded-xl bg-[#0C0C0C] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] placeholder-[rgba(245,245,245,0.3)] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                            />
                        )}
                    </div>

                    {/* Folder Picker */}
                    <div>
                        <label className="block text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider mb-2">
                            Select Folder
                        </label>
                        {hasAgencyConnection === false ? (
                            <div className="text-center py-8 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0C0C0C]">
                                <Cloud size={32} className="mx-auto text-[rgba(245,245,245,0.2)] mb-3" />
                                <p className="text-[14px] text-[rgba(245,245,245,0.5)] mb-3">Admin Drive not connected</p>
                                <a
                                    href="/dashboard/settings/integrations"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.1)] text-[13px] font-medium text-[#F5F5F5] transition-colors"
                                >
                                    Connect Admin Drive
                                </a>
                            </div>
                        ) : hasAgencyConnection === null ? (
                            <div className="flex items-center justify-center py-6 text-[rgba(245,245,245,0.5)]">
                                <Loader2 size={18} className="animate-spin mr-2" />
                                Checking connection...
                            </div>
                        ) : token ? (
                            <>
                                <FolderTreeSelector
                                    mode="google-drive"
                                    token={token}
                                    selectedExternalId={selectedFolder?.external_id ?? null}
                                    onSelect={(node) => setSelectedFolder(node)}
                                    rootFolderId={rootFolderId}
                                />
                                {selectedFolder && (
                                    <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]">
                                        <Folder size={14} className="text-amber-400" />
                                        <span className="text-[13px] text-[#F5F5F5] flex-1">{selectedFolder.title}</span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFolder(null)}
                                            className="text-[rgba(245,245,245,0.5)] hover:text-red-400"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-[13px] text-[rgba(245,245,245,0.5)]">Sign in to load tree</p>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-[14px] font-medium text-[rgba(245,245,245,0.7)] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedFolder || !scopeValue}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.15)] text-[14px] font-medium text-[#F5F5F5] transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? "Sharing..." : "Share Folder"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
