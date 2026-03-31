"use client";

import { useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
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

function acuityBadgeClass(acuity: string): string {
  switch (acuity) {
    case "complete":
      return "bg-[var(--muted-success-bg)] text-[var(--muted-success-text)] border border-[var(--muted-success-border)]";
    case "running":
      return "bg-[var(--muted-amber-bg)] text-[var(--muted-amber-text)] border border-[var(--muted-amber-border)]";
    case "not_run":
    case "failed":
    default:
      return "bg-[var(--muted-error-bg)] text-[var(--muted-error-text)] border border-[var(--muted-error-border)]";
  }
}

const ACUITY_LABELS: Record<string, string> = {
  not_run: "Not run",
  running: "Running",
  complete: "Complete",
  failed: "Failed",
};

const REVENUE = [
  { m: "Oct", v: 12 },
  { m: "Nov", v: 18 },
  { m: "Dec", v: 8 },
  { m: "Jan", v: 22 },
  { m: "Feb", v: 15 },
  { m: "Mar", v: 23.5 },
];
const maxRev = Math.max(...REVENUE.map((r) => r.v));

const STATUS_DONUT = [
  { label: "Confirmed", n: 3, color: "var(--color-success)" },
  { label: "Draft", n: 2, color: "var(--chrome-label)" },
  { label: "Proposed", n: 1, color: "var(--color-info)" },
  { label: "Completed", n: 0, color: "var(--muted-success-text)" },
  { label: "Cancelled", n: 0, color: "var(--color-error)" },
];
const totalTrips = STATUS_DONUT.reduce((s, x) => s + x.n, 0);
let acc = 0;
const donutStops = STATUS_DONUT.filter((x) => x.n > 0).map((x) => {
  const start = (acc / totalTrips) * 100;
  acc += x.n;
  const end = (acc / totalTrips) * 100;
  return `${x.color} ${start}% ${end}%`;
});
const donutBg =
  totalTrips > 0
    ? `conic-gradient(${donutStops.join(", ")})`
    : `conic-gradient(var(--border-default) 0% 100%)`;

const TOP_VICS = [
  { id: "vic-001", name: "Jean-Christophe Chopin", trips: 2, rev: "€28,500", last: "Monaco GP", acuity_status: "complete" as const },
  { id: "vic-014", name: "Valérie Rousseau", trips: 1, rev: "€3,970", last: "Paris Weekend", acuity_status: "complete" as const },
  { id: "vic-004", name: "Eric Tournier", trips: 1, rev: "—", last: "Tuscany (draft)", acuity_status: "complete" as const },
  { id: "vic-003", name: "Camille Signoles", trips: 1, rev: "€42,000", last: "Maldives", acuity_status: "complete" as const },
  { id: "vic-011", name: "Thomas Bresson", trips: 1, rev: "—", last: "Lyon (draft)", acuity_status: "not_run" as const },
];

const cardClass = "rounded-xl border border-border bg-white/[0.02] p-5 md:p-6";

export default function AnalyticsPage() {
  const showToast = useToast();
  const [range, setRange] = useState("quarter");
  const [askFocus, setAskFocus] = useState(false);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-inset text-foreground">
      <header className={DASHBOARD_LIST_PAGE_HEADER}>
        <div className={DASHBOARD_LIST_PAGE_HEADER_TITLE_STACK}>
          <h1 className={DASHBOARD_LIST_PAGE_HEADER_TITLE}>Analytics</h1>
          <p className={DASHBOARD_LIST_PAGE_HEADER_SUBTITLE}>
            VIC, trip, and revenue signals — sample data in preview
          </p>
        </div>
        <div className={DASHBOARD_LIST_PAGE_HEADER_ACTIONS}>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className={cn(directoryFilterSelectTriggerClass, "h-8 w-[min(100%,168px)] text-xs")}>
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent className={directoryFilterSelectContentClass}>
              <SelectItem className={directoryFilterSelectItemClass} value="month">
                This month
              </SelectItem>
              <SelectItem className={directoryFilterSelectItemClass} value="quarter">
                This quarter
              </SelectItem>
              <SelectItem className={directoryFilterSelectItemClass} value="year">
                This year
              </SelectItem>
              <SelectItem className={directoryFilterSelectItemClass} value="all">
                All time
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-input px-2.5 text-xs text-foreground"
            onClick={() => showToast("Export — coming soon")}
          >
            <Download size={13} className="mr-1 shrink-0" />
            Export
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="px-6 pb-8 pt-6 space-y-6 max-w-[1600px]">
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {[
              { label: "Active VICs", val: "15", sub: "+3 vs Q3", up: true },
              { label: "Total Trips", val: "8", sub: "+2 vs Q3", up: true },
              { label: "Revenue", val: "€98,500", sub: "+32% vs Q3", up: true },
              { label: "Margin", val: "25.0%", sub: "Gross", up: true },
            ].map((k) => (
              <div key={k.label} className={cardClass}>
                <ListLabel className="block">{k.label}</ListLabel>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{k.val}</p>
                <p
                  className={cn(
                    "mt-1 text-sm",
                    k.up ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
                  )}
                >
                  {k.sub}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className={cardClass}>
              <ListLabel className="mb-4 block">Revenue by month</ListLabel>
              <div className="flex h-48 items-end justify-between gap-2 pt-2">
                {REVENUE.map((r) => (
                  <div key={r.m} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="mx-auto w-full max-w-[48px] rounded-t-md bg-gradient-to-t from-[rgba(201,169,110,0.5)] to-[rgba(201,169,110,0.12)] transition-all min-h-[8px]"
                      style={{ height: `${(r.v / maxRev) * 100}%` }}
                    />
                    <span className="text-2xs text-muted-foreground">{r.m}</span>
                    <span className="text-xs text-muted-foreground/90">€{r.v}K</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={cardClass}>
              <ListLabel className="mb-4 block">Trips by status</ListLabel>
              <div className="flex flex-col items-center justify-center gap-6 py-2 sm:flex-row sm:gap-8">
                <div
                  className="h-36 w-36 shrink-0 rounded-full"
                  style={{
                    background: donutBg,
                    mask: "radial-gradient(transparent 55%, black 56%)",
                    WebkitMask: "radial-gradient(transparent 55%, black 56%)",
                  }}
                />
                <ul className="space-y-1.5 text-sm text-muted-foreground/90">
                  {STATUS_DONUT.map((s) => (
                    <li key={s.label} className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
                      {s.label}: {s.n}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className={cn(listSurfaceClass, listScrollClass, "overflow-hidden")}>
            <div className="border-b border-border px-3 py-3">
              <ListLabel>Top VICs</ListLabel>
            </div>
            <table className={listTableClass("min-w-[640px]")}>
              <thead>
                <tr className={listTheadRowClass}>
                  <th className={listThClass} scope="col">
                    Name
                  </th>
                  <th className={listThClass} scope="col">
                    Trips
                  </th>
                  <th className={listThClass} scope="col">
                    Revenue
                  </th>
                  <th className={listThClass} scope="col">
                    Last trip
                  </th>
                  <th className={listThClass} scope="col">
                    Acuity
                  </th>
                </tr>
              </thead>
              <tbody>
                {TOP_VICS.map((row) => {
                  const acuityLabel = ACUITY_LABELS[row.acuity_status] ?? row.acuity_status;
                  return (
                    <tr key={row.id} className={listTbodyRowClass}>
                      <td className={listTdClass}>
                        <div className="flex items-center gap-3">
                          <ImageWithFallback
                            fallbackType="avatar"
                            alt={row.name}
                            name={row.name}
                            className="h-10 w-10 shrink-0"
                          />
                          <Link href={`/dashboard/vics/${row.id}`} className={cn(listPrimaryTextClass, "hover:underline")}>
                            {row.name}
                          </Link>
                        </div>
                      </td>
                      <td className={cn(listTdClass, listMutedCellClass)}>{row.trips}</td>
                      <td className={cn(listTdClass, listMutedCellClass)}>{row.rev}</td>
                      <td className={cn(listTdClass, listMutedCellClass)}>{row.last}</td>
                      <td className={listTdClass}>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-2xs font-medium capitalize",
                            acuityBadgeClass(row.acuity_status)
                          )}
                        >
                          {acuityLabel.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            className={cn(
              "rounded-xl border border-border bg-white/[0.02] p-4 transition-colors",
              askFocus && "border-[rgba(201,169,110,0.28)]"
            )}
          >
            <div className="flex items-center gap-2 rounded-lg border border-input bg-inset px-3 py-2.5 md:px-4 md:py-3">
              <span className="text-brand-cta" aria-hidden>
                ✦
              </span>
              <input
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
                placeholder="Ask a question about your data…"
                onFocus={() => setAskFocus(true)}
                onBlur={() => setAskFocus(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") showToast("AI Analytics — coming in v2");
                }}
              />
              <Button
                size="sm"
                variant="toolbarAccent"
                className="h-8 shrink-0 px-3 text-xs"
                onClick={() => showToast("AI Analytics — coming in v2")}
              >
                Ask
              </Button>
            </div>
            {askFocus && (
              <div className="mt-3 flex flex-wrap gap-2">
                {["Top revenue VICs this quarter", "Trips with unconfirmed events", "Commission forecast next 3 months"].map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="rounded-full border border-border bg-background/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-input hover:bg-muted/35 hover:text-foreground"
                    onClick={() => showToast("AI Analytics — coming in v2")}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
