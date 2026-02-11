"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, FolderOpen, ChevronRight, Check } from "lucide-react";

type FolderItem = { id: string; name: string; mimeType: string };

type Props = {
    open: boolean;
    onClose: () => void;
    onSelect: (folderId: string, folderName: string) => void;
    mode?: "connect" | "change";
};

export default function GoogleDriveFolderPicker({ open, onClose, onSelect, mode = "connect" }: Props) {
    const [breadcrumb, setBreadcrumb] = useState<FolderItem[]>([{ id: "root", name: "My Drive", mimeType: "application/vnd.google-apps.folder" }]);
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selecting, setSelecting] = useState(false);

    const currentParent = breadcrumb[breadcrumb.length - 1];
    const parentId = currentParent?.id === "root" ? "root" : currentParent?.id;

    const fetchFolders = useCallback(async (parent: string) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(`/api/integrations/google-drive/folders?parent_id=${encodeURIComponent(parent)}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.status === 401) {
                setError("Please connect Google Drive first.");
                setFolders([]);
                return;
            }
            if (!res.ok) throw new Error("Failed to load folders");
            const data = await res.json();
            setFolders(data.files || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load folders");
            setFolders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open && parentId) fetchFolders(parentId);
    }, [open, parentId, fetchFolders]);

    const handleNavigate = (folder: FolderItem) => {
        setBreadcrumb((prev) => [...prev, folder]);
    };

    const handleBreadcrumbClick = (index: number) => {
        setBreadcrumb((prev) => prev.slice(0, index + 1));
    };

    const handleSelectThisFolder = () => {
        if (currentParent?.id === "root") {
            setError("Please select a folder inside My Drive.");
            return;
        }
        setSelecting(true);
        onSelect(currentParent!.id, currentParent!.name);
        setSelecting(false);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <div
                className="w-full max-w-md rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-[#F5F5F5]">
                        {mode === "change" ? "Change folder" : "Select a folder"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5] text-[14px]"
                    >
                        Close
                    </button>
                </div>

                <div className="p-4">
                    <div className="flex flex-wrap items-center gap-1 text-[13px] text-[rgba(245,245,245,0.6)] mb-4">
                        {breadcrumb.map((f, i) => (
                            <span key={f.id} className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => handleBreadcrumbClick(i)}
                                    className="hover:text-[#F5F5F5] truncate max-w-[120px]"
                                >
                                    {f.name}
                                </button>
                                {i < breadcrumb.length - 1 && <ChevronRight size={14} />}
                            </span>
                        ))}
                    </div>

                    {error && (
                        <p className="text-[13px] text-[#C87A7A] mb-3">{error}</p>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 size={24} className="animate-spin text-[rgba(245,245,245,0.5)]" />
                        </div>
                    ) : (
                        <div className="space-y-1 max-h-[280px] overflow-y-auto">
                            {folders.map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => handleNavigate(f)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.06)] text-left"
                                >
                                    <FolderOpen size={20} className="text-[rgba(245,245,245,0.5)] shrink-0" />
                                    <span className="text-[14px] text-[#F5F5F5] truncate">{f.name}</span>
                                </button>
                            ))}
                            {!loading && folders.length === 0 && parentId !== "root" && (
                                <p className="text-[13px] text-[rgba(245,245,245,0.5)] py-2">No subfolders.</p>
                            )}
                        </div>
                    )}

                    {currentParent && currentParent.id !== "root" && (
                        <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                            <button
                                type="button"
                                disabled={selecting}
                                onClick={handleSelectThisFolder}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.1)] text-[#F5F5F5] disabled:opacity-50"
                            >
                                {selecting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                Select &quot;{currentParent.name}&quot;
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
