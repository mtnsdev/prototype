"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PreviewBanner from "@/components/ui/PreviewBanner";
import { IS_PREVIEW_MODE } from "@/config/preview";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

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
  { label: "Confirmed", n: 3, color: "rgb(52 211 153)" },
  { label: "Draft", n: 2, color: "rgb(156 163 175)" },
  { label: "Proposed", n: 1, color: "rgb(96 165 250)" },
  { label: "Completed", n: 0, color: "rgb(45 212 191)" },
  { label: "Cancelled", n: 0, color: "rgb(248 113 113)" },
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
  totalTrips > 0 ? `conic-gradient(${donutStops.join(", ")})` : "conic-gradient(#333 0% 100%)";

const TOP_VICS = [
  { id: "fake-vic-1", name: "Jean-Christophe Chopin", trips: 2, rev: "€28,500", last: "Monaco GP", acuity: "Complete" },
  { id: "fake-vic-14", name: "Valérie Rousseau", trips: 1, rev: "€3,970", last: "Paris Weekend", acuity: "Complete" },
  { id: "fake-vic-4", name: "Eric Tournier", trips: 1, rev: "—", last: "Tuscany (draft)", acuity: "Complete" },
  { id: "fake-vic-3", name: "Camille Signoles", trips: 1, rev: "€42,000", last: "Maldives", acuity: "Complete" },
  { id: "fake-vic-11", name: "Thomas Bresson", trips: 1, rev: "—", last: "Lyon (draft)", acuity: "Not Run" },
];

export default function AnalyticsPage() {
  const showToast = useToast();
  const [range, setRange] = useState("quarter");
  const [askFocus, setAskFocus] = useState(false);

  return (
    <div className="h-full overflow-auto bg-[#0C0C0C]">
      {IS_PREVIEW_MODE && <PreviewBanner feature="Analytics" variant="full" dismissible sampleDataOnly />}
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-[#F5F5F5] flex items-center gap-2">
            <BarChart3 size={28} className="text-blue-400" /> Analytics
          </h1>
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-[#F5F5F5]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="quarter">This quarter</SelectItem>
                <SelectItem value="year">This year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-white/10" onClick={() => showToast("Export — coming soon")}>
              <Download size={14} className="mr-1" /> Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active VICs", val: "15", sub: "+3 vs Q3", up: true },
            { label: "Total Trips", val: "8", sub: "+2 vs Q3", up: true },
            { label: "Revenue", val: "€98,500", sub: "+32% vs Q3", up: true },
            { label: "Margin", val: "25.0%", sub: "Gross", up: true },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{k.label}</p>
              <p className="text-3xl font-bold text-[#F5F5F5] mt-1">{k.val}</p>
              <p className={cn("text-sm mt-1", k.up ? "text-emerald-500" : "text-red-400")}>{k.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Revenue by month</h2>
            <div className="flex items-end justify-between gap-2 h-48 pt-4">
              {REVENUE.map((r) => (
                <div key={r.m} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full max-w-[48px] mx-auto rounded-t-md bg-gradient-to-t from-violet-600 to-violet-400/80 min-h-[8px] transition-all"
                    style={{ height: `${(r.v / maxRev) * 100}%` }}
                  />
                  <span className="text-[10px] text-gray-500">{r.m}</span>
                  <span className="text-xs text-gray-400">€{r.v}K</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Trips by status</h2>
            <div className="flex items-center justify-center gap-8 py-4">
              <div
                className="w-36 h-36 rounded-full shrink-0"
                style={{
                  background: donutBg,
                  mask: "radial-gradient(transparent 55%, black 56%)",
                  WebkitMask: "radial-gradient(transparent 55%, black 56%)",
                }}
              />
              <ul className="text-sm space-y-1">
                {STATUS_DONUT.map((s) => (
                  <li key={s.label} className="flex items-center gap-2 text-gray-400">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                    {s.label}: {s.n}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] overflow-hidden">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 border-b border-white/[0.06]">
            Top VICs
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-white/[0.06]">
                <th className="px-4 py-2 font-medium">VIC</th>
                <th className="px-4 py-2 font-medium">Trips</th>
                <th className="px-4 py-2 font-medium">Revenue</th>
                <th className="px-4 py-2 font-medium">Last Trip</th>
                <th className="px-4 py-2 font-medium">Acuity</th>
              </tr>
            </thead>
            <tbody>
              {TOP_VICS.map((row) => (
                <tr key={row.id} className="border-b border-white/[0.04] hover:bg-white/[0.04]">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/vics/${row.id}`} className="text-[#F5F5F5] hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{row.trips}</td>
                  <td className="px-4 py-3 text-gray-400">{row.rev}</td>
                  <td className="px-4 py-3 text-gray-400">{row.last}</td>
                  <td className="px-4 py-3 text-gray-400">{row.acuity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className={cn(
            "rounded-xl border border-white/10 p-4 transition-colors bg-blue-500/5",
            askFocus && "border-blue-500/25"
          )}
        >
          <div className="flex items-center gap-2 rounded-lg bg-black/20 border border-blue-500/10 px-4 py-3">
            <span className="text-blue-400">✦</span>
            <input
              className="flex-1 bg-transparent text-[#F5F5F5] placeholder:text-gray-500 text-sm outline-none"
              placeholder="Ask a question about your data..."
              onFocus={() => setAskFocus(true)}
              onBlur={() => setAskFocus(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") showToast("AI Analytics — coming in v2");
              }}
            />
            <Button size="sm" className="bg-slate-600 hover:bg-slate-500" onClick={() => showToast("AI Analytics — coming in v2")}>
              →
            </Button>
          </div>
          {askFocus && (
            <div className="flex flex-wrap gap-2 mt-3">
              {["Top revenue VICs this quarter", "Trips with unconfirmed events", "Commission forecast next 3 months"].map((q) => (
                <button
                  key={q}
                  type="button"
                  className="text-xs px-3 py-1.5 rounded-full border border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
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
  );
}
