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

type Props = { content: QuickStartContent };

export default function QuickStartWidget({ content }: Props) {
  const actions = content.actions ?? [];
  if (actions.length === 0) {
    return (
      <p className="text-sm text-[rgba(245,245,245,0.5)] py-4">No quick actions.</p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action) => {
        const Icon = ICON_MAP[action.icon] ?? Zap;
        return (
          <Link
            key={action.label}
            href={action.route}
            className="flex flex-col items-center justify-center gap-1 rounded-lg border border-[rgba(255,255,255,0.08)] bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-colors text-center"
          >
            <Icon size={24} className="text-[rgba(245,245,245,0.9)]" />
            <span className="font-medium text-[#F5F5F5] text-sm">{action.label}</span>
            <span className="text-xs text-[rgba(245,245,245,0.5)] line-clamp-2">{action.description}</span>
          </Link>
        );
      })}
    </div>
  );
}
