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
import { EmptyKnowledgeVault, EmptySearchResults } from "@/components/ui/empty-states";
import {
  listMutedCellClass,
  listPrimaryTextClass,
  listSurfaceClass,
  listScrollClass,
  listTableClass,
  listTdClass,
  listThCheckboxClass,
  listThClass,
  listTheadRowClass,
  listTbodyRowClass,
} from "@/lib/list-ui";

const SOURCE_BADGE =
  "text-xs px-1.5 py-0.5 rounded-md bg-white/[0.06] text-foreground/[0.55] border border-white/[0.08] max-w-[160px] truncate";

type TeamOpt = { id: string; name: string };

type ListSelection = {
  selectedIds: string[];
  onToggle: (docId: string) => void;
  /** Selects or clears only the documents on the current page. */
  onSelectAllPageToggle: () => void;
};

export type KnowledgeVaultListEmptyVariant = "api_empty" | "filtered_empty" | "vic_visibility";

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
    <th className={cn(listThClass, "text-left font-medium", className)} scope="col">
      <button
        type="button"
        onClick={() => onColumnClick(column)}
        title={titleText}
        aria-label={listSortableAriaLabel(column, active, asc)}
        className={cn(
          "group -mx-1 -my-0.5 inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-left text-muted-foreground transition-colors",
          "hover:bg-white/[0.06] hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
          active && "text-foreground"
        )}
        aria-sort={active ? (asc ? "ascending" : "descending") : undefined}
      >
        <span className="border-b border-dotted border-current/40 group-hover:border-solid group-hover:border-brand-cta/50 pb-px">
          {label}
        </span>
        {active ? (
          asc ? (
            <ChevronUp className="h-3.5 w-3.5 shrink-0 text-brand-cta" aria-hidden />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-brand-cta" aria-hidden />
          )
        ) : (
          <ArrowUpDown
            className="h-3 w-3 shrink-0 text-muted-foreground opacity-80 transition-opacity group-hover:opacity-100 group-hover:text-muted-foreground"
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
          <DropdownMenuSubContent className="border border-border bg-popover py-1">
            {teams.map((team) => (
              <DropdownMenuItem
                key={team.id}
                className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground/90 focus:text-white hover:bg-white/[0.04]"
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
      <div className={cn(listSurfaceClass, listScrollClass, "overflow-hidden p-3")}>
        <div className="space-y-2">
          {Array.from({ length: 8 }, (_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!loading && documents.length === 0 && listEmpty) {
    // Special case: visibility restrictions
    if (listEmpty.variant === "vic_visibility") {
      return (
        <div className={cn(listSurfaceClass, listScrollClass, "overflow-hidden")}>
          <EmptyState
            icon={Shield}
            title="No documents match the current visibility"
            description="Everything from your search is hidden by access rules or permissions. Try widening filters, or use Show all if you are an admin."
          />
        </div>
      );
    }

    // api_empty: vault is completely empty — offer connection action
    if (listEmpty.variant === "api_empty") {
      return (
        <div className={cn(listSurfaceClass, listScrollClass, "overflow-hidden flex items-center justify-center")}>
          <EmptyKnowledgeVault
            action={listEmpty.onConnectSource ? { label: "Connect Source", onClick: listEmpty.onConnectSource } : undefined}
          />
        </div>
      );
    }

    // filtered_empty: documents exist but don't match filters
    return (
      <div className={cn(listSurfaceClass, listScrollClass, "overflow-hidden flex items-center justify-center")}>
        <EmptySearchResults />
      </div>
    );
  }

  if (!loading && documents.length === 0) {
    return (
      <div className={cn(listSurfaceClass, listScrollClass, "overflow-hidden flex items-center justify-center")}>
        <EmptySearchResults />
      </div>
    );
  }

  const stickyCbClass =
    "sticky left-0 z-[2] bg-background shadow-[4px_0_12px_-4px_rgba(0,0,0,0.65)]";
  const stickyTitleClass = cn(
    "sticky z-[2] bg-background shadow-[4px_0_12px_-4px_rgba(0,0,0,0.65)]",
    "left-10"
  );
  return (
    <div
      className={cn(
        listSurfaceClass,
        listScrollClass,
        "overflow-hidden transition-opacity",
        loading && listRefetching && "opacity-[0.72]"
      )}
      aria-busy={loading && listRefetching ? true : undefined}
    >
      <table className={listTableClass("min-w-[720px]")}>
        <caption className="sr-only">
          Document list. Use the Title, Size, and Updated column headers to change sort order.
        </caption>
        <thead>
          <tr className={listTheadRowClass}>
            <th className={cn(listThCheckboxClass, stickyCbClass)} scope="col">
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
            <th className={cn(listThClass, "font-medium")} scope="col">
              Source
            </th>
            <th className={cn(listThClass, "font-medium")} scope="col">
              Access
            </th>
            <th className={cn(listThClass, "font-medium")} scope="col">
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
            <th className={cn(listThClass, "w-10")} scope="col" />
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => {
            const oversight = isOversightPrivate?.(doc) ?? false;
            const rowTone = cn(
              listTbodyRowClass,
              doc.ingestion_status === "not_indexed" && "border-l-4 border-l-border",
              oversight && "opacity-60"
            );
            const checked = selectedSet.has(doc.id);
            const docTd = cn(listTdClass, "align-top");
            return (
              <tr key={doc.id} className={rowTone}>
                <td className={cn(docTd, stickyCbClass)}>
                  <input
                    type="checkbox"
                    className="checkbox-on-dark checkbox-on-dark-sm mt-1"
                    checked={checked}
                    onChange={() => listSelection.onToggle(doc.id)}
                    aria-label={`Select ${doc.title}`}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className={cn(docTd, stickyTitleClass)}>
                  <div className="flex min-w-0 items-start gap-2">
                    {oversight && (
                      <span title="This document belongs to another user" className="mt-1 inline-flex shrink-0">
                        <Shield
                          className="h-3.5 w-3.5 text-muted-foreground"
                          aria-label="This document belongs to another user"
                        />
                      </span>
                    )}
                    <div className="max-w-[min(280px,40vw)] min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onSelectDocument(doc)}
                        className={cn(
                          listPrimaryTextClass,
                          "block max-w-full truncate text-left hover:underline"
                        )}
                      >
                        {doc.title}
                      </button>
                      <KvTagsDiscreteTitleSubline tags={doc.tags} />
                    </div>
                  </div>
                </td>
                <td className={docTd}>
                  <span className={cn(SOURCE_BADGE, "inline-block max-w-[180px]")} title={doc.source_name}>
                    {doc.source_name}
                  </span>
                </td>
                <td className={docTd}>
                  <ScopeBadge scope={effectiveUiScope(doc, scopeOverrides)} teams={MOCK_TEAMS} />
                </td>
                <td className={docTd}>
                  <IngestionStatusBadge status={doc.ingestion_status} />
                </td>
                <td className={cn(docTd, listMutedCellClass)}>{(doc.file_size_kb / 1024).toFixed(2)} MB</td>
                <td className={cn(docTd, listMutedCellClass)}>
                  {new Date(doc.last_updated).toLocaleDateString()}
                </td>
                <td className={docTd}>
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
