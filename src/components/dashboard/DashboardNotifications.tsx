"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  AtSign,
  Bell,
  CheckCircle,
  Clock,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useKvShareSuggestionsOptional } from "@/contexts/KvShareSuggestionsContext";
import { usePartnerPrograms } from "@/contexts/PartnerProgramsContext";
import { useToast } from "@/contexts/ToastContext";
import {
  buildPartnerProgramAlerts,
  type PartnerProgramAlert,
} from "@/lib/partnerProgramNotifications";
import { relativeTime } from "@/components/products/productDirectoryRelativeTime";
import { cn } from "@/lib/utils";

export type NotificationType =
  | "approval_request"
  | "approval_approved"
  | "approval_rejected"
  | "sync_complete"
  | "sync_failed"
  | "onboarding"
  | "program_expiring"
  | "promotion_starting"
  | "promotion_ending"
  | "partner_link_expiring"
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
  promotion_starting: "Incentive starting",
  promotion_ending: "Incentive ending",
  partner_link_expiring: "Property link",
  mention: "Mention",
};

function notificationCategory(type: NotificationType): NotificationFilterTab {
  switch (type) {
    case "approval_request":
    case "sync_failed":
    case "program_expiring":
    case "promotion_starting":
    case "promotion_ending":
    case "partner_link_expiring":
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

function partnerAlertToApp(a: PartnerProgramAlert): AppNotification {
  const type: NotificationType =
    a.kind === "program_renewal"
      ? "program_expiring"
      : a.kind === "promotion_starting"
        ? "promotion_starting"
        : a.kind === "promotion_ending"
          ? "promotion_ending"
          : "partner_link_expiring";
  return {
    id: a.id,
    type,
    title: a.title,
    body: a.body,
    timestamp: a.timestamp,
    read: false,
    actionUrl: a.actionUrl,
    actionLabel: a.actionLabel,
  };
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
    body: '"Very responsive. Always gives us priority…" — submitted by Sarah Chen for Aman Tokyo',
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
    case "promotion_ending":
      return Clock;
    case "promotion_starting":
      return Sparkles;
    case "partner_link_expiring":
      return AlertTriangle;
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
    case "partner_link_expiring":
      return "text-[#A66B6B]";
    case "sync_complete":
      return "text-muted-foreground";
    case "program_expiring":
    case "promotion_ending":
      return "text-brand-cta";
    case "promotion_starting":
      return "text-[#C9A96E]";
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

const NOTIFICATION_STORAGE_KEY = "dashboard.notificationPanel.v1";
const DISMISS_UNDO_STORAGE_KEY = "dashboard.notificationDismissUndo.v1";
/** Undo remains available after refresh until this TTL from dismiss time. */
const DISMISS_UNDO_TTL_MS = 3 * 60 * 1000;
const RESUME_TOAST_MS = 45_000;

type PendingDismissUndo =
  | { kind: "standard"; notification: AppNotification; expiresAt: number }
  | { kind: "kv"; sid: string; expiresAt: number }
  | { kind: "partner"; notifId: string; expiresAt: number };

function readPendingDismissUndo(): PendingDismissUndo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DISMISS_UNDO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingDismissUndo;
    if (typeof parsed.expiresAt !== "number" || Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(DISMISS_UNDO_STORAGE_KEY);
      return null;
    }
    if (parsed.kind === "standard" && parsed.notification?.id) return parsed;
    if (parsed.kind === "kv" && typeof parsed.sid === "string") return parsed;
    if (parsed.kind === "partner" && typeof parsed.notifId === "string") return parsed;
    window.localStorage.removeItem(DISMISS_UNDO_STORAGE_KEY);
    return null;
  } catch {
    try {
      window.localStorage.removeItem(DISMISS_UNDO_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

function writePendingDismissUndo(data: PendingDismissUndo) {
  try {
    window.localStorage.setItem(DISMISS_UNDO_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}

function clearPendingDismissUndo() {
  try {
    window.localStorage.removeItem(DISMISS_UNDO_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

type NotificationPanelContextValue = {
  unreadCount: number;
  recentCount: number;
  filterTab: NotificationFilterTab;
  setFilterTab: (t: NotificationFilterTab) => void;
  unreadOnly: boolean;
  setUnreadOnly: (v: boolean) => void;
  tabFilteredNotifications: AppNotification[];
  merged: AppNotification[];
  markAllRead: () => void;
  clearAll: () => void;
  markOneRead: (id: string) => void;
  dismissOne: (n: AppNotification) => void;
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
  const router = useRouter();
  const kv = useKvShareSuggestionsOptional();
  const partnerPrograms = usePartnerPrograms();
  const resumeUndoToastFiredRef = useRef(false);
  const prevPartnerAlertCountRef = useRef<number | null>(null);
  const partnerAlertToastPrimedRef = useRef(false);
  const [filterTab, setFilterTab] = useState<NotificationFilterTab>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [kvFeedSuppressed, setKvFeedSuppressed] = useState(false);
  const [partnerProgramFeedSuppressed, setPartnerProgramFeedSuppressed] = useState(false);
  const [dismissedKvIds, setDismissedKvIds] = useState<string[]>([]);
  const [dismissedPartnerProgramNotifIds, setDismissedPartnerProgramNotifIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    MOCK_NOTIFICATIONS.map((n) => ({ ...n }))
  );
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (!raw) {
        setRestored(true);
        return;
      }
      const parsed = JSON.parse(raw) as {
        notifications?: AppNotification[];
        filterTab?: NotificationFilterTab;
        unreadOnly?: boolean;
        kvFeedSuppressed?: boolean;
        partnerProgramFeedSuppressed?: boolean;
        dismissedKvIds?: string[];
        dismissedPartnerProgramNotifIds?: string[];
      };
      if (Array.isArray(parsed.notifications)) setNotifications(parsed.notifications);
      if (parsed.filterTab) setFilterTab(parsed.filterTab);
      if (typeof parsed.unreadOnly === "boolean") setUnreadOnly(parsed.unreadOnly);
      if (typeof parsed.kvFeedSuppressed === "boolean") setKvFeedSuppressed(parsed.kvFeedSuppressed);
      if (typeof parsed.partnerProgramFeedSuppressed === "boolean") {
        setPartnerProgramFeedSuppressed(parsed.partnerProgramFeedSuppressed);
      }
      if (Array.isArray(parsed.dismissedKvIds)) setDismissedKvIds(parsed.dismissedKvIds);
      if (Array.isArray(parsed.dismissedPartnerProgramNotifIds)) {
        setDismissedPartnerProgramNotifIds(parsed.dismissedPartnerProgramNotifIds);
      }
    } catch {
      // Keep defaults when persistence is unavailable or corrupted.
    } finally {
      setRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!restored) return;
    window.localStorage.setItem(
      NOTIFICATION_STORAGE_KEY,
      JSON.stringify({
        notifications,
        filterTab,
        unreadOnly,
        kvFeedSuppressed,
        partnerProgramFeedSuppressed,
        dismissedKvIds,
        dismissedPartnerProgramNotifIds,
      })
    );
  }, [
    dismissedKvIds,
    dismissedPartnerProgramNotifIds,
    filterTab,
    kvFeedSuppressed,
    partnerProgramFeedSuppressed,
    notifications,
    restored,
    unreadOnly,
  ]);

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

  const partnerProgramAsNotifications = useMemo((): AppNotification[] => {
    if (partnerProgramFeedSuppressed) return [];
    const alerts = buildPartnerProgramAlerts(partnerPrograms.snapshot);
    return alerts
      .filter((a) => !dismissedPartnerProgramNotifIds.includes(a.id))
      .map(partnerAlertToApp);
  }, [
    partnerProgramFeedSuppressed,
    partnerPrograms.snapshot,
    partnerPrograms.revision,
    dismissedPartnerProgramNotifIds,
  ]);

  useEffect(() => {
    if (!restored) return;
    const count = partnerProgramAsNotifications.length;
    if (!partnerAlertToastPrimedRef.current) {
      partnerAlertToastPrimedRef.current = true;
      prevPartnerAlertCountRef.current = count;
      return;
    }
    const prev = prevPartnerAlertCountRef.current ?? 0;
    if (count > prev) {
      const delta = count - prev;
      toast({
        title: delta === 1 ? "New partner program alert" : `${delta} new partner program alerts`,
        description: "Temporary incentives, renewals, or expiring property links.",
        tone: "default",
        action: {
          label: "Open",
          onClick: () => router.push("/dashboard/notifications"),
        },
      });
    }
    prevPartnerAlertCountRef.current = count;
  }, [restored, partnerProgramAsNotifications.length, router, toast]);

  const merged = useMemo(
    () => [...kvAsNotifications, ...partnerProgramAsNotifications, ...notifications],
    [kvAsNotifications, partnerProgramAsNotifications, notifications]
  );

  const unreadCount = useMemo(() => merged.filter((n) => !n.read).length, [merged]);
  const recentCount = useMemo(() => {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    return merged.filter((n) => now - new Date(n.timestamp).getTime() <= DAY_MS).length;
  }, [merged]);

  const tabFilteredNotifications = useMemo(() => {
    const sorted = [...merged].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const byTab =
      filterTab === "all" ? sorted : sorted.filter((n) => notificationCategory(n.type) === filterTab);
    return unreadOnly ? byTab.filter((n) => !n.read) : byTab;
  }, [merged, filterTab, unreadOnly]);

  const markAllRead = useCallback(() => {
    clearPendingDismissUndo();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setKvFeedSuppressed(true);
    setPartnerProgramFeedSuppressed(true);
  }, []);

  const clearAll = useCallback(() => {
    clearPendingDismissUndo();
    setNotifications([]);
    setKvFeedSuppressed(true);
    setPartnerProgramFeedSuppressed(true);
    setDismissedPartnerProgramNotifIds([]);
  }, []);

  const markOneRead = useCallback((id: string) => {
    if (id.startsWith("kv-")) {
      const sid = id.slice(3);
      setDismissedKvIds((prev) => (prev.includes(sid) ? prev : [...prev, sid]));
      return;
    }
    if (id.startsWith("pp-")) {
      setDismissedPartnerProgramNotifIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return;
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const restoreStandardAfterDismiss = useCallback((snapshot: AppNotification) => {
    setNotifications((prev) => {
      if (prev.some((item) => item.id === snapshot.id)) return prev;
      const next = [...prev, { ...snapshot }];
      return next.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    });
    clearPendingDismissUndo();
  }, []);

  const restoreKvAfterDismiss = useCallback((sid: string) => {
    setDismissedKvIds((prev) => prev.filter((id) => id !== sid));
    clearPendingDismissUndo();
  }, []);

  const restorePartnerAfterDismiss = useCallback((notifId: string) => {
    setDismissedPartnerProgramNotifIds((prev) => prev.filter((id) => id !== notifId));
    clearPendingDismissUndo();
  }, []);

  useEffect(() => {
    if (!restored) return;
    if (resumeUndoToastFiredRef.current) return;
    const pending = readPendingDismissUndo();
    if (!pending) return;
    resumeUndoToastFiredRef.current = true;
    if (pending.kind === "kv") {
      toast({
        title: "Suggestion hidden",
        description: "Undo is still available after refresh.",
        tone: "default",
        duration: RESUME_TOAST_MS,
        action: { label: "Undo", onClick: () => restoreKvAfterDismiss(pending.sid) },
      });
    } else if (pending.kind === "partner") {
      toast({
        title: "Notification dismissed",
        description: "Undo is still available after refresh.",
        tone: "default",
        duration: RESUME_TOAST_MS,
        action: { label: "Undo", onClick: () => restorePartnerAfterDismiss(pending.notifId) },
      });
    } else if (pending.kind === "standard") {
      toast({
        title: "Notification dismissed",
        description: "Undo is still available after refresh.",
        tone: "default",
        duration: RESUME_TOAST_MS,
        action: {
          label: "Undo",
          onClick: () => restoreStandardAfterDismiss(pending.notification),
        },
      });
    }
  }, [restored, toast, restoreKvAfterDismiss, restorePartnerAfterDismiss, restoreStandardAfterDismiss]);

  const dismissOne = useCallback(
    (n: AppNotification) => {
      const expiresAt = Date.now() + DISMISS_UNDO_TTL_MS;
      if (n.id.startsWith("kv-")) {
        const sid = n.id.slice(3);
        setDismissedKvIds((prev) => (prev.includes(sid) ? prev : [...prev, sid]));
        writePendingDismissUndo({ kind: "kv", sid, expiresAt });
        toast({
          title: "Suggestion hidden",
          description: "Undo to show it in notifications again.",
          tone: "default",
          action: {
            label: "Undo",
            onClick: () => restoreKvAfterDismiss(sid),
          },
        });
        return;
      }
      if (n.id.startsWith("pp-")) {
        setDismissedPartnerProgramNotifIds((prev) => (prev.includes(n.id) ? prev : [...prev, n.id]));
        writePendingDismissUndo({ kind: "partner", notifId: n.id, expiresAt });
        toast({
          title: "Notification dismissed",
          description: "Undo to show partner alerts again.",
          tone: "default",
          action: {
            label: "Undo",
            onClick: () => restorePartnerAfterDismiss(n.id),
          },
        });
        return;
      }
      const snapshot = { ...n };
      setNotifications((prev) => prev.filter((item) => item.id !== n.id));
      writePendingDismissUndo({ kind: "standard", notification: snapshot, expiresAt });
      toast({
        title: "Notification dismissed",
        description: "Undo to restore it to your list.",
        tone: "default",
        action: {
          label: "Undo",
          onClick: () => restoreStandardAfterDismiss(snapshot),
        },
      });
    },
    [toast, restoreKvAfterDismiss, restorePartnerAfterDismiss, restoreStandardAfterDismiss]
  );

  const removeById = useCallback((id: string) => {
    const pending = readPendingDismissUndo();
    if (pending?.kind === "standard" && pending.notification.id === id) {
      clearPendingDismissUndo();
    }
    if (pending?.kind === "kv" && id.startsWith("kv-") && pending.sid === id.slice(3)) {
      clearPendingDismissUndo();
    }
    if (pending?.kind === "partner" && pending.notifId === id) {
      clearPendingDismissUndo();
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleApprove = useCallback(
    (n: AppNotification) => {
      if (n.id.startsWith("kv-") && kv) {
        const sid = n.id.slice(3);
        const pending = readPendingDismissUndo();
        if (pending?.kind === "kv" && pending.sid === sid) clearPendingDismissUndo();
        kv.approve(sid);
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
        const sid = n.id.slice(3);
        const pending = readPendingDismissUndo();
        if (pending?.kind === "kv" && pending.sid === sid) clearPendingDismissUndo();
        kv.decline(sid);
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
      unreadCount,
      recentCount,
      filterTab,
      setFilterTab,
      unreadOnly,
      setUnreadOnly,
      tabFilteredNotifications,
      merged,
      markAllRead,
      clearAll,
      markOneRead,
      dismissOne,
      onApprove: handleApprove,
      onDeny: handleDeny,
    }),
    [
      unreadCount,
      recentCount,
      filterTab,
      unreadOnly,
      tabFilteredNotifications,
      merged,
      markAllRead,
      clearAll,
      markOneRead,
      dismissOne,
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
  filterTab: NotificationFilterTab;
  unreadOnly: boolean;
  onMarkRead: (id: string) => void;
  onDismiss: (n: AppNotification) => void;
  onApprove: (n: AppNotification) => void;
  onDeny: (n: AppNotification) => void;
  onNavigate?: () => void;
  listClassName?: string;
};

function NotificationItemsList({
  items,
  filterTab,
  unreadOnly,
  onMarkRead,
  onDismiss,
  onApprove,
  onDeny,
  onNavigate,
  listClassName,
}: NotificationListProps) {
  const grouped = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const sections: Array<{ key: "today" | "yesterday" | "earlier"; label: string; items: AppNotification[] }> = [
      { key: "today", label: "Today", items: [] },
      { key: "yesterday", label: "Yesterday", items: [] },
      { key: "earlier", label: "Earlier", items: [] },
    ];
    for (const n of items) {
      const time = new Date(n.timestamp).getTime();
      if (time >= startOfToday) {
        sections[0].items.push(n);
      } else if (time >= startOfYesterday) {
        sections[1].items.push(n);
      } else {
        sections[2].items.push(n);
      }
    }
    return sections.filter((s) => s.items.length > 0);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-3 py-10 text-center">
        <Bell className="h-5 w-5 text-muted-foreground" aria-hidden />
        <p className="mt-3 text-sm font-medium text-foreground">All caught up</p>
        <p className="mt-1 max-w-[28ch] text-xs leading-relaxed text-muted-foreground">
          {unreadOnly
            ? "No unread notifications match your current filters."
            : filterTab === "all"
              ? "New updates, mentions, and approvals will appear here."
              : `No ${filterTab} notifications right now.`}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", listClassName)}>
      {grouped.map((section) => (
        <section key={section.key} aria-label={`${section.label} notifications`}>
          <h3 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {section.label}
          </h3>
          <ul className="flex flex-col gap-2.5">
            {section.items.map((n) => {
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
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-mono text-[9px] tracking-wide text-muted-foreground">
                            {notificationTypeLabel(n.type)}
                          </p>
                          {unread ? (
                            <span className="mt-0.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-brand-cta" />
                          ) : null}
                        </div>
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
                              aria-label={`Mark notification "${n.title}" as read`}
                              className="text-2xs font-medium text-brand-cta underline-offset-2 hover:underline"
                            >
                              Mark read
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => onDismiss(n)}
                            aria-label={`Dismiss notification "${n.title}"`}
                            className="text-2xs font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
                          >
                            Dismiss
                          </button>
                          {n.type === "approval_request" && n.approvable ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onApprove(n)}
                                aria-label={`Approve request "${n.title}"`}
                                className="rounded-md border border-[rgba(91,138,110,0.35)] bg-[rgba(91,138,110,0.12)] px-2 py-1 text-2xs font-medium text-[#5B8A6E] transition-colors hover:bg-[rgba(91,138,110,0.2)]"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeny(n)}
                                aria-label={`Deny request "${n.title}"`}
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
        </section>
      ))}
    </div>
  );
}

function NotificationFilterRow({
  filterTab,
  setFilterTab,
  unreadOnly,
  setUnreadOnly,
  merged,
}: {
  filterTab: NotificationFilterTab;
  setFilterTab: (t: NotificationFilterTab) => void;
  unreadOnly: boolean;
  setUnreadOnly: (v: boolean) => void;
  merged: AppNotification[];
}) {
  const countFor = (tab: NotificationFilterTab) => {
    const inTab = tab === "all" ? merged : merged.filter((n) => notificationCategory(n.type) === tab);
    return unreadOnly ? inTab.filter((n) => !n.read).length : inTab.length;
  };

  return (
    <div className="border-b border-border px-3 py-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1" role="tablist" aria-label="Notification categories">
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
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setUnreadOnly(!unreadOnly)}
          aria-pressed={unreadOnly}
          className={cn(
            "rounded-md border px-2 py-1 text-2xs font-medium transition-colors",
            unreadOnly
              ? "border-brand-cta bg-[rgba(201,169,110,0.12)] text-brand-cta"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          Unread only
        </button>
      </div>
    </div>
  );
}

function NotificationPanelHeader({
  unreadTotal,
  totalCount,
  recentCount,
  markAllRead,
  clearAll,
  titleId,
  showTitle = true,
}: {
  unreadTotal: number;
  totalCount: number;
  recentCount: number;
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
        <div>
          <h2 id={titleId} className="text-base font-semibold text-foreground">
            Notifications
          </h2>
          <p className="mt-0.5 text-2xs text-muted-foreground">
            {unreadTotal} unread · {recentCount} in the last 24h
          </p>
        </div>
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

function NotificationsShell() {
  const {
    filterTab,
    setFilterTab,
    unreadOnly,
    setUnreadOnly,
    tabFilteredNotifications,
    merged,
    markAllRead,
    clearAll,
    markOneRead,
    dismissOne,
    onApprove,
    onDeny,
    unreadCount,
    recentCount,
  } = useNotificationPanel();
  const prevUnreadRef = useRef(unreadCount);
  const [announcement, setAnnouncement] = useState<string>("");

  useEffect(() => {
    if (prevUnreadRef.current !== unreadCount) {
      const delta = unreadCount - prevUnreadRef.current;
      const action = delta < 0 ? "decreased" : "increased";
      setAnnouncement(`Unread notifications ${action} to ${unreadCount}.`);
      prevUnreadRef.current = unreadCount;
    }
  }, [unreadCount]);

  return (
    <div className="flex flex-col bg-background">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      <NotificationPanelHeader
        showTitle={false}
        unreadTotal={unreadCount}
        totalCount={merged.length}
        recentCount={recentCount}
        markAllRead={markAllRead}
        clearAll={clearAll}
      />
      <NotificationFilterRow
        filterTab={filterTab}
        setFilterTab={setFilterTab}
        unreadOnly={unreadOnly}
        setUnreadOnly={setUnreadOnly}
        merged={merged}
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <NotificationItemsList
          items={tabFilteredNotifications}
          filterTab={filterTab}
          unreadOnly={unreadOnly}
          onMarkRead={markOneRead}
          onDismiss={dismissOne}
          onApprove={onApprove}
          onDeny={onDeny}
        />
      </div>
    </div>
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
          <NotificationsShell />
        </div>
      </div>
    </div>
  );
}
