"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LibraryView from "@/components/library/LibraryView";
import { useClaromentisStatus } from "@/hooks/useClaromentisStatus";
import { useGoogleDriveStatus } from "@/hooks/useGoogleDriveStatus";
import { useFolderChildren } from "@/hooks/useFolderChildren";
import { usePages } from "@/hooks/usePages";
import {
    ChevronRight,
    ChevronDown,
    Folder,
    FileText,
    Loader2,
    BookOpen,
    FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TLItem } from "@/lib/claromentis/types";
import type { PageItem } from "@/hooks/usePages";

// ---------------------------------------------------------------------------
// Single tree node (folder or document)
// ---------------------------------------------------------------------------
function DocumentNode({ item }: { item: TLItem }) {
    const [expanded, setExpanded] = useState(false);
    const isFolder = item.kind === "folder";
    const hasChildren = isFolder && (item.has_children !== false);
    const { items: children, loading } = useFolderChildren(
        isFolder && expanded ? item.id : undefined,
        undefined,
        { enabled: isFolder && expanded }
    );

    if (!isFolder) {
        return (
            <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/4 cursor-default group">
                <FileText size={14} className="shrink-0 text-[rgba(245,245,245,0.4)]" />
                <span className="text-[13px] text-[rgba(245,245,245,0.75)] truncate">{item.title}</span>
            </div>
        );
    }

    return (
        <div>
            <Button
                type="button"
                variant="ghost"
                onClick={() => hasChildren && setExpanded((v) => !v)}
                className={`w-full justify-start gap-2 py-1.5 px-2 rounded-lg font-normal h-auto ${hasChildren ? "hover:bg-white/4 cursor-pointer" : "cursor-default"}`}
            >
                <span className="shrink-0 text-[rgba(245,245,245,0.35)] w-4">
                    {hasChildren ? (
                        expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    ) : null}
                </span>
                {expanded ? (
                    <FolderOpen size={14} className="shrink-0 text-[rgba(245,245,245,0.5)]" />
                ) : (
                    <Folder size={14} className="shrink-0 text-[rgba(245,245,245,0.5)]" />
                )}
                <span className="text-[13px] text-[rgba(245,245,245,0.8)] truncate flex-1">{item.title}</span>
            </Button>

            {expanded && (
                <div className="ml-5 pl-3 border-l border-[rgba(255,255,255,0.07)]">
                    {loading ? (
                        <div className="flex items-center gap-2 py-2 px-2">
                            <Loader2 size={12} className="animate-spin text-[rgba(245,245,245,0.4)]" />
                            <span className="text-[12px] text-[rgba(245,245,245,0.4)]">Loading…</span>
                        </div>
                    ) : children.length === 0 ? (
                        <p className="py-2 px-2 text-[12px] text-[rgba(245,245,245,0.35)]">Empty folder</p>
                    ) : (
                        children.map((child) => (
                            <DocumentNode key={child.kind === "folder" ? child.id : child.doc_id} item={child} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Pages root node
// ---------------------------------------------------------------------------
function PagesRootNode() {
    const [expanded, setExpanded] = useState(false);
    const { items, hasMore, isLoading, loadMore } = usePages({ enabled: expanded });

    return (
        <div>
            <Button
                type="button"
                variant="ghost"
                onClick={() => setExpanded((v) => !v)}
                className="w-full justify-start gap-2 py-2 px-3 rounded-xl font-normal h-auto hover:bg-white/4"
            >
                <span className="shrink-0 text-[rgba(245,245,245,0.45)] w-4">
                    {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </span>
                <BookOpen size={16} className="shrink-0 text-[rgba(245,245,245,0.55)]" />
                <span className="text-[14px] font-medium text-[rgba(245,245,245,0.85)] flex-1">Pages</span>
            </Button>

            {expanded && (
                <div className="ml-5 pl-3 border-l border-[rgba(255,255,255,0.07)] mt-0.5">
                    {isLoading && items.length === 0 ? (
                        <div className="flex items-center gap-2 py-2 px-2">
                            <Loader2 size={12} className="animate-spin text-[rgba(245,245,245,0.4)]" />
                            <span className="text-[12px] text-[rgba(245,245,245,0.4)]">Loading…</span>
                        </div>
                    ) : items.length === 0 ? (
                        <p className="py-2 px-2 text-[12px] text-[rgba(245,245,245,0.35)]">No pages available</p>
                    ) : (
                        <>
                            {items.map((page: PageItem) => (
                                <div key={page.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/4">
                                    <FileText size={14} className="shrink-0 text-[rgba(245,245,245,0.4)]" />
                                    <span className="text-[13px] text-[rgba(245,245,245,0.75)] truncate">{page.name}</span>
                                </div>
                            ))}
                            {hasMore && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={loadMore}
                                    disabled={isLoading}
                                    className="mt-1 w-full justify-start gap-2 font-normal text-[12px] text-[rgba(245,245,245,0.5)] hover:bg-white/4 h-auto py-1.5"
                                >
                                    {isLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                                    Load more
                                </Button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Documents root node
// ---------------------------------------------------------------------------
function DocumentsRootNode() {
    const [expanded, setExpanded] = useState(false);
    const { items, loading } = useFolderChildren(expanded ? 0 : undefined, undefined, { enabled: expanded });

    return (
        <div>
            <Button
                type="button"
                variant="ghost"
                onClick={() => setExpanded((v) => !v)}
                className="w-full justify-start gap-2 py-2 px-3 rounded-xl font-normal h-auto hover:bg-white/4"
            >
                <span className="shrink-0 text-[rgba(245,245,245,0.45)] w-4">
                    {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </span>
                {expanded ? (
                    <FolderOpen size={16} className="shrink-0 text-[rgba(245,245,245,0.55)]" />
                ) : (
                    <Folder size={16} className="shrink-0 text-[rgba(245,245,245,0.55)]" />
                )}
                <span className="text-[14px] font-medium text-[rgba(245,245,245,0.85)] flex-1">Documents</span>
            </Button>

            {expanded && (
                <div className="ml-5 pl-3 border-l border-[rgba(255,255,255,0.07)] mt-0.5">
                    {loading ? (
                        <div className="flex items-center gap-2 py-2 px-2">
                            <Loader2 size={12} className="animate-spin text-[rgba(245,245,245,0.4)]" />
                            <span className="text-[12px] text-[rgba(245,245,245,0.4)]">Loading…</span>
                        </div>
                    ) : items.length === 0 ? (
                        <p className="py-2 px-2 text-[12px] text-[rgba(245,245,245,0.35)]">No documents available</p>
                    ) : (
                        items.map((item) => (
                            <DocumentNode key={item.kind === "folder" ? item.id : item.doc_id} item={item} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// 2-root tree default view
// ---------------------------------------------------------------------------
function KnowledgeTreeView() {
    return (
        <div className="h-full overflow-y-auto bg-[#0C0C0C] p-6">
            <div className="max-w-2xl mx-auto">
                <h2 className="text-[18px] font-semibold text-[#F5F5F5] mb-1">Knowledge Library</h2>
                <p className="text-[13px] text-[rgba(245,245,245,0.45)] mb-6">Browse documents and pages from your knowledge base.</p>
                <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] p-4 space-y-1">
                    <DocumentsRootNode />
                    <PagesRootNode />
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Integration config map
// ---------------------------------------------------------------------------
type IntegrationConfig = {
    source: "claromentis" | "google-drive";
    rootId?: number;
    connectionType?: "personal" | "agency";
    name: string;
};

function KnowledgeContent() {
    const searchParams = useSearchParams();
    const integration = searchParams.get("integration");

    const integrationConfig: Record<string, IntegrationConfig> = {
        claromentis: { source: "claromentis", name: "Claromentis (Intranet)" },
        "google-drive-personal": { source: "google-drive", connectionType: "personal", name: "My Google Drive" },
        "google-drive-agency": { source: "google-drive", connectionType: "agency", name: "Admin Google Drive" },
    };

    const config = integration ? integrationConfig[integration] : null;
    const router = useRouter();
    const { status: claromentisStatus, loading: claromentisLoading } = useClaromentisStatus();
    const driveConnectionType: "personal" | "agency" =
        config?.source === "google-drive" && config.connectionType ? config.connectionType : "personal";
    const { status: driveStatus, loading: driveLoading } = useGoogleDriveStatus(driveConnectionType);

    if (!config) {
        return <KnowledgeTreeView />;
    }

    if (config.source === "google-drive") {
        if (driveLoading) {
            const driveLabel = config.connectionType === "agency" ? "Admin Google Drive" : "My Google Drive";
            return (
                <div className="h-full flex items-center justify-center bg-[#0C0C0C] text-[rgba(245,245,245,0.5)]">
                    <p className="text-[14px]">Checking {driveLabel} connection…</p>
                </div>
            );
        }

        if (!driveStatus?.connected) {
            const driveLabel = config.connectionType === "agency" ? "Admin Google Drive" : "My Google Drive";
            return (
                <div className="h-full flex items-center justify-center bg-[#0C0C0C] p-6">
                    <div className="w-full max-w-md rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] p-6 text-center space-y-3">
                        <h2 className="text-[18px] font-semibold text-[#F5F5F5]">
                            Connect {driveLabel} to use the Knowledge Library
                        </h2>
                        <p className="text-[13px] text-[rgba(245,245,245,0.6)]">
                            Your {driveLabel.toLowerCase()} integration is not connected. To browse files and folders from
                            Google Drive, connect it in Integrations.
                        </p>
                        <Button
                            type="button"
                            onClick={() => router.push("/dashboard/settings/integrations")}
                            className="mt-2 gap-2"
                        >
                            Go to Integrations
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <LibraryView
                source="google-drive"
                connectionType={config.connectionType}
            />
        );
    }

    // Claromentis: if not connected, explain what's missing and offer a redirect to Integrations
    if (claromentisLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-[#0C0C0C] text-[rgba(245,245,245,0.5)]">
                <p className="text-[14px]">Checking Claromentis connection…</p>
            </div>
        );
    }

    if (claromentisStatus?.status !== "active") {
        return (
            <div className="h-full flex items-center justify-center bg-[#0C0C0C] p-6">
                <div className="w-full max-w-md rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] p-6 text-center space-y-3">
                    <h2 className="text-[18px] font-semibold text-[#F5F5F5]">
                        Connect Claromentis to use the Knowledge Library
                    </h2>
                    <p className="text-[13px] text-[rgba(245,245,245,0.6)]">
                        Your Claromentis account is not connected. To browse documents and pages from your intranet,
                        connect your Claromentis account in Integrations.
                    </p>
                    <Button
                        type="button"
                        onClick={() => router.push("/dashboard/settings/integrations")}
                        className="mt-2 gap-2"
                    >
                        Go to Integrations
                    </Button>
                </div>
            </div>
        );
    }

    return <LibraryView source="claromentis" />;
}

export default function KnowledgePage() {
    return (
        <Suspense fallback={<div className="h-full flex items-center justify-center bg-[#0C0C0C] text-[rgba(245,245,245,0.5)]">Loading...</div>}>
            <KnowledgeContent />
        </Suspense>
    );
}
