"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Pin,
  Trash2,
  Megaphone,
  Bell,
  Plus,
  Eye,
  FileEdit,
  Gift,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EditIconButton } from "@/components/ui/edit-icon-button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/contexts/ToastContext";
import type { CommissionAlertItem, NewsAlertItem } from "@/types/briefing";
import {
  getBriefingHubAgencyNoteSeed,
  getBriefingHubIncentiveSeed,
  getBriefingHubNewsSeed,
} from "../briefingMockData";
import { BRIEFING_PANEL_SURFACE } from "@/lib/briefingSurface";
import { cn } from "@/lib/utils";
import { useBriefingAgencyHubLayout } from "@/hooks/useBriefingAgencyHubLayout";
import {
  AGENCY_HUB_USER_WIDGET_IDS,
  type AgencyHubUserWidgetId,
  type AgencyHubUserWidgetLayout,
} from "@/lib/briefingAgencyHubUserLayout";
import AppleWidgetCard, { type WidgetCardDensity } from "../AppleWidgetCard";
import BriefingAgencyHubLayoutPopover from "../BriefingAgencyHubLayoutPopover";
import { mergeWidgetHeaderRight } from "../mergeWidgetHeaderRight";
import {
  HUB_ANNOUNCEMENTS_SEED,
  HUB_TABS,
  type HubAnnouncement,
  type HubTab,
  CATEGORY_OPTIONS,
  SEVERITY_OPTIONS,
  SELECT_TRIGGER_CLASS,
  addDaysFromNow,
  alertTimeAgo,
  severityBorder,
  incentiveBorder,
  formatSavedAt,
  calendarDaysFromTodayToDate,
  toValidUntilIso,
  wholeDaysRemainingUntil,
  parseValidUntilForForm,
  formatIncentiveEndLabel,
} from "./core";

const NOTE_LINK_CLASS =
  "font-medium break-words text-[var(--color-info)] underline underline-offset-2 decoration-[var(--color-info)]/35 transition-colors [overflow-wrap:anywhere] hover:text-foreground hover:decoration-foreground/40";

/** Inline [label](https://…) and bare https:// URLs open in a new tab. */
function parseInlineWithLinks(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  const re = /\[(.+?)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s]+)/g;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    const href = (m[2] || m[3] || "").trim();
    const label = (m[1] || href).trim();
    if (href) {
      nodes.push(
        <a
          key={`${keyPrefix}-a-${n++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={NOTE_LINK_CLASS}
        >
          {label}
        </a>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return nodes.length > 0 ? nodes : [text];
}

function simpleAgencyNoteMarkdown(text: string): ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const isHeading =
      line.startsWith("**") && line.endsWith("**") && line.length >= 4 && !line.slice(2, -2).includes("**");
    if (isHeading) {
      const inner = line.slice(2, -2);
      return (
        <p key={i} className="font-semibold text-foreground mb-1.5 tracking-tight">
          {parseInlineWithLinks(inner, `nh-${i}`)}
        </p>
      );
    }
    if (line.trim() === "") {
      return <div key={i} className="h-2" />;
    }
    return (
      <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-1">
        {parseInlineWithLinks(line, `nl-${i}`)}
      </p>
    );
  });
}

type AgencyUserViewProps = {
  publishedNote: string;
  sortedAlerts: NewsAlertItem[];
  sortedAnnouncements: HubAnnouncement[];
  incentives: CommissionAlertItem[];
  hubLayout: Record<AgencyHubUserWidgetId, AgencyHubUserWidgetLayout>;
  updateHubWidget: (id: AgencyHubUserWidgetId, patch: Partial<AgencyHubUserWidgetLayout>) => void;
  hubLayoutLoading: boolean;
  resetHubLayout: () => void;
};

function orderedHubIdsForColumn(
  column: "left" | "right",
  layout: Record<AgencyHubUserWidgetId, AgencyHubUserWidgetLayout>,
): AgencyHubUserWidgetId[] {
  return AGENCY_HUB_USER_WIDGET_IDS.filter(
    (id) => layout[id].column === column && layout[id].visible,
  );
}

/** User (advisor): same agency content as admin hub; each person can arrange visibility, columns, and size. */
function BriefingAgencyUserViewWidgets({
  publishedNote,
  sortedAlerts,
  sortedAnnouncements,
  incentives,
  hubLayout,
  updateHubWidget,
  hubLayoutLoading,
  resetHubLayout,
}: AgencyUserViewProps) {
  const hiddenHubCount = useMemo(
    () => AGENCY_HUB_USER_WIDGET_IDS.filter((id) => !hubLayout[id].visible).length,
    [hubLayout],
  );

  const leftIds = useMemo(() => orderedHubIdsForColumn("left", hubLayout), [hubLayout]);
  const rightIds = useMemo(() => orderedHubIdsForColumn("right", hubLayout), [hubLayout]);

  const hubPopover = (id: AgencyHubUserWidgetId) => (
    <BriefingAgencyHubLayoutPopover
      widgetId={id}
      pref={hubLayout[id]}
      updateWidget={updateHubWidget}
      disabled={hubLayoutLoading}
    />
  );

  const renderHubBlock = (id: AgencyHubUserWidgetId, staggerIndex: number) => {
    const density: WidgetCardDensity = hubLayout[id].size;
    switch (id) {
      case "hub-notes":
        return (
          <AppleWidgetCard
            key={id}
            accent="gray"
            staggerIndex={staggerIndex}
            icon={<Pin className="size-5 text-primary/90" aria-hidden />}
            title="Agency notes"
            density={density}
            rightElement={mergeWidgetHeaderRight(
              <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground/70">
                Pinned
              </span>,
              hubPopover(id),
            )}
          >
            <div className="min-h-[120px] rounded-xl border border-border bg-muted/15 p-4">
              {simpleAgencyNoteMarkdown(publishedNote)}
            </div>
          </AppleWidgetCard>
        );
      case "hub-alerts":
        return (
          <AppleWidgetCard
            key={id}
            accent="blue"
            staggerIndex={staggerIndex}
            icon={<Bell className="size-5 text-[var(--color-info)]/90" aria-hidden />}
            title="News & alerts"
            density={density}
            rightElement={mergeWidgetHeaderRight(undefined, hubPopover(id))}
          >
            <div className="space-y-4">
              <ul className="space-y-2">
                {sortedAlerts.map((a) => (
                  <li
                    key={a.id}
                    className={cn(
                      "rounded-xl border px-4 py-3 flex gap-3 justify-between items-start",
                      severityBorder(a.severity),
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground leading-snug">{a.headline}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.summary}</p>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-2 text-2xs text-muted-foreground/85">
                        <span className="font-medium text-muted-foreground">{a.source}</span>
                        <span aria-hidden>·</span>
                        <span className="capitalize">{a.category}</span>
                        <span aria-hidden>·</span>
                        <span className="capitalize">{a.severity}</span>
                        <span aria-hidden>·</span>
                        <span>{alertTimeAgo(a.published_at)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {sortedAlerts.length === 0 && (
                <div className="rounded-xl border border-dashed border-border py-10 text-center">
                  <Bell className="size-7 mx-auto text-muted-foreground/40 mb-2" aria-hidden />
                  <p className="text-sm font-medium text-foreground">No alerts yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Your agency hasn’t published any news or alerts.</p>
                </div>
              )}
            </div>
          </AppleWidgetCard>
        );
      case "hub-announcements":
        return (
          <AppleWidgetCard
            key={id}
            accent="violet"
            staggerIndex={staggerIndex}
            icon={<Megaphone className="size-5 text-[var(--muted-accent-text)]" aria-hidden />}
            title="Announcements"
            density={density}
            rightElement={mergeWidgetHeaderRight(undefined, hubPopover(id))}
          >
            <div className="space-y-3">
              {sortedAnnouncements.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-border bg-card/50 p-4 transition-colors hover:bg-muted/35"
                >
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-sm font-semibold text-foreground">{a.title}</span>
                    {a.pinned ? (
                      <Pin className="size-3.5 shrink-0 text-primary/85" aria-hidden />
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {a.content}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-2xs text-muted-foreground/75">
                      {a.author} · {a.timeAgo}
                    </span>
                    <span className="text-2xs rounded-md border border-[var(--muted-info-border)] bg-[var(--muted-info-bg)] px-2 py-0.5 text-[var(--muted-info-text)]">
                      Agency
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </AppleWidgetCard>
        );
      case "hub-incentives":
        return (
          <AppleWidgetCard
            key={id}
            accent="blue"
            staggerIndex={staggerIndex}
            icon={<Gift className="size-5 text-[var(--color-info)]/90" aria-hidden />}
            title="Partner incentives"
            density={density}
            rightElement={mergeWidgetHeaderRight(undefined, hubPopover(id))}
          >
            <ul className="space-y-2">
              {incentives.map((item) => {
                const daysLeft = wholeDaysRemainingUntil(item.valid_until);
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "rounded-xl border px-4 py-3 flex justify-between gap-3 items-start transition-colors hover:bg-muted/30",
                      incentiveBorder(item.urgency),
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.partner_name}</p>
                      <p className="mt-1.5 text-sm font-medium text-brand-cta">{item.bonus_display}</p>
                      <p className="text-2xs text-muted-foreground/70 mt-1.5">
                        {formatIncentiveEndLabel(item.valid_until)}
                        <span className="text-muted-foreground/55">
                          {" · "}
                          {daysLeft === 0 ? "Window closed" : `${daysLeft}d left`}
                        </span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </AppleWidgetCard>
        );
      default:
        return null;
    }
  };

  return (
    <section className="mb-8 space-y-5" aria-label="Agency briefing">
      {hiddenHubCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {hiddenHubCount} agency block{hiddenHubCount === 1 ? "" : "s"} hidden.{" "}
            <span className="text-foreground/90">Reset agency layout</span> restores defaults.
          </p>
          <button
            type="button"
            disabled={hubLayoutLoading}
            onClick={resetHubLayout}
            className="shrink-0 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/45 disabled:opacity-40"
          >
            Reset agency layout
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        <div className="flex flex-col gap-5">{leftIds.map((id, i) => renderHubBlock(id, i))}</div>
        <div className="flex flex-col gap-5">{rightIds.map((id, i) => renderHubBlock(id, i))}</div>
      </div>
    </section>
  );
}

type Props = {
  canEditBriefing: boolean;
  publisherName: string;
};

type DeleteTarget =
  | { kind: "alert"; id: string; label: string }
  | { kind: "announcement"; id: string; label: string }
  | { kind: "incentive"; id: string; label: string };

function emptyNewsForm() {
  return {
    headline: "",
    summary: "",
    source: "",
    category: "industry" as NewsAlertItem["category"],
    severity: "info" as NewsAlertItem["severity"],
  };
}

function emptyAnnouncementForm() {
  return { title: "", content: "", pinned: false };
}

function emptyIncentiveForm() {
  return {
    title: "",
    partner_name: "",
    bonus_display: "",
    days_remaining: 30,
    end_date: addDaysFromNow(30),
    end_time: "",
    urgency: "info" as CommissionAlertItem["urgency"],
  };
}

export default function BriefingAgencyContentHub({ canEditBriefing, publisherName }: Props) {
  const showToast = useToast();
  const {
    layout: hubUserLayout,
    updateWidget: updateHubWidget,
    resetToDefaults: resetHubLayout,
    isLoading: hubLayoutLoading,
  } = useBriefingAgencyHubLayout();
  const [tab, setTab] = useState<HubTab>("notes");

  const [publishedNote, setPublishedNote] = useState(getBriefingHubAgencyNoteSeed);
  const [draftNote, setDraftNote] = useState(getBriefingHubAgencyNoteSeed);
  const [noteSavedAt, setNoteSavedAt] = useState<Date | null>(null);
  const noteDirty = draftNote !== publishedNote;

  const [alerts, setAlerts] = useState<NewsAlertItem[]>(() => getBriefingHubNewsSeed());

  const [announcements, setAnnouncements] = useState<HubAnnouncement[]>(HUB_ANNOUNCEMENTS_SEED);
  const [incentives, setIncentives] = useState<CommissionAlertItem[]>(() => getBriefingHubIncentiveSeed());

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const [newsDialogOpen, setNewsDialogOpen] = useState(false);
  const [newsEditing, setNewsEditing] = useState<NewsAlertItem | null>(null);
  const [newsForm, setNewsForm] = useState(emptyNewsForm);

  const [annDialogOpen, setAnnDialogOpen] = useState(false);
  const [annEditing, setAnnEditing] = useState<HubAnnouncement | null>(null);
  const [annForm, setAnnForm] = useState(emptyAnnouncementForm);

  const [incDialogOpen, setIncDialogOpen] = useState(false);
  const [incEditing, setIncEditing] = useState<CommissionAlertItem | null>(null);
  const [incForm, setIncForm] = useState(emptyIncentiveForm);

  useEffect(() => {
    if (!newsDialogOpen) return;
    if (newsEditing) {
      setNewsForm({
        headline: newsEditing.headline,
        summary: newsEditing.summary,
        source: newsEditing.source,
        category: newsEditing.category,
        severity: newsEditing.severity,
      });
    } else {
      setNewsForm(emptyNewsForm());
    }
  }, [newsDialogOpen, newsEditing]);

  useEffect(() => {
    if (!annDialogOpen) return;
    if (annEditing) {
      setAnnForm({
        title: annEditing.title,
        content: annEditing.content,
        pinned: annEditing.pinned,
      });
    } else {
      setAnnForm(emptyAnnouncementForm());
    }
  }, [annDialogOpen, annEditing]);

  useEffect(() => {
    if (!incDialogOpen) return;
    if (incEditing) {
      const { endYmd, endHm } = parseValidUntilForForm(incEditing.valid_until);
      const cal = calendarDaysFromTodayToDate(endYmd);
      setIncForm({
        title: incEditing.title,
        partner_name: incEditing.partner_name,
        bonus_display: incEditing.bonus_display,
        days_remaining: cal < 0 ? 0 : cal,
        end_date: endYmd,
        end_time: endHm,
        urgency: incEditing.urgency,
      });
    } else {
      setIncForm(emptyIncentiveForm());
    }
  }, [incDialogOpen, incEditing]);

  const openCreateNews = () => {
    setNewsEditing(null);
    setNewsDialogOpen(true);
  };
  const openEditNews = (item: NewsAlertItem) => {
    setNewsEditing(item);
    setNewsDialogOpen(true);
  };

  const openCreateAnn = () => {
    setAnnEditing(null);
    setAnnDialogOpen(true);
  };
  const openEditAnn = (item: HubAnnouncement) => {
    setAnnEditing(item);
    setAnnDialogOpen(true);
  };

  const openCreateInc = () => {
    setIncEditing(null);
    setIncDialogOpen(true);
  };
  const openEditInc = (item: CommissionAlertItem) => {
    setIncEditing(item);
    setIncDialogOpen(true);
  };

  const savePublishedNote = useCallback(() => {
    setPublishedNote(draftNote);
    setNoteSavedAt(new Date());
    showToast("Agency note published to the team");
  }, [draftNote, showToast]);

  const discardNoteDraft = useCallback(() => {
    setDraftNote(publishedNote);
    showToast("Draft discarded");
  }, [publishedNote, showToast]);

  const submitNews = () => {
    if (!newsForm.headline.trim() || !newsForm.summary.trim()) return;
    if (newsEditing) {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === newsEditing.id
            ? {
                ...a,
                headline: newsForm.headline.trim(),
                summary: newsForm.summary.trim(),
                source: newsForm.source.trim() || "Agency",
                category: newsForm.category,
                severity: newsForm.severity,
              }
            : a,
        ),
      );
      showToast("Alert updated");
    } else {
      const item: NewsAlertItem = {
        id: `hub-news-${Date.now()}`,
        headline: newsForm.headline.trim(),
        summary: newsForm.summary.trim(),
        source: newsForm.source.trim() || "Agency",
        category: newsForm.category,
        severity: newsForm.severity,
        published_at: new Date().toISOString(),
      };
      setAlerts((prev) => [item, ...prev]);
      showToast("Alert added");
    }
    setNewsDialogOpen(false);
    setNewsEditing(null);
  };

  const submitAnnouncement = () => {
    if (!annForm.title.trim() || !annForm.content.trim()) return;
    const author = publisherName.trim() || "Agency admin";
    if (annEditing) {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === annEditing.id
            ? {
                ...a,
                title: annForm.title.trim(),
                content: annForm.content.trim(),
                pinned: annForm.pinned,
                timeAgo: "Edited just now",
              }
            : a,
        ),
      );
      showToast("Announcement updated");
    } else {
      const newItem: HubAnnouncement = {
        id: `ann-${Date.now()}`,
        title: annForm.title.trim(),
        content: annForm.content.trim(),
        author,
        pinned: annForm.pinned,
        timeAgo: "Just now",
      };
      setAnnouncements((prev) => [newItem, ...prev]);
      showToast("Announcement published");
    }
    setAnnDialogOpen(false);
    setAnnEditing(null);
  };

  const submitIncentive = () => {
    if (!incForm.title.trim() || !incForm.partner_name.trim() || !incForm.bonus_display.trim()) return;
    if (!incForm.end_date?.trim()) {
      showToast("Choose an end date");
      return;
    }
    const valid_until = toValidUntilIso(incForm.end_date.trim(), incForm.end_time.trim());
    const days_remaining = wholeDaysRemainingUntil(valid_until);
    if (incEditing) {
      setIncentives((prev) =>
        prev.map((i) =>
          i.id === incEditing.id
            ? {
                ...i,
                title: incForm.title.trim(),
                partner_name: incForm.partner_name.trim(),
                bonus_display: incForm.bonus_display.trim(),
                days_remaining,
                valid_until,
                urgency: incForm.urgency,
              }
            : i,
        ),
      );
      showToast("Incentive updated");
    } else {
      const item: CommissionAlertItem = {
        id: `hub-inc-${Date.now()}`,
        title: incForm.title.trim(),
        partner_name: incForm.partner_name.trim(),
        incentive_type: "manual",
        bonus_display: incForm.bonus_display.trim(),
        valid_until,
        days_remaining,
        urgency: incForm.urgency,
      };
      setIncentives((prev) => [item, ...prev]);
      showToast("Partner incentive added");
    }
    setIncDialogOpen(false);
    setIncEditing(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "alert") {
      setAlerts((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      showToast("Alert removed");
    } else if (deleteTarget.kind === "announcement") {
      setAnnouncements((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      showToast("Announcement removed");
    } else {
      setIncentives((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      showToast("Incentive removed");
    }
    setDeleteTarget(null);
  };

  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      const order = { urgent: 0, warning: 1, info: 2 };
      const d = (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
      if (d !== 0) return d;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });
  }, [alerts]);

  const sortedAnnouncements = useMemo(() => {
    const pinned = announcements.filter((a) => a.pinned);
    const rest = announcements.filter((a) => !a.pinned);
    return [...pinned, ...rest];
  }, [announcements]);

  const tabCounts = useMemo(
    () => ({
      notes: 1,
      alerts: alerts.length,
      announcements: announcements.length,
      incentives: incentives.length,
    }),
    [alerts.length, announcements.length, incentives.length],
  );

  if (!canEditBriefing) {
    return (
      <BriefingAgencyUserViewWidgets
        publishedNote={publishedNote}
        sortedAlerts={sortedAlerts}
        sortedAnnouncements={sortedAnnouncements}
        incentives={incentives}
        hubLayout={hubUserLayout}
        updateHubWidget={updateHubWidget}
        hubLayoutLoading={hubLayoutLoading}
        resetHubLayout={resetHubLayout}
      />
    );
  }

  return (
    <>
      <Card className={cn("mb-8 gap-0 overflow-hidden py-0 shadow-none", BRIEFING_PANEL_SURFACE)}>
        <CardHeader className="border-b border-border/70 bg-gradient-to-br from-[var(--muted-info-bg)]/40 to-transparent px-6 py-7 md:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--muted-info-bg)] text-[var(--color-info)] ring-1 ring-[var(--muted-info-border)]">
                <Building2 className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 gap-y-1">
                  <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
                    Agency briefing content
                  </CardTitle>
                  <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                    Staff edits
                  </span>
                </div>
                <CardDescription className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                  {canEditBriefing
                    ? "Set what your advisors see first: one pinned note, news and alerts, team announcements, and partner incentives. Add, edit, or remove anything—your team sees updates as soon as you publish."
                    : "Your agency’s shared briefing."}
                </CardDescription>
              </div>
            </div>
          </div>

          <div
            className="mt-6 flex flex-wrap gap-1.5 rounded-2xl border border-border bg-muted/20 p-1.5"
            role="tablist"
            aria-label="Briefing content sections"
          >
            {HUB_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`hub-panel-${t.id}`}
                id={`hub-tab-${t.id}`}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 text-left transition-all sm:min-w-[140px] sm:flex-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  tab === t.id
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:bg-muted/35 hover:text-foreground/90",
                )}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-medium">{t.label}</span>
                  <span
                    className={cn(
                      "tabular-nums rounded-md px-1.5 py-0.5 text-2xs font-semibold",
                      tab === t.id ? "bg-muted/50 text-foreground" : "bg-muted/25 text-muted-foreground",
                    )}
                  >
                    {t.id === "notes" ? "—" : tabCounts[t.id]}
                  </span>
                </span>
                <span className="text-2xs text-muted-foreground/80">{t.hint}</span>
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="px-6 py-7 md:px-8">
          {tab === "notes" && (
            <div
              id="hub-panel-notes"
              role="tabpanel"
              aria-labelledby="hub-tab-notes"
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Pin className="size-3.5 shrink-0 text-primary/85" aria-hidden />
                  <span className="font-medium text-foreground/90">Pinned agency note</span>
                  <span className="text-muted-foreground/60">·</span>
                  <span>Visible to all advisors</span>
                </div>
                {canEditBriefing && noteSavedAt && (
                  <span className="text-2xs text-muted-foreground/70">
                    Last published {formatSavedAt(noteSavedAt)}
                  </span>
                )}
              </div>

              {canEditBriefing ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <FileEdit className="size-3.5" aria-hidden />
                      Edit
                    </div>
                    <Label htmlFor="agency-note-draft" className="sr-only">
                      Agency note draft
                    </Label>
                    <textarea
                      id="agency-note-draft"
                      value={draftNote}
                      onChange={(e) => setDraftNote(e.target.value)}
                      rows={14}
                      className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 resize-y min-h-[220px] leading-relaxed shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Weekly priorities, deadlines, FAMs, ops reminders, links to resources…"
                      spellCheck
                    />
                    {noteDirty && (
                      <p className="text-xs text-muted-foreground" role="status">
                        Unpublished changes — advisors still see the last published version until you save.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" onClick={savePublishedNote} disabled={!noteDirty}>
                        Publish to team
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={discardNoteDraft}
                        disabled={!noteDirty}
                      >
                        Discard draft
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Eye className="size-3.5" aria-hidden />
                      Preview (published)
                    </div>
                    <div className="min-h-[220px] rounded-xl border border-border bg-inset p-4 shadow-inner">
                      {simpleAgencyNoteMarkdown(publishedNote)}
                    </div>
                    <p className="text-2xs text-muted-foreground/65 leading-relaxed">
                      **Heading** on its own line. Paste <code className="text-2xs text-foreground/80">https://…</code>{" "}
                      or use{" "}
                      <code className="text-2xs text-foreground/80">[label](https://…)</code> for links. Blank lines
                      add space.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-gradient-to-b from-muted/25 to-transparent p-5 shadow-sm">
                  {simpleAgencyNoteMarkdown(publishedNote)}
                </div>
              )}
            </div>
          )}

          {tab === "alerts" && (
            <div
              id="hub-panel-alerts"
              role="tabpanel"
              aria-labelledby="hub-tab-alerts"
              className="space-y-5"
            >
              {canEditBriefing && (
                <div className="flex flex-wrap justify-end gap-3">
                  <Button type="button" size="sm" onClick={openCreateNews}>
                    <Plus className="size-3.5 mr-1.5" aria-hidden />
                    New alert
                  </Button>
                </div>
              )}

              <ul className="space-y-2">
                {sortedAlerts.map((a) => (
                  <li
                    key={a.id}
                    className={cn(
                      "group flex items-start justify-between gap-3 rounded-xl border px-4 py-3 transition-colors hover:bg-muted/30",
                      severityBorder(a.severity),
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground leading-snug">{a.headline}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.summary}</p>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-2 text-2xs text-muted-foreground/85">
                        <span className="font-medium text-muted-foreground">{a.source}</span>
                        <span aria-hidden>·</span>
                        <span className="capitalize">{a.category}</span>
                        <span aria-hidden>·</span>
                        <span className="capitalize">{a.severity}</span>
                        <span aria-hidden>·</span>
                        <span>{alertTimeAgo(a.published_at)}</span>
                      </div>
                    </div>
                    {canEditBriefing && (
                      <div className="flex shrink-0 gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <EditIconButton
                          label={`Edit alert: ${a.headline}`}
                          onClick={() => openEditNews(a)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setDeleteTarget({ kind: "alert", id: a.id, label: a.headline })
                          }
                          aria-label={`Delete alert: ${a.headline}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {sortedAlerts.length === 0 && (
                <div className="rounded-xl border border-dashed border-border py-14 text-center">
                  <Bell className="size-8 mx-auto text-muted-foreground/40 mb-2" aria-hidden />
                  <p className="text-sm font-medium text-foreground">No alerts yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Add a news item or alert for your advisors.
                  </p>
                  {canEditBriefing && (
                    <Button type="button" size="sm" variant="outline" className="mt-4" onClick={openCreateNews}>
                      New alert
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === "announcements" && (
            <div
              id="hub-panel-announcements"
              role="tabpanel"
              aria-labelledby="hub-tab-announcements"
              className="space-y-4"
            >
              {canEditBriefing && (
                <div className="flex justify-end">
                  <Button type="button" size="sm" onClick={openCreateAnn}>
                    <Megaphone className="size-3.5 mr-1.5" aria-hidden />
                    New announcement
                  </Button>
                </div>
              )}
              <div className="space-y-3">
                {sortedAnnouncements.map((a) => (
                  <div
                    key={a.id}
                    className="group rounded-xl border border-border bg-card/50 p-4 transition-colors hover:bg-muted/35"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{a.title}</span>
                          {a.pinned && (
                            <Pin className="size-3.5 shrink-0 text-primary/85" aria-hidden />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {a.content}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-2xs text-muted-foreground/75">
                            {a.author} · {a.timeAgo}
                          </span>
                          <span className="text-2xs rounded-md border border-[var(--muted-info-border)] bg-[var(--muted-info-bg)] px-2 py-0.5 text-[var(--muted-info-text)]">
                            Agency
                          </span>
                        </div>
                      </div>
                      {canEditBriefing && (
                        <div className="flex shrink-0 gap-0.5">
                          <EditIconButton
                            label={`Edit announcement: ${a.title}`}
                            onClick={() => openEditAnn(a)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              setDeleteTarget({ kind: "announcement", id: a.id, label: a.title })
                            }
                            aria-label={`Delete announcement: ${a.title}`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "incentives" && (
            <div
              id="hub-panel-incentives"
              role="tabpanel"
              aria-labelledby="hub-tab-incentives"
              className="space-y-5"
            >
              {canEditBriefing && (
                <div className="flex justify-end">
                  <Button type="button" size="sm" onClick={openCreateInc}>
                    <Plus className="size-3.5 mr-1.5" aria-hidden />
                    New incentive
                  </Button>
                </div>
              )}
              <ul className="space-y-2">
                {incentives.map((item) => {
                  const daysLeft = wholeDaysRemainingUntil(item.valid_until);
                  return (
                  <li
                    key={item.id}
                    className={cn(
                      "group flex items-start justify-between gap-3 rounded-xl border px-4 py-3 transition-colors hover:bg-muted/30",
                      incentiveBorder(item.urgency),
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.partner_name}</p>
                      <p className="mt-1.5 text-sm font-medium text-brand-cta">{item.bonus_display}</p>
                      <p className="text-2xs text-muted-foreground/70 mt-1.5">
                        {formatIncentiveEndLabel(item.valid_until)}
                        <span className="text-muted-foreground/55">
                          {" · "}
                          {daysLeft === 0 ? "Window closed" : `${daysLeft}d left`}
                        </span>
                      </p>
                    </div>
                    {canEditBriefing && (
                      <div className="flex shrink-0 gap-0.5">
                        <EditIconButton
                          label={`Edit incentive: ${item.title}`}
                          onClick={() => openEditInc(item)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setDeleteTarget({ kind: "incentive", id: item.id, label: item.title })
                          }
                          aria-label={`Delete incentive: ${item.title}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* News & alerts dialog */}
      <Dialog
        open={newsDialogOpen}
        onOpenChange={(o) => {
          setNewsDialogOpen(o);
          if (!o) setNewsEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-lg border-border bg-background" showCloseButton>
          <DialogHeader>
            <DialogTitle>{newsEditing ? "Edit alert" : "New alert"}</DialogTitle>
            <DialogDescription>
              Headline and summary show in the filtered list. Only agency staff can add or change
              alerts.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="news-headline">Headline</Label>
              <Input
                id="news-headline"
                value={newsForm.headline}
                onChange={(e) => setNewsForm((f) => ({ ...f, headline: e.target.value }))}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="news-summary">Summary</Label>
              <textarea
                id="news-summary"
                value={newsForm.summary}
                onChange={(e) => setNewsForm((f) => ({ ...f, summary: e.target.value }))}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="news-source">Source</Label>
              <Input
                id="news-source"
                value={newsForm.source}
                onChange={(e) => setNewsForm((f) => ({ ...f, source: e.target.value }))}
                placeholder="Agency, ASTA, partner name…"
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="news-category">Category</Label>
                <select
                  id="news-category"
                  value={newsForm.category}
                  onChange={(e) =>
                    setNewsForm((f) => ({ ...f, category: e.target.value as NewsAlertItem["category"] }))
                  }
                  className={SELECT_TRIGGER_CLASS}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="news-severity">Severity</Label>
                <select
                  id="news-severity"
                  value={newsForm.severity}
                  onChange={(e) =>
                    setNewsForm((f) => ({ ...f, severity: e.target.value as NewsAlertItem["severity"] }))
                  }
                  className={SELECT_TRIGGER_CLASS}
                >
                  {SEVERITY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setNewsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submitNews}>
              {newsEditing ? "Save changes" : "Add alert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Announcement dialog */}
      <Dialog
        open={annDialogOpen}
        onOpenChange={(o) => {
          setAnnDialogOpen(o);
          if (!o) setAnnEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-xl border-border bg-background" showCloseButton>
          <DialogHeader>
            <DialogTitle>{annEditing ? "Edit announcement" : "New announcement"}</DialogTitle>
            <DialogDescription>
              Shown to the whole agency. Pin important items to keep them at the top.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                value={annForm.title}
                onChange={(e) => setAnnForm((f) => ({ ...f, title: e.target.value }))}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann-body">Body</Label>
              <textarea
                id="ann-body"
                value={annForm.content}
                onChange={(e) => setAnnForm((f) => ({ ...f, content: e.target.value }))}
                rows={6}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={annForm.pinned}
                onChange={(e) => setAnnForm((f) => ({ ...f, pinned: e.target.checked }))}
                className="checkbox-on-dark checkbox-on-dark-sm"
              />
              Pin to top of the list
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAnnDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submitAnnouncement}>
              {annEditing ? "Save changes" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Incentive dialog */}
      <Dialog
        open={incDialogOpen}
        onOpenChange={(o) => {
          setIncDialogOpen(o);
          if (!o) setIncEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-lg border-border bg-background" showCloseButton>
          <DialogHeader>
            <DialogTitle>{incEditing ? "Edit partner incentive" : "New partner incentive"}</DialogTitle>
            <DialogDescription>
              Set when the offer ends (date and optional time of day). Days in window stays in sync
              with the end date, or you can type days to jump the calendar forward.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="inc-title">Title</Label>
              <Input
                id="inc-title"
                value={incForm.title}
                onChange={(e) => setIncForm((f) => ({ ...f, title: e.target.value }))}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inc-partner">Partner</Label>
              <Input
                id="inc-partner"
                value={incForm.partner_name}
                onChange={(e) => setIncForm((f) => ({ ...f, partner_name: e.target.value }))}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inc-bonus">Bonus</Label>
              <Input
                id="inc-bonus"
                value={incForm.bonus_display}
                onChange={(e) => setIncForm((f) => ({ ...f, bonus_display: e.target.value }))}
                placeholder="+5% or $200 spiff"
                className="bg-background"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="inc-end-date">Ends on</Label>
                <Input
                  id="inc-end-date"
                  type="date"
                  value={incForm.end_date}
                  onChange={(e) => {
                    const ymd = e.target.value;
                    const cal = calendarDaysFromTodayToDate(ymd);
                    setIncForm((f) => ({
                      ...f,
                      end_date: ymd,
                      days_remaining: Math.max(0, Math.min(365, cal)),
                    }));
                  }}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inc-end-time">End time (optional)</Label>
                <Input
                  id="inc-end-time"
                  type="time"
                  value={incForm.end_time}
                  onChange={(e) => setIncForm((f) => ({ ...f, end_time: e.target.value }))}
                  className="bg-background"
                />
                <p className="text-2xs text-muted-foreground/75">Leave blank for end of that day.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="inc-days">Days in window</Label>
                <Input
                  id="inc-days"
                  type="number"
                  min={0}
                  max={365}
                  value={incForm.days_remaining}
                  onChange={(e) => {
                    const raw = Number(e.target.value);
                    const clamped = Math.max(0, Math.min(365, Number.isFinite(raw) ? raw : 0));
                    setIncForm((f) => ({
                      ...f,
                      days_remaining: clamped,
                      end_date: addDaysFromNow(clamped),
                    }));
                  }}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inc-urgency">Urgency</Label>
                <select
                  id="inc-urgency"
                  value={incForm.urgency}
                  onChange={(e) =>
                    setIncForm((f) => ({
                      ...f,
                      urgency: e.target.value as CommissionAlertItem["urgency"],
                    }))
                  }
                  className={SELECT_TRIGGER_CLASS}
                >
                  <option value="urgent">Urgent</option>
                  <option value="soon">Soon</option>
                  <option value="info">Info</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIncDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submitIncentive}>
              {incEditing ? "Save changes" : "Add incentive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteTarget != null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md border-border bg-background" showCloseButton>
          <DialogHeader>
            <DialogTitle>Remove this item?</DialogTitle>
            <DialogDescription>
              {deleteTarget ? (
                <>
                  <span className="font-medium text-foreground">{deleteTarget.label}</span> will be
                  removed from this briefing. You can add a new item anytime.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
