"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pause, Play, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { AutomationBuilderModal } from "@/components/itineraries/CompetitorFeatureModals";
import { AppPageHeroHeader } from "@/components/ui/app-page-hero-header";
import { APP_PAGE_CONTENT_SHELL } from "@/lib/dashboardChrome";
import { cn } from "@/lib/utils";
import { listSurfaceClass } from "@/lib/list-ui";

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
  applied: string;
  /** Primary follow-up for this automation (prototype deep links). */
  relatedCta?: { label: string; href: string };
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
    relatedCta: { label: "Review upcoming birthdays", href: "/dashboard/vics" },
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
    relatedCta: { label: "View VICs with expiring passports", href: "/dashboard/vics" },
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
    relatedCta: { label: "Open departing trips", href: "/dashboard/itineraries" },
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
    relatedCta: { label: "See completed itineraries", href: "/dashboard/itineraries" },
  },
];

const TRIGGER_OPTIONS: { value: string; label: string }[] = [
  { value: "birthday_approaching", label: "VIC birthday in X days" },
  { value: "passport_expiring", label: "Passport expiring in X days" },
  { value: "trip_departure", label: "Trip departure in X days" },
  { value: "acuity_complete", label: "VIC Acuity profile completed" },
  { value: "new_vic_created", label: "New VIC created" },
  { value: "itinerary_stage_change", label: "Itinerary pipeline stage changes" },
  { value: "manual", label: "Manual trigger" },
];

const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "send_email", label: "Send personalized email" },
  { value: "create_action_item", label: "Create action item" },
  { value: "send_notification", label: "Send notification" },
  { value: "run_acuity", label: "Run Acuity on VIC" },
  { value: "add_tag", label: "Add tag to VIC" },
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
  const toast = useToast();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [automations, setAutomations] = useState<AutomationRecord[]>(INITIAL_MOCK);
  const [editingAutomation, setEditingAutomation] = useState<AutomationRecord | null>(null);

  const stats = useMemo(() => {
    const active = automations.filter((a) => a.enabled).length;
    const paused = automations.length - active;
    const totalRuns = automations.reduce((s, a) => s + a.runCount, 0);
    const ranThisWeek = automations.filter((a) => a.lastRun != null).length;
    return { active, paused, totalRuns, ranThisWeek };
  }, [automations]);

  const updateField = <K extends keyof AutomationRecord>(key: K, value: AutomationRecord[K]) => {
    setEditingAutomation((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const toggleEnabled = (id: string) => {
    setAutomations((list) =>
      list.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)),
    );
    toast({
      title: "Automation updated",
      description: "Status saved for this workflow.",
      tone: "success",
    });
  };

  const runNow = (name: string) => {
    toast({
      title: "Run queued",
      description: `“${name}” will execute on the next scheduler tick (prototype).`,
      tone: "default",
    });
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
      <AppPageHeroHeader
        eyebrow="Workflows"
        title="Automations"
        subtitle="Turn insights into repeatable workflows — triggers, actions, and clear next steps"
        toolbar={
          <>
            <Button
              variant="toolbarAccent"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setBuilderOpen(true)}
            >
              <Zap size={14} className="shrink-0" />
              Create automation
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-input px-2.5 text-xs text-foreground"
                  aria-label="More automation actions"
                >
                  <MoreHorizontal size={16} className="shrink-0" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[11rem]">
                <DropdownMenuItem
                  onClick={() =>
                    toast({
                      title: "Run history",
                      description: "Full execution logs will live here when backend wiring is ready.",
                    })
                  }
                >
                  View run history
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    toast({
                      title: "Templates",
                      description: "Automation templates are coming in a future iteration.",
                    })
                  }
                >
                  Browse templates
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {IS_PREVIEW_MODE && (
        <div className="shrink-0">
          <PreviewBanner feature="Automations" variant="full" dismissible sampleDataOnly />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        <div className={cn(APP_PAGE_CONTENT_SHELL, "space-y-6 pb-8 pt-6")}>
          <div
            className={cn(
              listSurfaceClass,
              "grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:gap-3",
            )}
          >
            <div>
              <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/70">Active</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{stats.active}</p>
            </div>
            <div>
              <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/70">Paused</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-muted-foreground">{stats.paused}</p>
            </div>
            <div>
              <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/70">Total runs</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{stats.totalRuns}</p>
            </div>
            <div>
              <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground/70">
                With recent activity
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{stats.ranThisWeek}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Each workflow has a <span className="font-medium text-foreground/90">suggested next step</span> tied to
            VICs or itineraries so you are never stuck on “what now?”.
          </p>

          <ul className="space-y-3">
            {automations.map((a) => (
              <li
                key={a.id}
                className={cn(
                  "rounded-xl border border-border bg-card/40 p-4 shadow-sm",
                  !a.enabled && "opacity-90",
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(201,169,110,0.22)] bg-[rgba(201,169,110,0.08)] text-brand-cta"
                      aria-hidden
                    >
                      <Zap size={18} />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{a.name}</span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-2xs font-medium uppercase tracking-wider",
                            a.enabled
                              ? "border-[var(--muted-success-border)] text-[var(--muted-success-text)]"
                              : "border-border text-muted-foreground",
                          )}
                        >
                          {a.enabled ? "Active" : "Paused"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground/90">
                        <span className="text-muted-foreground">When:</span>{" "}
                        {triggerSummary(a.trigger, a.triggerValue)}
                      </p>
                      <p className="text-sm text-muted-foreground/90">
                        <span className="text-muted-foreground">Then:</span> {actionSummary(a.action)}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Applies to {a.applied} · Last run: {a.lastRun ?? "—"} · {a.runCount} run
                        {a.runCount !== 1 ? "s" : ""}
                      </p>
                      {a.relatedCta ? (
                        <Button variant="link" size="sm" className="mt-2 h-auto p-0 text-xs font-medium" asChild>
                          <Link href={a.relatedCta.href}>{a.relatedCta.label}</Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-input text-xs"
                      onClick={() => setEditingAutomation({ ...a })}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={!a.enabled}
                      onClick={() => runNow(a.name)}
                    >
                      Run now
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-muted-foreground"
                      onClick={() => toggleEnabled(a.id)}
                    >
                      {a.enabled ? (
                        <>
                          <Pause size={14} className="mr-1 shrink-0" aria-hidden />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play size={14} className="mr-1 shrink-0" aria-hidden />
                          Resume
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <AutomationBuilderModal
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onSaveDraft={() => {
          toast("Save Draft — coming soon");
          setBuilderOpen(false);
        }}
      />

      <Dialog
        open={editingAutomation != null}
        onOpenChange={(open) => {
          if (!open) setEditingAutomation(null);
        }}
      >
        <DialogContent
          className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
          showCloseButton
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {editingAutomation ? (
            <>
              <DialogHeader className="space-y-1 pr-8 sm:text-left">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <DialogTitle>Edit automation</DialogTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-2xs text-muted-foreground">
                      {editingAutomation.enabled ? "Active" : "Paused"}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={editingAutomation.enabled}
                      onClick={() => updateField("enabled", !editingAutomation.enabled)}
                      className={cn(
                        "relative h-4 w-8 shrink-0 rounded-full transition-colors",
                        editingAutomation.enabled ? "bg-[var(--muted-success-bg)]" : "bg-white/[0.08]",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-3 w-3 rounded-full transition-all",
                          editingAutomation.enabled
                            ? "left-[18px] bg-[var(--color-success)]"
                            : "left-0.5 bg-muted-foreground/45",
                        )}
                      />
                    </button>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="auto-name" className="text-2xs uppercase tracking-wider text-muted-foreground">
                    Name
                  </Label>
                  <Input
                    id="auto-name"
                    value={editingAutomation.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auto-trigger" className="text-2xs uppercase tracking-wider text-muted-foreground">
                    When this happens
                  </Label>
                  <Select value={editingAutomation.trigger} onValueChange={(v) => updateField("trigger", v)}>
                    <SelectTrigger id="auto-trigger" className="h-9 w-full border-input bg-inset text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                    Conditions
                  </span>
                  <div className="rounded-lg border border-border bg-inset px-3 py-2.5">
                    <p className="text-xs text-muted-foreground/90">
                      {editingAutomation.conditionDescription || "No conditions — applies to all"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auto-action" className="text-2xs uppercase tracking-wider text-muted-foreground">
                    Then do this
                  </Label>
                  <Select value={editingAutomation.action} onValueChange={(v) => updateField("action", v)}>
                    <SelectTrigger id="auto-action" className="h-9 w-full border-input bg-inset text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {editingAutomation.lastRun != null && (
                  <div className="rounded-lg border border-border bg-inset px-3 py-2.5">
                    <p className="text-2xs text-muted-foreground">
                      Last triggered: {editingAutomation.lastRun} · {editingAutomation.runCount} total runs
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 border-t border-border pt-4 sm:justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    if (!confirm("Delete this automation?")) return;
                    const id = editingAutomation.id;
                    setAutomations((list) => list.filter((x) => x.id !== id));
                    toast({ title: "Automation deleted", tone: "default" });
                    setEditingAutomation(null);
                  }}
                >
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-input" onClick={() => setEditingAutomation(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="toolbarAccent"
                    size="sm"
                    onClick={() => {
                      const next = editingAutomation;
                      setAutomations((list) => list.map((x) => (x.id === next.id ? { ...next } : x)));
                      toast({ title: "Automation updated", description: "Changes saved.", tone: "success" });
                      setEditingAutomation(null);
                    }}
                  >
                    Save changes
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
