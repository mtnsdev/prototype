"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalSearchOptional } from "@/contexts/GlobalSearchContext";
import { useDashboardShell } from "@/contexts/DashboardShellContext";
import { getDefaultShellCrumbs, type ShellCrumb } from "@/lib/dashboardShellCrumbs";
import { useNotificationPanelOptional } from "@/components/dashboard/DashboardNotifications";
import { APP_SHELL_PATH_ROW, DASHBOARD_CHROME_HEADER_ROW } from "@/lib/dashboardChrome";
import { Button } from "@/components/ui/button";
import { IS_PREVIEW_MODE } from "@/config/preview";

function CrumbLink({ crumb, isLast }: { crumb: ShellCrumb; isLast: boolean }) {
  if (isLast || !crumb.href) {
    return (
      <span className="min-w-0 truncate text-xs font-medium text-foreground" title={crumb.label}>
        {crumb.label}
      </span>
    );
  }
  return (
    <Link
      href={crumb.href}
      className="min-w-0 truncate text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      title={crumb.label}
    >
      {crumb.label}
    </Link>
  );
}

export default function DashboardShellChrome() {
  const pathname = usePathname();
  const search = useGlobalSearchOptional();
  const { manualCrumbs } = useDashboardShell();
  const notificationPanel = useNotificationPanelOptional();
  const unread = notificationPanel?.unreadCount ?? 0;

  const crumbs = manualCrumbs ?? getDefaultShellCrumbs(pathname);

  return (
    <div className="shrink-0">
      <div
        className={cn(
          DASHBOARD_CHROME_HEADER_ROW,
          "justify-between pl-[3.25rem] md:pl-4"
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 pr-2">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold tracking-tight text-foreground">Enable VIC</span>
            {IS_PREVIEW_MODE ? (
              <span className="shrink-0 rounded border border-border bg-muted/30 px-1.5 py-px text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                Prototype
              </span>
            ) : null}
          </div>
          <p className="truncate text-2xs text-muted-foreground/75" title="Active workspace">
            Travel Lustre
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 gap-2 px-2.5 text-xs text-muted-foreground hover:text-foreground",
              !search && "pointer-events-none opacity-50"
            )}
            onClick={() => search?.openSearch()}
            aria-label="Search or jump (Command K)"
            title="Search or jump"
          >
            <Search className="size-3.5 shrink-0 opacity-80" aria-hidden />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden rounded border border-border bg-muted/40 px-1.5 py-px font-mono text-[9px] text-muted-foreground/90 sm:inline">
              ⌘K
            </kbd>
          </Button>
          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg" asChild>
            <Link href="/dashboard/notifications" aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}>
              <Bell className="size-4 text-muted-foreground" aria-hidden />
              {unread > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-[var(--muted-error-border)] bg-[var(--muted-error-bg)] px-1 text-[8px] font-semibold text-[var(--muted-error-text)]">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>
          </Button>
        </div>
      </div>

      <nav
        className={cn(
          APP_SHELL_PATH_ROW,
          "overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        )}
        aria-label="Location"
      >
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 ? (
                <span className="shrink-0 text-muted-foreground/35" aria-hidden>
                  /
                </span>
              ) : null}
              <CrumbLink crumb={crumb} isLast={isLast} />
            </span>
          );
        })}
      </nav>
    </div>
  );
}
