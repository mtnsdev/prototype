"use client";

import Link from "next/link";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { Itinerary } from "@/types/itinerary";
import { formatDateRange } from "../statusConfig";

const DEFAULT_COMMISSION_RATE = 12;

function computedTotals(itinerary: Itinerary) {
  let client = 0;
  let net = 0;
  let commission = 0;
  (itinerary.days ?? []).forEach((d) => {
    (d.events ?? []).forEach((e) => {
      const cp = e.client_price ?? 0;
      client += cp;
      const cost = e.net_cost ?? (cp > 0 ? Math.round(cp * 0.75) : 0);
      net += cost;
      commission += e.commission_amount ?? (cp > 0 ? Math.round(cp * (DEFAULT_COMMISSION_RATE / 100)) : 0);
    });
  });
  const margin = client - net;
  const commissionAmount = itinerary.total_commission ?? commission;
  const netToAgency = margin - commissionAmount;
  return {
    total_client_price: client,
    total_net_cost: net,
    total_commission: commissionAmount,
    total_margin: margin,
    margin_pct: client > 0 ? (margin / client) * 100 : 0,
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
  const totalClient = fin.total_client_price ?? computed.total_client_price;
  const totalNet = fin.total_net_cost ?? computed.total_net_cost;
  const totalMargin = fin.total_margin ?? computed.total_margin;
  const totalCommission = fin.total_commission ?? computed.total_commission;
  const marginPct = computed.margin_pct;
  const netToAgency = computed.net_to_agency;
  const currency = itinerary.currency === "EUR" ? "€" : itinerary.currency;
  const showFinancials = canViewFinancials || totalClient > 0 || totalNet > 0;

  return (
    <aside className="w-72 shrink-0 border-l border-[rgba(255,255,255,0.08)] bg-[#08080c] p-4 overflow-y-auto max-md:w-full max-md:border-l-0 max-md:border-t max-md:order-last">
      <section className="space-y-3 mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)]">
          Trip info
        </h3>
        <div className="text-sm space-y-2">
          <div>
            <span className="text-[rgba(245,245,245,0.5)]">VIC</span>
            <p className="text-[#F5F5F5]">
              <Link
                href={`/dashboard/vics/${itinerary.primary_vic_id}`}
                className="hover:underline"
              >
                {itinerary.primary_vic_name ?? itinerary.primary_vic_id ?? "—"}
              </Link>
            </p>
          </div>
          <div>
            <span className="text-[rgba(245,245,245,0.5)]">Advisor</span>
            <p className="text-[#F5F5F5]">{itinerary.primary_advisor_name ?? itinerary.primary_advisor_id ?? "—"}</p>
          </div>
          <div>
            <span className="text-[rgba(245,245,245,0.5)]">Dates</span>
            <p className="text-[#F5F5F5]">{formatDateRange(itinerary.trip_start_date, itinerary.trip_end_date)}</p>
          </div>
          {itinerary.traveler_count != null && (
            <div>
              <span className="text-[rgba(245,245,245,0.5)]">Travelers</span>
              <p className="text-[#F5F5F5]">{itinerary.traveler_count}</p>
            </div>
          )}
          <div>
            <span className="text-[rgba(245,245,245,0.5)]">Destinations</span>
            <p className="text-[#F5F5F5]">{(itinerary.destinations ?? []).join(", ") || "—"}</p>
          </div>
        </div>
      </section>

      {showFinancials && (
        <section className="space-y-3 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)]">
            Financial summary
          </h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-[rgba(245,245,245,0.5)]">Client price</span>
              <span className="text-[#F5F5F5]">{currency}{totalClient.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgba(245,245,245,0.5)]">Supplier cost</span>
              <span className="text-[#F5F5F5]">{currency}{totalNet.toLocaleString()}</span>
            </div>
            <div className="border-t border-white/5 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-[rgba(245,245,245,0.5)]">Gross margin</span>
                <span className="text-[#F5F5F5]">{currency}{totalMargin.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs mt-0.5">
                <span className="text-[rgba(245,245,245,0.5)]">Margin %</span>
                <span className="text-[#F5F5F5]">{marginPct.toFixed(1)}%</span>
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[rgba(245,245,245,0.5)]">Commission ({DEFAULT_COMMISSION_RATE}%)</span>
              <span className="text-[#F5F5F5]">{currency}{totalCommission.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-2">
              <span className="text-[rgba(245,245,245,0.5)]">Net to agency</span>
              <span className="text-[#F5F5F5]">{currency}{netToAgency.toLocaleString()}</span>
            </div>
          </div>
        </section>
      )}

      <section className="mb-6 border-t border-white/[0.08] pt-4">
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
                <p className="text-sm font-medium text-[#F5F5F5]">{x.t}</p>
                <p className="text-xs text-gray-500">{x.d}</p>
                <span className="text-xs text-blue-400 mt-1 inline-block">{x.on ? "Open →" : "—"}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {(itinerary.tags ?? []).length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)]">
            Tags
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {itinerary.tags.map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-0.5 rounded bg-white/10 text-[rgba(245,245,245,0.8)]"
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
