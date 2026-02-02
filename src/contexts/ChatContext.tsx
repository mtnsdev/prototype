"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ChatContextType = {
    selectedConversationId: number | null;
    setSelectedConversationId: (id: number | null) => void;
    isHistoryOpen: boolean;
    openHistory: () => void;
    closeHistory: () => void;
    refreshTrigger: number;
    triggerRefresh: () => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const openHistory = useCallback(() => setIsHistoryOpen(true), []);
    const closeHistory = useCallback(() => setIsHistoryOpen(false), []);
    const triggerRefresh = useCallback(() => setRefreshTrigger((n) => n + 1), []);

    return (
        <ChatContext.Provider
            value={{
                selectedConversationId,
                setSelectedConversationId,
                isHistoryOpen,
                openHistory,
                closeHistory,
                refreshTrigger,
                triggerRefresh,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChatContext must be used within a ChatProvider");
    }
    return context;
}

// Optional hook that returns null instead of throwing if used outside provider
export function useChatContextOptional() {
    return useContext(ChatContext);
}
