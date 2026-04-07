"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@/contexts/UserContext";
import { useBriefingDashboardLayout } from "@/hooks/useBriefingDashboardLayout";
import { fetchBriefingWidgetsForDashboard } from "@/lib/briefing-api";
import { BRIEFING_USER_GRID_WIDGET_IDS, USER_GRID_WIDGET_META } from "@/lib/briefingDashboardUserLayout";
import type { BriefingWidget } from "@/types/briefing";
import BriefingDashboardSkeleton from "./BriefingDashboardSkeleton";
import BriefingGrid from "./BriefingGrid";
import BriefingAgencyContentHub from "./agency-hub/BriefingAgencyContentHub";
import {
  getMockUpcomingTripsContentAgency,
  getMockRecentActivityContentAgency,
} from "./briefingMockData";
import { IS_PREVIEW_MODE } from "@/config/preview";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDateTime(): string {
  return new Date().toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BriefingRoomPage() {
  const { user, prototypeAdminView } = useUser();
  const {
    layout: userDashboardLayout,
    updateWidget,
    reorderWidgets,
    resetToDefaults,
    isLoading: layoutHydrating,
  } = useBriefingDashboardLayout();
  const [editDashboardLayout, setEditDashboardLayout] = useState(false);
  const [widgets, setWidgets] = useState<BriefingWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dateTime, setDateTime] = useState(formatDateTime());

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

  useEffect(() => {
    const t = setInterval(() => setDateTime(formatDateTime()), 60_000);
    return () => clearInterval(t);
  }, []);

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
    (IS_PREVIEW_MODE && user == null && prototypeAdminView ? "Kristin" : "there");
  return (
    <div className="briefing-nature flex h-full min-h-0 flex-1 flex-col bg-background">
      <header className="relative shrink-0 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--muted-info-bg)] to-transparent opacity-90" />
        <div className="relative px-6 py-7 md:px-10 md:py-9">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/50">
                Briefing
              </p>
              <h1 className="text-balance text-2xl font-semibold tracking-[-0.02em] text-foreground md:text-[1.75rem] md:leading-snug">
                {getGreeting()}, {firstName}
              </h1>
              <p className="max-w-md pt-0.5 text-sm leading-relaxed text-muted-foreground/80">
                Priorities, calendar, and agency updates in one place.
              </p>
            </div>
            <p
              role="status"
              aria-live="polite"
              aria-label={`Current date and time: ${dateTime}`}
              className="shrink-0 rounded-full border border-border bg-card/85 px-4 py-2 text-xs font-medium tabular-nums text-muted-foreground shadow-sm backdrop-blur-sm"
            >
              {dateTime}
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </header>

      <div className="flex min-h-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-[1600px] px-6 py-10 md:px-10 md:py-12">
          <BriefingAgencyContentHub canEditBriefing={canEditBriefing} publisherName={firstName} />
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
              <div className="mb-6 mt-12 flex flex-wrap items-center gap-4 md:mt-14">
                <h2 className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/55">
                  Your widgets
                </h2>
                <div className="h-px min-w-[4rem] flex-1 bg-border" aria-hidden />
                <button
                  type="button"
                  disabled={layoutHydrating}
                  onClick={() => setEditDashboardLayout((v) => !v)}
                  className={`shrink-0 rounded-xl border border-border bg-card/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted/50 disabled:opacity-40 ${focusRing}`}
                >
                  {editDashboardLayout ? "Done" : "Edit layout"}
                </button>
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
