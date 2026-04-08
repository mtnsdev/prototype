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
  /** Persistent Claire panel (FAB / dock) */
  claireOpen: boolean;
  claireFullscreen: boolean;
  openClaire: () => void;
  closeClaire: () => void;
  toggleClaire: () => void;
  setClaireFullscreen: (value: boolean) => void;
  toggleClaireFullscreen: () => void;
  startNewClaireConversation: () => void;
  /** Workspace dock assistant slide-over */
  assistantOpen: boolean;
  setAssistantOpen: (open: boolean) => void;
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [claireOpen, setClaireOpen] = useState(false);
  const [claireFullscreen, setClaireFullscreen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const openHistory = useCallback(() => setIsHistoryOpen(true), []);
  const closeHistory = useCallback(() => setIsHistoryOpen(false), []);
  const triggerRefresh = useCallback(() => setRefreshTrigger((n) => n + 1), []);
  const openAssistant = useCallback(() => setAssistantOpen(true), []);
  const closeAssistant = useCallback(() => setAssistantOpen(false), []);
  const toggleAssistant = useCallback(() => setAssistantOpen((v) => !v), []);

  const openClaire = useCallback(() => setClaireOpen(true), []);
  const closeClaire = useCallback(() => {
    setClaireOpen(false);
    setClaireFullscreen(false);
  }, []);
  const toggleClaire = useCallback(() => setClaireOpen((o) => !o), []);

  const toggleClaireFullscreen = useCallback(() => setClaireFullscreen((f) => !f), []);

  const startNewClaireConversation = useCallback(() => {
    setSelectedConversationId(null);
    triggerRefresh();
  }, [triggerRefresh]);

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
        claireOpen,
        claireFullscreen,
        openClaire,
        closeClaire,
        toggleClaire,
        setClaireFullscreen,
        toggleClaireFullscreen,
        startNewClaireConversation,
        assistantOpen,
        setAssistantOpen,
        openAssistant,
        closeAssistant,
        toggleAssistant,
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

export function useChatContextOptional() {
  return useContext(ChatContext);
}
