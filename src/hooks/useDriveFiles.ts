"use client";

import { useCallback, useEffect, useState } from "react";
import type { DriveFile } from "@/types/google-drive";

export function useDriveFiles(
    connectionType: "personal" | "agency",
    opts?: { includeFolders?: boolean; enabled?: boolean }
) {
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const enabled = opts?.enabled !== false;
    const includeFolders = opts?.includeFolders ?? true;

    const fetchFiles = useCallback(async () => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
            if (!token) {
                setLoading(false);
                return;
            }
            const params = new URLSearchParams({
                connection_type: connectionType,
                include_folders: String(includeFolders),
            });
            const res = await fetch(
                `/api/integrations/google-drive/files?${params.toString()}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch Drive files");
            const data = await res.json();
            setFiles(data.files || []);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load files");
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, [connectionType, includeFolders, enabled]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    return { files, loading, error, refetch: fetchFiles };
}
