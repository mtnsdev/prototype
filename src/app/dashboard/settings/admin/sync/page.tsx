"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react";

type IntegrationHealth = {
    integration: string;
    last_successful_sync_at: string | null;
    last_run_status: string | null;
    last_run_error: string | null;
    triggered_by: string | null;
    total_docs_synced: number;
    total_docs_failed: number;
    total_docs_indexed: number;
    pending_indexing: number;
};

type SyncHealthResponse = {
    integrations: IntegrationHealth[];
    overall_status: string;
};

function formatTimestamp(iso: string | null): string {
    if (!iso) return "—";
    try {
        const d = new Date(iso);
        return d.toLocaleString(undefined, {
            dateStyle: "short",
            timeStyle: "short",
        });
    } catch {
        return "—";
    }
}

function StatusBadge({ status }: { status: string }) {
    if (status === "healthy") {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium bg-green-500/15 text-green-400 border border-green-500/25">
                <CheckCircle size={12} />
                Healthy
            </span>
        );
    }
    if (status === "degraded") {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25">
                <AlertCircle size={12} />
                Degraded
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium bg-red-500/15 text-red-400 border border-red-500/25">
            <XCircle size={12} />
            Error
        </span>
    );
}

export default function AdminSyncHealthPage() {
    const [health, setHealth] = useState<SyncHealthResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [triggering, setTriggering] = useState(false);

    const fetchHealth = useCallback(async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch("/api/sync/health", {
                cache: "no-store",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error("Failed to fetch sync health");
            const data: SyncHealthResponse = await res.json();
            setHealth(data);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHealth();
    }, [fetchHealth]);

    const triggerSync = useCallback(async () => {
        setTriggering(true);
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch("/api/sync/trigger-safe", {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Trigger failed");
            await fetchHealth();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Trigger failed");
        } finally {
            setTriggering(false);
        }
    }, [fetchHealth]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-[rgba(245,245,245,0.5)]" />
            </div>
        );
    }

    if (error && !health) {
        return (
            <div className="rounded-2xl bg-[rgba(200,122,122,0.08)] border border-[rgba(200,122,122,0.2)] p-6 text-center">
                <p className="text-[14px] text-[#C87A7A]">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overall status */}
            <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-[#F5F5F5]">Sync Health</h2>
                {health && (
                    <div className="flex items-center gap-3">
                        <StatusBadge status={health.overall_status} />
                        <button
                            type="button"
                            onClick={triggerSync}
                            disabled={triggering}
                            className={[
                                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium",
                                "bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)]",
                                "border border-[rgba(255,255,255,0.1)]",
                                "text-[#F5F5F5]",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                            ].join(" ")}
                        >
                            {triggering ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <RefreshCw size={14} />
                            )}
                            Sync All
                        </button>
                    </div>
                )}
            </div>

            {/* Per-integration cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {health?.integrations.map((int) => (
                    <div
                        key={int.integration}
                        className="rounded-2xl bg-[#161616] border border-[rgba(255,255,255,0.08)] p-5"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-[14px] font-semibold text-[#F5F5F5] capitalize">
                                    {int.integration}
                                </h3>
                                <p className="text-[12px] text-[rgba(245,245,245,0.5)] mt-0.5">
                                    Last sync: {formatTimestamp(int.last_successful_sync_at)}
                                </p>
                            </div>
                            <span className="text-[11px] text-[rgba(245,245,245,0.4)]">
                                {int.triggered_by === "manual" ? "Manual" : "Scheduled"}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[12px] mb-4">
                            <div className="flex justify-between">
                                <span className="text-[rgba(245,245,245,0.5)]">Synced</span>
                                <span className="text-[#F5F5F5] font-medium">{int.total_docs_synced}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[rgba(245,245,245,0.5)]">Failed</span>
                                <span className="text-[#F5F5F5] font-medium">{int.total_docs_failed}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[rgba(245,245,245,0.5)]">Indexed</span>
                                <span className="text-[#F5F5F5] font-medium">{int.total_docs_indexed}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[rgba(245,245,245,0.5)]">Pending index</span>
                                <span className="text-[#F5F5F5] font-medium">{int.pending_indexing}</span>
                            </div>
                        </div>
                        {int.last_run_error && (
                            <div className="mb-4 p-3 rounded-lg bg-[rgba(200,122,122,0.08)] border border-[rgba(200,122,122,0.2)]">
                                <p className="text-[11px] text-[#C87A7A]">{int.last_run_error}</p>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={triggerSync}
                            disabled={triggering}
                            className={[
                                "w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] font-medium",
                                "bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)]",
                                "border border-[rgba(255,255,255,0.08)]",
                                "text-[rgba(245,245,245,0.9)]",
                                "disabled:opacity-50",
                            ].join(" ")}
                        >
                            {triggering ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                            Trigger Sync
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
