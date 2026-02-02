"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Search, MessageSquare, Trash2 } from "lucide-react";
import type { Conversation } from "./Sidebar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

    const fetchConversations = useCallback(async (search?: string) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            if (!token) return;

            const params = new URLSearchParams({ limit: "100" });
            if (search) {
                params.append("search", search);
            }

            const response = await fetch(`${API_URL}/api/chat/conversations?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setConversations(data);
            }
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
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

        if (!confirm("Are you sure you want to delete this conversation?")) {
            return;
        }

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/api/chat/conversations/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setConversations((prev) => prev.filter((c) => c.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete conversation:", error);
        }
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
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-96 max-w-full bg-gray-900 border-l border-white/10 z-50 flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold">Chat History</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-md hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-white/10">
                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
                        />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30"
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-8 text-white/50">
                            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No conversations found</p>
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
            <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                {title}
            </h3>
            <div className="space-y-1">
                {conversations.map((conv) => (
                    <button
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        className={[
                            "w-full flex items-center justify-between group",
                            "px-3 py-2 rounded-lg text-left",
                            "hover:bg-white/10 transition-colors",
                            selectedId === conv.id ? "bg-white/10" : "",
                        ].join(" ")}
                    >
                        <span className="text-sm truncate flex-1 mr-2">{conv.title}</span>
                        <button
                            onClick={(e) => onDelete(e, conv.id)}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-opacity"
                            title="Delete conversation"
                        >
                            <Trash2 size={14} className="text-white/50" />
                        </button>
                    </button>
                ))}
            </div>
        </div>
    );
}
