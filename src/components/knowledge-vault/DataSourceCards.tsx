"use client";

import {
  Cloud,
  Database,
  Upload,
  Globe,
  Mail,
  Plus,
  Building2,
  User,
  FileText,
  BookOpen,
  Sparkles,
} from "lucide-react";
import type { DataSource } from "@/types/knowledge-vault";
import { DataSourceType } from "@/types/knowledge-vault";
import { cn } from "@/lib/utils";

function isClaromentis(s: DataSource) {
  return (
    s.source_type === DataSourceType.ClaromentisDocuments || s.source_type === DataSourceType.ClaromentisPages
  );
}

function sourceCardLayer(source: DataSource): "Agency" | "Advisor" | "Enable" {
  const m: Partial<Record<DataSourceType, "Agency" | "Advisor" | "Enable">> = {
    [DataSourceType.GoogleDriveAdmin]: "Agency",
    [DataSourceType.GoogleDrivePersonal]: "Advisor",
    [DataSourceType.ClaromentisDocuments]: "Agency",
    [DataSourceType.ClaromentisPages]: "Agency",
    [DataSourceType.ManualUpload]: "Advisor",
    [DataSourceType.Virtuoso]: "Agency",
    [DataSourceType.WebScrape]: "Advisor",
    [DataSourceType.EmailTemplate]: "Agency",
    [DataSourceType.Email]: "Agency",
    [DataSourceType.APIStream]: "Agency",
  };
  return m[source.source_type] ?? "Agency";
}

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Cloud,
  Database,
  Upload,
  Globe,
  Mail,
  Sparkles,
};

function getBaseIcon(source: DataSource) {
  return ICONS[source.icon] ?? Database;
}

function BadgeIcon({ source }: { source: DataSource }) {
  if (source.source_type === DataSourceType.GoogleDriveAdmin)
    return <Building2 size={10} className="text-[var(--muted-success-text)]" />;
  if (source.source_type === DataSourceType.GoogleDrivePersonal)
    return <User size={10} className="text-[var(--muted-info-text)]" />;
  if (source.source_type === DataSourceType.ClaromentisDocuments)
    return <FileText size={10} className="text-[rgba(245,245,245,0.85)]" />;
  if (source.source_type === DataSourceType.ClaromentisPages)
    return <BookOpen size={10} className="text-[rgba(245,245,245,0.85)]" />;
  return null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return Math.floor(sec / 60) + " min ago";
  if (sec < 86400) return Math.floor(sec / 3600) + "h ago";
  if (sec < 604800) return Math.floor(sec / 86400) + "d ago";
  return Math.floor(sec / 604800) + "w ago";
}

function LayerBadge({ layer }: { layer: "Agency" | "Advisor" | "Enable" }) {
  return (
    <span
      className={cn(
        "text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block",
        layer === "Agency" && "bg-blue-500/10 text-blue-400",
        layer === "Advisor" && "bg-violet-500/10 text-violet-400",
        layer === "Enable" && "bg-emerald-500/10 text-emerald-400"
      )}
    >
      {layer}
    </span>
  );
}

type Props = {
  sources: DataSource[];
  selectedSourceIds: string[];
  onToggleSource: (id: string) => void;
  onConnectSource: () => void;
};

export default function DataSourceCards({
  sources,
  selectedSourceIds,
  onToggleSource,
  onConnectSource,
}: Props) {
  const connected = sources.filter((s) => s.status !== "disconnected");

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {connected.map((src) => {
        const Icon = getBaseIcon(src);
        const isSelected = selectedSourceIds.includes(src.id);
        const badge = BadgeIcon({ source: src });
        const isTemplates = src.source_type === DataSourceType.EmailTemplate;
        const isWeb = src.source_type === DataSourceType.WebScrape;
        const layer = sourceCardLayer(src);

        return (
          <button
            key={src.id}
            type="button"
            onClick={() => onToggleSource(src.id)}
            className={cn(
              "shrink-0 w-[180px] rounded-xl border p-3 text-left transition-colors",
              isWeb &&
                "bg-blue-500/[0.03] border-blue-500/10 hover:border-blue-500/20",
              isTemplates &&
                !isWeb &&
                "border-rose-500/20 bg-rose-500/[0.04] hover:bg-rose-500/[0.08]",
              !isWeb &&
                !isTemplates &&
                "border-[rgba(255,255,255,0.08)] bg-[#161616] hover:bg-white/[0.04]",
              isSelected &&
                (isWeb
                  ? "ring-2 ring-blue-500/40 border-blue-500/30"
                  : isTemplates
                    ? "ring-2 ring-rose-500/40 border-rose-500/30"
                    : "ring-2 ring-white/30 border-white/20")
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className={cn(
                  "relative w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  isWeb && "bg-blue-500/15 text-blue-400",
                  isTemplates && !isWeb && "bg-rose-500/15 text-rose-300",
                  !isWeb && !isTemplates && "bg-white/10 text-[rgba(245,245,245,0.9)]"
                )}
              >
                <Icon size={18} />
                {badge && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-md bg-[#0C0C0C] border border-white/15 flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-white line-clamp-2 leading-tight">{src.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  isWeb && "bg-blue-400",
                  !isWeb && src.status === "connected" && "bg-[var(--muted-success-text)]"
                )}
              />
              <span className={cn("text-[10px]", isWeb ? "text-blue-400" : "text-[rgba(245,245,245,0.5)]")}>
                {src.document_count} docs
              </span>
            </div>
            {isWeb && <p className="text-[10px] text-gray-600 mt-0.5">Personal saves</p>}
            <LayerBadge layer={layer} />
            {!isWeb && isClaromentis(src) && src.document_visible_count != null && (
              <p className="text-[10px] text-gray-500 mt-0.5">Based on your access</p>
            )}
            <p className="text-xs text-[rgba(245,245,245,0.5)] mt-2">
              {src.sync_frequency === "manual" && !src.last_sync
                ? "On demand"
                : `Last sync ${timeAgo(src.last_sync)}`}
            </p>
            <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  src.health_score >= 80 && "bg-[var(--muted-success-text)]",
                  src.health_score >= 50 && src.health_score < 80 && "bg-[var(--muted-amber-text)]",
                  src.health_score < 50 && src.health_score > 0 && "bg-[var(--muted-error-text)]"
                )}
                style={{ width: Math.max(0, src.health_score) + "%" }}
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
