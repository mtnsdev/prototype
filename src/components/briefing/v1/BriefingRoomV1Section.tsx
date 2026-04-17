"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Megaphone,
  BookOpen,
  X,
  Star,
  TrendingUp,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useBriefingRoomV1 } from "@/hooks/useBriefingRoomV1";
import {
  type AnnouncementPriority,
  type BriefingV1Announcement,
  type BriefingV1Commission,
  type BriefingV1Featured,
  type BriefingV1KvHighlight,
  daysUntilEndYmd,
  loadDismissedAnnouncementIds,
  saveDismissedAnnouncementIds,
  filterCommissionsForAdvisor,
  filterFeaturedForAdvisor,
  filterKvForAdvisor,
  isYmdInRange,
  sortAnnouncementsForAdvisor,
  sortCommissionsForAdvisor,
} from "@/lib/briefingRoomV1Store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AppleWidgetCard from "@/components/briefing/AppleWidgetCard";

function firstContentLine(text: string): string {
  const line = text.split(/\r?\n/).find((l) => l.trim().length > 0) ?? text;
  return line.trim();
}

function priorityBadgeClass(p: AnnouncementPriority): string {
  if (p === "urgent") return "border-[var(--color-error)]/35 bg-[var(--color-error)]/10 text-[var(--color-error)]";
  if (p === "important")
    return "border-[var(--color-warning)]/35 bg-[var(--color-warning)]/10 text-[var(--color-warning)]";
  return "border-[var(--color-info)]/35 bg-[var(--color-info)]/10 text-[var(--color-info)]";
}

function priorityLabel(p: AnnouncementPriority): string {
  if (p === "urgent") return "Urgent";
  if (p === "important") return "Important";
  return "Info";
}

function BriefingHref({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const ext = /^https?:\/\//i.test(href);
  if (ext) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function BriefingRoomV1Section() {
  const { user } = useUser();
  const userKey = String(user?.id ?? "anon");
  const { state } = useBriefingRoomV1();

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expandedAnnId, setExpandedAnnId] = useState<string | null>(null);

  useEffect(() => {
    setDismissed(loadDismissedAnnouncementIds(userKey));
  }, [userKey]);

  const persistDismiss = useCallback(
    (next: Set<string>) => {
      setDismissed(next);
      saveDismissedAnnouncementIds(userKey, next);
    },
    [userKey],
  );

  const announcements = useMemo(() => {
    const sorted = sortAnnouncementsForAdvisor(state.announcements);
    return sorted.filter((a) => !dismissed.has(a.id));
  }, [state.announcements, dismissed]);

  const commissions = useMemo(
    () => sortCommissionsForAdvisor(filterCommissionsForAdvisor(state.commissions)).slice(0, 6),
    [state.commissions],
  );
  const commissionsAll = useMemo(
    () => sortCommissionsForAdvisor(filterCommissionsForAdvisor(state.commissions)),
    [state.commissions],
  );

  const featured = useMemo(() => filterFeaturedForAdvisor(state.featured).slice(0, 8), [state.featured]);
  const kv = useMemo(() => filterKvForAdvisor(state.kvHighlights).slice(0, 6), [state.kvHighlights]);

  const annShow = announcements.slice(0, 5);
  const annOverflow = announcements.length > 5;

  /** True if admin has any non-expired published row (ignores advisor dismiss state). */
  const hasAnyAdminPublish = useMemo(() => {
    const now = Date.now();
    const ann = state.announcements.some((a) => {
      if (!a.published) return false;
      if (a.expiresAt && new Date(a.expiresAt).getTime() < now) return false;
      return true;
    });
    const com = state.commissions.some((c) => c.published && isYmdInRange(c.validFrom, c.validUntil));
    const feat = state.featured.some((f) => {
      if (!f.published) return false;
      if (f.expiresAt && new Date(f.expiresAt).getTime() < now) return false;
      return true;
    });
    const kvh = state.kvHighlights.some((k) => {
      if (!k.published) return false;
      if (k.expiresAt && new Date(k.expiresAt).getTime() < now) return false;
      return true;
    });
    return ann || com || feat || kvh;
  }, [state]);

  return (
    <div className="space-y-10">
      {!hasAnyAdminPublish ? (
        <div
          className="rounded-2xl border border-border bg-card/80 p-8 text-center shadow-sm backdrop-blur-sm"
          role="status"
        >
          <p className="text-lg font-medium text-foreground">Welcome to your Briefing Room</p>
          <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground leading-relaxed">
            Your team hasn&apos;t published anything yet. When announcements, incentives, and highlights go live,
            they&apos;ll appear here — your morning snapshot in one place.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AnnouncementsColumn
          items={annShow}
          allCount={announcements.length}
          overflow={annOverflow}
          allItems={announcements}
          expandedAnnId={expandedAnnId}
          setExpandedAnnId={setExpandedAnnId}
          onDismiss={(id) => {
            persistDismiss(new Set([...dismissed, id]));
          }}
        />
        <CommissionColumn items={commissions} total={commissionsAll.length} />
        <FeaturedRow featured={featured} />
        <KvColumn items={kv} />
      </div>

      <BriefingV2PlaceholderCards />
    </div>
  );
}

function AnnouncementsColumn({
  items,
  allCount,
  overflow,
  allItems,
  expandedAnnId,
  setExpandedAnnId,
  onDismiss,
}: {
  items: BriefingV1Announcement[];
  allCount: number;
  overflow: boolean;
  allItems: BriefingV1Announcement[];
  expandedAnnId: string | null;
  setExpandedAnnId: (id: string | null) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <AppleWidgetCard accent="blue" icon={<Megaphone size={20} />} title="Announcements" staggerIndex={0}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active announcements.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <li key={a.id} className="rounded-xl border border-border bg-background/60">
              <div className="flex items-start gap-2 p-3">
                <button
                  type="button"
                  className={cn(
                    "mt-0.5 shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  )}
                  aria-expanded={expandedAnnId === a.id}
                  onClick={() => setExpandedAnnId(expandedAnnId === a.id ? null : a.id)}
                >
                  {expandedAnnId === a.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 gap-y-1">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        priorityBadgeClass(a.priority),
                      )}
                    >
                      {priorityLabel(a.priority)}
                    </span>
                    <p className="text-sm font-medium text-foreground leading-snug">{a.title}</p>
                  </div>
                  {expandedAnnId === a.id ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">{a.body}</p>
                  ) : (
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{firstContentLine(a.body)}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  aria-label="Dismiss announcement"
                  onClick={() => onDismiss(a.id)}
                >
                  <X className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {overflow ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" className="mt-3 h-auto px-0 text-sm font-medium text-[var(--color-info)]">
              View all ({allCount})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto bg-background border-border">
            <DialogHeader>
              <DialogTitle>All announcements</DialogTitle>
            </DialogHeader>
            <ul className="space-y-3 pt-2">
              {allItems.map((a) => (
                <li key={a.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        priorityBadgeClass(a.priority),
                      )}
                    >
                      {priorityLabel(a.priority)}
                    </span>
                    <p className="font-medium text-foreground">{a.title}</p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>
                </li>
              ))}
            </ul>
          </DialogContent>
        </Dialog>
      ) : null}
    </AppleWidgetCard>
  );
}

function CommissionColumn({ items, total }: { items: BriefingV1Commission[]; total: number }) {
  return (
    <AppleWidgetCard
      accent="amber"
      icon={<TrendingUp size={20} />}
      title="Commission opportunities"
      staggerIndex={1}
      rightElement={
        total > 6 ? (
          <span className="text-xs font-medium text-muted-foreground">{total} active</span>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active commission posts right now.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => {
            const days = daysUntilEndYmd(c.validUntil);
            return (
              <li
                key={c.id}
                className="rounded-xl border border-border bg-background/60 px-3 py-2.5 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.partnerName}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {c.category}
                      </span>
                      {c.region ? (
                        <span className="rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {c.region}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-sm font-semibold text-[var(--color-warning)]">{c.commissionLabel}</span>
                    <p className="mt-1 inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      <Clock className="size-3" aria-hidden />
                      Ends in {days}d
                    </p>
                  </div>
                </div>
                {c.link ? (
                  <BriefingHref
                    href={c.link}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-info)] hover:underline"
                  >
                    Details
                    <ExternalLink className="size-3" />
                  </BriefingHref>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {total > 6 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing 6 of {total}. Open the admin Briefing Room to see the full list.
        </p>
      ) : null}
    </AppleWidgetCard>
  );
}

function FeaturedRow({ featured }: { featured: BriefingV1Featured[] }) {
  return (
    <AppleWidgetCard accent="violet" icon={<Star size={20} />} title="Featured & editor's picks" staggerIndex={2}>
      {featured.length === 0 ? (
        <p className="text-sm text-muted-foreground">No featured items yet.</p>
      ) : (
        <div className="-mx-1 flex gap-4 overflow-x-auto pb-2 pt-0.5 scrollbar-thin">
          {featured.map((f) => (
            <BriefingHref
              key={f.id}
              href={f.href}
              className={cn(
                "flex min-w-[240px] max-w-[280px] flex-col rounded-xl border border-border bg-card/90 p-3 shadow-sm transition-colors hover:bg-muted/40",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              <div className="relative mb-2 aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted/50">
                {f.thumbUrl ? (
                  /^https?:\/\//i.test(f.thumbUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external thumbnails vary by host
                    <img src={f.thumbUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Image src={f.thumbUrl} alt="" fill className="object-cover" sizes="280px" />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {f.typeTag}
                  </div>
                )}
              </div>
              <span className="mb-1 inline-flex w-fit rounded-md border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {f.typeTag}
              </span>
              <p className="text-sm font-medium text-foreground leading-snug">{f.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{f.description}</p>
            </BriefingHref>
          ))}
        </div>
      )}
    </AppleWidgetCard>
  );
}

function KvColumn({ items }: { items: BriefingV1KvHighlight[] }) {
  return (
    <AppleWidgetCard accent="cyan" icon={<BookOpen size={20} />} title="Knowledge Vault highlights" staggerIndex={3}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No highlights this week.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((k) => (
            <li key={k.id}>
              <BriefingHref
                href={k.documentHref}
                className="block rounded-xl border border-border bg-background/60 px-3 py-2.5 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{k.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{k.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {k.category}
                      </span>
                      {k.isNew ? (
                        <span className="rounded-md border border-[var(--color-info)]/30 bg-[var(--color-info)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-info)]">
                          New
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" aria-hidden />
                </div>
              </BriefingHref>
            </li>
          ))}
        </ul>
      )}
      <BriefingHref
        href="/dashboard/knowledge-vault"
        className="mt-3 inline-flex text-sm font-medium text-[var(--color-info)] hover:underline"
      >
        View all in Knowledge Vault
      </BriefingHref>
    </AppleWidgetCard>
  );
}

function BriefingV2PlaceholderCards() {
  return (
    <section aria-label="Coming soon" className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/55">
        Connect to unlock
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/15 px-5 py-6">
          <p className="text-sm font-medium text-foreground/90">Upcoming trips & departures</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Coming soon — connect Axus to see your upcoming departures in one place.
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/15 px-5 py-6">
          <p className="text-sm font-medium text-foreground/90">Travel advisories</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Coming soon — destination alerts and entry requirements, tailored to your trips.
          </p>
        </div>
      </div>
    </section>
  );
}
