"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
    MessageSquare,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    LogOut,
    Plus,
    History,
    User,
    ChevronRight,
    ChevronDown,
    Database,
    // Search
} from "lucide-react";
import Image from "next/image";
import { useUserOptional } from "@/contexts/UserContext";

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
    const userContext = useUserOptional();
    const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
    const [userPopoverOpen, setUserPopoverOpen] = useState(false);
    const [knowledgeExpanded, setKnowledgeExpanded] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const isOnChatPage = pathname.startsWith("/dashboard/chat");

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setUserPopoverOpen(false);
            }
        };
        if (userPopoverOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [userPopoverOpen]);

    useEffect(() => {
        if (isOnChatPage) {
            fetchRecentConversations();
        }
    }, [isOnChatPage, refreshTrigger]);

    const fetchRecentConversations = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            if (!token) return;

            // Using /api/chat/sessions endpoint (Swagger-compliant)
            const response = await fetch(`/api/chat/sessions`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Map session response to conversation format and limit to 5
                const conversations = data.slice(0, 5).map((session: { id: number; title?: string; created_at: string; updated_at: string }) => ({
                    id: session.id,
                    title: session.title || `Chat ${session.id}`,
                    created_at: session.created_at,
                    updated_at: session.updated_at,
                }));
                setRecentConversations(conversations);
            }
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        }
    };

    const handleSignOut = () => {
        // Local-only logout - clear user data and token
        if (userContext?.clearUser) {
            userContext.clearUser();
        } else {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user_data");
        }
        router.push("/login");
    };

    const handleNewChat = () => {
        onSelectConversation?.(null);
    };

    return (
        <aside
            className={[
                "h-full border-r bg-[#0C0C0C]/80 backdrop-blur-xl",
                "transition-all duration-200 ease-out",
                "border-[rgba(255,255,255,0.08)]",
                collapsed ? "w-16" : "w-64",
            ].join(" ")}
        >
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-3 border-b border-[rgba(255,255,255,0.08)]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 shadow-sm">
                            <Image
                                src="/TL_logo.svg"
                                alt="Enable Logo"
                                width={18}
                                height={18}
                                className="opacity-90"
                            />
                        </div>
                        {!collapsed && (
                            <div className="truncate">
                                <p className="text-sm font-semibold leading-none text-[#F5F5F5]">Enable</p>
                                <p className="text-[11px] text-[rgba(245,245,245,0.5)] mt-1">AI Assistant</p>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onToggle}
                        className="h-8 w-8 rounded-md hover:bg-white/8 flex items-center justify-center transition-colors duration-150 text-white/60 hover:text-white/90"
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                    </button>
                </div>

                {/* New Chat Button (only on chat page) */}
                {isOnChatPage && (
                    <div className="p-2.5 border-b border-[rgba(255,255,255,0.08)]">
                        <button
                            onClick={handleNewChat}
                            className={[
                                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg",
                                "bg-white/8 hover:bg-white/12 active:bg-white/16",
                                "transition-all duration-150 ease-out",
                                "border border-white/10 hover:border-white/15",
                                "group",
                                collapsed ? "justify-center" : "",
                            ].join(" ")}
                        >
                            <Plus size={16} className="text-white/70 group-hover:text-white/90 transition-colors" />
                            {!collapsed && <span className="text-sm font-medium text-[#F5F5F5]">New Chat</span>}
                        </button>
                    </div>
                )}

                {/* Recent Conversations (only on chat page) */}
                {isOnChatPage && !collapsed && recentConversations.length > 0 && (
                    <div className="p-2.5 border-b border-[rgba(255,255,255,0.08)] flex-shrink-0">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-[rgba(245,245,245,0.4)] px-2 mb-2">Recent</p>
                        <div className="space-y-0.5">
                            {recentConversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => onSelectConversation?.(conv.id)}
                                    className={[
                                        "w-full text-left px-3 py-2 rounded-md text-[13px] truncate",
                                        "transition-all duration-150 ease-out",
                                        selectedConversationId === conv.id
                                            ? "bg-white/10 text-[#F5F5F5]"
                                            : "text-[rgba(245,245,245,0.7)] hover:bg-white/6 hover:text-[#F5F5F5]",
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
                            className="w-full flex items-center gap-2 px-3 py-2 mt-2 rounded-md text-[13px] text-[rgba(245,245,245,0.5)] hover:text-[rgba(245,245,245,0.8)] hover:bg-white/5 transition-all duration-150"
                        >
                            <History size={14} />
                            <span>View all history</span>
                        </button>
                    </div>
                )}

                {/* Nav */}
                <nav className="p-2.5 space-y-1 flex-1 overflow-y-auto">
                    <NavLink
                        href="/dashboard/chat"
                        collapsed={collapsed}
                        icon={<MessageSquare size={18} />}
                        label="Chat"
                        active={pathname.startsWith("/dashboard/chat")}
                    />

                    {/* Knowledge Section - Expandable */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setKnowledgeExpanded(!knowledgeExpanded)}
                            className={[
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px]",
                                "transition-all duration-150 ease-out",
                                "text-[rgba(245,245,245,0.65)] hover:bg-white/6 hover:text-[#F5F5F5]",
                            ].join(" ")}
                        >
                            <span className="shrink-0 text-white/50">
                                <Database size={18} />
                            </span>
                            {!collapsed && (
                                <>
                                    <span className="truncate flex-1 text-left">Knowledge</span>
                                    {knowledgeExpanded ? (
                                        <ChevronDown size={14} className="text-[rgba(245,245,245,0.4)]" />
                                    ) : (
                                        <ChevronRight size={14} className="text-[rgba(245,245,245,0.4)]" />
                                    )}
                                </>
                            )}
                        </button>

                        {/* Integrations list when expanded */}
                        {knowledgeExpanded && !collapsed && (
                            <div className="ml-4 mt-1 space-y-0.5 border-l border-[rgba(255,255,255,0.08)] pl-3">
                                <IntegrationItem
                                    name="Claromentis (Intranet)"
                                    status="active"
                                    onClick={() => router.push("/dashboard/knowledge?integration=claromentis")}
                                    active={pathname.startsWith("/dashboard/knowledge") && pathname.includes("claromentis")}
                                />
                                <IntegrationItem
                                    name="Virtuoso"
                                    status="coming_soon"
                                />
                                <IntegrationItem
                                    name="Axus"
                                    status="coming_soon"
                                />
                                <IntegrationItem
                                    name="Partner Portals"
                                    status="coming_soon"
                                />
                            </div>
                        )}
                    </div>

                    {/* <NavLink
                        href="/dashboard/search"
                        collapsed={collapsed}
                        icon={<Search size={18} />}
                        label="Search"
                        active={pathname.startsWith("/dashboard/search")}
                    /> */}
                </nav>

                {/* Footer - User Popover */}
                <div className="mt-auto p-2.5 border-t border-[rgba(255,255,255,0.08)] relative" ref={popoverRef}>
                    <button
                        onClick={() => setUserPopoverOpen(!userPopoverOpen)}
                        className={[
                            "w-full rounded-lg p-2.5",
                            "bg-white/4 hover:bg-white/8 active:bg-white/10",
                            "transition-all duration-150 ease-out",
                            "border border-transparent hover:border-white/8",
                            "cursor-pointer text-left group",
                        ].join(" ")}
                        title="User menu"
                    >
                        {!collapsed ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                                        <User size={14} className="text-white/60" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] text-[rgba(245,245,245,0.5)]">Signed in</p>
                                        <p className="text-[13px] font-medium text-[#F5F5F5] truncate">
                                            {userContext?.user?.username || userContext?.user?.email?.split("@")[0] || "User"}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight
                                    size={14}
                                    className={[
                                        "text-[rgba(245,245,245,0.4)] group-hover:text-[rgba(245,245,245,0.7)] transition-all",
                                        userPopoverOpen ? "rotate-90" : ""
                                    ].join(" ")}
                                />
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <User size={16} className="text-[rgba(245,245,245,0.4)] group-hover:text-[rgba(245,245,245,0.7)] transition-colors" />
                            </div>
                        )}
                    </button>

                    {/* User Popover Menu */}
                    {userPopoverOpen && (
                        <div className={[
                            "absolute bottom-full mb-2 rounded-lg",
                            "bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)]",
                            "shadow-xl overflow-hidden",
                            "z-50",
                            collapsed ? "left-1/2 -translate-x-1/2 w-40" : "left-2.5 right-2.5",
                        ].join(" ")}>
                            <Link
                                href="/dashboard/settings"
                                onClick={() => setUserPopoverOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[rgba(245,245,245,0.8)] hover:bg-white/8 hover:text-[#F5F5F5] transition-colors"
                            >
                                <Settings size={14} className="text-[rgba(245,245,245,0.5)]" />
                                <span>Settings</span>
                            </Link>
                            <div className="h-px bg-[rgba(255,255,255,0.08)]" />
                            <button
                                onClick={() => {
                                    setUserPopoverOpen(false);
                                    handleSignOut();
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[rgba(245,245,245,0.8)] hover:bg-white/8 hover:text-[#F5F5F5] transition-colors"
                            >
                                <LogOut size={14} className="text-[rgba(245,245,245,0.5)]" />
                                <span>Sign out</span>
                            </button>
                        </div>
                    )}
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
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px]",
                "transition-all duration-150 ease-out",
                active
                    ? "bg-white/10 text-[#F5F5F5] font-medium"
                    : "text-[rgba(245,245,245,0.65)] hover:bg-white/6 hover:text-[#F5F5F5]",
            ].join(" ")}
        >
            <span className={`shrink-0 ${active ? 'text-white/90' : 'text-white/50'}`}>{icon}</span>
            {!collapsed && <span className="truncate">{label}</span>}
        </Link>
    );
}

function IntegrationItem({
    name,
    status,
    onClick,
    active,
}: {
    name: string;
    status: "active" | "coming_soon";
    onClick?: () => void;
    active?: boolean;
}) {
    const isClickable = status === "active" && onClick;

    return (
        <button
            type="button"
            onClick={isClickable ? onClick : undefined}
            disabled={!isClickable}
            className={[
                "w-full flex items-center justify-between py-1.5 px-2 rounded-md text-[12px]",
                "transition-all duration-150",
                isClickable ? "cursor-pointer hover:bg-white/6" : "cursor-default",
                active ? "bg-white/8" : "",
            ].join(" ")}
        >
            <span className={status === "active" ? "text-[rgba(245,245,245,0.8)]" : "text-[rgba(245,245,245,0.45)]"}>
                {name}
            </span>
            {status === "active" ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(122,200,137,0.15)] text-[#7AC889]">
                    Active
                </span>
            ) : (
                <span className="text-[10px] text-[rgba(245,245,245,0.35)]">
                    Coming soon
                </span>
            )}
        </button>
    );
}
