import { FAKE_VICS } from "@/components/vic/fakeData";
import { FAKE_PRODUCTS } from "@/components/products/fakeData";
import { FAKE_ITINERARIES } from "@/components/itineraries/fakeData";
import { getVICId } from "@/lib/vic-api";

export type ShellCrumb = { label: string; href?: string };

const HOME: ShellCrumb = { label: "Home", href: "/dashboard" };

const APP_ROOT: Record<string, { label: string; href: string }> = {
  chat: { label: "Assistant", href: "/dashboard/chat" },
  "knowledge-vault": { label: "Knowledge", href: "/dashboard/knowledge-vault" },
  knowledge: { label: "Knowledge", href: "/dashboard/knowledge" },
  products: { label: "Catalog", href: "/dashboard/products" },
  vics: { label: "VICs", href: "/dashboard/vics" },
  itineraries: { label: "Itineraries", href: "/dashboard/itineraries" },
  analytics: { label: "Analytics", href: "/dashboard/analytics" },
  automations: { label: "Automations", href: "/dashboard/automations" },
  notifications: { label: "Notifications", href: "/dashboard/notifications" },
  search: { label: "Search", href: "/dashboard/search" },
  library: { label: "Library", href: "/dashboard/library" },
  "email-ingestion": { label: "Email ingestion", href: "/dashboard/email-ingestion" },
  settings: { label: "Settings", href: "/dashboard/settings" },
};

const SETTINGS_CHILD: Record<string, string> = {
  integrations: "Integrations",
  sources: "Sources",
  teams: "Teams",
  "rep-firms": "Rep firms",
  admin: "Admin",
  "briefing-room": "Briefing layout",
  "dashboard-layout": "Dashboard layout",
};

/**
 * Default shell breadcrumbs from pathname + mock entity lookup (prototype).
 */
export function getDefaultShellCrumbs(pathname: string): ShellCrumb[] {
  const path = pathname.replace(/\/$/, "") || "/dashboard";
  if (path === "/dashboard") {
    return [HOME];
  }

  const parts = path.split("/").filter(Boolean);
  if (parts[0] !== "dashboard") {
    return [HOME];
  }

  if (parts.length === 1) {
    return [HOME];
  }

  const app = parts[1] ?? "";

  if (app === "settings") {
    const crumbs: ShellCrumb[] = [HOME, { label: "Settings", href: "/dashboard/settings" }];
    for (let i = 2; i < parts.length; i++) {
      const seg = parts[i]!;
      const isLast = i === parts.length - 1;
      const href = isLast ? undefined : `/${parts.slice(0, i + 1).join("/")}`;
      const raw = SETTINGS_CHILD[seg] ?? seg.replace(/-/g, " ");
      const label = raw.length > 0 ? raw.charAt(0).toUpperCase() + raw.slice(1) : raw;
      crumbs.push({ label, href });
    }
    return crumbs;
  }

  const root = APP_ROOT[app];
  if (!root) {
    return [HOME, { label: app.replace(/-/g, " ") }];
  }

  if (parts.length === 2) {
    return [HOME, { label: root.label, href: root.href }];
  }

  const id = parts[2] ?? "";

  if (app === "vics") {
    const vic = FAKE_VICS.find((v) => getVICId(v) === id || v.id === id);
    return [HOME, { label: "VICs", href: "/dashboard/vics" }, { label: vic?.full_name ?? "VIC" }];
  }

  if (app === "products") {
    if (parts[3] === "edit") {
      const product = FAKE_PRODUCTS.find((p) => p.id === id);
      return [
        HOME,
        { label: "Catalog", href: "/dashboard/products" },
        { label: product?.name ?? "Product", href: `/dashboard/products/${id}` },
        { label: "Edit" },
      ];
    }
    const product = FAKE_PRODUCTS.find((p) => p.id === id);
    return [HOME, { label: "Catalog", href: "/dashboard/products" }, { label: product?.name ?? "Product" }];
  }

  if (app === "itineraries") {
    if (parts[3] === "workspace") {
      const itin = FAKE_ITINERARIES.find((i) => i.id === id);
      return [
        HOME,
        { label: "Itineraries", href: "/dashboard/itineraries" },
        { label: itin?.trip_name ?? "Trip", href: `/dashboard/itineraries/${id}` },
        { label: "Catalog workspace" },
      ];
    }
    if (parts[3] === "edit") {
      const itin = FAKE_ITINERARIES.find((i) => i.id === id);
      return [
        HOME,
        { label: "Itineraries", href: "/dashboard/itineraries" },
        { label: itin?.trip_name ?? "Trip", href: `/dashboard/itineraries/${id}` },
        { label: "Edit" },
      ];
    }
    const itin = FAKE_ITINERARIES.find((i) => i.id === id);
    return [
      HOME,
      { label: "Itineraries", href: "/dashboard/itineraries" },
      { label: itin?.trip_name ?? "Itinerary" },
    ];
  }

  return [HOME, { label: root.label, href: root.href }, { label: id }];
}
