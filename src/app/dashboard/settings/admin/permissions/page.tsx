"use client";

import { useEffect, useState, useCallback } from "react";
import {
    FolderLock,
    Plus,
    Trash2,
    Folder,
    FileText,
    Users,
    User,
    Check,
    X,
    Loader2,
    Cloud,
    BookOpen,
    CheckSquare,
    Square,
    Search,
} from "lucide-react";
import { FolderTreeSelector, SelectedTarget } from "@/components/admin/FolderTreeSelector";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";

type ContentRule = {
    id: number;
    source: string;
    subject_type: string;
    subject_id: string;
    target_type: string;
    target_id: number;
    target_title: string | null;
    effect: string;
    applies_to_descendants: boolean;
    created_by_id: number | null;
    created_at: string;
};

type ConflictInfo = {
    target_id: number;
    target_type: string;
    target_title: string | null;
    conflict_type: "exact_duplicate" | "effect_change";
    existing_rule_id: number;
    existing_effect: string;
    new_effect: string;
    message: string;
};

type BatchPayload = {
    source: string;
    subject_type: string;
    subject_id: string;
    targets: { target_type: string; target_id: number; drive_resource_id?: string }[];
    effect: string;
    applies_to_descendants: boolean;
    force_update?: boolean;
};

type RulesResponse = {
    rules: ContentRule[];
    total: number;
};

type UserItem = {
    id: number;
    email: string;
    username: string;
    role: string;
    status: string;
};

type ScriptPageItem = {
    id: number;
    filename: string | null;
    s3_key: string | null;
    original_filename: string | null;
    index_status: string | null;
};

type SourceTab = "google_drive" | "pages";

const SOURCE_TABS: { key: SourceTab; label: string; icon: React.ReactNode }[] = [
    { key: "google_drive", label: "Google Drive", icon: <Cloud size={16} /> },
    { key: "pages", label: "Pages", icon: <BookOpen size={16} /> },
];

export default function PermissionsPage() {
    const [activeSource, setActiveSource] = useState<SourceTab>("google_drive");
    const [rules, setRules] = useState<ContentRule[]>([]);
    const [scriptPages, setScriptPages] = useState<ScriptPageItem[]>([]);
    const [scriptPagesLoading, setScriptPagesLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [users, setUsers] = useState<UserItem[]>([]);
    const [pendingConflicts, setPendingConflicts] = useState<ConflictInfo[] | null>(null);
    const [pendingPayload, setPendingPayload] = useState<BatchPayload | null>(null);

    const fetchRules = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("auth_token");
            const params = new URLSearchParams();
            const sourceParam = activeSource === "pages" ? "script" : activeSource;
            params.set("source", sourceParam);
            if (activeSource === "pages") {
                params.set("target_type", "script_page");
            }
            if (subjectFilter) {
                if (subjectFilter === "role:admin" || subjectFilter === "role:user") {
                    params.set("subject_type", "role");
                    params.set("subject_id", subjectFilter.split(":")[1]);
                } else {
                    params.set("subject_type", "user");
                    params.set("subject_id", subjectFilter);
                }
            }
            const response = await fetch(`/api/admin/rules?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch rules");
            const data: RulesResponse = await response.json();
            setRules(data.rules);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load rules");
        } finally {
            setIsLoading(false);
        }
    }, [activeSource, subjectFilter]);

    const fetchScriptPages = useCallback(async (search?: string) => {
        setScriptPagesLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            const response = await fetch(`/api/admin/script/pages?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch script pages");
            const data = await response.json();
            setScriptPages(data.pages || []);
        } catch (err) {
            console.error("Failed to fetch script pages", err);
            setScriptPages([]);
        } finally {
            setScriptPagesLoading(false);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch("/api/admin/users?page_size=100", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    }, []);

    useEffect(() => {
        fetchRules();
        fetchUsers();
    }, [fetchRules, fetchUsers]);

    useEffect(() => {
        if (activeSource === "pages") {
            fetchScriptPages();
        }
    }, [activeSource, fetchScriptPages]);

    const submitBatch = async (payload: BatchPayload) => {
        const token = localStorage.getItem("auth_token");
        const response = await fetch("/api/admin/rules/batch", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || "Failed to create rules");
        }
        return response.json() as Promise<{ created: ContentRule[]; skipped: number; conflicts: ConflictInfo[] }>;
    };

    const handleCreateRules = async (payload: BatchPayload) => {
        try {
            const result = await submitBatch(payload);
            if (result.conflicts && result.conflicts.length > 0) {
                // Pause and ask admin to resolve conflicts
                setPendingConflicts(result.conflicts);
                setPendingPayload(payload);
                // Don't close the create modal yet — conflicts modal will take over
                setShowCreateModal(false);
            } else {
                setShowCreateModal(false);
                fetchRules();
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to create rules");
        }
    };

    const handleConflictUpdate = async () => {
        if (!pendingPayload) return;
        try {
            await submitBatch({ ...pendingPayload, force_update: true });
            setPendingConflicts(null);
            setPendingPayload(null);
            fetchRules();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update rules");
        }
    };

    const handleConflictSkip = () => {
        setPendingConflicts(null);
        setPendingPayload(null);
        fetchRules();
    };

    const handleDeleteRule = async (ruleId: number) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`/api/admin/rules/${ruleId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Failed to delete rule");
            }
            fetchRules();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete rule");
        }
    };

    const getSubjectLabel = (rule: ContentRule) => {
        if (rule.subject_type === "role") {
            return rule.subject_id === "admin" ? "All Admins" : "All Users";
        }
        const user = users.find(u => u.id.toString() === rule.subject_id);
        return user ? user.email : `User #${rule.subject_id}`;
    };

    const getTargetIcon = (rule: ContentRule) => {
        if (rule.target_type === "folder" || rule.target_type === "drive_folder")
            return <Folder size={16} className="text-amber-400" />;
        if (rule.target_type === "page" || rule.target_type === "script_page")
            return <FileText size={16} className="text-purple-400" />;
        return <FileText size={16} className="text-blue-400" />;
    };

    return (
        <div className="space-y-6">
            {/* Source Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] w-fit">
                {SOURCE_TABS.map((tab) => (
                    <Button
                        key={tab.key}
                        variant={activeSource === tab.key ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setActiveSource(tab.key)}
                        className={activeSource === tab.key
                            ? "bg-[rgba(255,255,255,0.1)] text-[#F5F5F5] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.12)]"
                            : "text-[rgba(245,245,245,0.5)] hover:text-[rgba(245,245,245,0.8)] hover:bg-[rgba(255,255,255,0.04)] border border-transparent"}
                    >
                        {tab.icon}
                        {tab.label}
                    </Button>
                ))}
            </div>

            {/* Filters + Add Rule */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3">
                    <Select
                        value={subjectFilter ?? "__all__"}
                        onValueChange={(v) => setSubjectFilter(v === "__all__" ? null : v)}
                    >
                        <SelectTrigger className="w-[200px] rounded-xl bg-[#161616] border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] focus:border-[rgba(255,255,255,0.2)]">
                            <SelectValue placeholder="All Subjects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">All Subjects</SelectItem>
                            <SelectItem value="role:admin">Role: Admin</SelectItem>
                            <SelectItem value="role:user">Role: User</SelectItem>
                            {users.map(user => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    onClick={() => setShowCreateModal(true)}
                    variant="outline"
                    className="gap-2 bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] border-[rgba(255,255,255,0.1)] text-[#F5F5F5]"
                >
                    <Plus size={16} />
                    Add Rule
                </Button>
            </div>

            {/* Info */}
            <Card className="rounded-2xl bg-[rgba(59,130,246,0.08)] border-[rgba(59,130,246,0.2)] p-4">
                <CardContent className="p-0">
                <div className="flex items-start gap-3">
                    <FolderLock size={20} className="text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-[13px] text-[rgba(245,245,245,0.7)] space-y-1">
                        <p><strong>How permission rules work:</strong></p>
                        <ul className="list-disc ml-4 space-y-1">
                            <li>Rules are scoped to a specific data source ({SOURCE_TABS.find(t => t.key === activeSource)?.label})</li>
                            {activeSource === "pages" ? (
                                <>
                                    <li>Pages are script-ingested documents (source_document with source_type SCRIPT)</li>
                                    <li>By default, all users can access all pages; use <strong>deny</strong> rules to restrict access</li>
                                </>
                            ) : (
                                <>
                                    <li>By default, users can access everything the external system allows them</li>
                                    <li>Use <strong>deny</strong> rules to restrict specific content beyond what the external system controls</li>
                                </>
                            )}
                            <li>User-specific rules override role-based rules</li>
                            {activeSource !== "pages" && <li>More specific rules (direct target) override inherited rules from parent folders</li>}
                            <li>Admins bypass all rules and can see all content</li>
                        </ul>
                    </div>
                </div>
                </CardContent>
            </Card>

            {/* Rules Table (Google Drive / Pages) */}
            {(
                <Card className="rounded-2xl bg-[#161616] border-[rgba(255,255,255,0.08)] overflow-hidden">
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
                            {activeSource === "pages" ? (
                                <BookOpen size={48} className="mx-auto text-[rgba(245,245,245,0.2)] mb-4" />
                            ) : (
                                <FolderLock size={48} className="mx-auto text-[rgba(245,245,245,0.2)] mb-4" />
                            )}
                            <p className="text-[14px] text-[rgba(245,245,245,0.5)]">
                                No {SOURCE_TABS.find(t => t.key === activeSource)?.label} permission rules
                            </p>
                            <p className="text-[13px] text-[rgba(245,245,245,0.4)] mt-1">Add rules to control content access for this source</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-[rgba(255,255,255,0.08)] hover:bg-transparent">
                                    <TableHead className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">Subject</TableHead>
                                    <TableHead className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">Target</TableHead>
                                    <TableHead className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">Effect</TableHead>
                                    <TableHead className="text-left px-5 py-4 text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">Scope</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rules.map((rule) => (
                                    <TableRow key={rule.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                                        <TableCell className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                {rule.subject_type === "role" ? (
                                                    <Users size={16} className="text-[rgba(245,245,245,0.5)]" />
                                                ) : (
                                                    <User size={16} className="text-[rgba(245,245,245,0.5)]" />
                                                )}
                                                <div>
                                                    <p className="text-[14px] text-[#F5F5F5]">{getSubjectLabel(rule)}</p>
                                                    <p className="text-[12px] text-[rgba(245,245,245,0.4)]">
                                                        {rule.subject_type === "role" ? "Role" : "User"}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                {getTargetIcon(rule)}
                                                <div>
                                                    <p className="text-[14px] text-[#F5F5F5]">
                                                        {rule.target_title || "Unknown target"}
                                                    </p>
                                                    <p className="text-[12px] text-[rgba(245,245,245,0.4)]">
                                                        {rule.target_type.charAt(0).toUpperCase() + rule.target_type.slice(1).replace("_", " ")}
                                                        {!rule.target_title && ` (ID: ${rule.target_id})`}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium ${rule.effect === "allow"
                                                ? "bg-green-500/10 text-green-400"
                                                : "bg-red-500/10 text-red-400"
                                                }`}>
                                                {rule.effect === "allow" ? <Check size={12} /> : <X size={12} />}
                                                {rule.effect.charAt(0).toUpperCase() + rule.effect.slice(1)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-[13px] text-[rgba(245,245,245,0.5)]">
                                            {activeSource === "pages" ? "This item only" : (rule.applies_to_descendants ? "Including children" : "This item only")}
                                        </TableCell>
                                        <TableCell className="px-2 py-4">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteRule(rule.id)}
                                                className="p-2 hover:bg-[rgba(200,122,122,0.1)] text-[rgba(245,245,245,0.5)] hover:text-[#C87A7A]"
                                                title="Delete rule"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            )}

            {/* Create Rule Modal */}
            <CreateRuleModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                source={activeSource}
                users={users}
                scriptPages={activeSource === "pages" ? scriptPages : []}
                scriptPagesLoading={activeSource === "pages" ? scriptPagesLoading : false}
                onCreate={handleCreateRules}
            />

            {/* Conflict Confirmation Modal */}
            <ConflictConfirmModal
                open={pendingConflicts != null && pendingConflicts.length > 0}
                onOpenChange={(open) => { if (!open) { setPendingConflicts(null); setPendingPayload(null); } }}
                conflicts={pendingConflicts ?? []}
                onUpdate={handleConflictUpdate}
                onSkip={handleConflictSkip}
                onCancel={() => { setPendingConflicts(null); setPendingPayload(null); }}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Conflict Confirmation Modal Component
// ---------------------------------------------------------------------------
function ConflictConfirmModal({
    open,
    onOpenChange,
    conflicts,
    onUpdate,
    onSkip,
    onCancel,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    conflicts: ConflictInfo[];
    onUpdate: () => void;
    onSkip: () => void;
    onCancel: () => void;
}) {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async () => {
        setIsUpdating(true);
        await onUpdate();
        setIsUpdating(false);
    };

    const effectLabel = (effect: string) => (
        <span className={effect === "allow" ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
            {effect}
        </span>
    );

    return (
        <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) onCancel(); }}>
            <DialogContent className="max-w-lg max-h-[90vh] flex flex-col bg-[#161616] border-[rgba(255,255,255,0.1)]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <X size={16} className="text-amber-400" />
                        </div>
                        <DialogTitle className="text-[16px] text-[#F5F5F5]">Conflicting Rules Found</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="overflow-y-auto space-y-3">
                    <p className="text-[13px] text-[rgba(245,245,245,0.6)]">
                        The following targets already have rules. Choose how to handle them:
                    </p>

                    <div className="space-y-2">
                        {conflicts.map((c) => (
                            <Card key={c.existing_rule_id} className="rounded-xl bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.07)] p-4">
                                <CardContent className="p-0">
                                    <p className="text-[13px] text-[#F5F5F5] font-medium mb-1">
                                        {c.target_title || `${c.target_type} #${c.target_id}`}
                                    </p>
                                    {c.conflict_type === "exact_duplicate" ? (
                                        <p className="text-[12px] text-[rgba(245,245,245,0.5)]">
                                            A {effectLabel(c.existing_effect)} rule already exists — no change needed.
                                        </p>
                                    ) : (
                                        <p className="text-[12px] text-[rgba(245,245,245,0.5)]">
                                            Existing rule is {effectLabel(c.existing_effect)}. This will change it to {effectLabel(c.new_effect)}.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <DialogFooter className="flex gap-3 sm:justify-end">
                    <Button variant="outline" onClick={onCancel} className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[rgba(245,245,245,0.7)]">
                        Cancel
                    </Button>
                    <Button variant="outline" onClick={onSkip} className="flex-1 sm:flex-initial bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[rgba(245,245,245,0.7)]">
                        Skip conflicts
                    </Button>
                    <Button
                        onClick={handleUpdate}
                        disabled={isUpdating || conflicts.every(c => c.conflict_type === "exact_duplicate")}
                        className="flex-1 sm:flex-initial bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400"
                    >
                        {isUpdating ? "Updating..." : "Update conflicting rules"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


// ---------------------------------------------------------------------------
// Create Rule Modal Component
// ---------------------------------------------------------------------------
function CreateRuleModal({
    open,
    onOpenChange,
    source,
    users,
    scriptPages,
    scriptPagesLoading = false,
    onCreate,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    source: SourceTab;
    users: UserItem[];
    scriptPages?: ScriptPageItem[];
    scriptPagesLoading?: boolean;
    onCreate: (payload: {
        source: string;
        subject_type: string;
        subject_id: string;
        targets: { target_type: string; target_id: number; drive_resource_id?: string }[];
        effect: string;
        applies_to_descendants: boolean;
    }) => void;
}) {
    const [subjectType, setSubjectType] = useState<"user" | "role">("role");
    const [subjectId, setSubjectId] = useState("user");
    const [selectedTargets, setSelectedTargets] = useState<SelectedTarget[]>([]);
    const [selectedScriptPageIds, setSelectedScriptPageIds] = useState<number[]>([]);
    const [pageSearchQuery, setPageSearchQuery] = useState("");
    const [effect, setEffect] = useState<"allow" | "deny">("allow");
    const [applyToDescendants, setApplyToDescendants] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasAgencyConnection, setHasAgencyConnection] = useState<boolean | null>(null);
    const [rootFolderId, setRootFolderId] = useState<string | null>(null);
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null;

    const sourceLabel = source === "pages" ? "Pages" : "Google Drive";

    const allScriptPages = scriptPages || [];
    const pageSearchLower = pageSearchQuery.trim().toLowerCase();
    const filteredScriptPages = pageSearchLower
        ? allScriptPages.filter((p) => {
            const name = (p.filename || p.s3_key || p.original_filename || `Page #${p.id}`).toLowerCase();
            return name.includes(pageSearchLower);
        })
        : allScriptPages;
    const filteredScriptPageIds = filteredScriptPages.map((p) => p.id);
    const allFilteredSelected = source === "pages" && filteredScriptPageIds.length > 0 && filteredScriptPageIds.every((id) => selectedScriptPageIds.includes(id));

    // Check agency connection status and fetch root_folder_id when in Google Drive mode
    useEffect(() => {
        if (source !== "google_drive" || !token) return;
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
                setRootFolderId(null);
            });
    }, [source, token]);

    const hasSelection = source === "pages"
        ? selectedScriptPageIds.length > 0
        : selectedTargets.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasSelection) return;

        setIsSubmitting(true);

        const targets: { target_type: string; target_id: number; drive_resource_id?: string }[] = [];
        let payloadSource: string = source;
        let appliesToDescendants = applyToDescendants;

        if (source === "pages") {
            payloadSource = "script";
            appliesToDescendants = false;
            for (const id of selectedScriptPageIds) {
                targets.push({ target_type: "script_page", target_id: id });
            }
        } else {
            // Google Drive targets: use Drive IDs
            for (const t of selectedTargets) {
                targets.push({
                    target_type: t.node_type === "folder" ? "drive_folder" : "drive_file",
                    target_id: 0, // will be resolved by backend via drive_resource_id
                    drive_resource_id: t.drive_resource_id || String(t.external_id),
                });
            }
        }

        await onCreate({
            source: payloadSource,
            subject_type: subjectType,
            subject_id: subjectId,
            targets,
            effect,
            applies_to_descendants: appliesToDescendants,
        });
        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-md max-h-[90vh] flex flex-col bg-[#161616] border-[rgba(255,255,255,0.1)]">
                <DialogHeader>
                    <DialogTitle className="text-[16px] text-[#F5F5F5]">
                        Create {sourceLabel} Rule
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto">
                    {/* Subject Type */}
                    <div className="space-y-2">
                        <Label className="text-[12px] text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                            Apply To
                        </Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={subjectType === "role" ? "secondary" : "outline"}
                                className="flex-1 gap-2"
                                onClick={() => { setSubjectType("role"); setSubjectId("user"); }}
                            >
                                <Users size={16} /> Role
                            </Button>
                            <Button
                                type="button"
                                variant={subjectType === "user" ? "secondary" : "outline"}
                                className="flex-1 gap-2"
                                onClick={() => { setSubjectType("user"); setSubjectId(users[0]?.id.toString() || ""); }}
                            >
                                <User size={16} /> User
                            </Button>
                        </div>
                    </div>

                    {/* Subject Selection */}
                    <div className="space-y-2">
                        <Label className="text-[12px] text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                            {subjectType === "role" ? "Select Role" : "Select User"}
                        </Label>
                        <Select value={subjectId} onValueChange={setSubjectId}>
                            <SelectTrigger className="w-full rounded-xl bg-[#0C0C0C] border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] focus:border-[rgba(255,255,255,0.2)]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {subjectType === "role" ? (
                                    <>
                                        <SelectItem value="user">All Users (role: user)</SelectItem>
                                        <SelectItem value="admin">All Admins (role: admin)</SelectItem>
                                    </>
                                ) : (
                                    users.map(user => (
                                        <SelectItem key={user.id} value={user.id.toString()}>{user.email}</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Target Selection -- Pages (script pages): list all pages, multi-select with Select all / Deselect all */}
                    {source === "pages" && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[12px] text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                                    Pages
                                </Label>
                                <p className="text-[12px] text-[rgba(245,245,245,0.5)]">
                                    Select one or more pages to apply the rule to.
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center gap-2">
                                        <Search size={16} className="text-[rgba(245,245,245,0.4)] shrink-0" />
                                        <Input
                                            type="text"
                                            value={pageSearchQuery}
                                            onChange={(e) => setPageSearchQuery(e.target.value)}
                                            placeholder="Search pages..."
                                            className="bg-[#0C0C0C] border-[rgba(255,255,255,0.08)] text-[#F5F5F5] placeholder:text-[rgba(245,245,245,0.4)]"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            if (allFilteredSelected) {
                                                setSelectedScriptPageIds((prev) => prev.filter((id) => !filteredScriptPageIds.includes(id)));
                                            } else {
                                                setSelectedScriptPageIds((prev) => [...new Set([...prev, ...filteredScriptPageIds])].sort((a, b) => a - b));
                                            }
                                        }}
                                        disabled={filteredScriptPageIds.length === 0}
                                        title={allFilteredSelected ? "Clear all" : "Select all"}
                                        className="shrink-0"
                                    >
                                        {allFilteredSelected ? (
                                            <>
                                                <Square size={16} />
                                                <span>Clear all</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckSquare size={16} />
                                                <span>Select all</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0C0C0C] max-h-[240px] overflow-y-auto p-1">
                                    {scriptPagesLoading ? (
                                        <div className="flex items-center justify-center gap-2 px-3 py-4 text-[13px] text-[rgba(245,245,245,0.5)]">
                                            <Loader2 size={16} className="animate-spin" /> Loading pages…
                                        </div>
                                    ) : allScriptPages.length === 0 ? (
                                        <p className="text-[13px] text-[rgba(245,245,245,0.4)] px-3 py-4 text-center">No script pages found</p>
                                    ) : filteredScriptPages.length === 0 ? (
                                        <p className="text-[13px] text-[rgba(245,245,245,0.4)] px-3 py-4 text-center">No pages match your search</p>
                                    ) : (
                                        filteredScriptPages.map((p) => {
                                            const checked = selectedScriptPageIds.includes(p.id);
                                            const name = p.filename || p.s3_key || p.original_filename || `Page #${p.id}`;
                                            return (
                                                <Button
                                                    key={p.id}
                                                    type="button"
                                                    variant="ghost"
                                                    className="w-full justify-start gap-2.5 px-3 py-2 h-auto font-normal rounded-lg hover:bg-[rgba(255,255,255,0.04)]"
                                                    onClick={() => {
                                                        if (checked) {
                                                            setSelectedScriptPageIds((prev) => prev.filter((id) => id !== p.id));
                                                        } else {
                                                            setSelectedScriptPageIds((prev) => [...prev, p.id].sort((a, b) => a - b));
                                                        }
                                                    }}
                                                >
                                                    <span
                                                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                                            checked
                                                                ? "bg-purple-500 border-purple-500 text-white"
                                                                : "border-[rgba(255,255,255,0.2)] bg-transparent"
                                                        }`}
                                                    >
                                                        {checked ? <Check size={12} /> : null}
                                                    </span>
                                                    <FileText size={14} className="text-purple-400 shrink-0" />
                                                    <span className="text-[13px] text-[#F5F5F5] truncate">{name}</span>
                                                </Button>
                                            );
                                        })
                                    )}
                                </div>
                                {selectedScriptPageIds.length > 0 && (
                                    <p className="text-[12px] text-[rgba(245,245,245,0.5)] mt-2">
                                        {selectedScriptPageIds.length} page{selectedScriptPageIds.length !== 1 ? "s" : ""} selected
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {source === "google_drive" && (
                        <div className="space-y-2">
                            <Label className="text-[12px] text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                                Content (select one or more)
                            </Label>
                            <p className="text-[12px] text-[rgba(245,245,245,0.5)] mb-2">
                                Select folders from the connected Admin Drive to apply the rule to.
                            </p>
                            {hasAgencyConnection === false ? (
                                <div className="text-center py-8 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0C0C0C]">
                                    <Cloud size={32} className="mx-auto text-[rgba(245,245,245,0.2)] mb-3" />
                                    <p className="text-[14px] text-[rgba(245,245,245,0.5)] mb-3">Admin Drive not connected</p>
                                    <Button asChild variant="outline" className="gap-2 bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.1)] text-[#F5F5F5]">
                                        <a href="/dashboard/settings/integrations">Connect Admin Drive</a>
                                    </Button>
                                </div>
                            ) : hasAgencyConnection === null ? (
                                <div className="flex items-center justify-center py-6 text-[rgba(245,245,245,0.5)] text-[14px]">
                                    <Loader2 size={18} className="animate-spin mr-2" />
                                    Checking connection…
                                </div>
                            ) : token ? (
                                <FolderTreeSelector
                                    mode="google-drive"
                                    token={token}
                                    multiSelect
                                    selectedTargets={selectedTargets}
                                    onSelectionChange={setSelectedTargets}
                                    rootFolderId={rootFolderId}
                                />
                            ) : (
                                <p className="text-[13px] text-[rgba(245,245,245,0.5)]">Sign in to load tree</p>
                            )}
                            {selectedTargets.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {selectedTargets.map((t) => (
                                        <span
                                            key={String(t.external_id)}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-[12px] text-[rgba(245,245,245,0.7)]"
                                        >
                                            {t.node_type === "folder" ? <Folder size={10} className="text-amber-400" /> : <FileText size={10} className="text-blue-400" />}
                                            {t.title}
                                            <Button type="button" variant="ghost" size="icon-xs" className="ml-0.5 h-auto w-auto p-0 hover:text-red-400" onClick={() => setSelectedTargets(prev => prev.filter(x => String(x.external_id) !== String(t.external_id)))}><X size={10} /></Button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Effect */}
                    <div className="space-y-2">
                        <Label className="text-[12px] text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                            Permission
                        </Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className={`flex-1 gap-2 ${effect === "allow" ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20" : ""}`}
                                onClick={() => setEffect("allow")}
                            >
                                <Check size={16} /> Allow
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className={`flex-1 gap-2 ${effect === "deny" ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" : ""}`}
                                onClick={() => setEffect("deny")}
                            >
                                <X size={16} /> Deny
                            </Button>
                        </div>
                    </div>

                    {/* Apply to Descendants (not shown for Pages - script pages have no children) */}
                    {source !== "pages" && (
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="descendants"
                                checked={applyToDescendants}
                                onChange={(e) => setApplyToDescendants(e.target.checked)}
                                className="checkbox-on-dark"
                            />
                            <Label htmlFor="descendants" className="text-[14px] text-[rgba(245,245,245,0.7)] font-normal cursor-pointer">
                                Apply to all children (folders and documents inside)
                            </Label>
                        </div>
                    )}

                    <DialogFooter className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] border-[rgba(255,255,255,0.15)] text-[#F5F5F5]"
                            disabled={isSubmitting || !hasSelection || !token}
                        >
                            {isSubmitting ? "Creating..." : "Create Rule"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
