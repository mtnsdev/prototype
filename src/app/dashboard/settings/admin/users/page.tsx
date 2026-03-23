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
    Eye,
} from "lucide-react";
import { UserPermissionsModal } from "@/components/admin/UserPermissionsModal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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
    const [permissionsUser, setPermissionsUser] = useState<User | null>(null);

    // Invite result banner
    const [inviteMessage, setInviteMessage] = useState<{ type: "success" | "warning"; text: string } | null>(null);
    
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Failed to invite user");
            }

            setShowInviteModal(false);
            fetchUsers();

            if (data.email_sent) {
                setInviteMessage({ type: "success", text: `Invitation email sent to ${email}` });
            } else {
                setInviteMessage({
                    type: "warning",
                    text: `User created, but invitation email failed to send. ${data.email_error ? `(${data.email_error})` : "Resend API may not be configured."}`,
                });
            }

            setTimeout(() => setInviteMessage(null), 8000);
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
            {/* Invite result banner */}
            {inviteMessage && (
                <div
                    className={`p-3.5 rounded-xl border text-[13px] flex items-center justify-between gap-3 ${
                        inviteMessage.type === "success"
                            ? "bg-[rgba(52,211,153,0.08)] border-[rgba(52,211,153,0.2)] text-emerald-400"
                            : "bg-[rgba(251,191,36,0.08)] border-[rgba(251,191,36,0.2)] text-amber-400"
                    }`}
                >
                    <span>{inviteMessage.text}</span>
                    <Button variant="ghost" size="icon-xs" onClick={() => setInviteMessage(null)} className="shrink-0 opacity-60 hover:opacity-100">
                        <X size={14} />
                    </Button>
                </div>
            )}

            {/* Header with Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.4)]" />
                        <Input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 rounded-xl bg-[#161616] border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5]"
                        />
                    </div>

                    {/* Role Filter */}
                    <Select
                        value={roleFilter ?? "__all__"}
                        onValueChange={(v) => setRoleFilter(v === "__all__" ? null : v)}
                    >
                        <SelectTrigger className="w-[140px] rounded-xl bg-[#161616] border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] focus:border-[rgba(255,255,255,0.2)]">
                            <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">All Roles</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select
                        value={statusFilter ?? "__all__"}
                        onValueChange={(v) => setStatusFilter(v === "__all__" ? null : v)}
                    >
                        <SelectTrigger className="w-[140px] rounded-xl bg-[#161616] border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] focus:border-[rgba(255,255,255,0.2)]">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="invited">Invited</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button onClick={() => setShowInviteModal(true)} variant="outline" className="gap-2">
                    <Plus size={16} />
                    Invite User
                </Button>
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
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-[rgba(255,255,255,0.08)] hover:bg-transparent">
                                <TableHead className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">User</TableHead>
                                <TableHead className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">Role</TableHead>
                                <TableHead className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">Status</TableHead>
                                <TableHead className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">Last Login</TableHead>
                                <TableHead className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">Created</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => {
                                const statusStyle = STATUS_COLORS[user.status] || STATUS_COLORS.active;
                                const roleStyle = ROLE_COLORS[user.role] || ROLE_COLORS.user;
                                const StatusIcon = statusStyle.icon;

                                return (
                                    <TableRow key={user.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                                        <TableCell className="px-5 py-4">
                                            <div>
                                                <p className="text-[14px] font-medium text-[#F5F5F5]">{user.username}</p>
                                                <p className="text-[13px] text-[rgba(245,245,245,0.5)]">{user.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                                                {user.role === "admin" && <Shield size={12} />}
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                                <StatusIcon size={12} />
                                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-[13px] text-[rgba(245,245,245,0.5)]">
                                            {formatDate(user.last_login_at)}
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-[13px] text-[rgba(245,245,245,0.5)]">
                                            {formatDate(user.created_at)}
                                        </TableCell>
                                        <TableCell className="px-2 py-4">
                                            <Button
                                                ref={(el) => { actionButtonRefs.current.set(user.id, el); }}
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setActionMenuUser(actionMenuUser === user.id ? null : user.id)}
                                                className="p-2"
                                            >
                                                <MoreVertical size={16} className="text-[rgba(245,245,245,0.5)]" />
                                            </Button>

                                            <ActionMenu
                                                isOpen={actionMenuUser === user.id}
                                                onClose={() => setActionMenuUser(null)}
                                                triggerRef={getButtonRef(user.id)}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start font-normal text-[rgba(245,245,245,0.8)]"
                                                    onClick={() => {
                                                        setEditingUser(user);
                                                        setActionMenuUser(null);
                                                    }}
                                                >
                                                    Edit User
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start font-normal gap-2 text-[rgba(245,245,245,0.8)]"
                                                    onClick={() => {
                                                        setPermissionsUser(user);
                                                        setActionMenuUser(null);
                                                    }}
                                                >
                                                    <Eye size={13} className="text-[rgba(245,245,245,0.5)]" />
                                                    View Permissions
                                                </Button>
                                                {user.status !== "disabled" && (
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start font-normal text-[#C87A7A]"
                                                        onClick={() => handleDisableUser(user.id)}
                                                    >
                                                        Disable User
                                                    </Button>
                                                )}
                                                {user.status === "disabled" && (
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start font-normal text-green-400"
                                                        onClick={() => handleUpdateUser(user.id, { status: "active" })}
                                                    >
                                                        Reactivate User
                                                    </Button>
                                                )}
                                            </ActionMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Pagination */}
            {total > 20 && (
                <div className="flex items-center justify-between">
                    <p className="text-[13px] text-[rgba(245,245,245,0.5)]">
                        Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} users
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setPage(p => p + 1)}
                            disabled={page * 20 >= total}
                        >
                            Next
                        </Button>
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

            {/* Intranet permissions modal */}
            {permissionsUser && (
                <UserPermissionsModal
                    userId={permissionsUser.id}
                    userEmail={permissionsUser.email}
                    onClose={() => setPermissionsUser(null)}
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
        <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-[rgba(255,255,255,0.1)]">
                <DialogHeader>
                    <DialogTitle className="text-[16px] text-[#F5F5F5]">Invite User</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[12px] text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                            Email Address
                        </Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            required
                            className="rounded-xl bg-[#0C0C0C] border-[rgba(255,255,255,0.08)]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[12px] text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                            Role
                        </Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="w-full rounded-xl bg-[#0C0C0C] border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] focus:border-[rgba(255,255,255,0.2)]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Password Section */}
                    <div className="pt-2 border-t border-[rgba(255,255,255,0.08)]">
                        <p className="text-[12px] text-[rgba(245,245,245,0.5)] mb-3">
                            Set a password for email/password login, or leave empty for Google OAuth only.
                        </p>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[12px] text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                                    Password (Optional)
                                </Label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="rounded-xl bg-[#0C0C0C] border-[rgba(255,255,255,0.08)]"
                                />
                            </div>
                            
                            {password && (
                                <div className="space-y-2">
                                    <Label className="text-[12px] text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                                        Confirm Password
                                    </Label>
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm password"
                                        className="rounded-xl bg-[#0C0C0C] border-[rgba(255,255,255,0.08)]"
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

                            {password && (
                                <div className="p-3 rounded-xl bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.2)]">
                                    <p className="text-[12px] text-amber-400 leading-relaxed">
                                        <strong>Temporary password.</strong> The user will be required to change it immediately after their first login.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isSubmitting || !email.trim()}>
                            {isSubmitting ? "Inviting..." : "Send Invite"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
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
        <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-[rgba(255,255,255,0.1)]">
                <DialogHeader>
                    <DialogTitle className="text-[16px] text-[#F5F5F5]">Edit User</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[12px] text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                            Email
                        </Label>
                        <p className="text-[14px] text-[rgba(245,245,245,0.7)]">{user.email}</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[12px] text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                            Role
                        </Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="w-full rounded-xl bg-[#0C0C0C] border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] focus:border-[rgba(255,255,255,0.2)]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[12px] text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                            Status
                        </Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full rounded-xl bg-[#0C0C0C] border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] focus:border-[rgba(255,255,255,0.2)]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="invited">Invited</SelectItem>
                                <SelectItem value="disabled">Disabled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>

                {/* Change Password Section */}
                <div className="pb-6">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowPasswordSection(!showPasswordSection)}
                        className="gap-2 font-normal text-[rgba(245,245,245,0.6)] hover:text-[rgba(245,245,245,0.8)]"
                    >
                        <Key size={14} />
                        {showPasswordSection ? "Hide Password Options" : "Change Password"}
                        <ChevronDown 
                            size={14} 
                            className={`transition-transform ${showPasswordSection ? "rotate-180" : ""}`} 
                        />
                    </Button>
                    
                    {showPasswordSection && (
                        <div className="mt-4 p-4 rounded-xl bg-[#0C0C0C] border border-[rgba(255,255,255,0.08)] space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[12px] text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                                    New Password
                                </Label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="rounded-xl bg-[#161616] border-[rgba(255,255,255,0.08)]"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-[12px] text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                                    Confirm Password
                                </Label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="rounded-xl bg-[#161616] border-[rgba(255,255,255,0.08)]"
                                />
                            </div>
                            
                            {passwordError && (
                                <p className="text-[13px] text-[#C87A7A]">{passwordError}</p>
                            )}
                            
                            <p className="text-[12px] text-[rgba(245,245,245,0.4)]">
                                Password must be at least 8 characters with at least one letter and one number.
                            </p>
                            
                            <Button
                                type="button"
                                onClick={handlePasswordChange}
                                disabled={isChangingPassword || !newPassword || !confirmPassword}
                                className="w-full bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30 text-amber-400"
                            >
                                {isChangingPassword ? "Changing Password..." : "Change Password"}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
