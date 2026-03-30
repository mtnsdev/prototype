"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GoogleDriveOAuthCallbackPage() {
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState<string>("Connecting...");

    useEffect(() => {
        const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
        const code = params.get("code");
        const errorParam = params.get("error");

        // Extract connection_type from the OAuth state parameter or query string.
        // Backend encodes state as "user_id:connection_type" (e.g. "123:agency").
        let connectionType = "personal";
        const stateParam = params.get("state");
        if (stateParam) {
            try {
                const stateData = JSON.parse(stateParam);
                if (stateData.connection_type) {
                    connectionType = stateData.connection_type;
                }
            } catch {
                // State is not JSON. Try "user_id:connection_type" format first,
                // then fall back to plain string match.
                const colonIdx = stateParam.lastIndexOf(":");
                if (colonIdx !== -1) {
                    const ct = stateParam.slice(colonIdx + 1);
                    if (ct === "agency" || ct === "personal") {
                        connectionType = ct;
                    }
                } else if (stateParam === "agency" || stateParam === "personal") {
                    connectionType = stateParam;
                }
            }
        }
        // Also check for explicit query param (backend may pass it directly)
        const ctParam = params.get("connection_type");
        if (ctParam) {
            connectionType = ctParam;
        }

        if (errorParam) {
            setStatus("error");
            setMessage(errorParam === "access_denied" ? "You denied access." : "Authorization failed.");
            return;
        }

        if (!code) {
            setStatus("error");
            setMessage("No authorization code received.");
            return;
        }

        const redirectUri = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

        fetch("/api/integrations/google-drive/auth/callback", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
                code,
                redirect_uri: redirectUri,
                connection_type: connectionType,
                ...(stateParam ? { state: stateParam } : {}),
            }),
        })
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    setStatus("error");
                    setMessage(data.detail || "Failed to connect.");
                    return;
                }
                setStatus("success");
                setMessage("Connected. Closing...");
                if (window.opener) {
                    window.opener.postMessage(
                        { type: "google_drive_oauth_done", connection_type: connectionType },
                        window.location.origin
                    );
                    window.close();
                }
            })
            .catch(() => {
                setStatus("error");
                setMessage("Network error.");
            });
    }, []);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="rounded-2xl border border-border bg-card p-8 max-w-sm w-full text-center">
                {status === "loading" && (
                    <>
                        <Loader2 size={32} className="animate-spin text-muted-foreground mx-auto mb-4" />
                        <p className="text-base text-foreground">{message}</p>
                    </>
                )}
                {status === "success" && (
                    <>
                        <p className="text-base text-foreground">{message}</p>
                        <p className="text-compact text-muted-foreground/75 mt-2">You can close this window.</p>
                    </>
                )}
                {status === "error" && (
                    <>
                        <AlertCircle size={32} className="text-[var(--color-error)] mx-auto mb-4" />
                        <p className="text-base text-foreground">{message}</p>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => window.close()}
                            className="mt-4 text-compact text-muted-foreground hover:text-foreground"
                        >
                            Close window
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
