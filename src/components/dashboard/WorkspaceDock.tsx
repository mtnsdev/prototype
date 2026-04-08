"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Route,
  Building2,
  BookOpen,
  BarChart3,
  Zap,
  Search,
  Settings,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatContext } from "@/contexts/ChatContext";

const DOCK_APPS: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  match: (path: string) => boolean;
}[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, match: (p) => p === "/dashboard" },
  { href: "/dashboard/vics", label: "VICs", icon: Users, match: (p) => p.startsWith("/dashboard/vics") },
  {
    href: "/dashboard/itineraries",
    label: "Trips",
    icon: Route,
    match: (p) => p.startsWith("/dashboard/itineraries"),
  },
  {
    href: "/dashboard/products",
    label: "Catalog",
    icon: Building2,
    match: (p) => p.startsWith("/dashboard/products"),
  },
  {
    href: "/dashboard/knowledge-vault",
    label: "Knowledge",
    icon: BookOpen,
    match: (p) =>
      p.startsWith("/dashboard/knowledge-vault") || p.startsWith("/dashboard/knowledge"),
  },
  {
    href: "/dashboard/search",
    label: "Search",
    icon: Search,
    match: (p) => p.startsWith("/dashboard/search"),
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
    match: (p) => p.startsWith("/dashboard/analytics"),
  },
  {
    href: "/dashboard/automations",
    label: "Auto",
    icon: Zap,
    match: (p) => p.startsWith("/dashboard/automations"),
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    match: (p) => p.startsWith("/dashboard/settings"),
  },
];

export default function WorkspaceDock() {
  const pathname = usePathname();
  const { toggleAssistant, assistantOpen } = useChatContext();
  const onChat = pathname.startsWith("/dashboard/chat");

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2"
      role="navigation"
      aria-label="Workspace dock"
    >
      <div className="pointer-events-auto flex max-w-full items-end gap-1 overflow-x-auto rounded-[14px] border border-border/50 bg-background/70 px-2 py-2 shadow-md backdrop-blur-xl supports-[backdrop-filter]:bg-background/55 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {DOCK_APPS.map((app) => {
          const active = app.match(pathname);
          const Icon = app.icon;
          return (
            <Link
              key={app.href}
              href={app.href}
              title={app.label}
              aria-label={app.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 transition-colors",
                active
                  ? "bg-muted/90 text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className="size-5" aria-hidden />
              <span className="max-w-[3.25rem] truncate text-[9px] font-medium">{app.label}</span>
            </Link>
          );
        })}
        <div className="mx-1 h-8 w-px shrink-0 self-center bg-border/80" aria-hidden />
        {onChat ? (
          <Link
            href="/dashboard/chat"
            className={cn(
              "flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 transition-colors",
              "bg-muted/90 text-foreground"
            )}
            aria-current="page"
            title="Assistant"
          >
            <MessageSquare className="size-5" aria-hidden />
            <span className="max-w-[3.25rem] truncate text-[9px] font-medium">Assistant</span>
          </Link>
        ) : (
          <button
            type="button"
            title="Assistant"
            aria-label="Open assistant"
            aria-pressed={assistantOpen}
            onClick={() => toggleAssistant()}
            className={cn(
              "flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 transition-colors",
              assistantOpen
                ? "bg-muted/90 text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <MessageSquare className="size-5" aria-hidden />
            <span className="max-w-[3.25rem] truncate text-[9px] font-medium">Assistant</span>
          </button>
        )}
        {!onChat ? (
          <Link
            href="/dashboard/chat"
            title="Assistant full screen"
            aria-label="Assistant full screen"
            className="flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <span className="text-[9px] font-medium leading-none">Expand</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
