"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import PreviewBanner from "@/components/ui/PreviewBanner";
import { IS_PREVIEW_MODE } from "@/config/preview";
import { useToast } from "@/contexts/ToastContext";
import { AutomationBuilderModal } from "@/components/itineraries/CompetitorFeatureModals";

const CARDS = [
  {
    title: "Birthday Greeting",
    active: true,
    trigger: "VIC birthday (7 days before)",
    action: "Send personalized email",
    applied: "12 VICs",
    last: "8 Mar",
  },
  {
    title: "Passport Expiry Warning",
    active: true,
    trigger: "Passport expires in 200 days",
    action: "Create action item + notify advisor",
    applied: "15 VICs",
    last: "12 Mar",
  },
  {
    title: "Pre-Trip Preparation",
    active: true,
    trigger: "Trip departure in 14 days",
    action: "Send pre-travel checklist email",
    applied: "All confirmed trips",
    last: "5 Mar",
  },
  {
    title: "Post-Trip Follow-Up",
    active: false,
    trigger: "Trip end date + 3 days",
    action: "Send welcome home email + feedback form",
    applied: "All completed trips",
    last: "—",
  },
];

export default function AutomationsPage() {
  const showToast = useToast();
  const [builderOpen, setBuilderOpen] = useState(false);

  return (
    <div className="h-full overflow-auto bg-[#0C0C0C]">
      {IS_PREVIEW_MODE && <PreviewBanner feature="Automations" variant="full" dismissible sampleDataOnly />}
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-[#F5F5F5] flex items-center gap-2">
            <Zap size={28} className="text-violet-400" /> Automations
          </h1>
          <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setBuilderOpen(true)}>
            + Create Automation
          </Button>
        </div>

        <div className="space-y-4">
          {CARDS.map((c) => (
            <button
              key={c.title}
              type="button"
              onClick={() => showToast("Automation editor — coming in v2")}
              className="w-full text-left rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/15 flex items-center justify-center text-violet-400 shrink-0">
                  <Zap size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#F5F5F5]">{c.title}</span>
                    <span
                      className={
                        c.active
                          ? "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-400/30 text-emerald-400"
                          : "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-gray-500/30 text-gray-500"
                      }
                    >
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    <span className="text-gray-500">Trigger:</span> {c.trigger}
                  </p>
                  <p className="text-sm text-gray-400">
                    <span className="text-gray-500">Action:</span> {c.action}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Applied to: {c.applied} · Last triggered: {c.last}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <AutomationBuilderModal
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onSaveDraft={() => {
          showToast("Save Draft — coming soon");
          setBuilderOpen(false);
        }}
      />
    </div>
  );
}
