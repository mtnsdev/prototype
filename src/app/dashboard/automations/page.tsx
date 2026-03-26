"use client";

import { useState } from "react";
import { X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import PreviewBanner from "@/components/ui/PreviewBanner";
import { IS_PREVIEW_MODE } from "@/config/preview";
import { useToast } from "@/contexts/ToastContext";
import { AutomationBuilderModal } from "@/components/itineraries/CompetitorFeatureModals";
import { cn } from "@/lib/utils";

type AutomationRecord = {
  id: string;
  name: string;
  trigger: string;
  triggerValue: number;
  action: string;
  conditionDescription: string;
  enabled: boolean;
  lastRun: string | null;
  runCount: number;
  /** Shown on list card */
  applied: string;
};

const INITIAL_MOCK: AutomationRecord[] = [
  {
    id: "auto-001",
    name: "Birthday Greeting — 7 Day Reminder",
    trigger: "birthday_approaching",
    triggerValue: 7,
    action: "create_action_item",
    conditionDescription: "All active VICs with a birthday on file",
    enabled: true,
    lastRun: "12 Mar 2026",
    runCount: 3,
    applied: "12 VICs",
  },
  {
    id: "auto-002",
    name: "Passport Expiry Warning",
    trigger: "passport_expiring",
    triggerValue: 90,
    action: "send_notification",
    conditionDescription: "VICs with passport expiring within 90 days",
    enabled: true,
    lastRun: "15 Mar 2026",
    runCount: 1,
    applied: "15 VICs",
  },
  {
    id: "auto-003",
    name: "Pre-Trip Checklist — 14 Days Out",
    trigger: "trip_departure",
    triggerValue: 14,
    action: "create_action_item",
    conditionDescription: 'Itineraries in "preparing" or "final_review" stage',
    enabled: true,
    lastRun: null,
    runCount: 0,
    applied: "All confirmed trips",
  },
  {
    id: "auto-004",
    name: "Welcome Home Follow-Up",
    trigger: "trip_departure",
    triggerValue: -3,
    action: "send_email",
    conditionDescription: 'Itineraries in "post_travel" stage',
    enabled: false,
    lastRun: "20 Feb 2026",
    runCount: 5,
    applied: "All completed trips",
  },
];

function triggerSummary(trigger: string, triggerValue: number): string {
  switch (trigger) {
    case "birthday_approaching":
      return `VIC birthday (${triggerValue} days before)`;
    case "passport_expiring":
      return `Passport expiring in ${triggerValue} days`;
    case "trip_departure":
      return triggerValue < 0
        ? `Trip end + ${Math.abs(triggerValue)} days`
        : `Trip departure in ${triggerValue} days`;
    case "acuity_complete":
      return "VIC Acuity profile completed";
    case "new_vic_created":
      return "New VIC created";
    case "itinerary_stage_change":
      return "Itinerary pipeline stage changes";
    case "manual":
      return "Manual trigger";
    default:
      return trigger;
  }
}

function actionSummary(action: string): string {
  switch (action) {
    case "send_email":
      return "Send personalized email";
    case "create_action_item":
      return "Create action item";
    case "send_notification":
      return "Send notification";
    case "run_acuity":
      return "Run Acuity on VIC";
    case "add_tag":
      return "Add tag to VIC";
    default:
      return action;
  }
}

export default function AutomationsPage() {
  const showToast = useToast();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [automations, setAutomations] = useState<AutomationRecord[]>(INITIAL_MOCK);
  const [editingAutomation, setEditingAutomation] = useState<AutomationRecord | null>(null);

  const updateField = <K extends keyof AutomationRecord>(key: K, value: AutomationRecord[K]) => {
    setEditingAutomation((prev) => (prev ? { ...prev, [key]: value } : null));
  };

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
          {automations.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setEditingAutomation({ ...a })}
              className="w-full text-left rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 hover:border-white/10 hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/15 flex items-center justify-center text-violet-400 shrink-0">
                  <Zap size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#F5F5F5]">{a.name}</span>
                    <span
                      className={
                        a.enabled
                          ? "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-400/30 text-emerald-400"
                          : "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-gray-500/30 text-gray-500"
                      }
                    >
                      {a.enabled ? "Active" : "Paused"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    <span className="text-gray-500">Trigger:</span>{" "}
                    {triggerSummary(a.trigger, a.triggerValue)}
                  </p>
                  <p className="text-sm text-gray-400">
                    <span className="text-gray-500">Action:</span> {actionSummary(a.action)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Applied to: {a.applied} · Last triggered:{" "}
                    {a.lastRun ?? "—"} · {a.runCount} run{a.runCount !== 1 ? "s" : ""}
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

      {editingAutomation && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setEditingAutomation(null)}
          role="presentation"
        >
          <div
            className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-[520px] shadow-2xl max-h-[80vh] overflow-y-auto"
            role="dialog"
            aria-labelledby="edit-automation-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id="edit-automation-title" className="text-sm font-medium text-white">
                Edit Automation
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">
                    {editingAutomation.enabled ? "Active" : "Paused"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editingAutomation.enabled}
                    onClick={() => updateField("enabled", !editingAutomation.enabled)}
                    className={cn(
                      "w-8 h-4 rounded-full transition-colors relative shrink-0",
                      editingAutomation.enabled ? "bg-emerald-500/30" : "bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "w-3 h-3 rounded-full transition-all absolute top-0.5",
                        editingAutomation.enabled
                          ? "left-[18px] bg-emerald-400"
                          : "left-0.5 bg-gray-500"
                      )}
                    />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingAutomation(null)}
                  className="text-gray-500 hover:text-gray-400 p-1"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Name</p>
              <input
                type="text"
                value={editingAutomation.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full text-sm bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-white outline-none"
              />
            </div>

            <div className="mb-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                When this happens
              </p>
              <select
                value={editingAutomation.trigger}
                onChange={(e) => updateField("trigger", e.target.value)}
                className="w-full text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-gray-300 outline-none"
              >
                <option value="birthday_approaching">VIC birthday in X days</option>
                <option value="passport_expiring">Passport expiring in X days</option>
                <option value="trip_departure">Trip departure in X days</option>
                <option value="acuity_complete">VIC Acuity profile completed</option>
                <option value="new_vic_created">New VIC created</option>
                <option value="itinerary_stage_change">Itinerary pipeline stage changes</option>
                <option value="manual">Manual trigger</option>
              </select>
            </div>

            <div className="mb-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Conditions</p>
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
                <p className="text-xs text-gray-400">
                  {editingAutomation.conditionDescription || "No conditions — applies to all"}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Then do this</p>
              <select
                value={editingAutomation.action}
                onChange={(e) => updateField("action", e.target.value)}
                className="w-full text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-gray-300 outline-none"
              >
                <option value="send_email">Send personalized email</option>
                <option value="create_action_item">Create action item</option>
                <option value="send_notification">Send notification</option>
                <option value="run_acuity">Run Acuity on VIC</option>
                <option value="add_tag">Add tag to VIC</option>
              </select>
            </div>

            {editingAutomation.lastRun != null && (
              <div className="bg-white/[0.02] rounded-lg p-3 mb-4">
                <p className="text-[10px] text-gray-500">
                  Last triggered: {editingAutomation.lastRun} · {editingAutomation.runCount} total
                  runs
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  if (!confirm("Delete this automation?")) return;
                  const id = editingAutomation.id;
                  setAutomations((list) => list.filter((x) => x.id !== id));
                  showToast("Automation deleted");
                  setEditingAutomation(null);
                }}
                className="text-[10px] text-red-400/70 hover:text-red-400"
              >
                Delete Automation
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAutomation(null)}
                  className="text-xs text-gray-500 hover:text-gray-400 px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = editingAutomation;
                    setAutomations((list) =>
                      list.map((x) => (x.id === next.id ? { ...next } : x))
                    );
                    showToast("Automation updated");
                    setEditingAutomation(null);
                  }}
                  className="text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
