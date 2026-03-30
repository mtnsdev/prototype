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
import { dataSourceDefaultUiScope } from "@/lib/knowledgeDocumentScope";
import { SourceCardSkeleton } from "@/components/ui/SkeletonPatterns";

const SHOWN_TYPES = new Set<DataSourceType>([
  DataSourceType.GoogleDriveAdmin,
  DataSourceType.GoogleDrivePersonal,
  DataSourceType.IntranetDocuments,
  DataSourceType.IntranetPages,
  DataSourceType.Email,
]);

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
  if (source.source_type === DataSourceType.IntranetDocuments)
    return <FileText size={10} className="text-[rgba(245,245,245,0.85)]" />;
  if (source.source_type === DataSourceType.IntranetPages)
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
  loading?: boolean;
  /** When true, user’s team policies exclude this source — show note on card */
  isSourcePolicyBlocked?: (source: DataSource) => boolean;
  /** Admins see every connected source; advisors only sources their teams allow */
  isAdmin?: boolean;
};

export default function DataSourceCards({
  sources,
  selectedSourceIds,
  onToggleSource,
  onConnectSource,
  loading = false,
  isSourcePolicyBlocked,
  isAdmin = false,
}: Props) {
  const connected = sources.filter((s) => s.status !== "disconnected" && SHOWN_TYPES.has(s.source_type));
  const visible = isAdmin
    ? connected
    : connected.filter((s) => !isSourcePolicyBlocked?.(s));

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
      {visible.map((src) => {
        const Icon = getBaseIcon(src);
        const isSelected = selectedSourceIds.includes(src.id);
        const badge = src.source_type !== DataSourceType.Email ? BadgeIcon({ source: src }) : null;
        const defaultScope = dataSourceDefaultUiScope(src.source_type);
        const totalForBar = Math.max(src.document_count, 1);
        const indexedForBar = src.indexed_document_count ?? 0;
        const barPct = Math.min(100, (indexedForBar / totalForBar) * 100);

        return (
          <button
            key={src.id}
            type="button"
            onClick={() => onToggleSource(src.id)}
            className={cn(
              "shrink-0 w-[180px] rounded-xl border p-3 text-left transition-colors",
              "border-border bg-card hover:bg-white/[0.04]",
              isSelected && "ring-2 ring-white/30 border-white/20"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="relative w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/10 text-[rgba(245,245,245,0.9)]">
                <Icon size={18} />
                {badge && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-md bg-background border border-white/15 flex items-center justify-center">
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
                  src.status === "connected" && "bg-[var(--muted-success-text)]"
                )}
              />
              <span className="text-2xs tabular-nums text-muted-foreground/75">
                {src.indexed_document_count != null
                  ? `${src.indexed_document_count}/${src.document_count} indexed`
                  : `${src.document_count} docs`}
              </span>
            </div>
            <div className="mt-1">
              <ScopeBadge scope={defaultScope} teams={MOCK_TEAMS} />
            </div>
            <p className="text-xs text-muted-foreground/75 mt-2">
              {src.sync_frequency === "manual" && !src.last_sync
                ? "On demand"
                : `Last sync ${timeAgo(src.last_sync)}`}
            </p>
            {src.status === "syncing" ? (
              <div className="w-full h-[2px] bg-white/[0.04] rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full w-full animate-pulse"
                  style={{ backgroundColor: "#B8976E" }}
                />
              </div>
            ) : (
              <div className="w-full h-[2px] bg-white/[0.04] rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${barPct}%`,
                    backgroundColor: "#5B8A6E",
                  }}
                />
              </div>
            )}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onConnectSource}
        className={cn(
          "shrink-0 w-[180px] rounded-xl border border-dashed p-3 text-left transition-colors",
          "border-[rgba(255,255,255,0.2)] bg-white/[0.02] hover:bg-white/[0.06]",
          "text-muted-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[rgba(245,245,245,0.9)]">
            <Plus size={18} />
          </div>
          <span className="text-xs font-medium leading-tight text-white">Connect source</span>
        </div>
      </button>
    </div>
  );
}
