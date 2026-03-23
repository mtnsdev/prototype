"use client";

import {
  FileText,
  FileSpreadsheet,
  MoreHorizontal,
  CheckCircle,
  Loader2,
  AlertCircle,
  Clock,
  Globe,
  Search,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { KnowledgeDocument } from "@/types/knowledge-vault";
import { DataSourceType } from "@/types/knowledge-vault";
import { cn } from "@/lib/utils";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import { MOCK_TEAMS } from "@/lib/teamsMock";
import { effectiveUiScope, type KvScopeOverrides } from "@/lib/knowledgeVaultVisibility";
import { DemoBadge } from "@/components/ui/DemoBadge";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonRow } from "@/components/ui/SkeletonPatterns";

const SOURCE_BADGE =
  "text-xs px-1.5 py-0.5 rounded-md bg-white/[0.08] text-[rgba(245,245,245,0.75)] border border-white/10 max-w-[160px] truncate";

function fileIcon(doc: KnowledgeDocument) {
  if (doc.file_type === "html" || doc.is_wiki_page) return Globe;
  if (doc.file_type === "xlsx" || doc.file_type === "csv") return FileSpreadsheet;
  return FileText;
}

type Props = {
  documents: KnowledgeDocument[];
  viewMode: "grid" | "list";
  loading: boolean;
  onSelectDocument: (doc: KnowledgeDocument) => void;
  isOversightPrivate?: (doc: KnowledgeDocument) => boolean;
  scopeOverrides?: KvScopeOverrides;
};

export default function DocumentGrid({
  documents,
  viewMode,
  loading,
  onSelectDocument,
  isOversightPrivate,
  scopeOverrides,
}: Props) {
  if (loading && viewMode === "list") {
    return (
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161616] p-3 space-y-2">
        {Array.from({ length: 8 }, (_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161616] h-48 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161616]">
        <EmptyState
          icon={Search}
          title="No documents found"
          description="Try adjusting your filters or search query."
        />
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161616] overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.08)] text-left text-[rgba(245,245,245,0.5)]">
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Source</th>
              <th className="p-3 font-medium">Scope</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Size</th>
              <th className="p-3 font-medium">Updated</th>
              <th className="p-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const oversight = isOversightPrivate?.(doc) ?? false;
              return (
                <tr
                  key={doc.id}
                  className={cn(
                    "border-b border-[rgba(255,255,255,0.06)] hover:bg-white/[0.03]",
                    doc.ingestion_status === "failed" && "border-l-4 border-l-[var(--muted-error-border)]",
                    oversight && "opacity-60"
                  )}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-start gap-2">
                      {oversight && (
                        <Shield
                          className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-1"
                          aria-label="Other advisor private (oversight)"
                        />
                      )}
                      <div>
                        <button
                          type="button"
                          onClick={() => onSelectDocument(doc)}
                          className="font-medium text-[#F5F5F5] hover:underline text-left truncate max-w-[220px] block"
                        >
                          {doc.title}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={cn(SOURCE_BADGE, "inline-block max-w-[180px]")} title={doc.source_name}>
                      {doc.source_name}
                    </span>
                  </td>
                  <td className="p-3">
                    <ScopeBadge scope={effectiveUiScope(doc, scopeOverrides)} teams={MOCK_TEAMS} />
                  </td>
                  <td className="p-3">
                    {doc.ingestion_status === "indexed" && (
                      <CheckCircle size={14} className="text-[var(--muted-success-text)]" />
                    )}
                    {doc.ingestion_status === "processing" && (
                      <Loader2 size={14} className="animate-spin text-[var(--muted-info-text)]" />
                    )}
                    {doc.ingestion_status === "failed" && (
                      <AlertCircle size={14} className="text-[var(--muted-error-text)]" />
                    )}
                    {doc.ingestion_status === "pending" && (
                      <Clock size={14} className="text-[rgba(245,245,245,0.5)]" />
                    )}
                    {doc.ingestion_status === "stale" && (
                      <AlertCircle size={14} className="text-[var(--muted-amber-text)]" />
                    )}
                  </td>
                  <td className="p-3 text-[rgba(245,245,245,0.5)]">
                    {(doc.file_size_kb / 1024).toFixed(2)} MB
                  </td>
                  <td className="p-3 text-[rgba(245,245,245,0.5)]">
                    {new Date(doc.last_updated).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                        <DropdownMenuItem onClick={() => onSelectDocument(doc)}>View</DropdownMenuItem>
                        <DropdownMenuItem>Download</DropdownMenuItem>
                        <DropdownMenuItem>Re-index</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => {
        const Icon = fileIcon(doc);
        const oversight = isOversightPrivate?.(doc) ?? false;
        return (
          <div
            key={doc.id}
            className={cn(
              "rounded-xl border bg-[#161616] overflow-hidden flex flex-col transition-shadow hover:shadow-lg relative",
              "border-[rgba(255,255,255,0.08)]",
              doc.ingestion_status === "failed" && "border-[var(--muted-error-border)]",
              oversight && "opacity-60"
            )}
          >
            {oversight && (
              <Shield className="absolute top-2 left-12 z-20 w-3.5 h-3.5 text-gray-500" aria-hidden />
            )}
            <DemoBadge className="top-2 left-2 right-auto" />
            <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                  <DropdownMenuItem onClick={() => onSelectDocument(doc)}>View</DropdownMenuItem>
                  <DropdownMenuItem>Download</DropdownMenuItem>
                  <DropdownMenuItem>Re-index</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <button
              type="button"
              onClick={() => onSelectDocument(doc)}
              className="flex-1 p-4 pr-12 text-left min-w-0"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-[rgba(245,245,245,0.9)]",
                    "bg-white/10"
                  )}
                >
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-[#F5F5F5] line-clamp-2">{doc.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className={cn(SOURCE_BADGE)} title={doc.source_name}>
                      {doc.source_name}
                    </span>
                    <ScopeBadge scope={effectiveUiScope(doc, scopeOverrides)} teams={MOCK_TEAMS} />
                    {doc.is_wiki_page && (
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25">
                        Wiki Page
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {doc.ingestion_status === "indexed" && (
                      <CheckCircle size={12} className="text-[var(--muted-success-text)]" />
                    )}
                    {doc.ingestion_status === "processing" && (
                      <Loader2 size={12} className="animate-spin text-[var(--muted-info-text)]" />
                    )}
                    {doc.ingestion_status === "failed" && (
                      <AlertCircle size={12} className="text-[var(--muted-error-text)]" />
                    )}
                  </div>
                </div>
              </div>
            </button>
            <div className="px-4 py-2 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs text-[rgba(245,245,245,0.5)]">
              <span>{(doc.file_size_kb / 1024).toFixed(2)} MB</span>
              <span>{new Date(doc.last_updated).toLocaleDateString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
