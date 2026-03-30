"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, FolderOpen, ChevronRight, Check, HardDrive, Users } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent
                className="w-full max-w-md rounded-2xl border-border bg-card shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <h3 className="text-base font-semibold text-foreground">
                        {mode === "change" ? "Change folder" : "Select a folder"}
                    </h3>
                    <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground/75 hover:text-foreground">
                        Close
                    </Button>
                </div>

                <div className="p-4">
                    {/* Breadcrumb */}
                    {view !== "root" && (
                        <div className="flex flex-wrap items-center gap-1 text-compact text-muted-foreground mb-4">
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleBreadcrumbClick(-1)} className="hover:text-foreground h-auto p-0 font-normal text-compact">
                                Drives
                            </Button>
                            {breadcrumb.map((f, i) => (
                                <span key={`${f.id}-${i}`} className="flex items-center gap-1">
                                    <ChevronRight size={14} />
                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleBreadcrumbClick(i)} className="hover:text-foreground truncate max-w-[120px] h-auto p-0 font-normal text-compact">
                                        {f.name}
                                    </Button>
                                </span>
                            ))}
                        </div>
                    )}

                    {error && (
                        <p className="text-compact text-[var(--color-error)] mb-3">{error}</p>
                    )}

                    {/* Root view: show My Drive + Shared Drives */}
                    {view === "root" && (
                        <div className="space-y-1 max-h-[320px] overflow-y-auto">
                            <Button type="button" variant="ghost" onClick={enterMyDrive} className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.06)] font-normal h-auto">
                                <HardDrive size={20} className="text-muted-foreground/75 shrink-0" />
                                <span className="text-base text-foreground">My Drive</span>
                            </Button>

                            {sharedDrives.length > 0 && (
                                <>
                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55 px-3 pt-3 pb-1">
                                        Shared Drives
                                    </p>
                                    {sharedDrives.map((sd) => (
                                        <button
                                            key={sd.id}
                                            type="button"
                                            onClick={() => enterSharedDrive(sd)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.06)] text-left"
                                        >
                                            <Users size={20} className="text-muted-foreground/75 shrink-0" />
                                            <span className="text-base text-foreground truncate">{sd.name}</span>
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
                                    <Loader2 size={24} className="animate-spin text-muted-foreground/75" />
                                </div>
                            ) : (
                                <div className="space-y-1 max-h-[280px] overflow-y-auto">
                                    {folders.map((f) => (
                                        <Button
                                            key={f.id}
                                            type="button"
                                            variant="ghost"
                                            onClick={() => handleNavigate(f)}
                                            className="w-full justify-start gap-3 px-3 py-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.06)] font-normal h-auto"
                                        >
                                            <FolderOpen size={20} className="text-muted-foreground/75 shrink-0" />
                                            <span className="text-base text-foreground truncate">{f.name}</span>
                                        </Button>
                                    ))}
                                    {!loading && folders.length === 0 && (
                                        <p className="text-compact text-muted-foreground/75 py-2">No subfolders.</p>
                                    )}
                                </div>
                            )}

                            {canSelect && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <Button
                                        type="button"
                                        disabled={selecting}
                                        onClick={handleSelectThisFolder}
                                        className="w-full gap-2"
                                    >
                                        {selecting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                        Select &quot;{currentParent?.name}&quot;
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
