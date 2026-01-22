"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardFrame({ children }: { children: React.ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="h-screen flex">
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed((v) => !v)}
                />

                {/* Everything to the right of the sidebar is route-specific */}
                <div className="flex-1 min-w-0">{children}</div>
            </div>
        </div>
    );
}
