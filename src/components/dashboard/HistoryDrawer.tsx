"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Search, MessageSquare, Trash2, Loader2, Clock, AlertCircle } from "lucide-react";
import type { Conversation } from "./Sidebar";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSelectConversation: (id: number) => void;
    selectedConversationId?: number | null;
};

type GroupedConversations = {
    today: Conversation[];
    yesterday: Conversation[];
    lastWeek: Conversation[];
    older: Conversation[];
};

function groupConversationsByDate(conversations: Conversation[]): GroupedConversations {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: GroupedConversations = {
        today: [],
        yesterday: [],
        lastWeek: [],
        older: [],
    };

    conversations.forEach((conv) => {
        const convDate = new Date(conv.updated_at);

        if (convDate >= today) {
            groups.today.push(conv);
        } else if (convDate >= yesterday) {
            groups.yesterday.push(conv);
        } else if (convDate >= lastWeek) {
            groups.lastWeek.push(conv);
        } else {
            groups.older.push(conv);
        }
    });

    return groups;
}

export default function HistoryDrawer({
    isOpen,
    onClose,
    onSelectConversation,
    selectedConversationId,
}: Props) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Delayed loading to prevent flickering
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

            // Using /api/chat/sessions endpoint (Swagger-compliant)
            // Note: Backend doesn't support search param, so we filter client-side
            const response = await fetch(`api/chat/sessions`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Map session response to conversation format
                let conversations = data.map((session: { id: number; title?: string; created_at: string; updated_at: string }) => ({
                    id: session.id,
                    title: session.title || `Chat ${session.id}`,
                    created_at: session.created_at,
                    updated_at: session.updated_at,
                }));

                // Client-side search filtering
                if (search) {
                    const searchLower = search.toLowerCase();
                    conversations = conversations.filter((conv: Conversation) =>
                        conv.title.toLowerCase().includes(searchLower)
                    );
                }

                setConversations(conversations);
            }
        } catch (err) {
            console.error("Failed to fetch sessions:", err);
            setError("Failed to load conversations. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchConversations();
        }
    }, [isOpen, fetchConversations]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (isOpen) {
                fetchConversations(searchQuery || undefined);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, isOpen, fetchConversations]);

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        // Note: Backend doesn't support session deletion endpoint yet
        // Show a message to the user
        alert("Session deletion is not available yet.");
        console.log("Delete requested for session:", id);
    };

    const handleSelect = (id: number) => {
        onSelectConversation(id);
        onClose();
    };

    const grouped = groupConversationsByDate(conversations);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-200"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-[400px] max-w-full bg-[#0C0C0C] border-l border-[rgba(255,255,255,0.08)] z-50 flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.08)]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center border border-white/10">
                            <Clock size={18} className="text-[rgba(245,245,245,0.6)]" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-semibold text-[#F5F5F5]">Chat History</h2>
                            <p className="text-[11px] text-[rgba(245,245,245,0.45)]">
                                {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/8 transition-colors duration-150 text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5]"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.35)]"
                        />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={[
                                "w-full pl-10 pr-4 py-2.5 rounded-xl text-[14px]",
                                "bg-[#161616] text-[#F5F5F5] placeholder-[rgba(245,245,245,0.35)]",
                                "border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]",
                                "focus:outline-none focus:border-[rgba(255,255,255,0.2)] focus:ring-1 focus:ring-[rgba(255,255,255,0.08)]",
                                "transition-all duration-150",
                            ].join(" ")}
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-[rgba(200,122,122,0.1)] flex items-center justify-center mb-4">
                                <AlertCircle size={24} className="text-[#C87A7A]" />
                            </div>
                            <p className="text-[14px] text-[rgba(245,245,245,0.7)]">{error}</p>
                            <button
                                onClick={() => fetchConversations(searchQuery || undefined)}
                                className="mt-4 px-4 py-2 text-[13px] rounded-lg bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] text-[rgba(245,245,245,0.7)] transition-colors"
                            >
                                Try again
                            </button>
                        </div>
                    ) : showLoader ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 size={24} className="animate-spin text-[rgba(245,245,245,0.4)]" />
                            <span className="text-[13px] text-[rgba(245,245,245,0.5)] mt-3">Loading history...</span>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-[rgba(255,255,255,0.04)] flex items-center justify-center mb-4">
                                <MessageSquare size={24} className="text-[rgba(245,245,245,0.25)]" />
                            </div>
                            <p className="text-[14px] text-[rgba(245,245,245,0.5)]">No conversations found</p>
                            <p className="text-[12px] text-[rgba(245,245,245,0.35)] mt-1">
                                {searchQuery ? "Try a different search term" : "Start a new chat to get started"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {grouped.today.length > 0 && (
                                <ConversationGroup
                                    title="Today"
                                    conversations={grouped.today}
                                    selectedId={selectedConversationId}
                                    onSelect={handleSelect}
                                    onDelete={handleDelete}
                                />
                            )}
                            {grouped.yesterday.length > 0 && (
                                <ConversationGroup
                                    title="Yesterday"
                                    conversations={grouped.yesterday}
                                    selectedId={selectedConversationId}
                                    onSelect={handleSelect}
                                    onDelete={handleDelete}
                                />
                            )}
                            {grouped.lastWeek.length > 0 && (
                                <ConversationGroup
                                    title="Last 7 days"
                                    conversations={grouped.lastWeek}
                                    selectedId={selectedConversationId}
                                    onSelect={handleSelect}
                                    onDelete={handleDelete}
                                />
                            )}
                            {grouped.older.length > 0 && (
                                <ConversationGroup
                                    title="Older"
                                    conversations={grouped.older}
                                    selectedId={selectedConversationId}
                                    onSelect={handleSelect}
                                    onDelete={handleDelete}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function ConversationGroup({
    title,
    conversations,
    selectedId,
    onSelect,
    onDelete,
}: {
    title: string;
    conversations: Conversation[];
    selectedId?: number | null;
    onSelect: (id: number) => void;
    onDelete: (e: React.MouseEvent, id: number) => void;
}) {
    return (
        <div>
            <h3 className="text-[11px] font-medium text-[rgba(245,245,245,0.4)] uppercase tracking-wider mb-2 px-1">
                {title}
            </h3>
            <div className="space-y-0.5">
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onSelect(conv.id);
                            }
                        }}
                        className={[
                            "w-full flex items-center justify-between group cursor-pointer",
                            "px-3 py-2.5 rounded-xl text-left",
                            "transition-all duration-150",
                            selectedId === conv.id
                                ? "bg-white/10 border border-[rgba(255,255,255,0.12)]"
                                : "hover:bg-white/6 border border-transparent",
                        ].join(" ")}
                    >
                        <span className={[
                            "text-[13px] truncate flex-1 mr-3",
                            selectedId === conv.id ? "text-[#F5F5F5] font-medium" : "text-[rgba(245,245,245,0.75)]",
                        ].join(" ")}>
                            {conv.title}
                        </span>
                        <button
                            onClick={(e) => onDelete(e, conv.id)}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[rgba(200,122,122,0.15)] transition-all duration-150"
                            title="Delete conversation"
                        >
                            <Trash2 size={14} className="text-[rgba(245,245,245,0.4)] hover:text-[#C87A7A]" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
