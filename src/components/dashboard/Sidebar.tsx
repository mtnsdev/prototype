"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Bell,
    MessageSquare,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    LogOut,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ReportIssueLauncher from "@/components/ui/ReportIssueLauncher";
import { useUserOptional } from "@/contexts/UserContext";
import { DemoAdminSwitchRow } from "@/components/ui/demo-admin-switch-row";
import { DEMO_ADMIN_MENU, DEMO_ADMIN_SR } from "@/lib/demoAdminUi";
import { IS_PREVIEW_MODE } from "@/config/preview";
import { useNotificationPanelOptional } from "@/components/dashboard/DashboardNotifications";
import { DASHBOARD_CHROME_HEADER_ROW } from "@/lib/dashboardChrome";
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
    /** Full-width mobile sheet; hides rail collapse control */
    layout?: "rail" | "drawer";
    /** Close mobile drawer after navigation */
    onRequestClose?: () => void;
};

export default function Sidebar({
    collapsed,
    onToggle,
    layout = "rail",
    onRequestClose,
}: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const userContext = useUserOptional();
    const notificationPanel = useNotificationPanelOptional();
    const [notificationCountHydrated, setNotificationCountHydrated] = useState(false);
    useEffect(() => setNotificationCountHydrated(true), []);
    const unreadNotifications =
        notificationCountHydrated && notificationPanel ? notificationPanel.unreadCount : 0;
    const isDrawer = layout === "drawer";
    const showLabels = !collapsed || isDrawer;
    const navClose = isDrawer ? onRequestClose : undefined;

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

    return (
        <aside
            className={cn(
                "h-full border-r border-border bg-background/90 backdrop-blur-xl transition-all duration-200 ease-out",
                isDrawer ? "w-full min-w-0" : collapsed ? "w-16" : "w-64"
            )}
        >
            <div className="h-full flex flex-col">
                {/* Header */}
                <div
                    className={cn(
                        "flex items-center border-b border-border",
                        DASHBOARD_CHROME_HEADER_ROW,
                        !showLabels ? "flex-col justify-center gap-2 px-2" : "justify-between px-3"
                    )}
                >
                    {isDrawer ? (
                        <div className="flex items-center gap-2.5 min-w-0 pr-8">
                            <div className="h-8 w-8 shrink-0 rounded-md bg-white/5 flex items-center justify-center border border-input">
                                <Image
                                    src="/TL_logo.svg"
                                    alt="Travel Lustre Logo"
                                    width={18}
                                    height={18}
                                    className="opacity-90"
                                />
                            </div>
                            <div className="flex min-w-0 min-h-0 flex-col justify-center gap-1">
                                <p className="truncate text-sm font-semibold leading-none text-foreground">TRAVELLUSTRE</p>
                                <p className="line-clamp-1 text-xs leading-snug text-muted-foreground/75">
                                    Created by Enable VIC
                                </p>
                            </div>
                        </div>
                    ) : !showLabels ? (
                        <>
                            <div className="h-8 w-8 shrink-0 rounded-md bg-white/5 flex items-center justify-center border border-input">
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
                                <div className="h-8 w-8 shrink-0 rounded-md bg-white/5 flex items-center justify-center border border-input">
                                    <Image
                                        src="/TL_logo.svg"
                                        alt="Travel Lustre Logo"
                                        width={18}
                                        height={18}
                                        className="opacity-90"
                                    />
                                </div>
                                <div className="flex min-w-0 min-h-0 flex-col justify-center gap-1">
                                    <p className="truncate text-sm font-semibold leading-none text-foreground">TRAVELLUSTRE</p>
                                    <p className="line-clamp-1 text-xs leading-snug text-muted-foreground/75">
                                        Created by Enable VIC
                                    </p>
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

                {/* Nav — daily workflow order */}
                <nav className="p-2.5 space-y-1 flex-1 overflow-y-auto" aria-label="Main">
                    <NavLink
                        href="/dashboard"
                        collapsed={!showLabels}
                        onNavigate={navClose}
                        icon={<LayoutDashboard size={18} />}
                        label="Briefing Room"
                        active={pathname === "/dashboard"}
                        navTag={IS_PREVIEW_MODE ? "sample" : undefined}
                    />
                    <NavLink
                        href="/dashboard/products"
                        collapsed={!showLabels}
                        onNavigate={navClose}
                        icon={<Building2 size={18} />}
                        label="Products"
                        active={pathname.startsWith("/dashboard/products")}
                        navTag={IS_PREVIEW_MODE ? "sample" : undefined}
                    />
                    <NavLink
                        href="/dashboard/vics"
                        collapsed={!showLabels}
                        onNavigate={navClose}
                        icon={<Users size={18} />}
                        label="VICs"
                        active={pathname.startsWith("/dashboard/vics")}
                        navTag={IS_PREVIEW_MODE ? "sample" : undefined}
                    />
                    <NavLink
                        href="/dashboard/itineraries"
                        collapsed={!showLabels}
                        onNavigate={navClose}
                        icon={<Route size={18} />}
                        label="Itineraries"
                        active={pathname.startsWith("/dashboard/itineraries")}
                        navTag={IS_PREVIEW_MODE ? "sample" : undefined}
                    />

                    <NavLink
                        href="/dashboard/analytics"
                        collapsed={!showLabels}
                        onNavigate={navClose}
                        icon={<BarChart3 size={18} />}
                        label="Analytics"
                        active={pathname.startsWith("/dashboard/analytics")}
                        navTag={IS_PREVIEW_MODE ? "sample" : undefined}
                    />

                    <NavLink
                        href="/dashboard/automations"
                        collapsed={!showLabels}
                        onNavigate={navClose}
                        icon={<Zap size={18} />}
                        label="Automations"
                        active={pathname.startsWith("/dashboard/automations")}
                        navTag={IS_PREVIEW_MODE ? "sample" : undefined}
                    />

                    <NavLink
                        href="/dashboard/knowledge-vault"
                        collapsed={!showLabels}
                        onNavigate={navClose}
                        icon={<BookOpen size={18} />}
                        label="Knowledge"
                        active={
                            pathname.startsWith("/dashboard/knowledge-vault") ||
                            pathname.startsWith("/dashboard/knowledge")
                        }
                        navTag={IS_PREVIEW_MODE ? "sample" : undefined}
                    />

                    <NavLink
                        href="/dashboard/chat"
                        collapsed={!showLabels}
                        onNavigate={navClose}
                        icon={<MessageSquare size={18} />}
                        label="Claire"
                        subLabel="Enable VICs AI"
                        title={!showLabels ? "Claire — Enable VICs AI" : undefined}
                        active={pathname.startsWith("/dashboard/chat")}
                    />

                    {/* <NavLink
                        href="/dashboard/search"
                        collapsed={collapsed}
                        icon={<Search size={18} />}
                        label="Search"
                        active={pathname.startsWith("/dashboard/search")}
                    /> */}
                </nav>

                <div className="shrink-0 border-t border-border p-2.5 pt-2 space-y-1">
                    <NavLink
                        href="/dashboard/notifications"
                        collapsed={!showLabels}
                        onNavigate={navClose}
                        icon={<Bell size={18} />}
                        label="Notifications"
                        active={pathname.startsWith("/dashboard/notifications")}
                        unreadAlertCount={unreadNotifications}
                    />
                </div>

                <div className="px-2.5 pb-2 pt-1 shrink-0">
                    <ReportIssueLauncher
                        floating={false}
                        compact={!showLabels}
                        className="flex justify-end"
                    />
                </div>

                <div className="border-t border-border p-2.5">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                className="group w-full rounded-lg border border-transparent bg-white/4 p-2.5 text-left font-normal h-auto justify-start gap-2.5 hover:border-white/8 hover:bg-white/8"
                                title="User menu"
                                aria-label="User menu"
                            >
                                {showLabels ? (
                                    <div className="flex w-full items-center justify-between">
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                                                <User size={14} className="text-white/60" aria-hidden />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-muted-foreground/75">Signed in</p>
                                                <p className="truncate text-compact font-medium text-foreground">
                                                    {userContext?.user?.username ||
                                                        userContext?.user?.email?.split("@")[0] ||
                                                        "User"}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight
                                            size={14}
                                            className="shrink-0 text-muted-foreground/55 transition-colors group-hover:text-muted-foreground group-data-[state=open]:rotate-90"
                                            aria-hidden
                                        />
                                    </div>
                                ) : (
                                    <div className="flex w-full justify-center">
                                        <User
                                            size={16}
                                            className="text-muted-foreground/55 group-hover:text-muted-foreground"
                                            aria-hidden
                                        />
                                    </div>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            side="top"
                            align={showLabels ? "start" : "center"}
                            sideOffset={8}
                            className="w-[min(calc(100vw-2rem),16rem)] overflow-hidden border-input bg-card p-0 shadow-xl"
                        >
                            <Link
                                href="/dashboard/settings"
                                onClick={() => navClose?.()}
                                className="flex items-center gap-2.5 px-3 py-2.5 text-compact text-muted-foreground transition-colors hover:bg-white/8 hover:text-foreground"
                            >
                                <Settings size={14} className="text-muted-foreground/75" aria-hidden />
                                <span>Settings</span>
                            </Link>
                            {userContext && (
                                <div className="mx-2 my-1.5 overflow-hidden rounded-lg border border-border/80 bg-muted/10">
                                    <DemoAdminSwitchRow
                                        label={DEMO_ADMIN_MENU.prototypeAdminView}
                                        checked={userContext.prototypeAdminView}
                                        onCheckedChange={userContext.setPrototypeAdminView}
                                        srDescription={DEMO_ADMIN_SR.prototypeAdminView}
                                    />
                                </div>
                            )}
                            <div className="h-px bg-border" />
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    handleSignOut();
                                }}
                                className="h-auto w-full justify-start gap-2.5 rounded-none px-3 py-2.5 text-compact font-normal text-muted-foreground hover:bg-white/8 hover:text-foreground"
                            >
                                <LogOut size={14} className="text-muted-foreground/75" aria-hidden />
                                <span>Sign out</span>
                            </Button>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </aside>
    );
}

function NavTag({ variant }: { variant: "sample" | "construction" | "coming_soon" }) {
    if (variant === "coming_soon") {
        return (
            <span
                className="shrink-0 ml-auto rounded-md px-2 py-0.5 text-2xs font-medium text-violet-400 border border-violet-400/30"
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
                "shrink-0 ml-auto rounded-md px-2 py-0.5 text-2xs font-medium",
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
    onNavigate,
    icon,
    label,
    active,
    badge,
    navTag,
    notificationPill,
    unreadAlertCount,
    title,
    subLabel,
}: {
    href: string;
    collapsed: boolean;
    onNavigate?: () => void;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    badge?: string;
    /** Native title tooltip (e.g. expanded subtitle when rail is collapsed). */
    title?: string;
    /** Second line when the rail is expanded (e.g. product tagline). */
    subLabel?: string;
    /** Shown when IS_PREVIEW_MODE; "sample" = Sample data, "construction" = Under construction */
    navTag?: "sample" | "construction" | "coming_soon";
    /** Unprocessed email ingestion count (Knowledge Vault) */
    notificationPill?: number;
    /** Dashboard notification center unread count */
    unreadAlertCount?: number;
}) {
    const showUnread = unreadAlertCount != null && unreadAlertCount > 0;
    const linkAriaLabel =
        collapsed && showUnread ? `${label}, ${unreadAlertCount} unread` : collapsed ? label : undefined;

    return (
        <Link
            href={href}
            onClick={() => onNavigate?.()}
            aria-label={linkAriaLabel}
            title={title}
            className={[
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-compact",
                "transition-all duration-150 ease-out",
                active
                    ? "bg-white/[0.06] text-white font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]",
            ].join(" ")}
        >
            <span
                className={cn(
                    "shrink-0 inline-flex items-center justify-center relative",
                    active ? "text-white" : "text-muted-foreground"
                )}
            >
                {icon}
                {collapsed && showUnread ? (
                    <span
                        className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-[var(--muted-error-border)] bg-[var(--muted-error-bg)] px-1 text-[8px] font-semibold text-[var(--muted-error-text)] tabular-nums"
                        aria-hidden
                    >
                        {unreadAlertCount > 9 ? "9+" : unreadAlertCount}
                    </span>
                ) : null}
            </span>
            {!collapsed && (
                <>
                    <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
                        <span className="truncate w-full">{label}</span>
                        {subLabel ? (
                            <span className="w-full truncate text-2xs font-normal text-muted-foreground/65 leading-tight">
                                {subLabel}
                            </span>
                        ) : null}
                    </span>
                    {showUnread ? (
                        <span
                            className="shrink-0 ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border border-[var(--muted-error-border)] bg-[var(--muted-error-bg)] px-1.5 text-2xs font-semibold text-[var(--muted-error-text)] tabular-nums"
                            title={`${unreadAlertCount} unread`}
                        >
                            {unreadAlertCount > 9 ? "9+" : unreadAlertCount}
                        </span>
                    ) : null}
                    {notificationPill != null && notificationPill > 0 && (
                        <span
                            className="shrink-0 ml-auto min-w-[1.25rem] h-5 px-1 rounded-full bg-sky-500/15 text-sky-400 text-2xs font-semibold flex items-center justify-center"
                            title="Unprocessed forwarded emails"
                        >
                            {notificationPill > 9 ? "9+" : notificationPill}
                        </span>
                    )}
                    {navTag && <NavTag variant={navTag} />}
                    {badge && !navTag && (
                        <span
                            className="shrink-0 ml-auto rounded-md px-2 py-0.5 text-xs font-normal text-muted-foreground/55 bg-white/[0.05] border border-border"
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
            className={`w-full justify-between py-1.5 px-2 rounded-md text-sm font-normal h-auto ${isClickable ? "cursor-pointer hover:bg-white/6" : "cursor-default"} ${active ? "bg-white/8" : ""}`}
        >
            <span className={status === "active" ? "text-muted-foreground" : "text-muted-foreground/75"}>
                {name}
            </span>
            {status === "active" ? (
                showInactive ? (
                    <span className="text-2xs px-1.5 py-0.5 rounded bg-[rgba(245,245,245,0.08)] text-muted-foreground/75">
                        Inactive
                    </span>
                ) : (
                    <span className="text-2xs px-1.5 py-0.5 rounded bg-[rgba(122,200,137,0.15)] text-[#7AC889]">
                        Active
                    </span>
                )
            ) : (
                <span className="text-2xs text-muted-foreground/55">
                    Coming soon
                </span>
            )}
        </Button>
    );
}
