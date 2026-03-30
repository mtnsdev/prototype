"use client";

import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Clock,
  FileText,
  Heart,
  MessageSquare,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { VIC, AcuityStatus } from "@/types/vic";

type DimensionBarProps = {
  label: string;
  low: string;
  high: string;
  value: number;
};

function DimensionBar({ label, low, high, value }: DimensionBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div>
      <span className="mb-1.5 block text-2xs text-muted-foreground">{label}</span>
      <div className="relative h-[4px] rounded-full bg-[rgba(255,255,255,0.04)]">
        <div
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#08080c] bg-brand-cta"
          style={{ left: `${clamped}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[8px] text-muted-foreground/65">{low}</span>
        <span className="text-[8px] text-muted-foreground/65">{high}</span>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-[rgba(255,255,255,0.02)] p-3">
      <span className="mb-1 block text-[9px] text-muted-foreground/65">{label}</span>
      <span className="text-lg font-light text-foreground">{value}</span>
    </div>
  );
}

function InsightRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <div>
        <span className="block text-2xs text-muted-foreground/65">{label}</span>
        <span className="text-sm text-muted-foreground">{value}</span>
      </div>
    </div>
  );
}

const MONTH_HEIGHTS = [0, 0, 15, 60, 10, 0, 30, 100, 0, 40, 0, 80];

type Props = {
  vic: VIC;
  status: AcuityStatus;
  isRunning: boolean;
  onRun: () => void;
  onRefresh: () => void;
};

export default function AcuityReportTab({ vic, status, isRunning, onRun, onRefresh }: Props) {
  const name = vic.full_name ?? "This client";
  const lastRun =
    vic.acuity_last_run ?? (vic as { acuityLastRun?: string }).acuityLastRun ?? null;
  const lastUpdatedStr = useMemo(() => {
    if (!lastRun) return "—";
    try {
      const d = new Date(lastRun);
      return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return lastRun;
    }
  }, [lastRun]);

  const provenanceCount = useMemo(() => {
    const p = vic.field_provenance ?? {};
    return Object.values(p).filter((x) => x?.source === "acuity").length || 12;
  }, [vic.field_provenance]);

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(166,107,107,0.08)]">
          <Sparkles className="h-5 w-5 text-[#A66B6B]" />
        </div>
        <h3 className="text-base font-light text-foreground">Acuity run failed</h3>
        <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
          We couldn&apos;t complete the analysis. Try again in a moment.
        </p>
        <button
          type="button"
          onClick={onRun}
          className="mt-5 flex items-center gap-2 rounded-lg border border-[rgba(201,169,110,0.18)] bg-[rgba(201,169,110,0.10)] px-4 py-2 text-sm text-brand-cta transition-colors hover:bg-[rgba(201,169,110,0.16)]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Retry Acuity
        </button>
      </div>
    );
  }

  if (status === "not_run" && !isRunning) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(201,169,110,0.06)]">
          <Sparkles className="h-5 w-5 text-brand-cta" />
        </div>
        <h3 className="text-base font-light text-foreground">Acuity not yet run</h3>
        <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
          Run Acuity to generate an AI intelligence profile based on {name}&apos;s booking history, communications, and
          travel patterns.
        </p>
        <button
          type="button"
          onClick={onRun}
          className="mt-5 flex items-center gap-2 rounded-lg border border-[rgba(201,169,110,0.18)] bg-[rgba(201,169,110,0.10)] px-4 py-2 text-sm text-brand-cta transition-colors hover:bg-[rgba(201,169,110,0.16)]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Run Acuity Analysis
        </button>
        <span className="mt-2 text-[9px] text-muted-foreground/65">Takes approximately 30 seconds</span>
      </div>
    );
  }

  if (status === "running" || isRunning) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-[rgba(201,169,110,0.06)]">
          <Sparkles className="h-5 w-5 text-brand-cta" />
        </div>
        <h3 className="text-base font-light text-foreground">Analyzing {name}...</h3>
        <p className="mt-1 text-sm text-muted-foreground">Processing booking history, communications, and travel patterns</p>
        <div className="mt-4 h-[2px] w-48 overflow-hidden rounded-full bg-[rgba(255,255,255,0.03)]">
          <div className="h-full rounded-full bg-brand-cta animate-acuity-progress" />
        </div>
      </div>
    );
  }

  /* complete */
  const summary = `${name} is a high-value, experience-driven traveler with a strong preference for Asian luxury properties and boutique European destinations. Travels 4-5 times per year, typically in family configurations with two children. Highly price-insensitive on accommodations but value-conscious on experiences — expects unique access, not just luxury amenities. Responds best to curated, concise proposals with 2-3 options maximum. Long-standing relationship with the agency since 2019.`;

  const observations = [
    "Has never traveled to South America despite expressed interest — potential upsell opportunity",
    "Always books suites — never standard rooms. Villa preference when available.",
    "Requested kid-friendly activities on last 3 trips — children are growing into active travel age",
    "Mentioned interest in wine regions during last inquiry — consider Burgundy or Tuscany proposals",
    "Loyalty to Aman brand is strong — used Aman Junkies program on 4 of last 6 hotel bookings",
  ];

  const travelHistory = [
    { date: "Dec 2025", destination: "Maldives", property: "One&Only Reethi Rah", duration: "10 nights", type: "Family" },
    { date: "Aug 2025", destination: "Kyoto, Japan", property: "Aman Kyoto", duration: "7 nights", type: "Family" },
    { date: "Apr 2025", destination: "St. Barthélemy", property: "Cheval Blanc", duration: "6 nights", type: "Couple" },
    { date: "Dec 2024", destination: "Tokyo, Japan", property: "Aman Tokyo", duration: "5 nights", type: "Family" },
  ];

  return (
    <div className="overflow-y-auto">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(201,169,110,0.08)]">
              <Sparkles className="h-4 w-4 text-brand-cta" />
            </div>
            <div>
              <h2 className="text-lg font-light text-foreground">Acuity Profile</h2>
              <span className="text-2xs text-muted-foreground/65">
                Last updated {lastUpdatedStr} · Based on {provenanceCount} data points
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-2xs text-muted-foreground transition-colors hover:text-muted-foreground"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      </div>

      <div className="border-b border-border px-6 py-5">
        <span className="mb-2 block text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/65">
          Executive Summary
        </span>
        <p className="text-compact leading-relaxed text-muted-foreground">{summary}</p>
      </div>

      <div className="border-b border-border px-6 py-5">
        <span className="mb-4 block text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/65">
          Profile Dimensions
        </span>
        <div className="grid grid-cols-2 gap-4">
          <DimensionBar label="Price Sensitivity" low="Price-insensitive" high="Budget-conscious" value={15} />
          <DimensionBar label="Adventure vs Relaxation" low="Pure relaxation" high="Adventure-seeking" value={40} />
          <DimensionBar label="Planning Style" low="Spontaneous" high="Meticulous planner" value={70} />
          <DimensionBar label="Privacy Level" low="Social / group" high="Ultra-private" value={60} />
          <DimensionBar label="Culinary Interest" low="Standard dining" high="Gastronomic focus" value={85} />
          <DimensionBar label="Cultural Engagement" low="Resort-based" high="Deep cultural immersion" value={65} />
        </div>
      </div>

      <div className="border-b border-border px-6 py-5">
        <span className="mb-3 block text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/65">
          Travel Preferences
        </span>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <span className="mb-2 block text-2xs text-muted-foreground">Preferred Regions</span>
            <div className="space-y-1.5">
              {["Japan", "Southeast Asia", "French Riviera", "Maldives"].map((region) => (
                <div key={region} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-cta" />
                  <span className="text-xs text-foreground">{region}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-2 block text-2xs text-muted-foreground">Preferred Brands</span>
            <div className="space-y-1.5">
              {["Aman", "Four Seasons", "One&Only", "Cheval Blanc"].map((brand) => (
                <div key={brand} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-cta" />
                  <span className="text-xs text-foreground">{brand}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-2 block text-2xs text-muted-foreground">Travel Style</span>
            <div className="flex flex-wrap gap-1.5">
              {["Family", "Cultural immersion", "Fine dining", "Spa & wellness", "Private guides", "Photography"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded border border-[rgba(201,169,110,0.10)] bg-[rgba(201,169,110,0.06)] px-2 py-0.5 text-2xs text-brand-cta"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-border px-6 py-5">
        <span className="mb-3 block text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/65">
          Spending Profile
        </span>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniMetric label="Avg. trip spend" value="€32,000" />
          <MiniMetric label="Avg. night rate" value="€1,200" />
          <MiniMetric label="Trips per year" value="4-5" />
          <MiniMetric label="Avg. trip length" value="8 nights" />
        </div>
        <div className="mt-4">
          <span className="mb-2 block text-2xs text-muted-foreground">Spend Allocation</span>
          <div className="flex h-[6px] items-center gap-0 overflow-hidden rounded-full">
            <div className="h-full rounded-l-full bg-[#B8A082]" style={{ width: "45%" }} title="Accommodation" />
            <div className="h-full bg-[#82A0A0]" style={{ width: "20%" }} title="Experiences" />
            <div className="h-full bg-[#A08CAA]" style={{ width: "15%" }} title="Dining" />
            <div className="h-full bg-[#8296B4]" style={{ width: "12%" }} title="Transport" />
            <div className="h-full rounded-r-full bg-[#6B6560]" style={{ width: "8%" }} title="Other" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#B8A082]" /> Accommodation 45%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#82A0A0]" /> Experiences 20%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#A08CAA]" /> Dining 15%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#8296B4]" /> Transport 12%
            </span>
          </div>
        </div>
      </div>

      <div className="border-b border-border px-6 py-5">
        <span className="mb-3 block text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/65">
          Seasonal Patterns
        </span>
        <div className="flex h-16 items-end gap-1">
          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, i) => (
            <div key={month} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full min-h-[2px] rounded-t bg-[rgba(201,169,110,0.20)]"
                style={{ height: `${MONTH_HEIGHTS[i]}%` }}
              />
              <span className="text-[8px] text-muted-foreground/65">{month}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Peak travel months: April (spring break), August (summer holiday), December (winter escape). Avoids June and
          September.
        </p>
      </div>

      <div className="border-b border-border px-6 py-5">
        <span className="mb-3 block text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/65">
          Communication Insights
        </span>
        <div className="space-y-3">
          <InsightRow
            icon={MessageSquare}
            label="Preferred channel"
            value="Email — formal but warm tone. Responds within 24h."
          />
          <InsightRow
            icon={Clock}
            label="Best contact time"
            value="Weekday mornings (9-11am CET). Rarely responds weekends."
          />
          <InsightRow
            icon={FileText}
            label="Proposal preference"
            value="Concise — prefers 2-3 curated options with rationale, not long lists."
          />
          <InsightRow
            icon={Heart}
            label="Decision pattern"
            value="Decides quickly when options are well-curated. Spouse (Anne) has veto on beach destinations."
          />
        </div>
      </div>

      <div className="border-b border-border px-6 py-5">
        <span className="mb-3 block text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/65">
          AI Observations
        </span>
        <div className="space-y-2">
          {observations.map((obs, i) => (
            <div key={i} className="flex items-start gap-2 py-1.5">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-brand-cta" />
              <span className="text-sm leading-relaxed text-muted-foreground">{obs}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-5">
        <span className="mb-3 block text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/65">
          Recent Travel History
        </span>
        <div className="space-y-2">
          {travelHistory.map((trip, i) => (
            <div
              key={i}
              className="flex cursor-pointer items-center gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-[rgba(255,255,255,0.015)]"
            >
              <span className="w-16 text-2xs text-muted-foreground/65">{trip.date}</span>
              <div className="min-w-0 flex-1">
                <span className="text-sm text-foreground">{trip.destination}</span>
                <span className="block text-2xs text-muted-foreground">{trip.property}</span>
              </div>
              <span className="text-2xs text-muted-foreground">{trip.duration}</span>
              <span className="rounded bg-[rgba(255,255,255,0.03)] px-1.5 py-0.5 text-[9px] text-muted-foreground/65">{trip.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
