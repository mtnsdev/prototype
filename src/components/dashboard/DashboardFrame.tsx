"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import { ChatProvider, useChatContextOptional } from "@/contexts/ChatContext";

function DashboardContent({ children }: { children: React.ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const chatContext = useChatContextOptional();

    return (
        <div className="min-h-screen bg-[#0C0C0C] text-[#F5F5F5]">
            <div className="h-screen flex">
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed((v) => !v)}
                    selectedConversationId={chatContext?.selectedConversationId}
                    onSelectConversation={chatContext?.setSelectedConversationId}
                    onOpenHistory={chatContext?.openHistory}
                    refreshTrigger={chatContext?.refreshTrigger}
                />

                {/* Everything to the right of the sidebar is route-specific */}
                <div className="flex-1 min-w-0">{children}</div>
            </div>
        </div>
    );
}

export default function DashboardFrame({ children }: { children: React.ReactNode }) {
    return (
        <ChatProvider>
            <DashboardContent>{children}</DashboardContent>
        </ChatProvider>
    );
}
