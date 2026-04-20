"use client";

import { useCallback, useEffect, useState } from "react";
import { History, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatContext } from "@/contexts/ChatContext";
import ChatPanel from "@/components/dashboard/ChatPanel";
import { peekStarterChipsForChat, clearStarterChipsForChat } from "@/lib/onboardingState";
import HistoryDrawer from "@/components/dashboard/HistoryDrawer";
import type { Conversation } from "@/components/dashboard/Sidebar";
import { groupConversationsByDate } from "@/components/dashboard/claireConversationsUtils";
import { ConversationGroup } from "@/components/dashboard/HistoryDrawer";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { cn } from "@/lib/utils";

type HubTab = "chat" | "conversations";

export default function ClaireHubPage() {
    const {
        selectedConversationId,
        setSelectedConversationId,
        isHistoryOpen,
        openHistory,
        closeHistory,
        triggerRefresh,
        startNewClaireConversation,
    } = useChatContext();

    const [starterChips, setStarterChips] = useState<string[] | null>(null);

    useEffect(() => {
        const p = peekStarterChipsForChat();
        if (p?.length) setStarterChips(p);
    }, []);

    const [hubTab, setHubTab] = useState<HubTab>("chat");
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const showLoader = useDelayedLoading(isLoading);

    const fetchConversations = useCallback(async (search?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("auth_token");
            if (!token) {
                setIsLoading(false);
                return;
            }

            const response = await fetch(`/api/chat/sessions`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                let list = data.map(
                    (session: { id: number; title?: string; created_at: string; updated_at: string }) => ({
                        id: session.id,
                        title: session.title || `Chat ${session.id}`,
                        created_at: session.created_at,
                        updated_at: session.updated_at,
                    }),
                );

                if (search) {
                    const searchLower = search.toLowerCase();
                    list = list.filter((conv: Conversation) =>
                        conv.title.toLowerCase().includes(searchLower),
                    );
                }

                setConversations(list);
            }
        } catch (err) {
            console.error("Failed to fetch sessions:", err);
            setError("Failed to load conversations. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (hubTab === "conversations") {
            fetchConversations();
        }
    }, [hubTab, fetchConversations]);

    useEffect(() => {
        const t = setTimeout(() => {
            if (hubTab === "conversations") {
                fetchConversations(searchQuery || undefined);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery, hubTab, fetchConversations]);

    const handleConversationCreated = (id: number) => {
        setSelectedConversationId(id);
        triggerRefresh();
        setHubTab("chat");
    };

    const handleSelectFromDrawer = (id: number) => {
        setSelectedConversationId(id);
        setHubTab("chat");
    };

    const handleSelectFromTab = (id: number) => {
        setSelectedConversationId(id);
        setHubTab("chat");
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        alert("Session deletion is not available yet.");
        console.log("Delete requested for session:", id);
    };

    const grouped = groupConversationsByDate(conversations);

    return (
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
            <header className="shrink-0 border-b border-border px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div
                        className="flex rounded-lg border border-border bg-card/40 p-0.5"
                        role="tablist"
                        aria-label="Claire sections"
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={hubTab === "chat"}
                            className={cn(
                                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                                hubTab === "chat"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                            onClick={() => setHubTab("chat")}
                        >
                            Chat
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={hubTab === "conversations"}
                            className={cn(
                                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                                hubTab === "conversations"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                            onClick={() => setHubTab("conversations")}
                        >
                            Conversations
                        </button>
                    </div>

                    <div className="ml-auto flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-muted-foreground"
                            onClick={startNewClaireConversation}
                        >
                            <Plus className="h-4 w-4" aria-hidden />
                            New conversation
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={openHistory}
                            aria-label="Open full conversation history"
                            title="History"
                        >
                            <History className="h-4 w-4" aria-hidden />
                        </Button>
                    </div>
                </div>
            </header>

            {hubTab === "chat" ? (
                <div className="min-h-0 flex-1 overflow-hidden">
                    <ChatPanel
                        conversationId={selectedConversationId}
                        onConversationCreated={handleConversationCreated}
                        onBackToHome={startNewClaireConversation}
                        assistantName="Claire"
                        assistantSubtitle="Enable VICs AI"
                        starterSuggestionChips={starterChips}
                        onStarterSuggestionsConsumed={() => {
                            clearStarterChipsForChat();
                            setStarterChips(null);
                        }}
                    />
                </div>
            ) : (
                <div className="min-h-0 flex-1 overflow-hidden flex flex-col">
                    <div className="border-b border-border p-4">
                        <div className="relative max-w-md">
                            <Search
                                size={16}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />
                            <Input
                                type="text"
                                placeholder="Search conversations…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 rounded-xl bg-card border-border"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {error ? (
                            <p className="text-sm text-muted-foreground">{error}</p>
                        ) : showLoader ? (
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        ) : conversations.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No conversations found.</p>
                        ) : (
                            <div className="space-y-6 max-w-2xl">
                                {grouped.today.length > 0 && (
                                    <ConversationGroup
                                        title="Today"
                                        conversations={grouped.today}
                                        selectedId={selectedConversationId}
                                        onSelect={handleSelectFromTab}
                                        onDelete={handleDelete}
                                    />
                                )}
                                {grouped.yesterday.length > 0 && (
                                    <ConversationGroup
                                        title="Yesterday"
                                        conversations={grouped.yesterday}
                                        selectedId={selectedConversationId}
                                        onSelect={handleSelectFromTab}
                                        onDelete={handleDelete}
                                    />
                                )}
                                {grouped.lastWeek.length > 0 && (
                                    <ConversationGroup
                                        title="Last 7 days"
                                        conversations={grouped.lastWeek}
                                        selectedId={selectedConversationId}
                                        onSelect={handleSelectFromTab}
                                        onDelete={handleDelete}
                                    />
                                )}
                                {grouped.older.length > 0 && (
                                    <ConversationGroup
                                        title="Older"
                                        conversations={grouped.older}
                                        selectedId={selectedConversationId}
                                        onSelect={handleSelectFromTab}
                                        onDelete={handleDelete}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <HistoryDrawer
                isOpen={isHistoryOpen}
                onClose={closeHistory}
                onSelectConversation={handleSelectFromDrawer}
                selectedConversationId={selectedConversationId}
            />
        </div>
    );
}
