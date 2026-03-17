"use client";

import { Cloud, Database, Upload, Globe, Mail, Plus } from "lucide-react";
import type { DataSource } from "@/types/knowledge-vault";
import { DataSourceType } from "@/types/knowledge-vault";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Cloud,
  Database,
  Upload,
  Globe,
  Mail,
};

function getIcon(source: DataSource) {
  return ICONS[source.icon] ?? Database;
}

function timeAgo(iso: string): string {
  if (!iso) return "N/A";
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return Math.floor(sec / 60) + " min ago";
  if (sec < 86400) return Math.floor(sec / 3600) + "h ago";
  if (sec < 604800) return Math.floor(sec / 86400) + "d ago";
  return Math.floor(sec / 604800) + "w ago";
}

type Props = {
  sources: DataSource[];
  selectedSourceId?: string;
  onSelectSource: (id: string | null) => void;
  onConnectSource: () => void;
};

export default function DataSourceCards({
  sources,
  selectedSourceId,
  onSelectSource,
  onConnectSource,
}: Props) {
  const connected = sources.filter((s) => s.status !== "disconnected");

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {connected.map((src) => {
        const Icon = getIcon(src);
        const isSelected = selectedSourceId === src.id;
        return (
          <button
            key={src.id}
            type="button"
            onClick={() => onSelectSource(isSelected ? null : src.id)}
            className={cn(
              "shrink-0 w-44 rounded-xl border p-4 text-left transition-colors",
              "border-[rgba(255,255,255,0.08)] bg-[#161616] hover:bg-white/[0.04]",
              isSelected && "ring-2 ring-white/30 border-white/20"
            )}
          >
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-[rgba(245,245,245,0.9)]">
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#F5F5F5] text-sm truncate">{src.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      src.status === "connected" && "bg-[var(--muted-success-text)]",
                      src.status === "syncing" && "bg-[var(--muted-info-text)] animate-pulse",
                      src.status === "error" && "bg-[var(--muted-error-text)]",
                      src.status === "disconnected" && "bg-[rgba(255,255,255,0.3)]"
                    )}
                  />
                  <span className="text-xs text-[rgba(245,245,245,0.5)]">
                    {src.status === "syncing" ? "Syncing…" : src.document_count + " docs"}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-[rgba(245,245,245,0.5)] mt-2">
              Last sync {timeAgo(src.last_sync)}
            </p>
            <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  src.health_score >= 80 && "bg-[var(--muted-success-text)]",
                  src.health_score >= 50 && src.health_score < 80 && "bg-[var(--muted-amber-text)]",
                  src.health_score < 50 && src.health_score > 0 && "bg-[var(--muted-error-text)]"
                )}
                style={{ width: src.health_score + "%" }}
              />
            </div>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onConnectSource}
        className="shrink-0 w-44 rounded-xl border border-dashed border-[rgba(255,255,255,0.2)] bg-white/[0.02] hover:bg-white/[0.06] flex flex-col items-center justify-center gap-2 p-4 text-[rgba(245,245,245,0.6)]"
      >
        <Plus size={24} />
        <span className="text-sm font-medium">Connect Source</span>
      </button>
    </div>
  );
}
