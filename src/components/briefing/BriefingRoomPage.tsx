"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Settings,
  UserPlus,
  Route,
  Package,
  Search,
  Sparkles,
  FileDown,
  Zap,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { fetchBriefingWidgets } from "@/lib/briefing-api";
import type { BriefingWidget, QuickStartContent } from "@/types/briefing";
import BriefingGrid from "./BriefingGrid";
import PreviewBanner from "@/components/ui/PreviewBanner";
import { IS_PREVIEW_MODE } from "@/config/preview";

const QUICK_START_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  UserPlus,
  Route,
  Package,
  Search,
  Sparkles,
  FileDown,
  Zap,
};

const QUICK_START_ROUTES: Record<string, string> = {
  "Add VIC": "/dashboard/vics",
  "Create Itinerary": "/dashboard/itineraries?create=1",
  "Browse Products": "/dashboard/products",
  "Search Knowledge": "/dashboard/knowledge",
  "Run Acuity": "/dashboard/chat",
  "Import CSV": "/dashboard/vics",
};

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

  const firstName = user?.username?.split(/[\s@.]/)[0] || user?.email?.split("@")[0] || "Test";
  const quickStartContent = widgets.find((w) => w.id === "w-quick")?.content as QuickStartContent | undefined;
  const quickActions = quickStartContent?.actions?.slice(0, 6) ?? [];

  return (
    <div className="h-full flex flex-col min-h-0 bg-[#0a0a0b]">
      {IS_PREVIEW_MODE && <PreviewBanner feature="Briefing Room" variant="full" dismissible sampleDataOnly />}
      {/* Elegant header with subtle gradient */}
      <header className="shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-transparent pointer-events-none" />
        <div className="relative px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
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
              <button
                type="button"
                title="Coming soon"
                className="p-2 rounded-lg text-[rgba(245,245,245,0.5)] hover:text-[rgba(245,245,245,0.8)] hover:bg-white/[0.06] transition-colors"
                aria-label="Customize"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
          {quickActions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-5 pt-5 border-t border-white/[0.06]">
              {quickActions.map((action) => {
                const Icon = QUICK_START_ICONS[action.icon] ?? Zap;
                const href = QUICK_START_ROUTES[action.label] ?? action.route ?? "#";
                return (
                  <Link
                    key={action.label}
                    href={href}
                    title={action.description}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-[rgba(245,245,245,0.6)] hover:text-[#F5F5F5] hover:bg-white/[0.06] transition-colors"
                  >
                    <Icon size={18} />
                    <span className="text-sm">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.06)] to-transparent" />
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-8 md:px-8 md:py-10">
          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-[20px] border border-white/[0.08] bg-white/[0.02] h-64 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <BriefingGrid widgets={widgets} />
          )}
        </div>
      </div>
    </div>
  );
}
