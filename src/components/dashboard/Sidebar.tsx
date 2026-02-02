"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    LayoutGrid,
    MessageSquare,
    Book,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    LogOut,
    Plus,
    History,
    // Search
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Conversation = {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
};

type Props = {
    collapsed: boolean;
    onToggle: () => void;
    // Chat-specific props
    selectedConversationId?: number | null;
    onSelectConversation?: (id: number | null) => void;
    onOpenHistory?: () => void;
    refreshTrigger?: number;
};

export default function Sidebar({
    collapsed,
    onToggle,
    selectedConversationId,
    onSelectConversation,
    onOpenHistory,
    refreshTrigger,
}: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
    const isOnChatPage = pathname.startsWith("/dashboard/chat");

    useEffect(() => {
        if (isOnChatPage) {
            fetchRecentConversations();
        }
    }, [isOnChatPage, refreshTrigger]);

    const fetchRecentConversations = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            if (!token) return;

            const response = await fetch(`${API_URL}/api/chat/conversations?limit=5`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setRecentConversations(data);
            }
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        }
    };

    const handleSignOut = async () => {
        try {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
                },
            });
        } catch {
            // Ignore errors - we're logging out anyway
        }
        localStorage.removeItem("auth_token");
        router.push("/login");
    };

    const handleNewChat = () => {
        onSelectConversation?.(null);
    };

    return (
        <aside
            className={[
                "h-full border-r border-white/10 bg-black/60 backdrop-blur",
                "transition-all duration-200",
                collapsed ? "w-16" : "w-64",
            ].join(" ")}
        >
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <LayoutGrid size={18} />
                        </div>
                        {!collapsed && (
                            <div className="truncate">
                                <p className="text-sm font-semibold leading-none">Enable</p>
                                <p className="text-xs text-white/60 mt-1">AI Assistant</p>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onToggle}
                        className="h-9 w-9 rounded-md hover:bg-white/10 flex items-center justify-center"
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                </div>

                {/* New Chat Button (only on chat page) */}
                {isOnChatPage && (
                    <div className="p-2 border-b border-white/10">
                        <button
                            onClick={handleNewChat}
                            className={[
                                "w-full flex items-center gap-2 px-3 py-2 rounded-md",
                                "bg-white/10 hover:bg-white/20 transition-colors",
                                collapsed ? "justify-center" : "",
                            ].join(" ")}
                        >
                            <Plus size={18} />
                            {!collapsed && <span className="text-sm font-medium">New Chat</span>}
                        </button>
                    </div>
                )}

                {/* Recent Conversations (only on chat page) */}
                {isOnChatPage && !collapsed && recentConversations.length > 0 && (
                    <div className="p-2 border-b border-white/10 flex-shrink-0">
                        <p className="text-xs text-white/50 px-2 mb-2">Recent</p>
                        <div className="space-y-1">
                            {recentConversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => onSelectConversation?.(conv.id)}
                                    className={[
                                        "w-full text-left px-3 py-2 rounded-md text-sm truncate",
                                        "hover:bg-white/10 transition-colors",
                                        selectedConversationId === conv.id ? "bg-white/10" : "",
                                    ].join(" ")}
                                    title={conv.title}
                                >
                                    {conv.title}
                                </button>
                            ))}
                        </div>
                        {/* History Button */}
                        <button
                            onClick={onOpenHistory}
                            className="w-full flex items-center gap-2 px-3 py-2 mt-2 rounded-md text-sm text-white/70 hover:bg-white/10 transition-colors"
                        >
                            <History size={16} />
                            <span>View all history</span>
                        </button>
                    </div>
                )}

                {/* Nav */}
                <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
                    <NavLink
                        href="/dashboard/chat"
                        collapsed={collapsed}
                        icon={<MessageSquare size={18} />}
                        label="Chat"
                        active={pathname.startsWith("/dashboard/chat")}
                    />

                    <NavLink
                        href="/dashboard/library"
                        collapsed={collapsed}
                        icon={<Book size={18} />}
                        label="Library"
                        active={pathname.startsWith("/dashboard/library")}
                    />

                    {/* <NavLink
                        href="/dashboard/search"
                        collapsed={collapsed}
                        icon={<Search size={18} />}
                        label="Search"
                        active={pathname.startsWith("/dashboard/search")}
                    /> */}

                    <NavLink
                        href="/dashboard/settings"
                        collapsed={collapsed}
                        icon={<Settings size={18} />}
                        label="Settings"
                        active={pathname.startsWith("/dashboard/settings")}
                    />
                </nav>

                {/* Footer */}
                <div className="mt-auto p-2 border-t border-white/10">
                    <button
                        onClick={handleSignOut}
                        className="w-full rounded-md bg-white/5 p-2 hover:bg-white/10 transition-colors cursor-pointer text-left"
                        title="Sign out"
                    >
                        {!collapsed ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-white/70">Signed in</p>
                                    <p className="text-sm font-medium truncate">User</p>
                                </div>
                                <LogOut size={16} className="text-white/50" />
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <LogOut size={16} className="text-white/50" />
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </aside>
    );
}

function NavLink({
    href,
    collapsed,
    icon,
    label,
    active,
}: {
    href: string;
    collapsed: boolean;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
}) {
    return (
        <Link
            href={href}
            className={[
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                active ? "bg-white/10" : "hover:bg-white/10",
            ].join(" ")}
        >
            <span className="shrink-0">{icon}</span>
            {!collapsed && <span className="truncate">{label}</span>}
        </Link>
    );
}
