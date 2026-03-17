"use client";

import { useState, useEffect } from "react";
import {
  Newspaper,
  Handshake,
  CheckSquare,
  Plane,
  Calendar as CalendarIcon,
  Zap,
  FileText,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { BriefingWidget, WidgetSize } from "@/types/briefing";
import { WidgetType } from "@/types/briefing";
import { getMockBriefingWidgets } from "./briefingMockData";

const WIDGET_META: { type: WidgetType; label: string; description: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { type: WidgetType.NewsAlerts, label: "News & Alerts", description: "Industry and partner news", Icon: Newspaper },
  { type: WidgetType.PartnerUpdates, label: "Partner Updates", description: "Rates, FAMs, training", Icon: Handshake },
  { type: WidgetType.ActionItems, label: "Action Items", description: "Tasks and follow-ups", Icon: CheckSquare },
  { type: WidgetType.UpcomingTrips, label: "Upcoming Trips", description: "Next 30 days", Icon: Plane },
  { type: WidgetType.Calendar, label: "Calendar", description: "Events and deadlines", Icon: CalendarIcon },
  { type: WidgetType.QuickStart, label: "Quick Start", description: "Shortcuts", Icon: Zap },
  { type: WidgetType.FreeText, label: "Daily Notes", description: "Announcements and notes", Icon: FileText },
  { type: WidgetType.RecentActivity, label: "Recent Activity", description: "Latest actions", Icon: Activity },
];

type Props = {
  open: boolean;
  onClose: () => void;
  widgets: BriefingWidget[];
  onSave: (widgets: BriefingWidget[]) => void;
};

export default function WidgetManagerModal({ open, onClose, widgets, onSave }: Props) {
  const [local, setLocal] = useState<BriefingWidget[]>([]);

  useEffect(() => {
    if (open && widgets.length > 0) setLocal([...widgets]);
  }, [open, widgets]);

  if (!open) return null;

  const visible = local.length > 0 ? local : widgets;
  const sorted = [...visible].sort((a, b) => a.position - b.position);

  const toggleVisible = (id: string) => {
    const next = visible.map((w) => (w.id === id ? { ...w, is_visible: !w.is_visible } : w));
    setLocal(next);
  };

  const setSize = (id: string, size: WidgetSize) => {
    const next = visible.map((w) => (w.id === id ? { ...w, size } : w));
    setLocal(next);
  };

  const move = (id: string, dir: "up" | "down") => {
    const idx = sorted.findIndex((w) => w.id === id);
    if (idx < 0) return;
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= sorted.length) return;
    const next = [...sorted];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const withPos = next.map((w, i) => ({ ...w, position: i }));
    setLocal(withPos);
  };

  const reset = () => {
    setLocal(getMockBriefingWidgets());
  };

  const handleSave = () => {
    onSave(local.length > 0 ? local : widgets);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#1a1a1a] border-white/10 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-[#F5F5F5]">Customize Briefing Room</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto space-y-3 py-2">
          {WIDGET_META.map((meta) => {
            const w = sorted.find((x) => x.widget_type === meta.type);
            const isVisible = w?.is_visible ?? true;
            return (
              <div
                key={meta.type}
                className="flex items-center justify-between gap-4 rounded-lg border border-[rgba(255,255,255,0.08)] bg-white/[0.03] p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-[#F5F5F5] shrink-0">
                    <meta.Icon size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-[#F5F5F5]">{meta.label}</p>
                    <p className="text-xs text-[rgba(245,245,245,0.5)]">{meta.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {w && (
                    <>
                      <select
                        value={w.size}
                        onChange={(e) => setSize(w.id, e.target.value as WidgetSize)}
                        className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#F5F5F5]"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => move(w.id, "up")}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => move(w.id, "down")}
                      >
                        ↓
                      </Button>
                    </>
                  )}
                  <label className="flex items-center gap-1.5 text-sm text-[rgba(245,245,245,0.8)]">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => w && toggleVisible(w.id)}
                      className="rounded border-white/20"
                    />
                    Visible
                  </label>
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter className="border-t border-white/10 pt-4">
          <Button variant="outline" onClick={reset} className="border-white/10 text-[#F5F5F5]">
            Reset to default
          </Button>
          <Button variant="outline" onClick={onClose} className="border-white/10 text-[#F5F5F5]">
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
