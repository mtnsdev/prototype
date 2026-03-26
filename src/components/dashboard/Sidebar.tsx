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
    Users,
    Building2,
    Route,
    ChevronRight,
    LayoutDashboard,
    BookOpen,
    BarChart3,
    Zap,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useUserOptional } from "@/contexts/UserContext";
import { IS_PREVIEW_MODE } from "@/config/preview";
import { cn } from "@/lib/utils";
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
        if (!isOnChatPage) return;
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        let cancelled = false;
        fetch(`/api/chat/sessions`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (cancelled || !data) return;
                const conversations = data.slice(0, 5).map((session: { id: number; title?: string; created_at: string; updated_at: string }) => ({
                    id: session.id,
                    title: session.title || `Chat ${session.id}`,
                    created_at: session.created_at,
                    updated_at: session.updated_at,
                }));
                setRecentConversations(conversations);
            })
            .catch((err) => {
                if (!cancelled) console.error("Failed to fetch sessions:", err);
            });
        return () => {
            cancelled = true;
        };
    }, [isOnChatPage, refreshTrigger]);

    const handleSignOut = () => {
        // Local-only logout - clear user data and token
        if (userContext?.clearUser) {
            userContext.clearUser();
        } else {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user_data");
            document.cookie = "auth_token=; Path=/; Max-Age=0; SameSite=Lax";
        }
        router.push("/login");
    };

    const handleNewChat = () => {
        if (!pathname.startsWith("/dashboard/chat")) {
            router.push("/dashboard/chat");
        }
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
                <div
                    className={[
                        "flex min-h-14 border-b border-[rgba(255,255,255,0.08)]",
                        collapsed
                            ? "flex-col items-center gap-2 px-2 py-3"
                            : "items-center justify-between px-3 py-3",
                    ].join(" ")}
                >
                    {collapsed ? (
                        <>
                            <div className="h-8 w-8 shrink-0 rounded-md bg-white/5 flex items-center justify-center border border-white/10">
                                <Image
                                    src="/TL_logo.svg"
                                    alt="Travel Lustre Logo"
                                    width={18}
                                    height={18}
                                    className="opacity-90"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={onToggle}
                                className="h-8 w-8 shrink-0 rounded-md hover:bg-white/8 text-white/60 hover:text-white/90"
                                aria-label="Expand sidebar"
                            >
                                <PanelLeftOpen size={16} />
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-8 w-8 shrink-0 rounded-md bg-white/5 flex items-center justify-center border border-white/10">
                                    <Image
                                        src="/TL_logo.svg"
                                        alt="Travel Lustre Logo"
                                        width={18}
                                        height={18}
                                        className="opacity-90"
                                    />
                                </div>
                                <div className="truncate min-w-0">
                                    <p className="text-sm font-semibold leading-none text-[#F5F5F5]">TRAVELLUSTRE</p>
                                    <p className="text-[11px] text-[rgba(245,245,245,0.5)] mt-1">Created by Enable VIC</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={onToggle}
                                    className="h-8 w-8 shrink-0 rounded-md hover:bg-white/8 text-white/60 hover:text-white/90"
                                    aria-label="Collapse sidebar"
                                >
                                    <PanelLeftClose size={16} />
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                {/* New Chat — always visible so user can start a chat from any page */}
                <div className="border-b border-[rgba(255,255,255,0.08)] p-2.5">
                    <Button
                        variant="outline"
                        onClick={handleNewChat}
                        className={cn(
                            "group w-full gap-2.5 rounded-lg border-white/10 bg-white/8 hover:border-white/15 hover:bg-white/12",
                            collapsed ? "justify-center" : ""
                        )}
                    >
                        <Plus size={16} className="text-white/70 transition-colors group-hover:text-white/90" />
                        {!collapsed && <span className="text-sm font-medium text-[#F5F5F5]">New Chat</span>}
                    </Button>
                </div>

                {/* Recent Conversations (only on chat page) */}
                {isOnChatPage && !collapsed && recentConversations.length > 0 && (
                    <div className="p-2.5 border-b border-[rgba(255,255,255,0.08)] flex-shrink-0">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-[rgba(245,245,245,0.4)] px-2 mb-2">Recent</p>
                        <div className="space-y-0.5">
                            {recentConversations.map((conv) => (
                                <Button
                                    key={conv.id}
                                    variant="ghost"
                                    onClick={() => onSelectConversation?.(conv.id)}
                                    className={`w-full justify-start px-3 py-2 rounded-md text-[13px] truncate font-normal h-auto ${selectedConversationId === conv.id ? "bg-white/10 text-[#F5F5F5]" : "text-[rgba(245,245,245,0.7)] hover:bg-white/6 hover:text-[#F5F5F5]"}`}
                                    title={conv.title}
                                >
                                    {conv.title}
                                </Button>
                            ))}
                        </div>
                        {/* History Button */}
                        <Button
                            variant="ghost"
                            onClick={onOpenHistory}
                            className="w-full justify-start gap-2 px-3 py-2 mt-2 rounded-md text-[13px] font-normal h-auto text-[rgba(245,245,245,0.5)] hover:text-[rgba(245,245,245,0.8)] hover:bg-white/5"
                        >
                            <History size={14} />
                            <span>View all history</span>
                        </Button>
                    </div>
                )}

                {/* Nav */}
                <nav className="p-2.5 space-y-1 flex-1 overflow-y-auto">
                    <NavLink
                        href="/dashboard"
                        collapsed={collapsed}
                        icon={<LayoutDashboard size={18} />}
                        label="Briefing Room"
                        active={pathname === "/dashboard"}
                        navTag={IS_PREVIEW_MODE ? "sample" : undefined}
                    />
                    <NavLink
                        href="/dashboard/chat"
                        collapsed={collapsed}
                        icon={<MessageSquare size={18} />}
                        label="Chat"
                        active={pathname.startsWith("/dashboard/chat")}
                    />

                    <NavLink
                        href="/dashboard/vics"
                        collapsed={collapsed}
                        icon={<Users size={18} />}
                        label="VICs"
                        active={pathname.startsWith("/dashboard/vics")}
                        navTag={IS_PREVIEW_MODE ? "sample" : undefined}
                    />

                    <NavLink
                        href="/dashboard/itineraries"
                        collapsed={collapsed}
                        icon={<Route size={18} />}
                        label="Itineraries"
                        active={pathname.startsWith("/dashboard/itineraries")}
                        navTag={IS_PREVIEW_MODE ? "sample" : undefined}
                    />

                    <NavLink
                        href="/dashboard/knowledge-vault"
                        collapsed={collapsed}
                        icon={<BookOpen size={18} />}
                        label="Knowledge"
                        active={
                            pathname.startsWith("/dashboard/knowledge-vault") ||
                            pathname.startsWith("/dashboard/knowledge")
                        }
                        navTag={IS_PREVIEW_MODE ? "sample" : undefined}
                    />

                    <NavLink
                        href="/dashboard/products"
                        collapsed={collapsed}
                        icon={<Building2 size={18} />}
                        label="Products"
                        active={pathname.startsWith("/dashboard/products")}
                        navTag={IS_PREVIEW_MODE ? "sample" : undefined}
                    />

                    <NavLink
                        href="/dashboard/analytics"
                        collapsed={collapsed}
                        icon={<BarChart3 size={18} />}
                        label="Analytics"
                        active={pathname.startsWith("/dashboard/analytics")}
                        navTag={IS_PREVIEW_MODE ? "sample" : undefined}
                    />

                    <NavLink
                        href="/dashboard/automations"
                        collapsed={collapsed}
                        icon={<Zap size={18} />}
                        label="Automations"
                        active={pathname.startsWith("/dashboard/automations")}
                        navTag={IS_PREVIEW_MODE ? "sample" : undefined}
                    />

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
                    <Button
                        variant="ghost"
                        onClick={() => setUserPopoverOpen(!userPopoverOpen)}
                        className="w-full rounded-lg p-2.5 bg-white/4 hover:bg-white/8 h-auto justify-start gap-2.5 font-normal border border-transparent hover:border-white/8 text-left group"
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
                    </Button>

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
                            {userContext && (
                                <>
                                    <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.04]">
                                        <span className="text-[10px] text-gray-500">KV admin</span>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={userContext.kvViewAsAdmin}
                                            onClick={() =>
                                                userContext.setKvViewAsAdmin(!userContext.kvViewAsAdmin)
                                            }
                                            className={cn(
                                                "relative w-7 h-4 rounded-full transition-colors shrink-0",
                                                userContext.kvViewAsAdmin ? "bg-blue-500/20" : "bg-white/[0.06]"
                                            )}
                                        >
                                            <span className="sr-only">Toggle Knowledge Vault admin demo view</span>
                                            <span
                                                className={cn(
                                                    "absolute top-0.5 w-3 h-3 rounded-full transition-transform pointer-events-none",
                                                    userContext.kvViewAsAdmin
                                                        ? "translate-x-3.5 bg-blue-400"
                                                        : "translate-x-0.5 bg-gray-500"
                                                )}
                                            />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.04]">
                                        <span className="text-[10px] text-gray-500">Products admin</span>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={userContext.directoryViewAsAdmin}
                                            onClick={() =>
                                                userContext.setDirectoryViewAsAdmin(
                                                    !userContext.directoryViewAsAdmin
                                                )
                                            }
                                            className={cn(
                                                "relative w-7 h-4 rounded-full transition-colors shrink-0",
                                                userContext.directoryViewAsAdmin
                                                    ? "bg-blue-500/20"
                                                    : "bg-white/[0.06]"
                                            )}
                                        >
                                            <span className="sr-only">
                                                Toggle product directory and partner portal admin demo view
                                            </span>
                                            <span
                                                className={cn(
                                                    "absolute top-0.5 w-3 h-3 rounded-full transition-transform pointer-events-none",
                                                    userContext.directoryViewAsAdmin
                                                        ? "translate-x-3.5 bg-blue-400"
                                                        : "translate-x-0.5 bg-gray-500"
                                                )}
                                            />
                                        </button>
                                    </div>
                                </>
                            )}
                            <div className="h-px bg-[rgba(255,255,255,0.08)]" />
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setUserPopoverOpen(false);
                                    handleSignOut();
                                }}
                                className="w-full justify-start gap-2.5 px-3 py-2.5 text-[13px] font-normal text-[rgba(245,245,245,0.8)] hover:bg-white/8 hover:text-[#F5F5F5] rounded-none"
                            >
                                <LogOut size={14} className="text-[rgba(245,245,245,0.5)]" />
                                <span>Sign out</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}

function NavTag({ variant }: { variant: "sample" | "construction" | "coming_soon" }) {
    if (variant === "coming_soon") {
        return (
            <span
                className="shrink-0 ml-auto rounded-md px-2 py-0.5 text-[10px] font-medium text-violet-400 border border-violet-400/30"
                title="Planned feature — preview coming soon."
            >
                Coming soon
            </span>
        );
    }
    const isSample = variant === "sample";
    const label = isSample ? "Sample data" : "Under construction";
    const title = isSample
        ? "Everything here is sample data for demonstration."
        : "This section is under active development.";
    return (
        <span
            className={cn(
                "shrink-0 ml-auto rounded-md px-2 py-0.5 text-[10px] font-medium",
                isSample
                    ? "bg-[var(--muted-amber-bg)] text-[var(--muted-amber-text)] border border-[var(--muted-amber-border)]"
                    : "bg-[var(--muted-info-bg)] text-[var(--muted-info-text)] border border-[var(--muted-info-border)]"
            )}
            title={title}
        >
            {label}
        </span>
    );
}

function NavLink({
    href,
    collapsed,
    icon,
    label,
    active,
    badge,
    navTag,
    notificationPill,
}: {
    href: string;
    collapsed: boolean;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    badge?: string;
    /** Shown when IS_PREVIEW_MODE; "sample" = Sample data, "construction" = Under construction */
    navTag?: "sample" | "construction" | "coming_soon";
    /** Unprocessed email ingestion count (Knowledge Vault) */
    notificationPill?: number;
}) {
    return (
        <Link
            href={href}
            className={[
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px]",
                "transition-all duration-150 ease-out",
                active
                    ? "bg-white/[0.06] text-white font-medium"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]",
            ].join(" ")}
        >
            <span
                className={cn(
                    "shrink-0 inline-flex items-center justify-center relative",
                    active ? "text-white" : "text-gray-500"
                )}
            >
                {icon}
            </span>
            {!collapsed && (
                <>
                    <span className="truncate flex-1 min-w-0">{label}</span>
                    {notificationPill != null && notificationPill > 0 && (
                        <span
                            className="shrink-0 ml-auto min-w-[1.25rem] h-5 px-1 rounded-full bg-sky-500/15 text-sky-400 text-[10px] font-semibold flex items-center justify-center"
                            title="Unprocessed forwarded emails"
                        >
                            {notificationPill > 9 ? "9+" : notificationPill}
                        </span>
                    )}
                    {navTag && <NavTag variant={navTag} />}
                    {badge && !navTag && (
                        <span
                            className="shrink-0 ml-auto rounded-md px-2 py-0.5 text-[11px] font-normal text-[rgba(245,245,245,0.4)] bg-white/[0.05] border border-white/[0.08]"
                            title="This feature is not fully implemented yet"
                        >
                            {badge}
                        </span>
                    )}
                </>
            )}
        </Link>
    );
}

function IntegrationItem({
    name,
    status,
    connected,
    onClick,
    active,
}: {
    name: string;
    status: "active" | "coming_soon";
    connected?: boolean;
    onClick?: () => void;
    active?: boolean;
}) {
    const isClickable = status === "active" && onClick;
    const showInactive = status === "active" && connected === false;

    return (
        <Button
            type="button"
            variant="ghost"
            onClick={isClickable ? onClick : undefined}
            disabled={!isClickable}
            className={`w-full justify-between py-1.5 px-2 rounded-md text-[12px] font-normal h-auto ${isClickable ? "cursor-pointer hover:bg-white/6" : "cursor-default"} ${active ? "bg-white/8" : ""}`}
        >
            <span className={status === "active" ? "text-[rgba(245,245,245,0.8)]" : "text-[rgba(245,245,245,0.45)]"}>
                {name}
            </span>
            {status === "active" ? (
                showInactive ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(245,245,245,0.08)] text-[rgba(245,245,245,0.45)]">
                        Inactive
                    </span>
                ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(122,200,137,0.15)] text-[#7AC889]">
                        Active
                    </span>
                )
            ) : (
                <span className="text-[10px] text-[rgba(245,245,245,0.35)]">
                    Coming soon
                </span>
            )}
        </Button>
    );
}
