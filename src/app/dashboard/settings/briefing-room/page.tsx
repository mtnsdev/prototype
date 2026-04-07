"use client";

import Link from "next/link";
import { ChevronRight, LayoutDashboard, Newspaper, Shield } from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { useUser } from "@/contexts/UserContext";
import { DemoAdminSwitchRow } from "@/components/ui/demo-admin-switch-row";
import { DEMO_ADMIN_MENU, DEMO_ADMIN_SR } from "@/lib/demoAdminUi";

export default function BriefingRoomSettingsPage() {
    const { prototypeAdminView, setPrototypeAdminView, isLoading } = useUser();

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-background">
                <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-background">
            <div className="max-w-2xl mx-auto p-6 space-y-6">
                <Breadcrumbs
                    items={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Settings", href: "/dashboard/settings" },
                        { label: "Briefing Room" },
                    ]}
                />

                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Briefing Room</h1>
                    <p className="text-base text-muted-foreground/75 mt-1">
                        The briefing hub and dashboard widgets follow the same prototype mode as the rest of the
                        app.
                    </p>
                </div>

                <section className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center border border-input">
                            <Newspaper size={18} className="text-muted-foreground" />
                        </div>
                        <h2 className="text-base font-semibold text-foreground">User mode (default)</h2>
                    </div>
                    <div className="p-5 space-y-2 text-sm text-muted-foreground/90">
                        <p>
                            Agency notes, news and alerts, announcements, and partner incentives each appear
                            as their own dashboard widget (not a single tabbed panel). They are{" "}
                            <span className="font-medium text-foreground">read-only</span>, but each advisor can
                            use the layout control on those blocks to change visibility, column, and size for
                            themselves. Below that, your personal widgets use{" "}
                            <span className="font-medium text-foreground">Edit layout</span> to drag blocks
                            between columns, a hide control on each card, and a chip list to show hidden widgets
                            again.
                        </p>
                    </div>
                </section>

                <section className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/15 to-amber-600/8 flex items-center justify-center border border-amber-500/20">
                            <Shield size={18} className="text-[var(--color-warning)]" />
                        </div>
                        <h2 className="text-base font-semibold text-foreground">Admin view</h2>
                    </div>
                    <div className="p-5 space-y-3 text-sm text-muted-foreground/90">
                        <p>
                            With <span className="font-medium text-foreground">Admin view</span> on (user menu
                            in the sidebar), you can publish and edit agency briefing content and see
                            agency-wide trip and activity on the dashboard—along with admin controls in
                            Knowledge Vault and the product directory.
                        </p>
                    </div>
                </section>

                <section className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center border border-input">
                            <LayoutDashboard size={18} className="text-muted-foreground" />
                        </div>
                        <h2 className="text-base font-semibold text-foreground">Prototype mode</h2>
                    </div>
                    <div className="p-5 space-y-4">
                        <p className="text-sm text-muted-foreground/90">
                            Same switch as in the sidebar user menu. One toggle controls the whole prototype.
                            Saved on this device.
                        </p>
                        <DemoAdminSwitchRow
                            density="comfortable"
                            className="rounded-xl border border-border bg-background/50 hover:bg-background/60"
                            label={DEMO_ADMIN_MENU.prototypeAdminView}
                            checked={prototypeAdminView}
                            onCheckedChange={setPrototypeAdminView}
                            srDescription={DEMO_ADMIN_SR.prototypeAdminView}
                        />
                    </div>
                </section>

                <Link
                    href="/dashboard"
                    className={[
                        "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl",
                        "text-base font-medium",
                        "bg-white/[0.06] hover:bg-white/[0.1]",
                        "border border-border",
                        "text-foreground",
                        "transition-all duration-150",
                    ].join(" ")}
                >
                    <LayoutDashboard size={16} />
                    Open Briefing Room
                    <ChevronRight size={16} className="ml-auto opacity-60" />
                </Link>
            </div>
        </div>
    );
}
