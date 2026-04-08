"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
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

const LINKS: { href: string; label: string; icon: typeof LayoutDashboard }[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/vics", label: "VICs", icon: Users },
  { href: "/dashboard/itineraries", label: "Itineraries", icon: Route },
  { href: "/dashboard/products", label: "Catalog", icon: Building2 },
  { href: "/dashboard/knowledge-vault", label: "Knowledge", icon: BookOpen },
  { href: "/dashboard/search", label: "Search", icon: Search },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/automations", label: "Automations", icon: Zap },
  { href: "/dashboard/chat", label: "Assistant (full)", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function MobileWorkspaceNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="fixed left-3 top-[calc(env(safe-area-inset-top,0px)+4.25rem)] z-[55] h-10 w-10 shrink-0 rounded-lg border border-border bg-background/90 text-muted-foreground shadow-sm backdrop-blur-sm hover:bg-muted hover:text-foreground md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" aria-hidden />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          sheetSide="left"
          showCloseButton
          className="w-[min(288px,100vw)] max-w-none border-border p-0"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          <DialogTitle className="sr-only">Workspace navigation</DialogTitle>
          <nav className="flex flex-col gap-0.5 p-3 pt-14" aria-label="Main">
            {LINKS.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active ? "bg-muted/90 text-foreground" : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
        </DialogContent>
      </Dialog>
    </>
  );
}
