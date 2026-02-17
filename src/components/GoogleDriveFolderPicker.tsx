"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, FolderOpen, ChevronRight, Check, HardDrive, Users } from "lucide-react";

type FolderItem = { id: string; name: string; mimeType: string; driveId?: string };
type SharedDrive = { id: string; name: string };

type BreadcrumbItem = FolderItem & { driveId?: string };

type Props = {
    open: boolean;
    onClose: () => void;
    onSelect: (folderId: string, folderName: string) => void;
    mode?: "connect" | "change";
    connectionType?: string;
};

export default function GoogleDriveFolderPicker({ open, onClose, onSelect, mode = "connect", connectionType = "personal" }: Props) {
    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [sharedDrives, setSharedDrives] = useState<SharedDrive[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selecting, setSelecting] = useState(false);
    const [view, setView] = useState<"root" | "my_drive" | "shared_drive">("root");
    const [activeDriveId, setActiveDriveId] = useState<string | null>(null);

    const currentParent = breadcrumb[breadcrumb.length - 1];
    const parentId = currentParent?.id === "root" ? "root" : currentParent?.id;

    const fetchSharedDrives = useCallback(async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(
                `/api/integrations/google-drive/shared-drives?connection_type=${encodeURIComponent(connectionType)}`,
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );
            if (res.ok) {
                const data = await res.json();
                setSharedDrives(data.drives || []);
            }
        } catch {
            // Shared Drives listing is optional; silently continue
        }
    }, [connectionType]);

    const fetchFolders = useCallback(async (parent: string, driveId?: string | null) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("auth_token");
            let url = `/api/integrations/google-drive/folders?parent_id=${encodeURIComponent(parent)}&connection_type=${encodeURIComponent(connectionType)}`;
            if (driveId) {
                url += `&drive_id=${encodeURIComponent(driveId)}`;
            }
            const res = await fetch(url, {
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
    }, [connectionType]);

    // On open: fetch shared drives list and show root picker
    useEffect(() => {
        if (open) {
            setView("root");
            setBreadcrumb([]);
            setActiveDriveId(null);
            setFolders([]);
            setError(null);
            fetchSharedDrives();
        }
    }, [open, fetchSharedDrives]);

    // Fetch folders when navigating inside My Drive or a Shared Drive
    useEffect(() => {
        if (!open) return;
        if (view === "my_drive" && parentId) {
            fetchFolders(parentId, null);
        } else if (view === "shared_drive" && parentId && activeDriveId) {
            fetchFolders(parentId, parentId === "root" ? activeDriveId : null);
        }
    }, [open, view, parentId, activeDriveId, fetchFolders]);

    const enterMyDrive = () => {
        setView("my_drive");
        setActiveDriveId(null);
        setBreadcrumb([{ id: "root", name: "My Drive", mimeType: "application/vnd.google-apps.folder" }]);
    };

    const enterSharedDrive = (drive: SharedDrive) => {
        setView("shared_drive");
        setActiveDriveId(drive.id);
        setBreadcrumb([{ id: "root", name: drive.name, mimeType: "application/vnd.google-apps.folder", driveId: drive.id }]);
    };

    const handleNavigate = (folder: FolderItem) => {
        setBreadcrumb((prev) => [...prev, folder]);
    };

    const handleBreadcrumbClick = (index: number) => {
        if (index === -1) {
            setView("root");
            setBreadcrumb([]);
            setActiveDriveId(null);
            setFolders([]);
            return;
        }
        setBreadcrumb((prev) => prev.slice(0, index + 1));
    };

    const handleSelectThisFolder = () => {
        if (!currentParent || currentParent.id === "root") {
            if (view === "shared_drive" && activeDriveId) {
                // Selecting the root of a Shared Drive is valid
                setSelecting(true);
                onSelect(activeDriveId, currentParent?.name || "Shared Drive");
                setSelecting(false);
                onClose();
                return;
            }
            setError("Please select a folder inside My Drive.");
            return;
        }
        setSelecting(true);
        onSelect(currentParent.id, currentParent.name);
        setSelecting(false);
        onClose();
    };

    if (!open) return null;

    const canSelect = view === "shared_drive" || (currentParent && currentParent.id !== "root");

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
                    {/* Breadcrumb */}
                    {view !== "root" && (
                        <div className="flex flex-wrap items-center gap-1 text-[13px] text-[rgba(245,245,245,0.6)] mb-4">
                            <button
                                type="button"
                                onClick={() => handleBreadcrumbClick(-1)}
                                className="hover:text-[#F5F5F5]"
                            >
                                Drives
                            </button>
                            {breadcrumb.map((f, i) => (
                                <span key={`${f.id}-${i}`} className="flex items-center gap-1">
                                    <ChevronRight size={14} />
                                    <button
                                        type="button"
                                        onClick={() => handleBreadcrumbClick(i)}
                                        className="hover:text-[#F5F5F5] truncate max-w-[120px]"
                                    >
                                        {f.name}
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {error && (
                        <p className="text-[13px] text-[#C87A7A] mb-3">{error}</p>
                    )}

                    {/* Root view: show My Drive + Shared Drives */}
                    {view === "root" && (
                        <div className="space-y-1 max-h-[320px] overflow-y-auto">
                            <button
                                type="button"
                                onClick={enterMyDrive}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.06)] text-left"
                            >
                                <HardDrive size={20} className="text-[rgba(245,245,245,0.5)] shrink-0" />
                                <span className="text-[14px] text-[#F5F5F5]">My Drive</span>
                            </button>

                            {sharedDrives.length > 0 && (
                                <>
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-[rgba(245,245,245,0.4)] px-3 pt-3 pb-1">
                                        Shared Drives
                                    </p>
                                    {sharedDrives.map((sd) => (
                                        <button
                                            key={sd.id}
                                            type="button"
                                            onClick={() => enterSharedDrive(sd)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.06)] text-left"
                                        >
                                            <Users size={20} className="text-[rgba(245,245,245,0.5)] shrink-0" />
                                            <span className="text-[14px] text-[#F5F5F5] truncate">{sd.name}</span>
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                    {/* Folder browser (My Drive or inside a Shared Drive) */}
                    {view !== "root" && (
                        <>
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
                                    {!loading && folders.length === 0 && (
                                        <p className="text-[13px] text-[rgba(245,245,245,0.5)] py-2">No subfolders.</p>
                                    )}
                                </div>
                            )}

                            {canSelect && (
                                <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                                    <button
                                        type="button"
                                        disabled={selecting}
                                        onClick={handleSelectThisFolder}
                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.1)] text-[#F5F5F5] disabled:opacity-50"
                                    >
                                        {selecting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                        Select &quot;{currentParent?.name}&quot;
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
