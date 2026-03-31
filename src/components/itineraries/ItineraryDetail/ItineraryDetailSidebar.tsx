"use client";

import Link from "next/link";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { Itinerary } from "@/types/itinerary";
import { formatDateRange } from "../statusConfig";

const DEFAULT_COMMISSION_RATE = 12;

function computedTotals(itinerary: Itinerary) {
  let vicSellTotal = 0;
  let net = 0;
  let commission = 0;
  (itinerary.days ?? []).forEach((d) => {
    (d.events ?? []).forEach((e) => {
      const cp = e.vic_price ?? 0;
      vicSellTotal += cp;
      const cost = e.net_cost ?? (cp > 0 ? Math.round(cp * 0.75) : 0);
      net += cost;
      commission += e.commission_amount ?? (cp > 0 ? Math.round(cp * (DEFAULT_COMMISSION_RATE / 100)) : 0);
    });
  });
  const margin = vicSellTotal - net;
  const commissionAmount = itinerary.total_commission ?? commission;
  const netToAgency = margin - commissionAmount;
  return {
    total_vic_price: vicSellTotal,
    total_net_cost: net,
    total_commission: commissionAmount,
    total_margin: margin,
    margin_pct: vicSellTotal > 0 ? (margin / vicSellTotal) * 100 : 0,
    net_to_agency: netToAgency,
  };
}

type Props = {
  itinerary: Itinerary;
  /** Days used for financial totals (e.g. selected trip option) */
  financialItinerary?: Itinerary;
  canViewFinancials: boolean;
  onAIImport?: () => void;
  onAIGuide?: () => void;
  onAISuggest?: () => void;
};

export default function ItineraryDetailSidebar({
  itinerary,
  financialItinerary,
  canViewFinancials,
  onAIImport,
  onAIGuide,
  onAISuggest,
}: Props) {
  const [aiOpen, setAiOpen] = useState(true);
  const fin = financialItinerary ?? itinerary;
  const computed = computedTotals(fin);
  const totalVic = fin.total_vic_price ?? computed.total_vic_price;
  const totalNet = fin.total_net_cost ?? computed.total_net_cost;
  const totalMargin = fin.total_margin ?? computed.total_margin;
  const totalCommission = fin.total_commission ?? computed.total_commission;
  const marginPct = computed.margin_pct;
  const netToAgency = computed.net_to_agency;
  const currency = itinerary.currency === "EUR" ? "€" : itinerary.currency;
  const showFinancials = canViewFinancials || totalVic > 0 || totalNet > 0;

  return (
    <aside className="w-72 shrink-0 border-l border-border bg-inset p-4 overflow-y-auto max-md:w-full max-md:border-l-0 max-md:border-t max-md:order-last">
      <section className="space-y-3 mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/75">
          Trip info
        </h3>
        <div className="text-sm space-y-2">
          <div>
            <span className="text-muted-foreground/75">VIC</span>
            <p className="text-foreground">
              <Link
                href={`/dashboard/vics/${itinerary.primary_vic_id}`}
                className="hover:underline"
              >
                {itinerary.primary_vic_name ?? itinerary.primary_vic_id ?? "—"}
              </Link>
            </p>
          </div>
          <div>
            <span className="text-muted-foreground/75">Advisor</span>
            <p className="text-foreground">{itinerary.primary_advisor_name ?? itinerary.primary_advisor_id ?? "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground/75">Dates</span>
            <p className="text-foreground">{formatDateRange(itinerary.trip_start_date, itinerary.trip_end_date)}</p>
          </div>
          {itinerary.traveler_count != null && (
            <div>
              <span className="text-muted-foreground/75">Travelers</span>
              <p className="text-foreground">{itinerary.traveler_count}</p>
            </div>
          )}
          <div>
            <span className="text-muted-foreground/75">Destinations</span>
            <p className="text-foreground">{(itinerary.destinations ?? []).join(", ") || "—"}</p>
          </div>
        </div>
      </section>

      {showFinancials && (
        <section className="space-y-3 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/75">
            Financial summary
          </h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground/75">VIC price</span>
              <span className="text-foreground">{currency}{totalVic.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground/75">Supplier cost</span>
              <span className="text-foreground">{currency}{totalNet.toLocaleString()}</span>
            </div>
            <div className="border-t border-white/5 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground/75">Gross margin</span>
                <span className="text-foreground">{currency}{totalMargin.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs mt-0.5">
                <span className="text-muted-foreground/75">Margin %</span>
                <span className="text-foreground">{marginPct.toFixed(1)}%</span>
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground/75">Commission ({DEFAULT_COMMISSION_RATE}%)</span>
              <span className="text-foreground">{currency}{totalCommission.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-2">
              <span className="text-muted-foreground/75">Net to agency</span>
              <span className="text-foreground">{currency}{netToAgency.toLocaleString()}</span>
            </div>
          </div>
        </section>
      )}

      <section className="mb-6 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setAiOpen((o) => !o)}
          className="flex items-center justify-between w-full text-left text-xs font-semibold uppercase tracking-wider text-blue-400/90"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-blue-400" /> AI Assist
          </span>
          {aiOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {aiOpen && (
          <div className="mt-3 space-y-2">
            {[
              { t: "Import Itinerary", d: "From PDF, URL, or text", on: onAIImport },
              { t: "Generate Destination Guide", d: "AI-powered travel brief", on: onAIGuide },
              { t: "Suggest Activities", d: "Based on VIC preferences", on: onAISuggest },
            ].map((x) => (
              <button
                key={x.t}
                type="button"
                onClick={x.on}
                className="w-full text-left rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 hover:bg-blue-500/10 transition-colors"
              >
                <p className="text-sm font-medium text-foreground">{x.t}</p>
                <p className="text-xs text-muted-foreground">{x.d}</p>
                <span className="text-xs text-blue-400 mt-1 inline-block">{x.on ? "Open →" : "—"}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {(itinerary.tags ?? []).length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/75">
            Tags
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {itinerary.tags.map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-0.5 rounded bg-white/10 text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
