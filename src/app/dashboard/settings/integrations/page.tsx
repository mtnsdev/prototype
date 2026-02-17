"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import Link from "next/link";
import GoogleDriveFolderPicker from "@/components/GoogleDriveFolderPicker";
import { useUser } from "@/contexts/UserContext";
import type { DriveStatus } from "@/types/google-drive";

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
    isAdmin,
}: {
    connectionType: "personal" | "agency";
    isAdmin: boolean;
}) {
    const router = useRouter();
    const [driveStatus, setDriveStatus] = useState<DriveStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerMode, setPickerMode] = useState<"connect" | "change">("connect");

    const label = connectionType === "personal" ? "Personal Google Drive" : "Admin Google Drive";
    const description =
        connectionType === "personal"
            ? "Connect your personal Google Drive folder. Only you can see its content in search and answers."
            : "Connect a shared Google Drive folder for all workspace users. Admin only.";
    const CardIcon = connectionType === "personal" ? User : Users;

    const fetchStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem("auth_token");
            if (!token) {
                router.push("/login");
                return;
            }
            const res = await fetch(
                `/api/integrations/google-drive/status?connection_type=${connectionType}`,
                {
                    cache: "no-store",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (res.status === 401) {
                router.push("/login");
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
    }, [router, connectionType]);

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
            <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] overflow-hidden">
                <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-[rgba(245,245,245,0.5)]" />
                </div>
            </section>
        );
    }

    return (
        <>
            <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center border border-white/10">
                        <Cloud size={18} className="text-[rgba(245,245,245,0.6)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-[15px] font-semibold text-[#F5F5F5]">{label}</h2>
                            <CardIcon size={14} className="text-[rgba(245,245,245,0.4)]" />
                        </div>
                        {connectionType === "agency" && (
                            <p className="text-[11px] text-[rgba(245,245,245,0.4)] mt-0.5">
                                Shared with all workspace users
                            </p>
                        )}
                    </div>
                    {driveStatus?.connected && (
                        <span className="ml-auto">
                            {driveStatus.sync_status === "running" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25">
                                    <Loader2 size={12} className="animate-spin" />
                                    Syncing...
                                </span>
                            ) : driveStatus.sync_status === "failed" || driveStatus.status === "token_expired" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium bg-red-500/15 text-red-400 border border-red-500/25">
                                    <AlertCircle size={12} />
                                    Error
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium bg-green-500/15 text-green-400 border border-green-500/25">
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
                        <div className="rounded-lg bg-[rgba(200,122,122,0.08)] border border-[rgba(200,122,122,0.2)] px-3 py-2 text-[13px] text-[#C87A7A]">
                            {error}
                        </div>
                    )}

                    {!driveStatus?.connected ? (
                        <>
                            <p className="text-[13px] text-[rgba(245,245,245,0.5)]">{description}</p>
                            <button
                                onClick={handleConnect}
                                className={[
                                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl",
                                    "text-[14px] font-medium",
                                    "bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)]",
                                    "border border-[rgba(255,255,255,0.1)]",
                                    "text-[#F5F5F5]",
                                    "transition-all duration-150",
                                ].join(" ")}
                            >
                                <Cloud size={16} />
                                Connect {connectionType === "personal" ? "Personal" : "Admin"} Drive
                            </button>
                        </>
                    ) : (
                        <>
                            {driveStatus.folder_name && (
                                <p className="text-[13px] text-[rgba(245,245,245,0.6)]">
                                    Folder: <span className="text-[#F5F5F5] font-medium">{driveStatus.folder_name}</span>
                                </p>
                            )}
                            <p className="text-[13px] text-[rgba(245,245,245,0.5)]">
                                Last synced: {formatTime(driveStatus.last_synced_at)} · {driveStatus.files_indexed} indexed, {driveStatus.files_pending} pending
                            </p>
                            {driveStatus.sync_error && (
                                <p className="text-[13px] text-[#C87A7A]">{driveStatus.sync_error}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handleSyncNow}
                                    disabled={syncing || driveStatus.sync_status === "running"}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.1)] text-[#F5F5F5] disabled:opacity-50"
                                >
                                    {syncing || driveStatus.sync_status === "running" ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <RefreshCw size={16} />
                                    )}
                                    Sync now
                                </button>
                                <button
                                    onClick={openChangeFolder}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.1)] text-[#F5F5F5]"
                                >
                                    <FolderOpen size={16} />
                                    Change folder
                                </button>
                                <button
                                    onClick={handleDisconnect}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium bg-[rgba(200,122,122,0.12)] hover:bg-[rgba(200,122,122,0.18)] border border-[rgba(200,122,122,0.2)] text-[#C87A7A]"
                                >
                                    <LogOut size={16} />
                                    Disconnect
                                </button>
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
// IntegrationsPage -- renders both connection cards
// ---------------------------------------------------------------------------
export default function IntegrationsPage() {
    const { user } = useUser();
    const isAdmin = user?.role === "admin";

    return (
        <div className="h-full overflow-y-auto bg-[#0C0C0C]">
            <div className="max-w-2xl mx-auto p-6 space-y-6">
                <div className="mb-8">
                    <Link
                        href="/dashboard/settings"
                        className="text-[13px] text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5] mb-2 inline-block"
                    >
                        ← Settings
                    </Link>
                    <h1 className="text-[24px] font-semibold text-[#F5F5F5] tracking-tight">Integrations</h1>
                    <p className="text-[14px] text-[rgba(245,245,245,0.5)] mt-1">Connect data sources for search and RAG</p>
                </div>

                {/* Personal Google Drive -- available to all users */}
                <DriveConnectionCard connectionType="personal" isAdmin={isAdmin} />

                {/* Admin Google Drive -- admin only */}
                {isAdmin && (
                    <DriveConnectionCard connectionType="agency" isAdmin={isAdmin} />
                )}
            </div>
        </div>
    );
}
