"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LibraryView from "@/components/library/LibraryView";
import { Database } from "lucide-react";

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
        claromentis: { source: "claromentis", rootId: 0, name: "Claromentis (Intranet)" },
        "google-drive-personal": { source: "google-drive", connectionType: "personal", name: "My Google Drive" },
        "google-drive-agency": { source: "google-drive", connectionType: "agency", name: "Agency Google Drive" },
    };

    const config = integration ? integrationConfig[integration] : null;

    if (!config) {
        return (
            <div className="h-full flex items-center justify-center bg-[#0C0C0C] p-6">
                <div className="w-full max-w-md rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] p-8 text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center mb-5 border border-white/10 mx-auto">
                        <Database size={22} className="text-[rgba(245,245,245,0.6)]" />
                    </div>
                    <h2 className="text-[18px] font-semibold text-[#F5F5F5]">Knowledge Library</h2>
                    <p className="mt-2 text-[14px] text-[rgba(245,245,245,0.5)] leading-relaxed">
                        Select an integration from the sidebar to browse its content.
                    </p>
                </div>
            </div>
        );
    }

    if (config.source === "google-drive") {
        return (
            <LibraryView
                source="google-drive"
                connectionType={config.connectionType}
            />
        );
    }

    return <LibraryView initialRootId={config.rootId} source="claromentis" />;
}

export default function KnowledgePage() {
    return (
        <Suspense fallback={<div className="h-full flex items-center justify-center bg-[#0C0C0C] text-[rgba(245,245,245,0.5)]">Loading...</div>}>
            <KnowledgeContent />
        </Suspense>
    );
}
