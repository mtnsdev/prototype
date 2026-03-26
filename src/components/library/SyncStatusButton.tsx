"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type SyncStatus = {
    last_successful_sync_at: string | null;
    last_run_status: string | null;
    last_run_error: string | null;
};

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120000; // 2 minutes

function getCookie(name: string): string {
    if (typeof document === "undefined") return "";
    const prefix = `${name}=`;
    for (const part of document.cookie.split(";")) {
        const trimmed = part.trim();
        if (trimmed.startsWith(prefix)) {
            return decodeURIComponent(trimmed.slice(prefix.length));
        }
    }
    return "";
}

function formatTimestamp(iso: string | null): string {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        const hours = d.getHours().toString().padStart(2, "0");
        const minutes = d.getMinutes().toString().padStart(2, "0");
        const day = d.getDate().toString().padStart(2, "0");
        const month = (d.getMonth() + 1).toString().padStart(2, "0");
        return `${hours}:${minutes} ${day}/${month}`;
    } catch {
        return "";
    }
}

export default function SyncStatusButton() {
    const [status, setStatus] = useState<SyncStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [triggerError, setTriggerError] = useState<string | null>(null);
    const [timedOut, setTimedOut] = useState(false);
    const pollUntil = useRef<number>(0);
    const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchStatus = useCallback(async (): Promise<SyncStatus | null> => {
        const token = getCookie("auth_token");
        const res = await fetch("/api/sync/status", {
            cache: "no-store",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return null;
        const data = await res.json();
        return {
            last_successful_sync_at: data.last_successful_sync_at ?? null,
            last_run_status: data.last_run_status ?? null,
            last_run_error: data.last_run_error ?? null,
        };
    }, []);

    const loadStatus = useCallback(async () => {
        setError(null);
        try {
            const data = await fetchStatus();
            setStatus(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load status");
        } finally {
            setLoading(false);
        }
    }, [fetchStatus]);

    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    // Polling when syncing
    useEffect(() => {
        if (!syncing || Date.now() > pollUntil.current) return;

        const tick = async () => {
            if (Date.now() > pollUntil.current) {
                if (pollTimer.current) clearInterval(pollTimer.current);
                pollTimer.current = null;
                setTimedOut(true);
                setSyncing(false);
                await loadStatus();
                return;
            }
            const data = await fetchStatus();
            if (data) setStatus(data);
            if (data?.last_run_status !== "running") {
                if (pollTimer.current) clearInterval(pollTimer.current);
                pollTimer.current = null;
                setSyncing(false);
                await loadStatus();
            }
        };

        pollTimer.current = setInterval(tick, POLL_INTERVAL_MS);
        return () => {
            if (pollTimer.current) clearInterval(pollTimer.current);
        };
    }, [syncing, fetchStatus, loadStatus]);

    const handleClick = async () => {
        setTriggerError(null);
        const token = getCookie("auth_token");
        try {
            const res = await fetch("/api/sync/trigger-safe", {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (!res.ok) {
                setTriggerError(data.detail || "Trigger failed");
                return;
            }
            setTimedOut(false);
            if (data.status === "already_running") {
                setSyncing(true);
                pollUntil.current = Date.now() + POLL_TIMEOUT_MS;
                return;
            }
            if (data.status === "started") {
                setSyncing(true);
                pollUntil.current = Date.now() + POLL_TIMEOUT_MS;
            }
        } catch (e) {
            setTriggerError(e instanceof Error ? e.message : "Request failed");
        }
    };

    const formatted = status?.last_successful_sync_at
        ? formatTimestamp(status.last_successful_sync_at)
        : "";
    const neverSynced = !status?.last_successful_sync_at && !loading && !error;
    const hasError = status?.last_run_error || triggerError || error;
    const isRunning = status?.last_run_status === "running" || syncing;

    if (loading && !status) {
        return (
            <div className="flex items-center gap-2 text-[13px] text-[rgba(245,245,245,0.5)]">
                <Loader2 size={14} className="animate-spin" />
                <span>Loading…</span>
            </div>
        );
    }

    if (error && !status) {
        return (
            <div className="flex items-center gap-2 text-[13px] text-[rgba(245,245,245,0.45)]">
                <AlertCircle size={14} />
                <span>Status unavailable</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end gap-0.5">
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClick}
                disabled={isRunning}
                className="gap-2 text-[13px]"
            >
                {isRunning ? (
                    <>
                        <Loader2 size={14} className="animate-spin shrink-0" />
                        <span>Syncing…</span>
                    </>
                ) : (
                    <>
                        <RefreshCw size={14} className="shrink-0" />
                        <span>
                            {neverSynced
                                ? "Never synced — Sync now"
                                : formatted
                                    ? `Last update was at: ${formatted}`
                                    : "Last update: —"}
                        </span>
                    </>
                )}
            </Button>
            {hasError && (
                <p
                    className="text-[11px] text-[#C87A7A] max-w-[220px] truncate"
                    title={status?.last_run_error ?? triggerError ?? error ?? undefined}
                >
                </p>
            )}
            {timedOut && (
                <p className="text-[11px] text-[rgba(245,245,245,0.5)]">Sync may still be running</p>
            )}
        </div>
    );
}
