"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@/contexts/UserContext";
import { useBriefingDashboardLayout } from "@/hooks/useBriefingDashboardLayout";
import { fetchBriefingWidgetsForDashboard } from "@/lib/briefing-api";
import { BRIEFING_USER_GRID_WIDGET_IDS, USER_GRID_WIDGET_META } from "@/lib/briefingDashboardUserLayout";
import type { BriefingWidget } from "@/types/briefing";
import BriefingDashboardSkeleton from "./BriefingDashboardSkeleton";
import BriefingGrid from "./BriefingGrid";
import BriefingRoomV1Section from "./v1/BriefingRoomV1Section";
import {
  getMockUpcomingTripsContentAgency,
  getMockRecentActivityContentAgency,
} from "./briefingMockData";
import { IS_PREVIEW_MODE } from "@/config/preview";
import { APP_PAGE_CONTENT_SHELL } from "@/lib/dashboardChrome";
import { AppPageHeroHeader } from "@/components/ui/app-page-hero-header";
import { cn } from "@/lib/utils";
import { getCmdKRecents, type CmdKRecent } from "@/lib/cmdkRecents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BriefingCatchUpDialog from "@/components/briefing/BriefingCatchUpDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  return "Good evening";
}

/** Same output on server and client (avoids `Intl` hydration mismatches). */
function formatDateTime(d = new Date()): string {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const w = weekdays[d.getDay()] ?? "";
  const mon = months[d.getMonth()] ?? "";
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${w}, ${day} ${mon}, ${h}:${m}`;
}

type BriefingRoomPageProps = {
  /** macOS-style home desktop (replaces “Briefing” framing in header). */
  desktopMode?: boolean;
};

export default function BriefingRoomPage({ desktopMode = false }: BriefingRoomPageProps) {
  const { user, prototypeAdminView } = useUser();
  const {
    layout: userDashboardLayout,
    updateWidget,
    reorderWidgets,
    resetToDefaults,
    isLoading: layoutHydrating,
    activeViewId,
    viewsList,
    selectView,
    saveLayoutAsNewView,
    renameActiveView,
    deleteActiveView,
    canDeleteActiveView,
  } = useBriefingDashboardLayout();
  const [editDashboardLayout, setEditDashboardLayout] = useState(false);
  const [catchUpOpen, setCatchUpOpen] = useState(false);
  const [widgets, setWidgets] = useState<BriefingWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dateTime, setDateTime] = useState(formatDateTime);
  const [cmdRecents, setCmdRecents] = useState<CmdKRecent[]>([]);
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!desktopMode) return;
    setCmdRecents(getCmdKRecents());
    const onVis = () => setCmdRecents(getCmdKRecents());
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [desktopMode]);

  useEffect(() => {
    const t = setInterval(() => setDateTime(formatDateTime()), 60_000);
    return () => clearInterval(t);
  }, []);

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await fetchBriefingWidgetsForDashboard(user?.id?.toString());
      if (result.ok) {
        setWidgets(result.widgets);
      } else {
        setWidgets([]);
        setLoadError(result.error);
      }
    } catch (e) {
      setWidgets([]);
      setLoadError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const canEditBriefing = prototypeAdminView;

  const widgetsForGrid = useMemo(() => {
    if (!prototypeAdminView) return widgets;
    return widgets.map((w) => {
      if (w.id === "w-trips")
        return { ...w, content: getMockUpcomingTripsContentAgency() };
      if (w.id === "w-activity")
        return { ...w, content: getMockRecentActivityContentAgency() };
      return w;
    });
  }, [widgets, prototypeAdminView]);

  const hiddenWidgetCount = useMemo(
    () =>
      BRIEFING_USER_GRID_WIDGET_IDS.filter((id) => !userDashboardLayout[id].visible).length,
    [userDashboardLayout],
  );

  const firstName =
    user?.username?.split(/[\s@.]/)[0] ||
    user?.email?.split("@")[0] ||
    (IS_PREVIEW_MODE && user == null ? "Kristin" : "there");
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-1 flex-col bg-background",
        desktopMode &&
          "bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,var(--muted-info-bg),transparent_55%),radial-gradient(ellipse_80%_50%_at_100%_50%,color-mix(in_oklab,var(--muted-info-bg)_35%,transparent),transparent)]"
      )}
    >
      <div
        ref={setScrollRoot}
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden"
      >
      <AppPageHeroHeader
        scrollRoot={scrollRoot}
        collapseOnScroll
        eyebrow={desktopMode ? "Desktop" : "Briefing"}
        title={
          <>
            {getGreeting()}, {firstName}
          </>
        }
        subtitle={
          desktopMode
            ? "Widgets and recents on your workspace. Open apps from the dock below."
            : "Priorities, calendar, and agency updates in one place."
        }
        belowSubtitle={
          !desktopMode ? (
            <button
              type="button"
              onClick={() => setCatchUpOpen(true)}
              className={`rounded-xl border border-border bg-card/90 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted/50 ${focusRing}`}
            >
              Catch up
            </button>
          ) : null
        }
        aside={
          <p
            role="status"
            aria-live="polite"
            aria-label={`Current date and time: ${dateTime}`}
            className="shrink-0 rounded-full border border-border bg-card/85 px-4 py-2 text-xs font-medium tabular-nums text-muted-foreground shadow-sm backdrop-blur-sm"
          >
            {dateTime}
          </p>
        }
      />

      {desktopMode && cmdRecents.length > 0 ? (
        <div className="shrink-0 border-b border-border/60 bg-card/20 px-6 py-3 md:px-10">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recent windows
          </p>
          <div className="flex flex-wrap gap-2">
            {cmdRecents.slice(0, 6).map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="max-w-[11rem] rounded-xl border border-border bg-card/80 px-3 py-2 shadow-sm backdrop-blur-sm transition-colors hover:bg-muted/50"
              >
                <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground/65">
                  {r.kind}
                </span>
                <span className="block truncate text-sm font-medium text-foreground">{r.title}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

        <div className={cn(APP_PAGE_CONTENT_SHELL, "py-10 md:py-12")}>
          <BriefingCatchUpDialog open={catchUpOpen} onOpenChange={setCatchUpOpen} />
          <BriefingRoomV1Section />
          {loadError && !loading ? (
            <div
              className="mt-8 rounded-2xl border border-border bg-card/90 p-6 shadow-sm backdrop-blur-sm"
              role="alert"
            >
              <p className="text-sm font-medium text-foreground">Couldn’t load your widgets</p>
              <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
              <button
                type="button"
                onClick={() => load()}
                className={`mt-4 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 ${focusRing}`}
              >
                Try again
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="mt-8">
              <BriefingDashboardSkeleton />
            </div>
          ) : loadError ? null : (
            <>
              <div className="mb-6 mt-12 flex flex-col gap-4 md:mt-14">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Your widgets
                  </h2>
                  <div className="h-px min-w-[2rem] flex-1 bg-border" aria-hidden />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground/70">View</span>
                  <Select
                    value={activeViewId}
                    onValueChange={selectView}
                    disabled={layoutHydrating}
                  >
                    <SelectTrigger size="sm" className="w-[min(100%,220px)] border-border bg-card/80">
                      <SelectValue placeholder="Select view" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground">
                      {viewsList.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        disabled={layoutHydrating}
                        className={`inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-3 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted/50 disabled:opacity-40 ${focusRing}`}
                        aria-label="View actions"
                      >
                        <MoreHorizontal className="size-4 opacity-80" aria-hidden />
                        View actions
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[11rem]">
                      <DropdownMenuItem
                        disabled={layoutHydrating}
                        onClick={() => {
                          const name = window.prompt("Name for this view", "My briefing");
                          if (name != null) saveLayoutAsNewView(name);
                        }}
                      >
                        Save as new view
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={layoutHydrating}
                        onClick={() => {
                          const current = viewsList.find((v) => v.id === activeViewId)?.name ?? "";
                          const name = window.prompt("Rename view", current);
                          if (name != null) renameActiveView(name);
                        }}
                      >
                        Rename view
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={layoutHydrating || !canDeleteActiveView}
                        onClick={() => {
                          if (!canDeleteActiveView) return;
                          if (window.confirm("Delete this saved view? Widget layout will be removed.")) {
                            deleteActiveView();
                          }
                        }}
                      >
                        Delete view
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={layoutHydrating}
                      onClick={() => setEditDashboardLayout((v) => !v)}
                      className={`shrink-0 rounded-xl border border-border bg-card/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted/50 disabled:opacity-40 ${focusRing}`}
                    >
                      {editDashboardLayout ? "Done" : "Edit layout"}
                    </button>
                  </div>
                </div>
              </div>
              {editDashboardLayout && hiddenWidgetCount > 0 ? (
                <div
                  className="mb-6 rounded-2xl border border-border bg-card/80 px-4 py-3.5 shadow-sm backdrop-blur-sm"
                  role="region"
                  aria-label="Hidden widgets"
                >
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                    Hidden — tap to show
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {BRIEFING_USER_GRID_WIDGET_IDS.filter((id) => !userDashboardLayout[id].visible).map(
                      (id) => (
                        <button
                          key={id}
                          type="button"
                          disabled={layoutHydrating}
                          onClick={() => updateWidget(id, { visible: true })}
                          className={`rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted/50 disabled:opacity-40 ${focusRing}`}
                        >
                          {USER_GRID_WIDGET_META[id].label}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              ) : null}
              {hiddenWidgetCount > 0 ? (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/80 px-4 py-3.5 shadow-sm backdrop-blur-sm">
                  <p className="text-sm text-muted-foreground">
                    {hiddenWidgetCount} widget{hiddenWidgetCount === 1 ? "" : "s"} hidden. Use{" "}
                    <span className="font-medium text-foreground/90">Edit layout</span> to show them, or{" "}
                    <span className="text-foreground/90">Reset layout</span> for defaults.
                  </p>
                  <button
                    type="button"
                    disabled={layoutHydrating}
                    onClick={resetToDefaults}
                    className={`shrink-0 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 disabled:opacity-40 ${focusRing}`}
                  >
                    Reset layout
                  </button>
                </div>
              ) : null}
              <BriefingGrid
                widgets={widgetsForGrid}
                isAdmin={canEditBriefing}
                userLayout={userDashboardLayout}
                updateWidget={updateWidget}
                reorderWidgets={reorderWidgets}
                layoutLoading={layoutHydrating}
                editLayout={editDashboardLayout}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
