"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  AlertTriangle,
  AtSign,
  Bell,
  CheckCircle,
  Clock,
  RefreshCw,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useKvShareSuggestionsOptional } from "@/contexts/KvShareSuggestionsContext";
import { useToast } from "@/contexts/ToastContext";
import { relativeTime } from "@/components/products/productDirectoryRelativeTime";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type NotificationType =
  | "approval_request"
  | "approval_approved"
  | "approval_rejected"
  | "sync_complete"
  | "sync_failed"
  | "onboarding"
  | "program_expiring"
  | "mention";

export type NotificationFilterTab = "all" | "alerts" | "updates" | "digest";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  approvable?: boolean;
  sourceType?: "note" | "contact" | "document";
  sourceProductName?: string;
  submittedBy?: string;
}

const TYPE_LABELS: Record<NotificationType, string> = {
  approval_request: "Approval request",
  approval_approved: "Approval approved",
  approval_rejected: "Approval declined",
  sync_complete: "Sync complete",
  sync_failed: "Sync issue",
  onboarding: "Getting started",
  program_expiring: "Program renewal",
  mention: "Mention",
};

function notificationCategory(type: NotificationType): NotificationFilterTab {
  switch (type) {
    case "approval_request":
    case "sync_failed":
    case "program_expiring":
    case "approval_rejected":
      return "alerts";
    case "sync_complete":
    case "approval_approved":
    case "mention":
      return "updates";
    case "onboarding":
      return "digest";
    default:
      return "updates";
  }
}

export function notificationTypeLabel(type: NotificationType): string {
  return TYPE_LABELS[type];
}

/**
 * Fixed ISO timestamps (not `Date.now()` at module load) so SSR/CSR markup matches and
 * `relativeTime()` stays stable across hydration.
 */
export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    type: "approval_request",
    title: "Note submitted for agency review",
    body: '"Very responsive. Always gives us priority..." — submitted by Sarah Chen for Aman Tokyo',
    timestamp: "2026-03-25T11:45:00.000Z",
    read: false,
    approvable: true,
    sourceType: "note",
    sourceProductName: "Aman Tokyo",
    submittedBy: "Sarah Chen",
  },
  {
    id: "notif-2",
    type: "approval_request",
    title: "Contact submitted for agency review",
    body: "Dima Wijaya (Managing Director) — submitted by James Rivera for Bali Luxury DMC",
    timestamp: "2026-03-25T11:15:00.000Z",
    read: false,
    approvable: true,
    sourceType: "contact",
    sourceProductName: "Bali Luxury DMC",
    submittedBy: "James Rivera",
  },
  {
    id: "notif-3",
    type: "sync_complete",
    title: "Knowledge Vault sync complete",
    body: "47 documents indexed, 3 new files detected",
    timestamp: "2026-03-25T10:00:00.000Z",
    read: false,
    actionUrl: "/dashboard/knowledge-vault",
    actionLabel: "View",
  },
  {
    id: "notif-4",
    type: "approval_approved",
    title: "Your note was approved",
    body: "Your note on Four Seasons Bora Bora is now visible to the agency",
    timestamp: "2026-03-25T07:00:00.000Z",
    read: true,
  },
  {
    id: "notif-5",
    type: "program_expiring",
    title: "Virtuoso agreement expiring",
    body: "Virtuoso Preferred program expires in 12 days — review renewal terms",
    timestamp: "2026-03-24T12:00:00.000Z",
    read: true,
    actionUrl: "/dashboard/products",
    actionLabel: "View",
  },
  {
    id: "notif-6",
    type: "onboarding",
    title: "Welcome to Enable",
    body: "Complete your profile and connect your first data source to get started",
    timestamp: "2026-03-23T12:00:00.000Z",
    read: true,
    actionLabel: "Get Started",
    actionUrl: "/dashboard/settings",
  },
  {
    id: "notif-7",
    type: "sync_failed",
    title: "Sync issue detected",
    body: "2 files could not be processed from Google Drive — review ingestion health",
    timestamp: "2026-03-25T09:00:00.000Z",
    read: false,
    actionUrl: "/dashboard/knowledge-vault",
    actionLabel: "View",
  },
  {
    id: "notif-8",
    type: "approval_rejected",
    title: "Document submission declined",
    body: 'Your shared document "Rate Card 2026" was not approved — contact admin for details',
    timestamp: "2026-03-24T04:00:00.000Z",
    read: true,
  },
  {
    id: "notif-9",
    type: "mention",
    title: "You were mentioned",
    body: "Alex Kim mentioned you in a team note on Jade Mountain",
    timestamp: "2026-03-25T11:30:00.000Z",
    read: false,
    actionUrl: "/dashboard/products",
    actionLabel: "View",
  },
];

function typeIcon(type: NotificationType): LucideIcon {
  switch (type) {
    case "approval_approved":
      return CheckCircle;
    case "approval_rejected":
      return XCircle;
    case "sync_complete":
      return RefreshCw;
    case "sync_failed":
      return AlertTriangle;
    case "program_expiring":
      return Clock;
    case "mention":
      return AtSign;
    case "approval_request":
    case "onboarding":
    default:
      return Bell;
  }
}

function iconColorClass(type: NotificationType): string {
  switch (type) {
    case "approval_approved":
      return "text-[#5B8A6E]";
    case "approval_rejected":
    case "sync_failed":
      return "text-[#A66B6B]";
    case "sync_complete":
      return "text-muted-foreground";
    case "program_expiring":
      return "text-brand-cta";
    case "mention":
      return "text-brand-cta";
    default:
      return "text-muted-foreground";
  }
}

const FILTER_TABS: { id: NotificationFilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "alerts", label: "Alerts" },
  { id: "updates", label: "Updates" },
  { id: "digest", label: "Digest" },
];

type NotificationPanelContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  unreadCount: number;
  filterTab: NotificationFilterTab;
  setFilterTab: (t: NotificationFilterTab) => void;
  tabFilteredNotifications: AppNotification[];
  merged: AppNotification[];
  markAllRead: () => void;
  clearAll: () => void;
  markOneRead: (id: string) => void;
  onApprove: (n: AppNotification) => void;
  onDeny: (n: AppNotification) => void;
};

const NotificationPanelContext = createContext<NotificationPanelContextValue | null>(null);

export function useNotificationPanel(): NotificationPanelContextValue {
  const ctx = useContext(NotificationPanelContext);
  if (!ctx) {
    throw new Error("useNotificationPanel must be used within NotificationPanelProvider");
  }
  return ctx;
}

export function useNotificationPanelOptional(): NotificationPanelContextValue | null {
  return useContext(NotificationPanelContext);
}

type ProviderProps = { children: ReactNode };

export function NotificationPanelProvider({ children }: ProviderProps) {
  const toast = useToast();
  const kv = useKvShareSuggestionsOptional();
  const [open, setOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<NotificationFilterTab>("all");
  const [kvFeedSuppressed, setKvFeedSuppressed] = useState(false);
  const [dismissedKvIds, setDismissedKvIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    MOCK_NOTIFICATIONS.map((n) => ({ ...n }))
  );

  const kvAsNotifications = useMemo((): AppNotification[] => {
    if (!kv || kvFeedSuppressed) return [];
    return kv.suggestions
      .filter((s) => !dismissedKvIds.includes(s.id))
      .map((s) => ({
        id: `kv-${s.id}`,
        type: "approval_request" as const,
        title: "Document sharing suggestion",
        body: `Suggested sharing "${s.docTitle}" with ${s.teamName}`,
        timestamp: new Date().toISOString(),
        read: false,
        approvable: true,
        sourceType: "document" as const,
        sourceProductName: s.docTitle,
        submittedBy: "Knowledge Vault",
      }));
  }, [kv, kvFeedSuppressed, dismissedKvIds]);

  const merged = useMemo(() => [...kvAsNotifications, ...notifications], [kvAsNotifications, notifications]);

  const unreadCount = useMemo(() => merged.filter((n) => !n.read).length, [merged]);

  const tabFilteredNotifications = useMemo(() => {
    const sorted = [...merged].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    if (filterTab === "all") return sorted;
    return sorted.filter((n) => notificationCategory(n.type) === filterTab);
  }, [merged, filterTab]);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setKvFeedSuppressed(true);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setKvFeedSuppressed(true);
  }, []);

  const markOneRead = useCallback((id: string) => {
    if (id.startsWith("kv-")) {
      const sid = id.slice(3);
      setDismissedKvIds((prev) => (prev.includes(sid) ? prev : [...prev, sid]));
      return;
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const removeById = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleApprove = useCallback(
    (n: AppNotification) => {
      if (n.id.startsWith("kv-") && kv) {
        kv.approve(n.id.slice(3));
        toast({ title: "Document sharing approved", tone: "success" });
        return;
      }
      removeById(n.id);
      const kind =
        n.sourceType === "contact" ? "Contact" : n.sourceType === "document" ? "Document" : "Note";
      toast({ title: `${kind} approved — now visible to agency`, tone: "success" });
    },
    [kv, removeById, toast]
  );

  const handleDeny = useCallback(
    (n: AppNotification) => {
      if (n.id.startsWith("kv-") && kv) {
        kv.decline(n.id.slice(3));
        toast({ title: "Suggestion dismissed", tone: "success" });
        return;
      }
      removeById(n.id);
      toast({ title: "Submission declined", tone: "destructive" });
    },
    [kv, removeById, toast]
  );

  const ctxValue = useMemo(
    () => ({
      open,
      setOpen,
      toggle,
      unreadCount,
      filterTab,
      setFilterTab,
      tabFilteredNotifications,
      merged,
      markAllRead,
      clearAll,
      markOneRead,
      onApprove: handleApprove,
      onDeny: handleDeny,
    }),
    [
      open,
      toggle,
      unreadCount,
      filterTab,
      tabFilteredNotifications,
      merged,
      markAllRead,
      clearAll,
      markOneRead,
      handleApprove,
      handleDeny,
    ]
  );

  return (
    <NotificationPanelContext.Provider value={ctxValue}>{children}</NotificationPanelContext.Provider>
  );
}

type NotificationListProps = {
  items: AppNotification[];
  onMarkRead: (id: string) => void;
  onApprove: (n: AppNotification) => void;
  onDeny: (n: AppNotification) => void;
  onNavigate?: () => void;
  listClassName?: string;
};

function NotificationItemsList({
  items,
  onMarkRead,
  onApprove,
  onDeny,
  onNavigate,
  listClassName,
}: NotificationListProps) {
  if (items.length === 0) {
    return (
      <p className="px-2 py-8 text-center text-sm text-muted-foreground">No notifications</p>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-2.5", listClassName)}>
      {items.map((n) => {
        const Icon = typeIcon(n.type);
        const unread = !n.read;
        return (
          <li key={n.id}>
            <div
              className={cn(
                "overflow-hidden rounded-xl px-3 py-3",
                unread
                  ? "border border-border border-l-2 border-l-[#C9A96E] bg-[rgba(201,169,110,0.02)]"
                  : "border border-border bg-transparent"
              )}
            >
              <div className="flex gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-inset",
                    n.type === "sync_failed" && "bg-[rgba(166,107,107,0.08)]"
                  )}
                >
                  <Icon className={cn("h-4 w-4", iconColorClass(n.type))} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[9px] tracking-wide text-muted-foreground">
                    {notificationTypeLabel(n.type)}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-medium leading-snug",
                      unread ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {n.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-2xs text-muted-foreground">{relativeTime(n.timestamp)}</span>
                    {unread ? (
                      <button
                        type="button"
                        onClick={() => onMarkRead(n.id)}
                        className="text-2xs font-medium text-brand-cta underline-offset-2 hover:underline"
                      >
                        Mark read
                      </button>
                    ) : null}
                    {n.type === "approval_request" && n.approvable ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onApprove(n)}
                          className="rounded-md border border-[rgba(91,138,110,0.35)] bg-[rgba(91,138,110,0.12)] px-2 py-1 text-2xs font-medium text-[#5B8A6E] transition-colors hover:bg-[rgba(91,138,110,0.2)]"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeny(n)}
                          className="rounded-md border border-[rgba(166,107,107,0.35)] bg-[rgba(166,107,107,0.1)] px-2 py-1 text-2xs font-medium text-[#A66B6B] transition-colors hover:bg-[rgba(166,107,107,0.16)]"
                        >
                          Deny
                        </button>
                      </>
                    ) : null}
                    {n.actionUrl && n.actionLabel && n.type !== "approval_request" ? (
                      <Link
                        href={n.actionUrl}
                        onClick={onNavigate}
                        className={cn(
                          "rounded-md px-2 py-1 text-2xs text-brand-cta transition-colors",
                          n.type === "onboarding"
                            ? "border border-[rgba(201,169,110,0.25)] bg-[rgba(201,169,110,0.08)] hover:bg-[rgba(201,169,110,0.12)]"
                            : "border border-border hover:bg-white/[0.04]"
                        )}
                      >
                        {n.actionLabel}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function NotificationFilterRow({
  filterTab,
  setFilterTab,
  merged,
}: {
  filterTab: NotificationFilterTab;
  setFilterTab: (t: NotificationFilterTab) => void;
  merged: AppNotification[];
}) {
  const countFor = (tab: NotificationFilterTab) => {
    if (tab === "all") return merged.length;
    return merged.filter((n) => notificationCategory(n.type) === tab).length;
  };

  return (
    <div
      className="flex flex-wrap gap-x-4 gap-y-1 border-b border-border px-3 py-2"
      role="tablist"
      aria-label="Notification categories"
    >
      {FILTER_TABS.map((t) => {
        const active = filterTab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setFilterTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full border",
                active ? "border-brand-cta bg-brand-cta" : "border-[#6B6560] bg-transparent"
              )}
              aria-hidden
            />
            {t.label}
            <span className="text-muted-foreground">({countFor(t.id)})</span>
          </button>
        );
      })}
    </div>
  );
}

function NotificationPanelHeader({
  unreadTotal,
  totalCount,
  markAllRead,
  clearAll,
  titleId,
  showTitle = true,
}: {
  unreadTotal: number;
  totalCount: number;
  markAllRead: () => void;
  clearAll: () => void;
  titleId?: string;
  showTitle?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 border-b border-border px-3 py-2.5",
        showTitle ? "justify-between" : "justify-end"
      )}
    >
      {showTitle && titleId ? (
        <h2 id={titleId} className="text-base font-semibold text-foreground">
          Notifications
        </h2>
      ) : null}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadTotal === 0}
          className={cn(
            "text-right text-2xs font-medium transition-colors",
            unreadTotal === 0
              ? "cursor-not-allowed text-muted-foreground"
              : "text-brand-cta hover:text-[#D4B383]"
          )}
        >
          Mark all as read
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={totalCount === 0}
          className={cn(
            "text-right text-2xs font-medium transition-colors",
            totalCount === 0
              ? "cursor-not-allowed text-muted-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Clear all
        </button>
      </div>
    </div>
  );
}

const DROPDOWN_TITLE_ID = "dashboard-notifications-dropdown-title";

function NotificationsShell({
  variant,
  onClose,
}: {
  variant: "dropdown" | "page";
  onClose?: () => void;
}) {
  const {
    filterTab,
    setFilterTab,
    tabFilteredNotifications,
    merged,
    markAllRead,
    clearAll,
    markOneRead,
    onApprove,
    onDeny,
    unreadCount,
  } = useNotificationPanel();

  const showHeaderTitle = variant === "dropdown";

  return (
    <div
      className={cn(
        "flex flex-col bg-inset",
        variant === "dropdown" && "max-h-[min(70vh,560px)] w-[360px] max-w-[calc(100vw-2rem)]"
      )}
    >
      <NotificationPanelHeader
        titleId={showHeaderTitle ? DROPDOWN_TITLE_ID : undefined}
        showTitle={showHeaderTitle}
        unreadTotal={unreadCount}
        totalCount={merged.length}
        markAllRead={markAllRead}
        clearAll={clearAll}
      />
      <NotificationFilterRow
        filterTab={filterTab}
        setFilterTab={setFilterTab}
        merged={merged}
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <NotificationItemsList
          items={tabFilteredNotifications}
          onMarkRead={markOneRead}
          onApprove={onApprove}
          onDeny={onDeny}
          onNavigate={onClose}
        />
      </div>
      {variant === "dropdown" ? (
        <div className="border-t border-border px-3 py-2">
          <Link
            href="/dashboard/notifications"
            onClick={onClose}
            className="block text-center text-xs font-medium text-brand-cta hover:text-[#D4B383]"
          >
            View all notifications
          </Link>
        </div>
      ) : null}
    </div>
  );
}

type BellProps = {
  className?: string;
  /** Smaller hit target and icon for dense toolbars. */
  compact?: boolean;
};

/** Bell + notification dropdown (top bar). */
export function SidebarNotificationBell({ className, compact }: BellProps) {
  const ctx = useNotificationPanelOptional();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!ctx) return null;
  const { open, setOpen, unreadCount } = ctx;
  const label =
    hydrated && unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : "Open notifications";

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "relative flex shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors",
            "hover:bg-white/[0.06] hover:text-muted-foreground",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]/50",
            className,
            compact ? "h-7 w-7" : "h-9 w-9"
          )}
        >
          <Bell className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
          {hydrated && unreadCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#DC2626] px-1 text-[8px] font-semibold text-white shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={10}
        collisionPadding={16}
        className="w-[360px] max-w-[calc(100vw-2rem)] border-border p-0"
        aria-labelledby={DROPDOWN_TITLE_ID}
      >
        <NotificationsShell variant="dropdown" onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

/** Full-page notification center at `/dashboard/notifications`. */
const PAGE_TITLE_ID = "dashboard-notifications-page-title";

export function NotificationsCenterPage() {
  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      aria-labelledby={PAGE_TITLE_ID}
    >
      <div className="flex min-h-14 items-center border-b border-border px-3 py-3">
        <h1
          id={PAGE_TITLE_ID}
          className="text-sm font-semibold leading-none text-foreground"
        >
          Notification center
        </h1>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <NotificationsShell variant="page" />
        </div>
      </div>
    </div>
  );
}
