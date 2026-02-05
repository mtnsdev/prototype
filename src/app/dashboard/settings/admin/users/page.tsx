"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
    Users,
    Plus,
    Search,
    ChevronDown,
    MoreVertical,
    Shield,
    UserCheck,
    Clock,
    UserX,
    Loader2,
    X,
    Key,
} from "lucide-react";

type User = {
    id: number;
    email: string;
    username: string;
    role: string;
    status: string;
    created_at: string;
    last_login_at: string | null;
};

type UsersResponse = {
    users: User[];
    total: number;
    page: number;
    page_size: number;
};

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: typeof UserCheck }> = {
    active: { bg: "bg-green-500/10", text: "text-green-400", icon: UserCheck },
    invited: { bg: "bg-amber-500/10", text: "text-amber-400", icon: Clock },
    disabled: { bg: "bg-red-500/10", text: "text-red-400", icon: UserX },
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
    admin: { bg: "bg-amber-500/10", text: "text-amber-400" },
    user: { bg: "bg-blue-500/10", text: "text-blue-400" },
};

// Password validation helper
function validatePassword(password: string): { valid: boolean; error?: string } {
    if (password.length < 8) {
        return { valid: false, error: "Password must be at least 8 characters" };
    }
    if (!/[a-zA-Z]/.test(password)) {
        return { valid: false, error: "Password must contain at least one letter" };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, error: "Password must contain at least one number" };
    }
    return { valid: true };
}

// Action Menu Component with Portal
function ActionMenu({
    isOpen,
    onClose,
    triggerRef,
    children,
}: {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    children: React.ReactNode;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const menuWidth = 192; // w-48 = 12rem = 192px
            const menuHeight = 120; // approximate height
            
            let top = rect.bottom + 4;
            let left = rect.right - menuWidth;
            
            // Flip up if near bottom of viewport
            if (top + menuHeight > window.innerHeight - 20) {
                top = rect.top - menuHeight - 4;
            }
            
            // Ensure left doesn't go off-screen
            if (left < 10) {
                left = 10;
            }
            
            setPosition({ top, left });
        }
    }, [isOpen, triggerRef]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose, triggerRef]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div
            ref={menuRef}
            className="fixed w-48 rounded-xl bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] shadow-xl overflow-hidden"
            style={{
                top: position.top,
                left: position.left,
                zIndex: 9999,
            }}
        >
            {children}
        </div>,
        document.body
    );
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // Modals
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [actionMenuUser, setActionMenuUser] = useState<number | null>(null);
    
    // Refs for action menu buttons
    const actionButtonRefs = useRef<Map<number, HTMLButtonElement | null>>(new Map());
    const getButtonRef = (userId: number) => ({
        current: actionButtonRefs.current.get(userId) ?? null,
    });

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("auth_token");
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("page_size", "20");

            if (searchQuery) params.set("search", searchQuery);
            if (roleFilter) params.set("role", roleFilter);
            if (statusFilter) params.set("status", statusFilter);

            const response = await fetch(`/api/admin/users?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Failed to fetch users");

            const data: UsersResponse = await response.json();
            setUsers(data.users);
            setTotal(data.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load users");
        } finally {
            setIsLoading(false);
        }
    }, [page, searchQuery, roleFilter, statusFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleInvite = async (email: string, role: string, password?: string) => {
        try {
            const token = localStorage.getItem("auth_token");
            const body: { email: string; role: string; password?: string } = { email, role };
            if (password) {
                body.password = password;
            }
            
            const response = await fetch("/api/admin/users/invite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Failed to invite user");
            }

            setShowInviteModal(false);
            fetchUsers();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to invite user");
        }
    };

    const handleUpdateUser = async (userId: number, updates: { role?: string; status?: string }) => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Failed to update user");
            }

            setEditingUser(null);
            setActionMenuUser(null);
            fetchUsers();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update user");
        }
    };

    const handleDisableUser = async (userId: number) => {
        if (!confirm("Are you sure you want to disable this user?")) return;

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Failed to disable user");
            }

            setActionMenuUser(null);
            fetchUsers();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to disable user");
        }
    };

    const handleChangePassword = async (userId: number, newPassword: string): Promise<boolean> => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`/api/admin/users/${userId}/password`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ new_password: newPassword }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Failed to change password");
            }

            alert("Password changed successfully");
            return true;
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to change password");
            return false;
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Never";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header with Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.4)]" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#161616] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] placeholder:text-[rgba(245,245,245,0.4)] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                        />
                    </div>

                    {/* Role Filter */}
                    <select
                        value={roleFilter || ""}
                        onChange={(e) => setRoleFilter(e.target.value || null)}
                        className="px-3 py-2.5 rounded-xl bg-[#161616] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter || ""}
                        onChange={(e) => setStatusFilter(e.target.value || null)}
                        className="px-3 py-2.5 rounded-xl bg-[#161616] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="invited">Invited</option>
                        <option value="disabled">Disabled</option>
                    </select>
                </div>

                <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.1)] text-[14px] font-medium text-[#F5F5F5] transition-colors"
                >
                    <Plus size={16} />
                    Invite User
                </button>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.08)] overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-[rgba(245,245,245,0.4)]" />
                    </div>
                ) : error ? (
                    <div className="p-6 text-center">
                        <p className="text-[14px] text-[#C87A7A]">{error}</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users size={48} className="mx-auto text-[rgba(245,245,245,0.2)] mb-4" />
                        <p className="text-[14px] text-[rgba(245,245,245,0.5)]">No users found</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[rgba(255,255,255,0.08)]">
                                <th className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">User</th>
                                <th className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">Role</th>
                                <th className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">Status</th>
                                <th className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">Last Login</th>
                                <th className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">Created</th>
                                <th className="w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => {
                                const statusStyle = STATUS_COLORS[user.status] || STATUS_COLORS.active;
                                const roleStyle = ROLE_COLORS[user.role] || ROLE_COLORS.user;
                                const StatusIcon = statusStyle.icon;

                                return (
                                    <tr key={user.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                                        <td className="px-5 py-4">
                                            <div>
                                                <p className="text-[14px] font-medium text-[#F5F5F5]">{user.username}</p>
                                                <p className="text-[13px] text-[rgba(245,245,245,0.5)]">{user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                                                {user.role === "admin" && <Shield size={12} />}
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                                <StatusIcon size={12} />
                                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-[13px] text-[rgba(245,245,245,0.5)]">
                                            {formatDate(user.last_login_at)}
                                        </td>
                                        <td className="px-5 py-4 text-[13px] text-[rgba(245,245,245,0.5)]">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="px-2 py-4">
                                            <button
                                                ref={(el) => { actionButtonRefs.current.set(user.id, el); }}
                                                onClick={() => setActionMenuUser(actionMenuUser === user.id ? null : user.id)}
                                                className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                                            >
                                                <MoreVertical size={16} className="text-[rgba(245,245,245,0.5)]" />
                                            </button>

                                            <ActionMenu
                                                isOpen={actionMenuUser === user.id}
                                                onClose={() => setActionMenuUser(null)}
                                                triggerRef={getButtonRef(user.id)}
                                            >
                                                <button
                                                    onClick={() => {
                                                        setEditingUser(user);
                                                        setActionMenuUser(null);
                                                    }}
                                                    className="w-full px-4 py-2.5 text-left text-[14px] text-[rgba(245,245,245,0.8)] hover:bg-[rgba(255,255,255,0.06)]"
                                                >
                                                    Edit User
                                                </button>
                                                {user.status !== "disabled" && (
                                                    <button
                                                        onClick={() => handleDisableUser(user.id)}
                                                        className="w-full px-4 py-2.5 text-left text-[14px] text-[#C87A7A] hover:bg-[rgba(255,255,255,0.06)]"
                                                    >
                                                        Disable User
                                                    </button>
                                                )}
                                                {user.status === "disabled" && (
                                                    <button
                                                        onClick={() => handleUpdateUser(user.id, { status: "active" })}
                                                        className="w-full px-4 py-2.5 text-left text-[14px] text-green-400 hover:bg-[rgba(255,255,255,0.06)]"
                                                    >
                                                        Reactivate User
                                                    </button>
                                                )}
                                            </ActionMenu>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {total > 20 && (
                <div className="flex items-center justify-between">
                    <p className="text-[13px] text-[rgba(245,245,245,0.5)]">
                        Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} users
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 rounded-xl bg-[#161616] border border-[rgba(255,255,255,0.08)] text-[14px] text-[rgba(245,245,245,0.7)] disabled:opacity-50 hover:bg-[rgba(255,255,255,0.06)]"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page * 20 >= total}
                            className="px-4 py-2 rounded-xl bg-[#161616] border border-[rgba(255,255,255,0.08)] text-[14px] text-[rgba(245,245,245,0.7)] disabled:opacity-50 hover:bg-[rgba(255,255,255,0.06)]"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <InviteUserModal
                    onClose={() => setShowInviteModal(false)}
                    onInvite={handleInvite}
                />
            )}

            {/* Edit Modal */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={(updates) => handleUpdateUser(editingUser.id, updates)}
                    onPasswordChange={handleChangePassword}
                />
            )}
        </div>
    );
}

// Invite User Modal Component
function InviteUserModal({
    onClose,
    onInvite,
}: {
    onClose: () => void;
    onInvite: (email: string, role: string, password?: string) => void;
}) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("user");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        
        setPasswordError(null);
        
        // Validate password if provided
        if (password) {
            if (password !== confirmPassword) {
                setPasswordError("Passwords do not match");
                return;
            }
            const validation = validatePassword(password);
            if (!validation.valid) {
                setPasswordError(validation.error || "Invalid password");
                return;
            }
        }

        setIsSubmitting(true);
        await onInvite(email.trim().toLowerCase(), role, password || undefined);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.1)] overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                    <h2 className="text-[16px] font-semibold text-[#F5F5F5]">Invite User</h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.06)]">
                        <X size={18} className="text-[rgba(245,245,245,0.5)]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            required
                            className="w-full px-4 py-2.5 rounded-xl bg-[#0C0C0C] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] placeholder:text-[rgba(245,245,245,0.4)] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider mb-2">
                            Role
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#0C0C0C] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {/* Password Section */}
                    <div className="pt-2 border-t border-[rgba(255,255,255,0.08)]">
                        <p className="text-[12px] text-[rgba(245,245,245,0.5)] mb-3">
                            Set a password for email/password login, or leave empty for Google OAuth only.
                        </p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider mb-2">
                                    Password (Optional)
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="w-full px-4 py-2.5 rounded-xl bg-[#0C0C0C] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] placeholder:text-[rgba(245,245,245,0.4)] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                                />
                            </div>
                            
                            {password && (
                                <div>
                                    <label className="block text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider mb-2">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm password"
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#0C0C0C] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] placeholder:text-[rgba(245,245,245,0.4)] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                                    />
                                </div>
                            )}
                            
                            {passwordError && (
                                <p className="text-[13px] text-[#C87A7A]">{passwordError}</p>
                            )}
                            
                            {password && (
                                <p className="text-[12px] text-[rgba(245,245,245,0.4)]">
                                    Password must be at least 8 characters with at least one letter and one number.
                                </p>
                            )}
                        </div>
                    </div>

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
                            disabled={isSubmitting || !email.trim()}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.15)] text-[14px] font-medium text-[#F5F5F5] transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? "Inviting..." : "Send Invite"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Edit User Modal Component
function EditUserModal({
    user,
    onClose,
    onSave,
    onPasswordChange,
}: {
    user: User;
    onClose: () => void;
    onSave: (updates: { role?: string; status?: string }) => void;
    onPasswordChange: (userId: number, newPassword: string) => Promise<boolean>;
}) {
    const [role, setRole] = useState(user.role);
    const [status, setStatus] = useState(user.status);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Password change state
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const updates: { role?: string; status?: string } = {};
        if (role !== user.role) updates.role = role;
        if (status !== user.status) updates.status = status;

        await onSave(updates);
        setIsSubmitting(false);
    };

    const handlePasswordChange = async () => {
        setPasswordError(null);
        
        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }
        
        // Validate password policy
        const validation = validatePassword(newPassword);
        if (!validation.valid) {
            setPasswordError(validation.error || "Invalid password");
            return;
        }
        
        setIsChangingPassword(true);
        const success = await onPasswordChange(user.id, newPassword);
        setIsChangingPassword(false);
        
        if (success) {
            setNewPassword("");
            setConfirmPassword("");
            setShowPasswordSection(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.1)] overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                    <h2 className="text-[16px] font-semibold text-[#F5F5F5]">Edit User</h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.06)]">
                        <X size={18} className="text-[rgba(245,245,245,0.5)]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider mb-2">
                            Email
                        </label>
                        <p className="text-[14px] text-[rgba(245,245,245,0.7)]">{user.email}</p>
                    </div>

                    <div>
                        <label className="block text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider mb-2">
                            Role
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#0C0C0C] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider mb-2">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#0C0C0C] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                        >
                            <option value="active">Active</option>
                            <option value="invited">Invited</option>
                            <option value="disabled">Disabled</option>
                        </select>
                    </div>

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
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.15)] text-[14px] font-medium text-[#F5F5F5] transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>

                {/* Change Password Section */}
                <div className="px-6 pb-6">
                    <button
                        type="button"
                        onClick={() => setShowPasswordSection(!showPasswordSection)}
                        className="flex items-center gap-2 text-[14px] text-[rgba(245,245,245,0.6)] hover:text-[rgba(245,245,245,0.8)] transition-colors"
                    >
                        <Key size={14} />
                        {showPasswordSection ? "Hide Password Options" : "Change Password"}
                        <ChevronDown 
                            size={14} 
                            className={`transition-transform ${showPasswordSection ? "rotate-180" : ""}`} 
                        />
                    </button>
                    
                    {showPasswordSection && (
                        <div className="mt-4 p-4 rounded-xl bg-[#0C0C0C] border border-[rgba(255,255,255,0.08)] space-y-4">
                            <div>
                                <label className="block text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full px-4 py-2.5 rounded-xl bg-[#161616] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] placeholder:text-[rgba(245,245,245,0.4)] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="w-full px-4 py-2.5 rounded-xl bg-[#161616] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] placeholder:text-[rgba(245,245,245,0.4)] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                                />
                            </div>
                            
                            {passwordError && (
                                <p className="text-[13px] text-[#C87A7A]">{passwordError}</p>
                            )}
                            
                            <p className="text-[12px] text-[rgba(245,245,245,0.4)]">
                                Password must be at least 8 characters with at least one letter and one number.
                            </p>
                            
                            <button
                                type="button"
                                onClick={handlePasswordChange}
                                disabled={isChangingPassword || !newPassword || !confirmPassword}
                                className="w-full px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-[14px] font-medium text-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isChangingPassword ? "Changing Password..." : "Change Password"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
