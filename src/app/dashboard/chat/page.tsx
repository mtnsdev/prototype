"use client";

import ChatPanel from "@/components/dashboard/ChatPanel";
import RightPlaceholder from "@/components/dashboard/RightPlaceHolder";
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

    return (
        <>
            <div className="h-full flex flex-col overflow-hidden">
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 min-h-0 overflow-hidden">
                    {/* LEFT: chat column (2/3 of remaining space) */}
                    <div className="lg:col-span-2 border-r border-white/10 flex flex-col overflow-hidden">
                        <ChatPanel
                            conversationId={selectedConversationId}
                            onConversationCreated={handleConversationCreated}
                        />
                    </div>

                    {/* RIGHT: placeholder (1/3 of remaining space) */}
                    <div className="lg:col-span-1 overflow-hidden">
                        <RightPlaceholder />
                    </div>
                </div>
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
