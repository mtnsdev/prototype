"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { Shield, Users, FolderLock, ArrowLeft, Loader2, FlaskConical } from "lucide-react";

const ADMIN_NAV_ITEMS = [
    { href: "/dashboard/settings/admin", label: "Overview", icon: Shield, exact: true },
    { href: "/dashboard/settings/admin/users", label: "Users", icon: Users },
    { href: "/dashboard/settings/admin/permissions", label: "Permissions", icon: FolderLock },
    { href: "/dashboard/settings/admin/bulk-test", label: "Bulk Test", icon: FlaskConical },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading } = useUser();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/login");
            } else if (user.role !== "admin") {
                router.push("/dashboard");
            } else {
                setIsAuthorized(true);
            }
        }
    }, [user, isLoading, router]);

    if (isLoading || !isAuthorized) {
        return (
            <div className="h-full flex items-center justify-center bg-[#0C0C0C]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[rgba(245,245,245,0.4)]" />
                    <span className="text-[13px] text-[rgba(245,245,245,0.5)]">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-[#0C0C0C]">
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/dashboard/settings"
                        className="inline-flex items-center gap-2 text-[13px] text-[rgba(245,245,245,0.5)] hover:text-[rgba(245,245,245,0.8)] transition-colors mb-4"
                    >
                        <ArrowLeft size={14} />
                        Back to Settings
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border border-amber-500/20">
                            <Shield size={20} className="text-amber-400" />
                        </div>
                        <div>
                            <h1 className="text-[24px] font-semibold text-[#F5F5F5] tracking-tight">Admin Panel</h1>
                            <p className="text-[14px] text-[rgba(245,245,245,0.5)]">Manage users and content permissions</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-1 mb-6 p-1 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                    {ADMIN_NAV_ITEMS.map((item) => {
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname.startsWith(item.href);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={[
                                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-[14px] font-medium transition-all",
                                    isActive
                                        ? "bg-[rgba(255,255,255,0.08)] text-[#F5F5F5]"
                                        : "text-[rgba(245,245,245,0.5)] hover:text-[rgba(245,245,245,0.8)] hover:bg-[rgba(255,255,255,0.04)]",
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
