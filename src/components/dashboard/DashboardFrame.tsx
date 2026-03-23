"use client";

import { Suspense, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import { ChatProvider, useChatContextOptional } from "@/contexts/ChatContext";
import { UserProvider } from "@/contexts/UserContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { KnowledgeVaultEmailProvider } from "@/contexts/KnowledgeVaultEmailContext";
import ReportIssueLauncher from "@/components/ui/ReportIssueLauncher";

function SidebarFallback() {
    return (
        <div className="w-[56px] shrink-0 border-r border-[rgba(255,255,255,0.08)] bg-[#0C0C0C] flex flex-col items-center py-3 gap-2" aria-hidden />
    );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const chatContext = useChatContextOptional();

    return (
        <div className="min-h-screen bg-[#0C0C0C] text-[#F5F5F5]">
            <div className="h-screen flex">
                <Suspense fallback={<SidebarFallback />}>
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed((v) => !v)}
                    selectedConversationId={chatContext?.selectedConversationId}
                    onSelectConversation={chatContext?.setSelectedConversationId}
                    onOpenHistory={chatContext?.openHistory}
                    refreshTrigger={chatContext?.refreshTrigger}
                />
                </Suspense>

                {/* Everything to the right of the sidebar is route-specific */}
                <div className="flex-1 min-w-0">{children}</div>
                <ReportIssueLauncher />
            </div>
        </div>
    );
}

export default function DashboardFrame({ children }: { children: React.ReactNode }) {
    return (
        <UserProvider>
            <KnowledgeVaultEmailProvider>
                <ChatProvider>
                    <ToastProvider>
                        <DashboardContent>{children}</DashboardContent>
                    </ToastProvider>
                </ChatProvider>
            </KnowledgeVaultEmailProvider>
        </UserProvider>
    );
}
