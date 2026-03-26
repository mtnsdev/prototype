"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Clock,
  FileCheck,
  Megaphone,
  Share2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useKnowledgeVaultEmailsOptional } from "@/contexts/KnowledgeVaultEmailContext";
import { useKvShareSuggestions } from "@/contexts/KvShareSuggestionsContext";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";

type Priority = "urgent" | "action" | "normal" | "low";
type Tab = "All" | "Action required" | "Sharing" | "System";

type Notif = {
  id: string;
  icon: LucideIcon;
  message: string;
  time: string;
  read: boolean;
  priority: Priority;
  tab: Tab;
  href?: string;
  actions?: { label: string; primary: boolean; onClick?: () => void }[];
};

const MOCK: Notif[] = [
  {
    id: "sync",
    icon: AlertTriangle,
    message: "Google Drive — Shared sync failed. Last successful sync: 2h ago.",
    time: "15 min ago",
    read: false,
    priority: "urgent",
    tab: "System",
    href: "/dashboard/settings/integrations",
    actions: [
      { label: "Retry sync", primary: true },
      { label: "View details", primary: false },
    ],
  },
  {
    id: "commission",
    icon: Clock,
    message: "Virtuoso Preferred commission for Aman Tokyo expires in 28 days",
    time: "1h ago",
    read: false,
    priority: "urgent",
    tab: "All",
  },
  {
    id: "acuity",
    icon: FileCheck,
    message: "Acuity report for Eric Tournier is complete",
    time: "3h ago",
    read: true,
    priority: "normal",
    tab: "All",
    href: "/dashboard/vics",
  },
  {
    id: "vic-share",
    icon: Users,
    message: "Marie Limousis shared VIC \"Jacques Veyrat\" with you",
    time: "5h ago",
    read: true,
    priority: "normal",
    tab: "Sharing",
    href: "/dashboard/vics",
  },
  {
    id: "announce",
    icon: Megaphone,
    message: "New announcement: \"2026 Hotel Launches\" posted by Kristin",
    time: "2 days ago",
    read: true,
    priority: "low",
    tab: "System",
    href: "/dashboard",
  },
];

type Props = {
  compact?: boolean;
};

export default function DashboardNotifications({ compact }: Props) {
  const kv = useKnowledgeVaultEmailsOptional();
  const { suggestions } = useKvShareSuggestions();
  const { user } = useUser();
  const isAdmin = user?.role === "admin" || user?.role === "agency_admin";
  const [tab, setTab] = useState<Tab>("All");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const kvPending = kv?.unprocessedCount ?? 0;

  const dynamicSharing: Notif[] = useMemo(() => {
    return suggestions.map((s, i) => ({
      id: `sug-${s.docId}-${i}`,
      icon: Share2,
      message: `Suggested sharing "${s.docTitle}" with ${s.teamName}`,
      time: "Just now",
      read: false,
      priority: "action" as const,
      tab: "Action required" as const,
      href: "/dashboard/knowledge-vault",
      actions: isAdmin
        ? [
            { label: "Approve", primary: true },
            { label: "Dismiss", primary: false },
          ]
        : undefined,
    }));
  }, [suggestions, isAdmin]);

  const kvNotif: Notif | null =
    kvPending > 0
      ? {
          id: "kv-email",
          icon: FileCheck,
          message:
            kvPending === 1
              ? "1 unprocessed email to review in Knowledge Vault"
              : `${kvPending} unprocessed emails to review`,
          time: "Today",
          read: false,
          priority: "normal",
          tab: "All",
          href: "/dashboard/email-ingestion",
        }
      : null;

  const all = useMemo(() => {
    const base = [...dynamicSharing, ...(kvNotif ? [kvNotif] : []), ...MOCK];
    return base.map((n) => (readIds.has(n.id) ? { ...n, read: true } : n));
  }, [dynamicSharing, kvNotif, readIds]);

  const filtered = useMemo(() => {
    if (tab === "All") return all;
    if (tab === "Action required")
      return all.filter((n) => n.tab === "Action required" || n.priority === "action");
    if (tab === "Sharing") return all.filter((n) => n.tab === "Sharing");
    if (tab === "System") return all.filter((n) => n.tab === "System");
    return all;
  }, [all, tab]);

  const unreadCount = all.filter((n) => !n.read).length;

  const markAllRead = () => {
    setReadIds(new Set(all.map((n) => n.id)));
  };

  const iconWrap = (p: Priority) =>
    cn(
      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
      p === "urgent" && "bg-[rgba(166,107,107,0.1)]",
      p === "action" && "bg-[rgba(201,169,110,0.1)]",
      p === "normal" && "bg-[rgba(255,255,255,0.03)]",
      p === "low" && "bg-[rgba(255,255,255,0.02)]"
    );

  const iconColor = (p: Priority) =>
    cn(
      "w-3.5 h-3.5",
      p === "urgent" && "text-[#A66B6B]",
      p === "action" && "text-[#C9A96E]",
      p === "normal" && "text-[#6B6560]",
      p === "low" && "text-[#4A4540]"
    );

  return (
    <div className="relative">
      <details className="group">
        <summary
          className={cn(
            "list-none cursor-pointer relative shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-[#6B6560] hover:bg-[rgba(255,255,255,0.03)] hover:text-[#9B9590] transition-colors",
            compact && "p-0",
            unreadCount > 0 && "text-[#9B9590]"
          )}
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <Bell className="w-[16px] h-[16px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-[rgba(166,107,107,0.85)] text-[8px] text-[#F5F0EB] flex items-center justify-center tabular-nums leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </summary>
        <div
          className={cn(
            "absolute right-0 top-full mt-2 w-[min(100vw-1.5rem,380px)] z-[80]",
            "bg-[#0c0c12] border border-[rgba(255,255,255,0.06)] rounded-2xl shadow-2xl overflow-hidden"
          )}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(255,255,255,0.03)]">
            <span className="text-[12px] text-[#F5F0EB]">Notifications</span>
            <button
              type="button"
              onClick={markAllRead}
              className="text-[10px] text-[#C9A96E] hover:text-[#D4B87E]"
            >
              Mark all read
            </button>
          </div>
          <div className="flex items-center gap-1 px-4 py-2 border-b border-[rgba(255,255,255,0.03)] flex-wrap">
            {(["All", "Action required", "Sharing", "System"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "px-2 py-1 rounded text-[10px] transition-colors",
                  tab === t
                    ? "text-[#F5F0EB] bg-[rgba(255,255,255,0.04)]"
                    : "text-[#4A4540] hover:text-[#6B6560]"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-5 py-10 text-center text-[12px] text-[#6B6560]">No notifications</div>
            ) : (
              filtered.map((n) => {
                const Icon = n.icon;
                const rowClass = cn(
                  "flex items-start gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.02)] transition-colors",
                  !n.read && "bg-[rgba(201,169,110,0.02)]",
                  n.href && !n.actions && "cursor-pointer hover:bg-[rgba(255,255,255,0.015)]"
                );
                const body = (
                  <>
                    <div className={iconWrap(n.priority)}>
                      <Icon className={iconColor(n.priority)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] shrink-0" />}
                        <span
                          className={cn(
                            "text-[12px] line-clamp-2",
                            n.read ? "text-[#6B6560]" : "text-[#F5F0EB]"
                          )}
                        >
                          {n.message}
                        </span>
                      </div>
                      <span className="text-[9px] text-[#4A4540] mt-1 block">{n.time}</span>
                      {n.actions && (
                        <div className="flex items-center gap-2 mt-2">
                          {n.actions.map((a) => (
                            <button
                              key={a.label}
                              type="button"
                              className={cn(
                                "px-2 py-1 rounded text-[10px] transition-colors",
                                a.primary
                                  ? "bg-[rgba(201,169,110,0.1)] text-[#C9A96E] hover:bg-[rgba(201,169,110,0.16)]"
                                  : "text-[#6B6560] hover:text-[#9B9590] border border-[rgba(255,255,255,0.04)]"
                              )}
                            >
                              {a.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
                if (n.href && !n.actions) {
                  return (
                    <Link key={n.id} href={n.href} className={rowClass}>
                      {body}
                    </Link>
                  );
                }
                return (
                  <div key={n.id} className={rowClass}>
                    {body}
                  </div>
                );
              })
            )}
          </div>
          <div className="px-5 py-2.5 border-t border-[rgba(255,255,255,0.03)]">
            <Link href="/dashboard" className="text-[10px] text-[#6B6560] hover:text-[#9B9590]">
              View all notifications →
            </Link>
          </div>
        </div>
      </details>
    </div>
  );
}
