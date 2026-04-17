/**
 * Command palette entries. `opsOnly` items appear when the user has the agency ops lens
 * (`prototypeAdminView` in UserContext, derived from `user.role === "admin"`) — advisor vs agency ops.
 */

export type DashboardCommand = {
    id: string;
    label: string;
    href: string;
    group: "Go to" | "Agency ops";
    keywords?: string[];
    /** Shown only when prototype “agency ops” lens is on */
    opsOnly?: boolean;
};

export const DASHBOARD_COMMANDS: DashboardCommand[] = [
    { id: "briefing", label: "Briefing Room", href: "/dashboard/briefing-room", group: "Go to", keywords: ["home", "start", "dashboard"] },
    { id: "products", label: "Products", href: "/dashboard/products", group: "Go to", keywords: ["catalog", "directory", "hotels"] },
    { id: "vics", label: "VICs", href: "/dashboard/vics", group: "Go to", keywords: ["clients", "customers"] },
    { id: "itineraries", label: "Itineraries", href: "/dashboard/itineraries", group: "Go to", keywords: ["trips", "travel"] },
    { id: "analytics", label: "Analytics", href: "/dashboard/analytics", group: "Go to", keywords: ["metrics", "reports", "revenue"] },
    { id: "automations", label: "Automations", href: "/dashboard/automations", group: "Go to", keywords: ["workflows", "rules", "zap"] },
    { id: "knowledge", label: "Knowledge", href: "/dashboard/knowledge-vault", group: "Go to", keywords: ["vault", "documents", "library"] },
    { id: "claire", label: "Claire (AI hub)", href: "/dashboard/chat", group: "Go to", keywords: ["chat", "ai", "assistant", "enable"] },
    { id: "notifications", label: "Notifications", href: "/dashboard/notifications", group: "Go to", keywords: ["alerts", "inbox"] },
    { id: "settings", label: "Settings", href: "/dashboard/settings", group: "Go to", keywords: ["account", "preferences"] },

    {
        id: "ops-users",
        label: "Admin: Users",
        href: "/dashboard/settings/admin/users",
        group: "Agency ops",
        opsOnly: true,
        keywords: ["team", "permissions", "staff"],
    },
    {
        id: "ops-teams",
        label: "Admin: Teams",
        href: "/dashboard/settings/teams",
        group: "Agency ops",
        opsOnly: true,
        keywords: ["groups"],
    },
    {
        id: "ops-rep-firms",
        label: "Admin: Rep firms",
        href: "/dashboard/products?tab=rep-firms",
        group: "Agency ops",
        opsOnly: true,
        keywords: ["partners"],
    },
    {
        id: "ops-briefing",
        label: "Admin: Briefing room CMS",
        href: "/admin/briefing-room",
        group: "Agency ops",
        opsOnly: true,
        keywords: ["publish", "agency hub", "cms"],
    },
    {
        id: "ops-integrations",
        label: "Admin: Integrations",
        href: "/dashboard/settings/integrations",
        group: "Agency ops",
        opsOnly: true,
        keywords: ["connect", "api"],
    },
    {
        id: "ops-sources",
        label: "Admin: Sources",
        href: "/dashboard/settings/sources",
        group: "Agency ops",
        opsOnly: true,
        keywords: ["ingestion", "feeds"],
    },
    {
        id: "ops-layout",
        label: "Admin: Dashboard layout",
        href: "/dashboard/settings/dashboard-layout",
        group: "Agency ops",
        opsOnly: true,
        keywords: ["widgets", "default view"],
    },
    {
        id: "ops-admin-home",
        label: "Admin: Overview",
        href: "/dashboard/settings/admin",
        group: "Agency ops",
        opsOnly: true,
        keywords: ["console"],
    },
];

export function filterDashboardCommands(
    commands: DashboardCommand[],
    opts: { opsLens: boolean; query: string },
): DashboardCommand[] {
    const q = opts.query.trim().toLowerCase();
    return commands.filter((c) => {
        if (c.opsOnly && !opts.opsLens) return false;
        if (!q) return true;
        if (c.label.toLowerCase().includes(q)) return true;
        if (c.keywords?.some((k) => k.toLowerCase().includes(q))) return true;
        if (c.group.toLowerCase().includes(q)) return true;
        return false;
    });
}
