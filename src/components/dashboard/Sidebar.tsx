"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutGrid,
    MessageSquare,
    Book,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
} from "lucide-react";

type Props = {
    collapsed: boolean;
    onToggle: () => void;
};

export default function Sidebar({ collapsed, onToggle }: Props) {
    const pathname = usePathname();

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
                                <p className="text-sm font-semibold leading-none">Dashboard</p>
                                <p className="text-xs text-white/60 mt-1">Boilerplate</p>
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

                {/* Nav */}
                <nav className="p-2 space-y-1">
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
                    <div className="rounded-md bg-white/5 p-2">
                        {!collapsed ? (
                            <>
                                <p className="text-xs text-white/70">Signed in</p>
                                <p className="text-sm font-medium truncate">User</p>
                            </>
                        ) : (
                            <p className="text-xs text-white/70 text-center">User</p>
                        )}
                    </div>
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
