"use client";

import { useEffect, useRef } from "react";
import {
  FileText,
  FileSpreadsheet,
  MoreHorizontal,
  Globe,
  Search,
  Shield,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import { IngestionStatusBadge } from "@/components/ui/IngestionStatusBadge";
import { KvTagsTitleSubline } from "./KvTagsDisplay";
import { useToast } from "@/contexts/ToastContext";

const SOURCE_BADGE =
  "text-xs px-1.5 py-0.5 rounded-md bg-white/[0.08] text-[rgba(245,245,245,0.75)] border border-white/10 max-w-[160px] truncate";

function fileIcon(doc: KnowledgeDocument) {
  if (doc.file_type === "html" || doc.is_wiki_page) return Globe;
  if (doc.file_type === "xlsx" || doc.file_type === "csv") return FileSpreadsheet;
  return FileText;
}

type TeamOpt = { id: string; name: string };

type ListSelection = {
  selectedIds: string[];
  onToggle: (docId: string) => void;
  onSelectAllToggle: () => void;
};

type Props = {
  documents: KnowledgeDocument[];
  viewMode: "grid" | "list";
  loading: boolean;
  onSelectDocument: (doc: KnowledgeDocument) => void;
  isOversightPrivate?: (doc: KnowledgeDocument) => boolean;
  scopeOverrides?: KvScopeOverrides;
  /** List view: selection + bulk actions (parent owns state). */
  listSelection?: ListSelection;
  isAdmin?: boolean;
  teams?: TeamOpt[];
  onShareDocument?: (doc: KnowledgeDocument, teamId: string) => void;
  onDeleteDocument?: (doc: KnowledgeDocument) => void;
};

function DocumentActionsMenu({
  doc,
  onSelectDocument,
  isAdmin,
  teams,
  onShareDocument,
  onDeleteDocument,
}: {
  doc: KnowledgeDocument;
  onSelectDocument: (d: KnowledgeDocument) => void;
  isAdmin?: boolean;
  teams: TeamOpt[];
  onShareDocument?: (d: KnowledgeDocument, teamId: string) => void;
  onDeleteDocument?: (d: KnowledgeDocument) => void;
}) {
  const toast = useToast();
  return (
    <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 min-w-[10rem]">
      <DropdownMenuItem onClick={() => onSelectDocument(doc)}>View</DropdownMenuItem>
      <DropdownMenuItem onClick={() => toast("Download started (demo)")}>Download</DropdownMenuItem>
      {onShareDocument && teams.length > 0 && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-sm">
            Share with…
            <ChevronRight className="ml-auto h-3.5 w-3.5" aria-hidden />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-[#1a1a1a] border-white/10">
            {teams.map((team) => (
              <DropdownMenuItem
                key={team.id}
                className="text-xs text-gray-400 focus:text-white"
                onClick={() => onShareDocument(doc, team.id)}
              >
                {team.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )}
      {isAdmin && onDeleteDocument && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-400/70 focus:text-red-400 focus:bg-red-500/10"
            onClick={() => onDeleteDocument(doc)}
          >
            Delete
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );
}

export default function DocumentGrid({
  documents,
  viewMode,
  loading,
  onSelectDocument,
  isOversightPrivate,
  scopeOverrides,
  listSelection,
  isAdmin,
  teams = MOCK_TEAMS.map((t) => ({ id: t.id, name: t.name })),
  onShareDocument,
  onDeleteDocument,
}: Props) {
  const headerCbRef = useRef<HTMLInputElement>(null);
  const selectedSet = listSelection ? new Set(listSelection.selectedIds) : null;
  const allSelected =
    Boolean(listSelection && documents.length > 0 && documents.every((d) => selectedSet!.has(d.id)));
  const someSelected =
    Boolean(listSelection && documents.some((d) => selectedSet!.has(d.id)) && !allSelected);

  useEffect(() => {
    const el = headerCbRef.current;
    if (el) el.indeterminate = someSelected;
  }, [someSelected]);

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
    const showCb = Boolean(listSelection);
    return (
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161616] overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.08)] text-left text-[var(--text-secondary)]">
              {showCb && (
                <th className="p-3 w-10">
                  <input
                    ref={headerCbRef}
                    type="checkbox"
                    className="rounded border-white/20 bg-white/[0.06]"
                    checked={allSelected}
                    onChange={() => listSelection!.onSelectAllToggle()}
                    aria-label="Select all documents"
                  />
                </th>
              )}
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
              const emailLike =
                doc.source_type === DataSourceType.Email || doc.source_type === DataSourceType.EmailTemplate;
              const rowTone = cn(
                "hover:bg-white/[0.02]",
                doc.ingestion_status === "not_indexed" && "border-l-4 border-l-white/10",
                oversight && "opacity-60"
              );
              const checked = showCb && selectedSet!.has(doc.id);
              return (
                <tr key={doc.id} className={cn(rowTone, "border-b border-[rgba(255,255,255,0.06)]")}>
                  {showCb && (
                    <td className="py-2.5 px-3 align-top">
                      <input
                        type="checkbox"
                        className="rounded border-white/20 bg-white/[0.06] mt-1"
                        checked={checked}
                        onChange={() => listSelection!.onToggle(doc.id)}
                        aria-label={`Select ${doc.title}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  <td className="py-2.5 px-3 align-top">
                    <div className="flex items-start gap-2 min-w-0">
                      {oversight && (
                        <Shield
                          className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-1"
                          aria-label="Other advisor private (oversight)"
                        />
                      )}
                      <div className="min-w-0 flex-1 max-w-[min(280px,40vw)]">
                        <button
                          type="button"
                          onClick={() => onSelectDocument(doc)}
                          className="font-medium text-[#F5F5F5] hover:underline text-left truncate max-w-full block"
                        >
                          {doc.title}
                        </button>
                        <KvTagsTitleSubline tags={doc.tags} emailLike={emailLike} className="mt-0.5" />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 align-top">
                    <span className={cn(SOURCE_BADGE, "inline-block max-w-[180px]")} title={doc.source_name}>
                      {doc.source_name}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 align-top">
                    <ScopeBadge scope={effectiveUiScope(doc, scopeOverrides)} teams={MOCK_TEAMS} />
                  </td>
                  <td className="py-2.5 px-3 align-top">
                    <IngestionStatusBadge status={doc.ingestion_status} />
                  </td>
                  <td className="py-2.5 px-3 align-top text-[var(--text-tertiary)]">
                    {(doc.file_size_kb / 1024).toFixed(2)} MB
                  </td>
                  <td className="py-2.5 px-3 align-top text-[var(--text-tertiary)]">
                    {new Date(doc.last_updated).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3 align-top">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DocumentActionsMenu
                        doc={doc}
                        onSelectDocument={onSelectDocument}
                        isAdmin={isAdmin}
                        teams={teams}
                        onShareDocument={onShareDocument}
                        onDeleteDocument={onDeleteDocument}
                      />
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
        const emailLike =
          doc.source_type === DataSourceType.Email || doc.source_type === DataSourceType.EmailTemplate;
        return (
          <div
            key={doc.id}
            className={cn(
              "rounded-xl border bg-[#161616] overflow-hidden flex flex-col transition-shadow hover:shadow-lg relative",
              "border-[rgba(255,255,255,0.08)]",
              doc.ingestion_status === "not_indexed" && "border-white/20",
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
                <DocumentActionsMenu
                  doc={doc}
                  onSelectDocument={onSelectDocument}
                  isAdmin={isAdmin}
                  teams={teams}
                  onShareDocument={onShareDocument}
                  onDeleteDocument={onDeleteDocument}
                />
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
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-[var(--muted-info-bg)] text-[var(--muted-info-text)] border border-[var(--muted-info-border)]">
                        Wiki Page
                      </span>
                    )}
                  </div>
                  <KvTagsTitleSubline tags={doc.tags} emailLike={emailLike} className="mt-1.5" />
                  <div className="mt-2">
                    <IngestionStatusBadge status={doc.ingestion_status} />
                  </div>
                </div>
              </div>
            </button>
            <div className="px-4 py-2 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs text-[var(--text-tertiary)]">
              <span>{(doc.file_size_kb / 1024).toFixed(2)} MB</span>
              <span>{new Date(doc.last_updated).toLocaleDateString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
