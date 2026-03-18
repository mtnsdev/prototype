"use client";

import Link from "next/link";
import {
  UserPlus,
  Route,
  Package,
  Search,
  Sparkles,
  FileDown,
  Zap,
} from "lucide-react";
import AppleWidgetCard from "../AppleWidgetCard";
import type { QuickStartContent } from "@/types/briefing";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  UserPlus,
  Route,
  Package,
  Search,
  Sparkles,
  FileDown,
  Zap,
};

const ROUTES: Record<string, string> = {
  "Add VIC": "/dashboard/vics",
  "Create Itinerary": "/dashboard/itineraries?create=1",
  "Browse Products": "/dashboard/products",
  "Search Knowledge": "/dashboard/knowledge",
  "Run Acuity": "/dashboard/chat",
  "Import CSV": "/dashboard/vics",
};

type Props = {
  content: QuickStartContent;
  staggerIndex?: number;
};

export default function QuickStartWidget({ content, staggerIndex = 0 }: Props) {
  const actions = (content.actions ?? []).slice(0, 6);

  if (actions.length === 0) {
    return (
      <AppleWidgetCard
        accent="gray"
        icon={<Zap size={20} />}
        title="Quick Start"
        staggerIndex={staggerIndex}
      >
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Zap size={28} className="text-gray-600 mb-2" />
          <p className="text-sm text-gray-500">No quick actions</p>
        </div>
      </AppleWidgetCard>
    );
  }

  return (
    <AppleWidgetCard
      accent="gray"
      icon={<Zap size={20} />}
      title="Quick Start"
      staggerIndex={staggerIndex}
    >
      <div className="grid grid-cols-3 gap-2">
        {actions.map((action) => {
          const Icon = ICON_MAP[action.icon] ?? Zap;
          const href = ROUTES[action.label] ?? action.route ?? "#";
          return (
            <Link
              key={action.label}
              href={href}
              className="flex flex-col items-center justify-center rounded-xl bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-all text-center group"
            >
              <Icon
                size={24}
                className="text-gray-400 group-hover:text-white transition-colors"
              />
              <span className="text-xs text-gray-400 mt-2 group-hover:text-white transition-colors truncate w-full">
                {action.label.replace("Create Itinerary", "Create Itin.").replace("Browse Products", "Browse Prods.").replace("Search Knowledge", "Search Knowl.")}
              </span>
            </Link>
          );
        })}
      </div>
    </AppleWidgetCard>
  );
}
