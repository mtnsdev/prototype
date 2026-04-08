"use client";

import { useState, useMemo } from "react";
import { useUserOptional } from "@/contexts/UserContext";
import Link from "next/link";
import { Download, MoreHorizontal, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";
import {
  directoryFilterSelectContentClass,
  directoryFilterSelectItemClass,
  directoryFilterSelectTriggerClass,
} from "@/components/ui/page-search-field";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { ListLabel } from "@/components/ui/typography";
import {
  listSurfaceClass,
  listScrollClass,
  listTableClass,
  listTheadRowClass,
  listThClass,
  listTbodyRowClass,
  listTdClass,
  listMutedCellClass,
  listPrimaryTextClass,
} from "@/lib/list-ui";
import {
  DASHBOARD_LIST_PAGE_HEADER,
  DASHBOARD_LIST_PAGE_HEADER_ACTIONS,
  DASHBOARD_LIST_PAGE_HEADER_SUBTITLE,
  DASHBOARD_LIST_PAGE_HEADER_TITLE,
  DASHBOARD_LIST_PAGE_HEADER_TITLE_STACK,
} from "@/lib/dashboardChrome";

// Mock data with realistic seasonal patterns
const MONTHLY_REVENUE_12M = [
  { month: "Apr 2025", value: 98500 },
  { month: "May 2025", value: 142300 },
  { month: "Jun 2025", value: 185600 }, // summer peak
  { month: "Jul 2025", value: 201450 }, // summer peak
  { month: "Aug 2025", value: 176200 },
  { month: "Sep 2025", value: 128900 },
  { month: "Oct 2025", value: 118700 },
  { month: "Nov 2025", value: 95400 },
  { month: "Dec 2025", value: 165200 }, // holiday peak
  { month: "Jan 2026", value: 87300 },  // post-holiday dip
  { month: "Feb 2026", value: 92150 },
  { month: "Mar 2026", value: 155800 }, // spring recovery
];

const COMMISSION_BY_PARTNER = [
  { name: "Four Seasons", percentage: 28, value: 41720 },
  { name: "Aman", percentage: 22, value: 32756 },
  { name: "Belmond", percentage: 15, value: 22335 },
  { name: "Virtuoso", percentage: 12, value: 17868 },
  { name: "Other", percentage: 23, value: 34221 },
];

const TOP_VICS_DATA = [
  { id: "vic-001", name: "Jean-Christophe Chopin", spend: 148500, commission: 22275, trips: 12, lastTrip: "2026-03-28" },
  { id: "vic-003", name: "Camille Signoles", spend: 127300, commission: 19095, trips: 9, lastTrip: "2026-03-25" },
  { id: "vic-002", name: "Eric Tournier", spend: 98200, commission: 14730, trips: 7, lastTrip: "2026-03-22" },
  { id: "vic-004", name: "Valérie Rousseau", spend: 85600, commission: 12840, trips: 6, lastTrip: "2026-03-20" },
  { id: "vic-005", name: "Sophie Mercier", spend: 76400, commission: 11460, trips: 5, lastTrip: "2026-03-18" },
  { id: "vic-006", name: "Laurent Dupont", spend: 65900, commission: 9885, trips: 5, lastTrip: "2026-03-15" },
  { id: "vic-007", name: "Anne-Marie Lefevre", spend: 58300, commission: 8745, trips: 4, lastTrip: "2026-03-12" },
  { id: "vic-008", name: "Michel Renard", spend: 51200, commission: 7680, trips: 3, lastTrip: "2026-03-10" },
  { id: "vic-009", name: "Claire Berger", spend: 47800, commission: 7170, trips: 3, lastTrip: "2026-03-08" },
  { id: "vic-010", name: "Pierre Fontaine", spend: 42900, commission: 6435, trips: 2, lastTrip: "2026-03-05" },
];

const PIPELINE_DATA = [
  { stage: "Lead", count: 12, color: "rgba(201, 169, 110, 0.3)" },
  { stage: "Discovery", count: 8, color: "rgba(201, 169, 110, 0.5)" },
  { stage: "Proposal", count: 5, color: "rgba(201, 169, 110, 0.7)" },
  { stage: "Negotiation", count: 3, color: "rgba(201, 169, 110, 0.85)" },
  { stage: "Won", count: 2, color: "rgba(201, 169, 110, 1)" },
];

const cardClass = "rounded-xl border border-border bg-white/[0.02] p-5 md:p-6";

function AnalyticsKpiAttributionBanner() {
  const userContext = useUserOptional();
  const opsLens = userContext?.prototypeAdminView ?? false;
  const [loadedAt] = useState(() => new Date());
  const loadedLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(loadedAt),
    [loadedAt],
  );

  return (
    <div
      className="rounded-lg border border-border bg-muted/10 px-4 py-3 text-xs leading-relaxed text-muted-foreground"
      role="note"
    >
      <span className="font-medium text-foreground/90">Sample metrics</span>
      <span className="mx-1.5 text-muted-foreground/45">·</span>
      <span className="font-medium text-foreground/90">Scope:</span>{" "}
      {opsLens
        ? "Agency roll-up across advisors (illustrative only)."
        : "Your personal book and pipelines (illustrative only)."}
      <span className="mx-1.5 text-muted-foreground/45">·</span>
      <span className="font-medium text-foreground/90">Loaded:</span> {loadedLabel}
    </div>
  );
}

function getDataForRange(range: string) {
  const ytdData = MONTHLY_REVENUE_12M.slice(-12); // Last 12 months
  const last90 = MONTHLY_REVENUE_12M.slice(-3);
  const last30 = [MONTHLY_REVENUE_12M[MONTHLY_REVENUE_12M.length - 1]];

  switch (range) {
    case "30days":
      return {
        monthlyData: last30,
        totalRevenue: 155800,
        lastYearRevenue: 138800,
        activeVics: 18,
        quarterVics: 3,
        commission: 23370,
        lastYearCommission: 20820,
        tripCompletion: 92,
      };
    case "90days":
      return {
        monthlyData: last90,
        totalRevenue: 325200,
        lastYearRevenue: 289400,
        activeVics: 21,
        quarterVics: 3,
        commission: 48780,
        lastYearCommission: 43470,
        tripCompletion: 93,
      };
    case "ytd":
      return {
        monthlyData: ytdData,
        totalRevenue: 1247500,
        lastYearRevenue: 1112400,
        activeVics: 24,
        quarterVics: 3,
        commission: 148900,
        lastYearCommission: 126100,
        tripCompletion: 94,
      };
    case "12months":
      return {
        monthlyData: MONTHLY_REVENUE_12M,
        totalRevenue: 1548550,
        lastYearRevenue: 1389200,
        activeVics: 28,
        quarterVics: 4,
        commission: 193284,
        lastYearCommission: 173460,
        tripCompletion: 94,
      };
    case "alltime":
      return {
        monthlyData: MONTHLY_REVENUE_12M,
        totalRevenue: 2847300,
        lastYearRevenue: 2156700,
        activeVics: 32,
        quarterVics: 5,
        commission: 356545,
        lastYearCommission: 324300,
        tripCompletion: 95,
      };
    default:
      return {
        monthlyData: ytdData,
        totalRevenue: 1247500,
        lastYearRevenue: 1112400,
        activeVics: 24,
        quarterVics: 3,
        commission: 148900,
        lastYearCommission: 126100,
        tripCompletion: 94,
      };
  }
}

export default function AnalyticsPage() {
  const toast = useToast();
  const [range, setRange] = useState("ytd");

  const data = useMemo(() => {
    const base = getDataForRange(range);
    const vicsNeedingAttention = Math.min(
      12,
      Math.max(1, Math.round(base.activeVics * 0.17)),
    );
    /** Prototype: deals in early stages without recent movement */
    const stalePipelineCount = Math.min(14, Math.max(4, Math.round(base.activeVics * 0.35)));
    /** Prototype: confirmed trips missing final checklist */
    const tripsNeedingFollowUp = base.tripCompletion < 94 ? 3 : 1;
    return {
      ...base,
      vicsNeedingAttention,
      stalePipelineCount,
      tripsNeedingFollowUp,
    };
  }, [range]);

  const maxRevenue = Math.max(...data.monthlyData.map((m) => m.value));
  const revenueChange =
    ((data.totalRevenue - data.lastYearRevenue) / data.lastYearRevenue) * 100;
  const commissionChange =
    ((data.commission - data.lastYearCommission) / data.lastYearCommission) * 100;

  // Commission donut stops
  const totalCommission = COMMISSION_BY_PARTNER.reduce((s, p) => s + p.value, 0);
  let commissionAcc = 0;
  const commissionStops = COMMISSION_BY_PARTNER.map((p) => {
    const start = (commissionAcc / totalCommission) * 100;
    commissionAcc += p.value;
    const end = (commissionAcc / totalCommission) * 100;
    return { color: p.name === "Four Seasons" ? "rgba(201, 169, 110, 1)" : p.name === "Aman" ? "rgba(201, 169, 110, 0.85)" : p.name === "Belmond" ? "rgba(201, 169, 110, 0.7)" : p.name === "Virtuoso" ? "rgba(201, 169, 110, 0.55)" : "rgba(201, 169, 110, 0.35)", start, end };
  });

  const donutBg = `conic-gradient(${commissionStops
    .map((s) => `${s.color} ${s.start}% ${s.end}%`)
    .join(", ")})`;

  // Pipeline total
  const pipelineTotal = PIPELINE_DATA.reduce((s, p) => s + p.count, 0);

  const handleExport = () => {
    const csv = [
      ["Analytics Export", new Date().toISOString()],
      [],
      ["KPI Summary"],
      ["Total Revenue", data.totalRevenue],
      ["Commission Earned", data.commission],
      ["Active VICs", data.activeVics],
      ["Trip Completion Rate", `${data.tripCompletion}%`],
      [],
      ["Monthly Revenue"],
      ...data.monthlyData.map((m) => [m.month, m.value]),
      [],
      ["Top VICs by Spend"],
      ["VIC Name", "Total Spend", "Commission", "Trips", "Last Trip"],
      ...TOP_VICS_DATA.map((v) => [v.name, v.spend, v.commission, v.trips, v.lastTrip]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${range}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast({
      title: "Export started",
      description: "Your analytics CSV download should begin shortly.",
      tone: "success",
    });
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-inset text-foreground">
      <header className={DASHBOARD_LIST_PAGE_HEADER}>
        <div className={DASHBOARD_LIST_PAGE_HEADER_TITLE_STACK}>
          <h1 className={DASHBOARD_LIST_PAGE_HEADER_TITLE}>Analytics</h1>
          <p className={DASHBOARD_LIST_PAGE_HEADER_SUBTITLE}>
            Key metrics, revenue trends, and VIC performance
          </p>
        </div>
        <div className={DASHBOARD_LIST_PAGE_HEADER_ACTIONS}>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger
              className={cn(
                directoryFilterSelectTriggerClass,
                "h-8 w-[min(100%,180px)] text-xs"
              )}
            >
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent className={directoryFilterSelectContentClass}>
              <SelectItem className={directoryFilterSelectItemClass} value="30days">
                Last 30 days
              </SelectItem>
              <SelectItem className={directoryFilterSelectItemClass} value="90days">
                Last 90 days
              </SelectItem>
              <SelectItem className={directoryFilterSelectItemClass} value="ytd">
                Year to date
              </SelectItem>
              <SelectItem className={directoryFilterSelectItemClass} value="12months">
                Last 12 months
              </SelectItem>
              <SelectItem className={directoryFilterSelectItemClass} value="alltime">
                All time
              </SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-input px-2.5 text-xs text-foreground"
                aria-label="More actions"
              >
                <MoreHorizontal size={16} className="shrink-0" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              <DropdownMenuItem onClick={handleExport} className="gap-2">
                <Download size={14} className="shrink-0 opacity-80" aria-hidden />
                Export CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="px-6 pb-8 pt-6 space-y-6 max-w-[1600px]">
          <AnalyticsKpiAttributionBanner />
          {/* KPI Row */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <div className={cardClass}>
              <ListLabel className="block text-xs text-muted-foreground">
                Total Revenue (YTD)
              </ListLabel>
              <div className="mt-3">
                <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  ${(data.totalRevenue / 1000000).toFixed(2)}M
                </p>
                <div className="mt-1.5 flex items-center gap-1">
                  <TrendingUp size={14} className="text-[var(--color-success)]" />
                  <span className="text-sm font-medium text-[var(--color-success)]">
                    +{revenueChange.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground/70">vs last year</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground/80">
                  Spot revenue dips early and align outreach with booking cycles.
                </p>
                <Button variant="outline" size="sm" className="mt-3 h-8 border-input text-xs" asChild>
                  <Link href="/dashboard/products">Explore revenue drivers</Link>
                </Button>
              </div>
            </div>

            <div className={cardClass}>
              <ListLabel className="block text-xs text-muted-foreground">
                Active VICs
              </ListLabel>
              <div className="mt-3">
                <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  {data.activeVics}
                </p>
                <div className="mt-1.5 flex items-center gap-1">
                  <TrendingUp size={14} className="text-[var(--color-success)]" />
                  <span className="text-sm font-medium text-[var(--color-success)]">
                    +{data.quarterVics}
                  </span>
                  <span className="text-xs text-muted-foreground/70">this quarter</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground/80">
                  <span className="font-medium text-[var(--muted-amber-text)]">
                    {data.vicsNeedingAttention} need attention
                  </span>{" "}
                  — lower recent activity vs peers
                </p>
                <Button variant="outline" size="sm" className="mt-3 h-8 border-input text-xs" asChild>
                  <Link href="/dashboard/vics">Reach out / view VICs</Link>
                </Button>
              </div>
            </div>

            <div className={cardClass}>
              <ListLabel className="block text-xs text-muted-foreground">
                Commission Earned (YTD)
              </ListLabel>
              <div className="mt-3">
                <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  ${(data.commission / 1000).toFixed(1)}K
                </p>
                <div className="mt-1.5 flex items-center gap-1">
                  <TrendingUp size={14} className="text-[var(--color-success)]" />
                  <span className="text-sm font-medium text-[var(--color-success)]">
                    +{commissionChange.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground/70">vs last year</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground/80">
                  Top partner: <span className="font-medium text-foreground/90">Four Seasons</span> — consider
                  promoting similar inventory.
                </p>
                <Button variant="outline" size="sm" className="mt-3 h-8 border-input text-xs" asChild>
                  <Link href="/dashboard/products?tab=enable">Browse partner programs</Link>
                </Button>
              </div>
            </div>

            <div className={cardClass}>
              <ListLabel className="block text-xs text-muted-foreground">
                Trip Completion Rate
              </ListLabel>
              <div className="mt-3">
                <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  {data.tripCompletion}%
                </p>
                <div className="mt-1.5 flex items-center gap-1">
                  <TrendingUp size={14} className="text-[var(--color-success)]" />
                  <span className="text-sm font-medium text-[var(--color-success)]">
                    Healthy
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground/80">
                  {data.tripCompletion < 94 ? (
                    <>
                      <span className="font-medium text-[var(--muted-amber-text)]">
                        {data.tripsNeedingFollowUp} trips
                      </span>{" "}
                      may need a final confirmation nudge.
                    </>
                  ) : (
                    <>Completion is on track — keep an eye on departures in the next 30 days.</>
                  )}
                </p>
                <Button variant="outline" size="sm" className="mt-3 h-8 border-input text-xs" asChild>
                  <Link href="/dashboard/itineraries">Open itineraries</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Chart */}
            <div className={cardClass}>
              <ListLabel className="mb-4 block">Monthly Revenue</ListLabel>
              <div className="flex h-56 items-end justify-between gap-1.5 pt-2">
                {data.monthlyData.map((item, idx) => {
                  const shortMonth = item.month.split(" ")[0];
                  const shortYear = item.month.split(" ")[1]?.slice(-2);
                  return (
                    <div
                      key={`${item.month}-${idx}`}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <div className="group relative w-full">
                        <div
                          className="mx-auto w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-[rgba(201,169,110,0.6)] to-[rgba(201,169,110,0.2)] transition-all duration-200 min-h-[6px] hover:from-[rgba(201,169,110,0.8)] hover:to-[rgba(201,169,110,0.3)] cursor-pointer"
                          style={{
                            height: `${(item.value / maxRevenue) * 100}%`,
                          }}
                          title={`${item.month}: $${(item.value / 1000).toFixed(1)}K`}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-background/95 border border-border rounded px-2 py-1 text-2xs whitespace-nowrap text-muted-foreground pointer-events-none z-10">
                          ${(item.value / 1000).toFixed(1)}K
                        </div>
                      </div>
                      <span className="text-2xs text-muted-foreground/70 text-center leading-tight">
                        {shortMonth} {shortYear}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-sm font-semibold text-foreground">
                  ${(
                    data.monthlyData.reduce((sum, m) => sum + m.value, 0) / 1000
                  ).toFixed(0)}K
                </span>
              </div>
            </div>

            {/* Commission by Partner */}
            <div className={cardClass}>
              <ListLabel className="mb-4 block">Commission by Partner</ListLabel>
              <div className="flex flex-col items-center justify-center gap-6 py-4">
                <div
                  className="h-48 w-48 shrink-0 rounded-full"
                  style={{
                    background: donutBg,
                    mask: "radial-gradient(transparent 60%, black 62%)",
                    WebkitMask: "radial-gradient(transparent 60%, black 62%)",
                  }}
                />
                <div className="w-full space-y-2">
                  {COMMISSION_BY_PARTNER.map((partner) => (
                    <div
                      key={partner.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              partner.name === "Four Seasons"
                                ? "rgba(201, 169, 110, 1)"
                                : partner.name === "Aman"
                                  ? "rgba(201, 169, 110, 0.85)"
                                  : partner.name === "Belmond"
                                    ? "rgba(201, 169, 110, 0.7)"
                                    : partner.name === "Virtuoso"
                                      ? "rgba(201, 169, 110, 0.55)"
                                      : "rgba(201, 169, 110, 0.35)",
                          }}
                        />
                        <span className="text-muted-foreground truncate">
                          {partner.name}
                        </span>
                      </div>
                      <span className="ml-2 shrink-0 text-foreground font-medium">
                        {partner.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline */}
          <div className={cardClass}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <ListLabel className="block">Pipeline by Stage</ListLabel>
              <div className="flex flex-col items-end gap-2 text-right">
                <p className="max-w-xs text-xs text-muted-foreground/80">
                  <span className="font-medium text-[var(--muted-amber-text)]">
                    {data.stalePipelineCount} opportunities
                  </span>{" "}
                  have no activity in 14+ days.
                </p>
                <Button variant="outline" size="sm" className="h-8 border-input text-xs" asChild>
                  <Link href="/dashboard/vics">Prioritize follow-ups</Link>
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {PIPELINE_DATA.map((stage) => {
                const percentage = (stage.count / pipelineTotal) * 100;
                return (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-muted-foreground">
                        {stage.stage}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {stage.count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-6 bg-background/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 hover:opacity-80"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: stage.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top VICs Table */}
          <div className={cn(listSurfaceClass, listScrollClass, "overflow-hidden")}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-3">
              <ListLabel className="mb-0">Top 10 VICs by Revenue</ListLabel>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" asChild>
                <Link href="/dashboard/vics">View all VICs</Link>
              </Button>
            </div>
            <table className={listTableClass("min-w-[800px]")}>
              <thead>
                <tr className={listTheadRowClass}>
                  <th className={listThClass} scope="col">
                    VIC Name
                  </th>
                  <th className={cn(listThClass, "text-right")} scope="col">
                    Total Spend
                  </th>
                  <th className={cn(listThClass, "text-right")} scope="col">
                    Commission
                  </th>
                  <th className={cn(listThClass, "text-right")} scope="col">
                    Trips
                  </th>
                  <th className={cn(listThClass, "text-right")} scope="col">
                    Last Trip
                  </th>
                  <th className={listThClass} scope="col">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {TOP_VICS_DATA.map((vic) => {
                  const lastDate = new Date(vic.lastTrip);
                  const daysSince = Math.floor(
                    (new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const lastTripLabel =
                    daysSince === 0
                      ? "Today"
                      : daysSince === 1
                        ? "Yesterday"
                        : `${daysSince} days ago`;
                  const lowActivity = daysSince > 14;

                  return (
                    <tr key={vic.id} className={listTbodyRowClass}>
                      <td className={listTdClass}>
                        <div className="flex items-center gap-3">
                          <ImageWithFallback
                            fallbackType="avatar"
                            alt={vic.name}
                            name={vic.name}
                            className="h-10 w-10 shrink-0"
                          />
                          <Link
                            href={`/dashboard/vics/${vic.id}`}
                            className={cn(
                              listPrimaryTextClass,
                              "hover:underline font-medium inline-flex items-center gap-2"
                            )}
                          >
                            {vic.name}
                            {lowActivity ? (
                              <span className="rounded-md border border-[var(--muted-amber-border)] bg-[var(--muted-amber-bg)] px-1.5 py-0.5 text-2xs font-medium text-[var(--muted-amber-text)]">
                                Quieter
                              </span>
                            ) : null}
                          </Link>
                        </div>
                      </td>
                      <td
                        className={cn(listTdClass, listMutedCellClass, "text-right")}
                      >
                        ${(vic.spend / 1000).toFixed(1)}K
                      </td>
                      <td
                        className={cn(listTdClass, listMutedCellClass, "text-right")}
                      >
                        ${(vic.commission / 1000).toFixed(1)}K
                      </td>
                      <td
                        className={cn(listTdClass, listMutedCellClass, "text-right")}
                      >
                        {vic.trips}
                      </td>
                      <td
                        className={cn(listTdClass, listMutedCellClass, "text-right")}
                      >
                        {lastTripLabel}
                      </td>
                      <td className={listTdClass}>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Button variant="outline" size="sm" className="h-7 border-input px-2 text-2xs" asChild>
                            <Link href={`/dashboard/vics/${vic.id}`}>View</Link>
                          </Button>
                          {lowActivity ? (
                            <Button variant="secondary" size="sm" className="h-7 px-2 text-2xs" asChild>
                              <Link href={`/dashboard/vics/${vic.id}?focus=outreach`}>Reach out</Link>
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
