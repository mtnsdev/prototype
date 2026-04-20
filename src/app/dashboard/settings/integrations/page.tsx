"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Loader2,
    RefreshCw,
    FolderOpen,
    LogOut,
    AlertCircle,
    CheckCircle,
    Cloud,
    Users,
    User,
    Link2,
    Mail,
    Copy,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GoogleDriveFolderPicker from "@/components/GoogleDriveFolderPicker";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/contexts/ToastContext";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import type { DriveStatus } from "@/types/google-drive";
import { BRIEFING_ROOM_PATH } from "@/lib/briefingRoutes";
import { APP_PAGE_CONTENT_SHELL } from "@/lib/dashboardChrome";
import { cn } from "@/lib/utils";

const OAUTH_POPUP_WIDTH = 600;
const OAUTH_POPUP_HEIGHT = 700;

function formatTime(iso: string | null | undefined): string {
    if (!iso) return "—";
    try {
        const d = new Date(iso);
        return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) + " " + d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
        return "—";
    }
}

// ---------------------------------------------------------------------------
// DriveConnectionCard -- renders one Google Drive connection (personal or admin)
// ---------------------------------------------------------------------------
function DriveConnectionCard({
    connectionType,
}: {
    connectionType: "personal" | "agency";
}) {
    const [driveStatus, setDriveStatus] = useState<DriveStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerMode, setPickerMode] = useState<"connect" | "change">("connect");

    const label = connectionType === "personal" ? "My Google Drive" : "Admin Google Drive";
    const description =
        connectionType === "personal"
            ? "Connect your personal Google Drive folder. Only you can see its content in search and answers."
            : "Connect a shared Google Drive folder for all workspace users. Admin only.";
    const CardIcon = connectionType === "personal" ? User : Users;

    const fetchStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(
                `/api/integrations/google-drive/status?connection_type=${connectionType}`,
                {
                    cache: "no-store",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );
            if (res.status === 401) {
                setDriveStatus(null);
                setError("Sign in required for this integration (backend).");
                return;
            }
            if (!res.ok) throw new Error("Failed to fetch status");
            const data: DriveStatus = await res.json();
            setDriveStatus(data);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, [connectionType]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Listen for OAuth popup completion
    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            if (
                event.data?.type === "google_drive_oauth_done" &&
                event.data?.connection_type === connectionType
            ) {
                fetchStatus();
                setPickerOpen(true);
            }
        };
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, [fetchStatus, connectionType]);

    const handleConnect = useCallback(async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(
                `/api/integrations/google-drive/auth/url?connection_type=${connectionType}`,
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );
            if (!res.ok) throw new Error("Failed to get auth URL");
            const { url } = await res.json();
            const left = Math.round((window.screen.width - OAUTH_POPUP_WIDTH) / 2);
            const top = Math.round((window.screen.height - OAUTH_POPUP_HEIGHT) / 2);
            window.open(
                url,
                `google_drive_oauth_${connectionType}`,
                `width=${OAUTH_POPUP_WIDTH},height=${OAUTH_POPUP_HEIGHT},left=${left},top=${top},scrollbars=yes`
            );
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not start OAuth");
        }
    }, [connectionType]);

    const handleSyncNow = useCallback(async () => {
        setSyncing(true);
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(
                `/api/integrations/google-drive/sync?connection_type=${connectionType}`,
                {
                    method: "POST",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Sync failed");
            if (data.status === "already_running") return;
            if (data.status === "queue_unavailable") {
                setError(data.message || "Sync service unavailable.");
                return;
            }
            await fetchStatus();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Sync failed");
        } finally {
            setSyncing(false);
        }
    }, [fetchStatus, connectionType]);

    const handleDisconnect = useCallback(async () => {
        if (!confirm(`Disconnect ${label}? Synced files will be removed from search.`)) return;
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(
                `/api/integrations/google-drive/disconnect?connection_type=${connectionType}`,
                {
                    method: "DELETE",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );
            if (!res.ok) throw new Error("Disconnect failed");
            await fetchStatus();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Disconnect failed");
        }
    }, [fetchStatus, connectionType, label]);

    const handleFolderSelected = useCallback(
        async (folderId: string, folderName: string) => {
            setPickerOpen(false);
            try {
                const token = localStorage.getItem("auth_token");
                const endpoint =
                    pickerMode === "change"
                        ? "/api/integrations/google-drive/change-folder"
                        : "/api/integrations/google-drive/connect";
                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        folder_id: folderId,
                        folder_name: folderName,
                        connection_type: connectionType,
                    }),
                });
                if (!res.ok) throw new Error("Failed to save folder");
                await fetchStatus();
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to save folder");
            }
        },
        [fetchStatus, pickerMode, connectionType]
    );

    const openChangeFolder = useCallback(() => {
        setPickerMode("change");
        setPickerOpen(true);
    }, []);

    if (loading) {
        return (
            <section className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-muted-foreground/75" />
                </div>
            </section>
        );
    }

    return (
        <>
            <section className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center border border-input">
                        <Cloud size={18} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold text-foreground">{label}</h2>
                            <CardIcon size={14} className="text-muted-foreground" />
                        </div>
                        {connectionType === "agency" && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Shared with all workspace users
                            </p>
                        )}
                    </div>
                    {driveStatus?.connected && (
                        <span className="ml-auto">
                            {driveStatus.sync_status === "running" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-medium bg-amber-500/15 text-[var(--color-warning)] border border-amber-500/25">
                                    <Loader2 size={12} className="animate-spin" />
                                    Syncing…
                                </span>
                            ) : driveStatus.sync_status === "failed" || driveStatus.status === "token_expired" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/25">
                                    <AlertCircle size={12} />
                                    Error
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-medium bg-green-500/15 text-green-400 border border-green-500/25">
                                    <CheckCircle size={12} />
                                    Connected
                                </span>
                            )}
                        </span>
                    )}
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {error && (
                        <div className="rounded-lg bg-[rgba(200,122,122,0.08)] border border-[rgba(200,122,122,0.2)] px-3 py-2 text-compact text-[var(--color-error)]">
                            {error}
                        </div>
                    )}

                    {!driveStatus?.connected ? (
                        <>
                            <p className="text-compact text-muted-foreground/75">{description}</p>
                            <Button onClick={handleConnect} className="gap-2">
                                <Cloud size={16} />
                                Connect {connectionType === "personal" ? "Personal" : "Admin"} Drive
                            </Button>
                        </>
                    ) : (
                        <>
                            {driveStatus.folder_name && (
                                <p className="text-compact text-muted-foreground">
                                    Folder: <span className="text-foreground font-medium">{driveStatus.folder_name}</span>
                                </p>
                            )}
                            <p className="text-compact text-muted-foreground/75">
                                Last synced: {formatTime(driveStatus.last_synced_at)} · {driveStatus.files_indexed} indexed, {driveStatus.files_pending} pending
                            </p>
                            {driveStatus.sync_error && (
                                <p className="text-compact text-[var(--color-error)]">{driveStatus.sync_error}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={handleSyncNow} disabled={syncing || driveStatus.sync_status === "running"} className="gap-2">
                                    {syncing || driveStatus.sync_status === "running" ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <RefreshCw size={16} />
                                    )}
                                    Sync now
                                </Button>
                                <Button variant="outline" onClick={openChangeFolder} className="gap-2">
                                    <FolderOpen size={16} />
                                    Change folder
                                </Button>
                                <Button variant="destructive" onClick={handleDisconnect} className="gap-2 bg-[rgba(200,122,122,0.12)] hover:bg-[rgba(200,122,122,0.18)] border-[rgba(200,122,122,0.2)] text-[var(--color-error)]">
                                    <LogOut size={16} />
                                    Disconnect
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </section>

            <GoogleDriveFolderPicker
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={handleFolderSelected}
                mode={pickerMode}
                connectionType={connectionType}
            />
        </>
    );
}

// ---------------------------------------------------------------------------
// Intranet connection card (Basic Auth; API routes remain /claromentis/*)
// ---------------------------------------------------------------------------
type ClaromentisStatus = {
    status: "active" | "error" | "disconnected";
    claromentis_username?: string | null;
    claromentis_base_url?: string | null;
    last_connected_at?: string | null;
    last_error?: string | null;
};

function ClaromentisConnectionCard() {
    const [status, setStatus] = useState<ClaromentisStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [baseUrl, setBaseUrl] = useState("");

    const fetchStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch("/api/integrations/claromentis/status", {
                cache: "no-store",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.status === 401) {
                setStatus(null);
                setError("Sign in required (backend).");
                return;
            }
            if (!res.ok) throw new Error("Failed to fetch status");
            const data: ClaromentisStatus = await res.json();
            setStatus(data);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    const handleConnect = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const token = localStorage.getItem("auth_token");
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch("/api/integrations/claromentis/connect", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    claromentis_username: username,
                    claromentis_password: password,
                    claromentis_base_url: baseUrl || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Connection failed");
            setPassword("");
            await fetchStatus();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Connection failed");
        } finally {
            setSubmitting(false);
        }
    }, [username, password, baseUrl, fetchStatus]);

    const handleSyncNow = useCallback(async () => {
        setSyncing(true);
        setError(null);
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch("/api/sync/trigger-safe", {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Sync failed");
            if (data.status === "already_running") {
                setError("Sync already in progress — check back in a moment.");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Sync failed");
        } finally {
            setSyncing(false);
        }
    }, []);

    const handleDisconnect = useCallback(async () => {
        if (!confirm("Disconnect your intranet account?")) return;
        try {
            const token = localStorage.getItem("auth_token");
            await fetch("/api/integrations/claromentis/disconnect", {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            setUsername("");
            setPassword("");
            setBaseUrl("");
            await fetchStatus();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Disconnect failed");
        }
    }, [fetchStatus]);

    const isConnected = status?.status === "active";
    const isError = status?.status === "error";
    const showForm = !isConnected || isError;

    if (loading) {
        return (
            <section className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-muted-foreground/75" />
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center border border-input">
                    <Link2 size={18} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-foreground">Intranet account</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Connect your personal intranet account for search and browsing
                    </p>
                </div>
                {isConnected && (
                    <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-medium bg-green-500/15 text-green-400 border border-green-500/25">
                        <CheckCircle size={12} /> Connected
                    </span>
                )}
                {isError && (
                    <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/25">
                        <AlertCircle size={12} /> Error
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
                {error && (
                    <div className="rounded-lg bg-[rgba(200,122,122,0.08)] border border-[rgba(200,122,122,0.2)] px-3 py-2 text-compact text-[var(--color-error)]">
                        {error}
                    </div>
                )}

                {isError && status?.last_error && (
                    <div className="rounded-lg bg-[rgba(200,122,122,0.08)] border border-[rgba(200,122,122,0.2)] px-3 py-2 text-compact text-[var(--color-error)]">
                        {status.last_error} — re-enter your credentials below to reconnect.
                    </div>
                )}

                {isConnected && !isError && (
                    <div className="space-y-1">
                        <p className="text-compact text-muted-foreground">
                            Signed in as <span className="text-foreground font-medium">{status?.claromentis_username}</span>
                        </p>
                        {status?.last_connected_at && (
                            <p className="text-sm text-muted-foreground">
                                Connected {formatTime(status.last_connected_at)}
                            </p>
                        )}
                        <div className="pt-2 flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleSyncNow}
                                disabled={syncing}
                                className="gap-2"
                            >
                                {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                Sync now
                            </Button>
                            <Button variant="destructive" onClick={handleDisconnect} className="gap-2 bg-[rgba(200,122,122,0.12)] hover:bg-[rgba(200,122,122,0.18)] border-[rgba(200,122,122,0.2)] text-[var(--color-error)]">
                                <LogOut size={16} />
                                Disconnect
                            </Button>
                        </div>
                    </div>
                )}

                {showForm && (
                    <form onSubmit={handleConnect} className="space-y-3">
                        <div className="space-y-2">
                            <Input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoComplete="username"
                                className="rounded-xl bg-foreground/[0.06] border-input"
                            />
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="rounded-xl bg-foreground/[0.06] border-input"
                            />
                            <Input
                                type="url"
                                placeholder="Custom URL (optional — leave blank to use default)"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                autoComplete="off"
                                className="rounded-xl bg-foreground/[0.06] border-input"
                            />
                        </div>
                        <Button type="submit" disabled={submitting} className="gap-2">
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
                            {isError ? "Reconnect" : "Connect"}
                        </Button>
                    </form>
                )}
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// EmailForwardingCard -- agency ingest address for Knowledge Vault
// ---------------------------------------------------------------------------
function EmailForwardingCard() {
    const toast = useToast();
    const agencySlug =
        (typeof process !== "undefined" && process.env.NEXT_PUBLIC_AGENCY_INGEST_SLUG) || "travellustre";
    const address = `${agencySlug}@ingest.enable.travel`;

    return (
        <div className="bg-foreground/[0.03] border border-border rounded-[20px] p-5">
            <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-semibold tracking-wider text-muted-foreground/90 uppercase">
                    Email Forwarding
                </span>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
                Forward any email to this address and it will appear in your Knowledge Vault. Attachments are
                extracted and stored as separate documents.
            </p>

            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.04] rounded-xl px-4 py-3">
                <code className="text-sm text-sky-400 flex-1 font-mono break-all">{address}</code>
                <button
                    type="button"
                    onClick={() => {
                        void navigator.clipboard.writeText(address);
                        toast({ title: "Email address copied", tone: "success" });
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1"
                    aria-label="Copy address"
                >
                    <Copy className="w-4 h-4" />
                </button>
            </div>

            <p className="text-2xs text-muted-foreground/70 mt-3">
                We match forwarded emails to your advisor account using your registered email address. All ingested
                content is private to you by default.
            </p>
        </div>
    );
}

// ---------------------------------------------------------------------------
// IntegrationsPage -- renders both connection cards
// ---------------------------------------------------------------------------
export default function IntegrationsPage() {
    const { user } = useUser();
    const isAdmin = user?.role === "admin";

    return (
        <div className="h-full overflow-y-auto bg-background">
            <div className={cn(APP_PAGE_CONTENT_SHELL, "py-6")}>
            <div className="mx-auto w-full max-w-2xl space-y-6">
                <div className="mb-8">
                    <Breadcrumbs
                        items={[
                            { label: "Dashboard", href: BRIEFING_ROOM_PATH },
                            { label: "Settings", href: "/dashboard/settings" },
                            { label: "Integrations" },
                        ]}
                        className="mb-3"
                    />
                    <Link
                        href="/dashboard/settings"
                        className="text-compact text-muted-foreground/75 hover:text-foreground mb-2 inline-block"
                    >
                        ← Settings
                    </Link>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Integrations</h1>
                    <p className="text-base text-muted-foreground/75 mt-1">Connect data sources for search and RAG</p>
                </div>

                <EmailForwardingCard />

                {/* Intranet first, then personal drive, then admin drive (when applicable) */}
                <ClaromentisConnectionCard />

                <DriveConnectionCard connectionType="personal" />

                {isAdmin && (
                    <DriveConnectionCard connectionType="agency" />
                )}
            </div>
            </div>
        </div>
    );
}
