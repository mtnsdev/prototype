"use client";

import { useEffect, useRef } from "react";
import {
  MoreHorizontal,
  Search,
  Shield,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Trash2,
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
import { cn } from "@/lib/utils";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import { MOCK_TEAMS } from "@/lib/teamsMock";
import { effectiveUiScope, type KvScopeOverrides } from "@/lib/knowledgeVaultVisibility";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonRow } from "@/components/ui/SkeletonPatterns";
import { IngestionStatusBadge } from "@/components/ui/IngestionStatusBadge";
import { KvTagsDiscreteTitleSubline } from "./KvTagsDisplay";
import { useToast } from "@/contexts/ToastContext";
import type { KvSortColumn, KvSortOption } from "@/lib/knowledgeVaultSort";
import { kvSortActiveColumn, kvSortIsAsc } from "@/lib/knowledgeVaultSort";

const SOURCE_BADGE =
  "text-xs px-1.5 py-0.5 rounded-md bg-white/[0.08] text-[rgba(245,245,245,0.75)] border border-white/10 max-w-[160px] truncate";

type TeamOpt = { id: string; name: string };

type ListSelection = {
  selectedIds: string[];
  onToggle: (docId: string) => void;
  /** Selects or clears only the documents on the current page. */
  onSelectAllPageToggle: () => void;
};

export type KnowledgeVaultListEmptyVariant = "api_empty" | "filtered_empty" | "client_visibility";

type Props = {
  documents: KnowledgeDocument[];
  loading: boolean;
  onSelectDocument: (doc: KnowledgeDocument) => void;
  isOversightPrivate?: (doc: KnowledgeDocument) => boolean;
  scopeOverrides?: KvScopeOverrides;
  /** Selection + bulk actions (parent owns state). */
  listSelection: ListSelection;
  isAdmin?: boolean;
  teams?: TeamOpt[];
  onShareDocument?: (doc: KnowledgeDocument, teamId: string) => void;
  onDeleteDocument?: (doc: KnowledgeDocument) => void;
  canExportDocuments?: boolean;
  /** Row/bulk submenu label */
  shareSubmenuLabel?: string;
  /** Column-header sort (Title, Size, Updated). */
  listSort: {
    option: KvSortOption;
    onColumnClick: (column: KvSortColumn) => void;
  };
  /** When list fetch returns no rows (or all hidden), tailor empty copy. */
  listEmpty?: {
    variant: KnowledgeVaultListEmptyVariant;
    onConnectSource?: () => void;
  };
  /** True while re-fetching with existing rows — keep table chrome visible. */
  listRefetching?: boolean;
};

const SORT_COLUMN_HINT: Record<KvSortColumn, string> = {
  title: "title",
  file_size_kb: "file size",
  last_updated: "date updated",
};

function listSortableAriaLabel(column: KvSortColumn, active: boolean, asc: boolean): string {
  const by = SORT_COLUMN_HINT[column];
  if (!active) return `Sort by ${by}`;
  return `Sorted ${asc ? "ascending" : "descending"} by ${by}. Activate to reverse order.`;
}

function ListSortableHeader({
  label,
  column,
  sortOption,
  onColumnClick,
  className,
}: {
  label: string;
  column: KvSortColumn;
  sortOption: KvSortOption;
  onColumnClick: (column: KvSortColumn) => void;
  className?: string;
}) {
  const active = kvSortActiveColumn(sortOption) === column;
  const asc = kvSortIsAsc(sortOption);
  const hint = SORT_COLUMN_HINT[column];
  const titleText = (() => {
    if (!active) return `Click to sort by ${hint}`;
    if (column === "title") {
      return asc ? "Sorted A–Z. Click to reverse." : "Sorted Z–A. Click to reverse.";
    }
    if (column === "file_size_kb") {
      return asc ? "Smallest files first. Click to reverse." : "Largest files first. Click to reverse.";
    }
    return asc ? "Oldest first. Click to reverse." : "Newest first. Click to reverse.";
  })();

  return (
    <th className={cn("p-3 font-medium text-left", className)} scope="col">
      <button
        type="button"
        onClick={() => onColumnClick(column)}
        title={titleText}
        aria-label={listSortableAriaLabel(column, active, asc)}
        className={cn(
          "group inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 -mx-1 -my-0.5 text-left text-[var(--text-secondary)] transition-colors",
          "hover:bg-white/[0.06] hover:text-[#F5F5F5]",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C9A96E]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161616]",
          active && "text-[#F5F5F5]"
        )}
        aria-sort={active ? (asc ? "ascending" : "descending") : undefined}
      >
        <span className="border-b border-dotted border-current/40 group-hover:border-solid group-hover:border-[#C9A96E]/50 pb-px">
          {label}
        </span>
        {active ? (
          asc ? (
            <ChevronUp className="h-3.5 w-3.5 shrink-0 text-[#C9A96E]" aria-hidden />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#C9A96E]" aria-hidden />
          )
        ) : (
          <ArrowUpDown
            className="h-3 w-3 shrink-0 text-[#6B6560] opacity-80 transition-opacity group-hover:opacity-100 group-hover:text-[#9B9590]"
            aria-hidden
          />
        )}
      </button>
    </th>
  );
}

function DocumentActionsMenu({
  doc,
  onSelectDocument,
  isAdmin,
  teams,
  onShareDocument,
  onDeleteDocument,
  canExportDocuments = true,
  shareSubmenuLabel = "Share with…",
}: {
  doc: KnowledgeDocument;
  onSelectDocument: (d: KnowledgeDocument) => void;
  isAdmin?: boolean;
  teams: TeamOpt[];
  onShareDocument?: (d: KnowledgeDocument, teamId: string) => void;
  onDeleteDocument?: (d: KnowledgeDocument) => void;
  canExportDocuments?: boolean;
  shareSubmenuLabel?: string;
}) {
  const toast = useToast();
  return (
    <DropdownMenuContent align="end" className="min-w-[10rem]">
      <DropdownMenuItem onClick={() => onSelectDocument(doc)}>View</DropdownMenuItem>
      {canExportDocuments ? (
        <DropdownMenuItem
          onClick={() => {
            toast("Download started (demo)");
          }}
        >
          Download
        </DropdownMenuItem>
      ) : null}
      {teams.length > 0 && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-sm">
            {shareSubmenuLabel}
            <ChevronRight className="ml-auto h-3.5 w-3.5" aria-hidden />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-[#1a1a1a] border-white/10 py-1">
            {teams.map((team) => (
              <DropdownMenuItem
                key={team.id}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-400 focus:text-white hover:bg-white/[0.04]"
                onClick={() => onShareDocument?.(doc, team.id)}
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
            className="hover:opacity-80 focus:bg-white/[0.04]"
            style={{ color: "#A66B6B" }}
            onClick={() => onDeleteDocument(doc)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-2 inline" aria-hidden />
            Delete
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );
}

export default function DocumentGrid({
  documents,
  loading,
  onSelectDocument,
  isOversightPrivate,
  scopeOverrides,
  listSelection,
  isAdmin,
  teams = MOCK_TEAMS.map((t) => ({ id: t.id, name: t.name })),
  onShareDocument,
  onDeleteDocument,
  canExportDocuments = true,
  shareSubmenuLabel = "Share with…",
  listSort,
  listEmpty,
  listRefetching = false,
}: Props) {
  const headerCbRef = useRef<HTMLInputElement>(null);
  const selectedSet = new Set(listSelection.selectedIds);
  const allSelected =
    documents.length > 0 && documents.every((d) => selectedSet.has(d.id));
  const someSelected = documents.some((d) => selectedSet.has(d.id)) && !allSelected;

  useEffect(() => {
    const el = headerCbRef.current;
    if (el) el.indeterminate = someSelected;
  }, [someSelected]);

  if (loading && !listRefetching) {
    return (
      <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161616]">
        <div className="space-y-2 p-3">
          {Array.from({ length: 8 }, (_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!loading && documents.length === 0 && listEmpty) {
    const empty =
      listEmpty.variant === "client_visibility"
        ? {
            icon: Shield,
            title: "No documents match the current visibility",
            description:
              "Everything from your search is hidden by access rules or permissions. Try widening filters, or use Show all if you are an admin.",
          }
        : listEmpty.variant === "filtered_empty"
          ? {
              icon: Search,
              title: "No documents match your search or filters",
              description: "Clear filters or try different keywords.",
            }
          : {
              icon: FolderOpen,
              title: "Your vault is empty",
              description: "Connect a source or upload files so documents appear here.",
              action: listEmpty.onConnectSource
                ? { label: "Connect a source", onClick: listEmpty.onConnectSource }
                : undefined,
            };
    const EmptyIcon = empty.icon;
    return (
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161616]">
        <EmptyState
          icon={EmptyIcon}
          title={empty.title}
          description={empty.description}
          action={empty.action}
        />
      </div>
    );
  }

  if (!loading && documents.length === 0) {
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

  const stickyCbClass =
    "sticky left-0 z-[2] bg-[#161616] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.65)]";
  const stickyTitleClass = cn(
    "sticky z-[2] bg-[#161616] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.65)]",
    "left-10"
  );
  return (
    <div
      className={cn(
        "rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161616] overflow-hidden overflow-x-auto transition-opacity",
        loading && listRefetching && "opacity-[0.72]"
      )}
      aria-busy={loading && listRefetching ? true : undefined}
    >
      <table className="w-full text-sm min-w-[720px]">
        <caption className="sr-only">
          Document list. Use the Title, Size, and Updated column headers to change sort order.
        </caption>
        <thead>
          <tr className="border-b border-[rgba(255,255,255,0.08)] text-left text-[var(--text-secondary)]">
            <th className={cn("p-3 w-10", stickyCbClass)} scope="col">
              <input
                ref={headerCbRef}
                type="checkbox"
                className="checkbox-on-dark"
                checked={allSelected}
                onChange={() => listSelection.onSelectAllPageToggle()}
                aria-label="Select all documents on this page"
              />
            </th>
              <ListSortableHeader
                label="Title"
                column="title"
                sortOption={listSort.option}
                onColumnClick={listSort.onColumnClick}
                className={stickyTitleClass}
              />
              <th className="p-3 font-medium" scope="col">
                Source
              </th>
              <th className="p-3 font-medium" scope="col">
                Access
              </th>
              <th className="p-3 font-medium" scope="col">
                Status
              </th>
              <ListSortableHeader
                label="Size"
                column="file_size_kb"
                sortOption={listSort.option}
                onColumnClick={listSort.onColumnClick}
              />
              <ListSortableHeader
                label="Updated"
                column="last_updated"
                sortOption={listSort.option}
                onColumnClick={listSort.onColumnClick}
              />
              <th className="p-3 w-10" scope="col" />
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const oversight = isOversightPrivate?.(doc) ?? false;
              const rowTone = cn(
                "hover:bg-white/[0.02]",
                doc.ingestion_status === "not_indexed" && "border-l-4 border-l-white/10",
                oversight && "opacity-60"
              );
              const checked = selectedSet.has(doc.id);
              return (
                <tr key={doc.id} className={cn(rowTone, "border-b border-[rgba(255,255,255,0.06)]")}>
                  <td className={cn("py-2.5 px-3 align-top", stickyCbClass)}>
                    <input
                      type="checkbox"
                      className="checkbox-on-dark checkbox-on-dark-sm mt-1"
                      checked={checked}
                      onChange={() => listSelection.onToggle(doc.id)}
                      aria-label={`Select ${doc.title}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className={cn("py-2.5 px-3 align-top", stickyTitleClass)}>
                    <div className="flex items-start gap-2 min-w-0">
                      {oversight && (
                        <span title="This document belongs to another user" className="shrink-0 mt-1 inline-flex">
                          <Shield
                            className="w-3.5 h-3.5 text-gray-500"
                            aria-label="This document belongs to another user"
                          />
                        </span>
                      )}
                      <div className="min-w-0 flex-1 max-w-[min(280px,40vw)]">
                        <button
                          type="button"
                          onClick={() => onSelectDocument(doc)}
                          className="font-medium text-[#F5F5F5] hover:underline text-left truncate max-w-full block"
                        >
                          {doc.title}
                        </button>
                        <KvTagsDiscreteTitleSubline tags={doc.tags} />
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
                        canExportDocuments={canExportDocuments}
                        shareSubmenuLabel={shareSubmenuLabel}
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
