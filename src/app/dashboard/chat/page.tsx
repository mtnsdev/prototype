"use client";

import ChatPanel from "@/components/dashboard/ChatPanel";
import HistoryDrawer from "@/components/dashboard/HistoryDrawer";
import { useChatContext } from "@/contexts/ChatContext";

export default function ChatPage() {
    const {
        selectedConversationId,
        setSelectedConversationId,
        isHistoryOpen,
        closeHistory,
        triggerRefresh,
    } = useChatContext();

    const handleConversationCreated = (id: number) => {
        setSelectedConversationId(id);
        triggerRefresh();
    };

    const handleSelectConversation = (id: number) => {
        setSelectedConversationId(id);
    };

    const handleBackToHome = () => {
        setSelectedConversationId(null);
    };

    return (
        <>
            <div className="h-full flex flex-col overflow-hidden">
                <ChatPanel
                    conversationId={selectedConversationId}
                    onConversationCreated={handleConversationCreated}
                    onBackToHome={handleBackToHome}
                />
            </div>

            {/* History Drawer */}
            <HistoryDrawer
                isOpen={isHistoryOpen}
                onClose={closeHistory}
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversationId}
            />
        </>
    );
}
