"use client";

import { useEffect, useState } from "react";
import { Users, FolderLock, UserCheck, UserX, Clock, Shield } from "lucide-react";

type AdminStats = {
    users: {
        total: number;
        active: number;
        invited: number;
        disabled: number;
        admins: number;
    };
    rules: {
        total: number;
    };
};

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const token = localStorage.getItem("auth_token");
                const response = await fetch("/api/admin/stats", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch stats");
                }

                const data = await response.json();
                setStats(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load stats");
            } finally {
                setIsLoading(false);
            }
        }

        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="h-32 rounded-2xl bg-card border border-border animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl bg-[rgba(200,122,122,0.08)] border border-[rgba(200,122,122,0.2)] p-6 text-center">
                <p className="text-base text-[var(--color-error)]">{error}</p>
            </div>
        );
    }

    const statCards = [
        {
            label: "Total Users",
            value: stats?.users.total ?? 0,
            icon: Users,
            color: "from-blue-500/20 to-blue-600/10",
            borderColor: "border-blue-500/20",
            iconColor: "text-blue-400",
        },
        {
            label: "Active Users",
            value: stats?.users.active ?? 0,
            icon: UserCheck,
            color: "from-green-500/20 to-green-600/10",
            borderColor: "border-green-500/20",
            iconColor: "text-green-400",
        },
        {
            label: "Pending Invites",
            value: stats?.users.invited ?? 0,
            icon: Clock,
            color: "from-amber-500/20 to-amber-600/10",
            borderColor: "border-amber-500/20",
            iconColor: "text-[var(--color-warning)]",
        },
        {
            label: "Content Rules",
            value: stats?.rules.total ?? 0,
            icon: FolderLock,
            color: "from-purple-500/20 to-purple-600/10",
            borderColor: "border-purple-500/20",
            iconColor: "text-purple-400",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="rounded-2xl bg-card border border-border p-5"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground/75 uppercase tracking-wider">
                                        {stat.label}
                                    </p>
                                    <p className="text-3xl font-bold text-foreground mt-1">
                                        {stat.value}
                                    </p>
                                </div>
                                <div
                                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center border ${stat.borderColor}`}
                                >
                                    <Icon size={20} className={stat.iconColor} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-card border border-border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-4">User Breakdown</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield size={14} className="text-[var(--color-warning)]" />
                                <span className="text-base text-muted-foreground">Administrators</span>
                            </div>
                            <span className="text-base font-medium text-foreground">{stats?.users.admins ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UserCheck size={14} className="text-green-400" />
                                <span className="text-base text-muted-foreground">Active</span>
                            </div>
                            <span className="text-base font-medium text-foreground">{stats?.users.active ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-[var(--color-warning)]" />
                                <span className="text-base text-muted-foreground">Invited</span>
                            </div>
                            <span className="text-base font-medium text-foreground">{stats?.users.invited ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UserX size={14} className="text-red-400" />
                                <span className="text-base text-muted-foreground">Disabled</span>
                            </div>
                            <span className="text-base font-medium text-foreground">{stats?.users.disabled ?? 0}</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl bg-card border border-border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                        <a
                            href="/dashboard/settings/admin/users"
                            className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] border border-border transition-colors"
                        >
                            <Users size={18} className="text-muted-foreground/75" />
                            <span className="text-base text-muted-foreground">Manage Users</span>
                        </a>
                        <a
                            href="/dashboard/settings/admin/permissions"
                            className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] border border-border transition-colors"
                        >
                            <FolderLock size={18} className="text-muted-foreground/75" />
                            <span className="text-base text-muted-foreground">Manage Permissions</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
