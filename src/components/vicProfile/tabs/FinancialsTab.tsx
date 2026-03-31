"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FinancialSummary, Trip } from "@/types/vic-profile";
import { KPICard } from "../components/KPICard";
import { ProfileSectionCard } from "../components/ProfileSectionCard";
import { formatCurrency } from "@/lib/vic-profile-helpers";
import { Button } from "@/components/ui/button";
import { listSurfaceClass, listTableClass, listTdClass, listThClass, listTheadRowClass, listTbodyRowClass } from "@/lib/list-ui";
import { cn } from "@/lib/utils";

type Sub = "trip" | "year" | "category" | "partner";

export function FinancialsTab({ financials, trips }: { financials: FinancialSummary; trips: Trip[] }) {
  const [sub, setSub] = useState<Sub>("year");

  const unavailable = financials.dataSource === "unavailable";
  const partial = financials.dataSource === "axus_partial";

  const maxYear = useMemo(
    () => Math.max(...financials.yearlyBreakdown.map((y) => y.totalValue), 1),
    [financials.yearlyBreakdown]
  );
  const maxCat = useMemo(
    () => Math.max(...financials.categoryBreakdown.map((c) => c.totalValue), 1),
    [financials.categoryBreakdown]
  );
  const maxPart = useMemo(
    () => Math.max(...financials.partnerBreakdown.map((p) => p.totalValue), 1),
    [financials.partnerBreakdown]
  );

  if (unavailable) {
    return (
      <div className="rounded-xl border border-border bg-background p-6 text-center text-sm">
        <p className="font-medium text-foreground">Connect TripSuite to unlock financial intelligence</p>
        <p className="mt-2 text-muted-foreground">
          Lifetime value, commission rollups, and partner splits will appear here.
        </p>
        <Button type="button" className="mt-4" variant="secondary" asChild>
          <Link href="/dashboard/settings/integrations">Integration setup</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {partial ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
          Partial data — connect TripSuite for commission details. Showing available Axus-linked totals only.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Lifetime value" value={formatCurrency(financials.lifetimeValue)} />
        <KPICard label="Lifetime commission" value={formatCurrency(financials.lifetimeCommission)} />
        <KPICard
          label="Avg trip value"
          value={formatCurrency(financials.averageTripValue)}
          hint={`${financials.totalTrips} trips`}
        />
        <KPICard
          label="Projected pipeline"
          value={formatCurrency(financials.projectedPipelineValue)}
          hint={formatCurrency(financials.projectedPipelineCommission) + " est. commission"}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["trip", "By trip"],
            ["year", "By year"],
            ["category", "By category"],
            ["partner", "By partner"],
          ] as const
        ).map(([id, label]) => (
          <Button key={id} size="sm" variant={sub === id ? "secondary" : "outline"} type="button" onClick={() => setSub(id)}>
            {label}
          </Button>
        ))}
      </div>

      <ProfileSectionCard title="Detail">
        {sub === "trip" ? (
          trips.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trips to show.</p>
          ) : (
            <div className={listSurfaceClass}>
              <table className={listTableClass("min-w-[520px]")}>
                <thead>
                  <tr className={listTheadRowClass}>
                    <th className={listThClass}>Trip</th>
                    <th className={listThClass}>Status</th>
                    <th className={cn(listThClass, "text-right")}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((t) => (
                    <tr key={t.id} className={listTbodyRowClass}>
                      <td className={listTdClass}>{t.name ?? t.id}</td>
                      <td className={listTdClass}>{t.status}</td>
                      <td className={cn(listTdClass, "text-right")}>
                        {t.totalValue != null ? formatCurrency(t.totalValue) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}

        {sub === "year" ? (
          financials.yearlyBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No yearly breakdown in seed data.</p>
          ) : (
            <div className="space-y-3">
              {financials.yearlyBreakdown.map((y) => (
                <div key={y.year}>
                  <div className="mb-0.5 flex justify-between text-xs text-muted-foreground">
                    <span>{y.year}</span>
                    <span>
                      {formatCurrency(y.totalValue)} · {y.tripCount} trips
                      {y.yoyChange != null ? ` · YoY ${y.yoyChange > 0 ? "+" : ""}${y.yoyChange}%` : ""}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full bg-[var(--brand-cta)]/70"
                      style={{ width: `${(y.totalValue / maxYear) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}

        {sub === "category" ? (
          financials.categoryBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No category breakdown.</p>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div
                className="relative mx-auto h-40 w-40 rounded-full border border-border bg-muted/30"
                aria-hidden
                style={{
                  background:
                    "conic-gradient(from 0deg, rgb(59 130 246 / 0.7) 0 40%, rgb(139 92 246 / 0.55) 40% 70%, rgb(16 185 129 / 0.5) 70% 100%)",
                }}
              />
              <div className="min-w-0 flex-1 space-y-2">
                {financials.categoryBreakdown.map((c) => (
                  <div key={c.category}>
                    <div className="mb-0.5 flex justify-between text-xs text-muted-foreground">
                      <span className="capitalize">{c.category}</span>
                      <span>
                        {formatCurrency(c.totalValue)} ({c.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                      <div
                        className="h-full rounded-full bg-violet-500/70"
                        style={{ width: `${(c.totalValue / maxCat) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : null}

        {sub === "partner" ? (
          financials.partnerBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No partner breakdown.</p>
          ) : (
            <div className="space-y-2">
              {financials.partnerBreakdown.map((p) => (
                <div key={p.partnerName}>
                  <div className="mb-0.5 flex justify-between text-xs text-muted-foreground">
                    <span>
                      {p.partnerName} <span className="capitalize">({p.partnerType.replace("_", " ")})</span>
                    </span>
                    <span>
                      {formatCurrency(p.totalValue)} · {p.stayCount} stays
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full bg-cyan-600/60"
                      style={{ width: `${(p.totalValue / maxPart) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}
      </ProfileSectionCard>
    </div>
  );
}
