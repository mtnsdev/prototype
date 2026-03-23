"use client";

import {
  Cloud,
  Database,
  Mail,
  Plus,
  Building2,
  User,
  FileText,
  BookOpen,
} from "lucide-react";
import type { DataSource } from "@/types/knowledge-vault";
import { DataSourceType } from "@/types/knowledge-vault";
import { cn } from "@/lib/utils";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import { MOCK_TEAMS } from "@/lib/teamsMock";
import { TEAM_EVERYONE_ID } from "@/types/teams";
import { SourceCardSkeleton } from "@/components/ui/SkeletonPatterns";

const SHOWN_TYPES = new Set<DataSourceType>([
  DataSourceType.GoogleDriveAdmin,
  DataSourceType.GoogleDrivePersonal,
  DataSourceType.ClaromentisDocuments,
  DataSourceType.ClaromentisPages,
  DataSourceType.Email,
]);

function isClaromentis(s: DataSource) {
  return (
    s.source_type === DataSourceType.ClaromentisDocuments || s.source_type === DataSourceType.ClaromentisPages
  );
}

/** Admin-configurable default scope per source (UI mock). */
function sourceDefaultScope(source: DataSource): "private" | string {
  const m: Partial<Record<DataSourceType, "private" | string>> = {
    [DataSourceType.GoogleDriveAdmin]: TEAM_EVERYONE_ID,
    [DataSourceType.GoogleDrivePersonal]: "private",
    [DataSourceType.ClaromentisDocuments]: TEAM_EVERYONE_ID,
    [DataSourceType.ClaromentisPages]: TEAM_EVERYONE_ID,
    [DataSourceType.Email]: "private",
  };
  return m[source.source_type] ?? TEAM_EVERYONE_ID;
}

function getBaseIcon(source: DataSource) {
  if (source.source_type === DataSourceType.Email) return Mail;
  if (source.icon === "Cloud") return Cloud;
  return Database;
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

type Props = {
  sources: DataSource[];
  selectedSourceIds: string[];
  onToggleSource: (id: string) => void;
  onConnectSource: () => void;
  emailUnprocessedCount?: number;
  loading?: boolean;
};

export default function DataSourceCards({
  sources,
  selectedSourceIds,
  onToggleSource,
  onConnectSource,
  emailUnprocessedCount = 0,
  loading = false,
}: Props) {
  const connected = sources.filter((s) => s.status !== "disconnected" && SHOWN_TYPES.has(s.source_type));

  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 pb-2">
        {Array.from({ length: 4 }, (_, i) => (
          <SourceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 pb-2">
      {connected.map((src) => {
        const Icon = getBaseIcon(src);
        const isSelected = selectedSourceIds.includes(src.id);
        const badge = src.source_type !== DataSourceType.Email ? BadgeIcon({ source: src }) : null;
        const isEmail = src.source_type === DataSourceType.Email;
        const defaultScope = sourceDefaultScope(src);

        return (
          <button
            key={src.id}
            type="button"
            onClick={() => onToggleSource(src.id)}
            className={cn(
              "shrink-0 w-[180px] rounded-xl border p-3 text-left transition-colors",
              isEmail && "bg-sky-500/5 border-sky-500/10 hover:border-sky-500/20",
              !isEmail && "border-[rgba(255,255,255,0.08)] bg-[#161616] hover:bg-white/[0.04]",
              isSelected &&
                (isEmail ? "ring-2 ring-sky-500/40 border-sky-500/30" : "ring-2 ring-white/30 border-white/20")
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className={cn(
                  "relative w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  isEmail ? "bg-sky-500/10 text-sky-400" : "bg-white/10 text-[rgba(245,245,245,0.9)]"
                )}
              >
                <Icon size={18} />
                {isEmail && emailUnprocessedCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-0.5 bg-sky-400 text-[9px] text-[#06060a] font-bold rounded-full flex items-center justify-center">
                    {emailUnprocessedCount > 9 ? "9+" : emailUnprocessedCount}
                  </span>
                )}
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
                  isEmail ? "bg-sky-400" : src.status === "connected" && "bg-[var(--muted-success-text)]"
                )}
              />
              <span
                className={cn(
                  "text-[10px]",
                  isEmail ? "text-sky-400/90" : "text-[rgba(245,245,245,0.5)]"
                )}
              >
                {src.document_count} docs
              </span>
            </div>
            <div className="mt-1">
              <ScopeBadge scope={defaultScope} teams={MOCK_TEAMS} />
            </div>
            {!isEmail && isClaromentis(src) && src.document_visible_count != null && (
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
        className="min-h-[140px] rounded-xl border border-dashed border-[rgba(255,255,255,0.2)] bg-white/[0.02] hover:bg-white/[0.06] flex flex-col items-center justify-center gap-2 p-4 text-[rgba(245,245,245,0.6)]"
      >
        <Plus size={24} />
        <span className="text-sm font-medium">Connect Source</span>
      </button>
    </div>
  );
}
