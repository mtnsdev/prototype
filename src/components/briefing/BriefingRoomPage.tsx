"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { fetchBriefingWidgets, saveBriefingWidgets } from "@/lib/briefing-api";
import type { BriefingWidget, WidgetSize } from "@/types/briefing";
import BriefingGrid from "./BriefingGrid";
import WidgetManagerModal from "./WidgetManagerModal";
import PreviewBanner from "@/components/ui/PreviewBanner";
import { IS_PREVIEW_MODE } from "@/config/preview";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDateTime(): string {
  return new Date().toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BriefingRoomPage() {
  const { user } = useUser();
  const [widgets, setWidgets] = useState<BriefingWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [managerOpen, setManagerOpen] = useState(false);
  const [dateTime, setDateTime] = useState(formatDateTime());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchBriefingWidgets(user?.id?.toString());
      setWidgets(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => setDateTime(formatDateTime()), 60_000);
    return () => clearInterval(t);
  }, []);

  const visibleWidgets = widgets.filter((w) => w.is_visible).sort((a, b) => a.position - b.position);

  const updateWidget = useCallback((id: string, patch: Partial<BriefingWidget>) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w))
    );
  }, []);

  const handleResize = useCallback(
    (id: string, size: WidgetSize) => {
      updateWidget(id, { size });
      saveBriefingWidgets(widgets.map((w) => (w.id === id ? { ...w, size } : w))).catch(() => {});
    },
    [widgets, updateWidget]
  );

  const handleHide = useCallback(
    (id: string) => {
      updateWidget(id, { is_visible: false });
      saveBriefingWidgets(widgets.map((w) => (w.id === id ? { ...w, is_visible: false } : w))).catch(() => {});
    },
    [widgets, updateWidget]
  );

  const handleMove = useCallback(
    (id: string, direction: "up" | "down") => {
      const idx = visibleWidgets.findIndex((w) => w.id === id);
      if (idx < 0) return;
      const next = [...visibleWidgets];
      const swap = direction === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      const updated = widgets.map((w) => {
        const newPos = next.findIndex((n) => n.id === w.id);
        return { ...w, position: newPos >= 0 ? newPos : w.position };
      });
      setWidgets(updated);
      saveBriefingWidgets(updated).catch(() => {});
    },
    [visibleWidgets, widgets]
  );

  const handleSaveLayout = useCallback((next: BriefingWidget[]) => {
    setWidgets(next);
    saveBriefingWidgets(next).catch(() => {});
  }, []);

  const firstName = user?.username?.split(/[\s@.]/)[0] || user?.email?.split("@")[0] || "there";

  return (
    <div className="h-full flex flex-col min-h-0 bg-[#0a0a0b]">
      {IS_PREVIEW_MODE && <PreviewBanner feature="Briefing Room" variant="full" dismissible sampleDataOnly />}
      {/* Elegant header with subtle gradient */}
      <header className="shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-transparent pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-6 px-6 py-6 md:px-8 md:py-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[rgba(245,245,245,0.4)] mb-1">
              Dashboard
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#F5F5F5] tracking-tight">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-sm text-[rgba(245,245,245,0.55)] mt-1">
              Your briefing and priorities at a glance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-[rgba(245,245,245,0.5)] bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-full px-4 py-2">
              {dateTime}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-[rgba(255,255,255,0.1)] bg-white/[0.02] text-[#F5F5F5] hover:bg-white/[0.06] hover:border-[rgba(255,255,255,0.14)] transition-colors"
              onClick={() => setManagerOpen(true)}
            >
              <Settings2 size={16} className="mr-2" />
              Customize
            </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.06)] to-transparent" />
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-8 md:px-8 md:py-10">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] h-56 animate-pulse"
                />
              ))}
            </div>
          ) : visibleWidgets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] flex flex-col items-center justify-center py-16 px-6 text-center">
              <p className="text-[rgba(245,245,245,0.5)] text-sm mb-4">No widgets visible. Add some from the Customize panel.</p>
              <Button
                variant="outline"
                size="sm"
                className="border-[rgba(255,255,255,0.12)] text-[#F5F5F5]"
                onClick={() => setManagerOpen(true)}
              >
                <Settings2 size={16} className="mr-2" />
                Customize
              </Button>
            </div>
          ) : (
            <BriefingGrid
              widgets={visibleWidgets}
              onResize={handleResize}
              onHide={handleHide}
              onMoveUp={(id) => handleMove(id, "up")}
              onMoveDown={(id) => handleMove(id, "down")}
              onRefresh={load}
            />
          )}
        </div>
      </div>

      <WidgetManagerModal
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        widgets={widgets}
        onSave={handleSaveLayout}
      />
    </div>
  );
}
