"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Shield, Users, FolderLock, ArrowLeft, FlaskConical, Sparkles, Megaphone } from "lucide-react";

const ADMIN_NAV_ITEMS = [
    { href: "/dashboard/settings/admin/users", label: "Users", icon: Users },
    { href: "/dashboard/settings/admin/permissions", label: "Permissions", icon: FolderLock },
    { href: "/dashboard/settings/admin/acuity-settings", label: "VIC Intelligence", icon: Sparkles },
    { href: "/dashboard/settings/admin/bulk-test", label: "Bulk Test", icon: FlaskConical },
    { href: "/admin/briefing-room", label: "Briefing CMS", icon: Megaphone },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="h-full overflow-y-auto bg-background">
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/dashboard/settings"
                        className="inline-flex items-center gap-2 text-compact text-muted-foreground/75 hover:text-muted-foreground transition-colors mb-4"
                    >
                        <ArrowLeft size={14} />
                        Back to Settings
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border border-amber-500/20">
                            <Shield size={20} className="text-[var(--color-warning)]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Admin Panel</h1>
                            <p className="text-base text-muted-foreground/75">Manage users and content permissions</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-1 mb-6 p-1 rounded-xl bg-[rgba(255,255,255,0.03)] border border-border">
                    {ADMIN_NAV_ITEMS.map((item) => {
                        const isActive =
                            item.href.startsWith("/admin")
                                ? pathname === item.href
                                : pathname.startsWith(item.href);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={[
                                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-base font-medium transition-all",
                                    isActive
                                        ? "bg-[rgba(255,255,255,0.08)] text-foreground"
                                        : "text-muted-foreground/75 hover:text-muted-foreground hover:bg-[rgba(255,255,255,0.04)]",
                                ].join(" ")}
                            >
                                <Icon size={16} />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Content */}
                {children}
            </div>
        </div>
    );
}
