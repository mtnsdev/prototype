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
  Mail,
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
import { PIPELINE_STAGE_LABEL_MAP } from "@/config/pipelineStages";
import { DemoBadge } from "@/components/ui/DemoBadge";

const LAYER_COLORS: Record<string, string> = {
  enable: "bg-[var(--muted-info-bg)] text-[var(--muted-info-text)] border border-[var(--muted-info-border)]",
  agency: "bg-[var(--muted-success-bg)] text-[var(--muted-success-text)] border border-[var(--muted-success-border)]",
  advisor: "bg-[var(--muted-amber-bg)] text-[var(--muted-amber-text)] border border-[var(--muted-amber-border)]",
};

const SOURCE_BADGE =
  "text-xs px-1.5 py-0.5 rounded-md bg-white/[0.08] text-[rgba(245,245,245,0.75)] border border-white/10 max-w-[160px] truncate";

function fileIcon(doc: KnowledgeDocument) {
  if (doc.source_type === DataSourceType.WebScrape) return Globe;
  if (doc.file_type === "html" || doc.is_wiki_page) return Globe;
  if (doc.file_type === "xlsx" || doc.file_type === "csv") return FileSpreadsheet;
  return FileText;
}

type Props = {
  documents: KnowledgeDocument[];
  viewMode: "grid" | "list";
  loading: boolean;
  onSelectDocument: (doc: KnowledgeDocument) => void;
};

export default function DocumentGrid({
  documents,
  viewMode,
  loading,
  onSelectDocument,
}: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
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
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161616] p-12 text-center">
        <FileText size={48} className="mx-auto text-[rgba(245,245,245,0.3)] mb-4" />
        <p className="text-[#F5F5F5] font-medium">No documents found</p>
        <p className="text-sm text-[rgba(245,245,245,0.5)] mt-1">
          Try adjusting filters or search, or upload a document.
        </p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161616] overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.08)] text-left text-[rgba(245,245,245,0.5)]">
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Source</th>
              <th className="p-3 font-medium">Layer</th>
              <th className="p-3 font-medium">Tags</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Size</th>
              <th className="p-3 font-medium">Updated</th>
              <th className="p-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className={cn(
                  "border-b border-[rgba(255,255,255,0.06)] hover:bg-white/[0.03]",
                  doc.ingestion_status === "failed" && "border-l-4 border-l-[var(--muted-error-border)]",
                  doc.source_type === DataSourceType.WebScrape && "bg-blue-500/[0.04]"
                )}
              >
                <td className="py-3 px-3">
                  <div className="flex items-start gap-2">
                    {doc.source_type === DataSourceType.WebScrape && (
                      <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    )}
                    {doc.source_type === DataSourceType.EmailTemplate && (
                      <Mail className="w-3.5 h-3.5 text-rose-400/60 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectDocument(doc)}
                        className="font-medium text-[#F5F5F5] hover:underline text-left truncate max-w-[220px] block"
                      >
                        {doc.title}
                      </button>
                      {doc.pipeline_stage && doc.source_type === DataSourceType.EmailTemplate && (
                        <span className="text-[10px] text-rose-400/60 bg-rose-500/5 px-1.5 py-0.5 rounded mt-1 inline-block">
                          {PIPELINE_STAGE_LABEL_MAP[doc.pipeline_stage]}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span className={cn(SOURCE_BADGE, "inline-block max-w-[180px]")} title={doc.source_name}>
                    {doc.source_name}
                  </span>
                </td>
                <td className="p-3">
                  <span className={cn("text-xs px-1.5 py-0.5 rounded capitalize", LAYER_COLORS[doc.data_layer])}>
                    {doc.data_layer}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1 flex-wrap">
                    {doc.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/[0.06]"
                      >
                        {tag}
                      </span>
                    ))}
                    {doc.tags.length > 3 && (
                      <span className="text-[10px] text-gray-600">+{doc.tags.length - 3}</span>
                    )}
                    {doc.tags.length === 0 && <span className="text-[10px] text-gray-600">—</span>}
                  </div>
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
                <td className="p-3 text-[rgba(245,245,245,0.5)]">{(doc.file_size_kb / 1024).toFixed(2)} MB</td>
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
                      <DropdownMenuItem>View Linked Products</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => {
        const Icon = fileIcon(doc);
        return (
          <div
            key={doc.id}
            className={cn(
              "rounded-xl border bg-[#161616] overflow-hidden flex flex-col transition-shadow hover:shadow-lg relative",
              doc.source_type === DataSourceType.WebScrape
                ? "border-blue-500/20 bg-blue-500/[0.03]"
                : "border-[rgba(255,255,255,0.08)]",
              doc.ingestion_status === "failed" && "border-[var(--muted-error-border)]"
            )}
          >
            <DemoBadge className="top-2 left-2 right-auto" />
            {doc.source_type === DataSourceType.EmailTemplate && (
              <div className="absolute top-3 right-10 z-10 pointer-events-none">
                <Mail className="w-3.5 h-3.5 text-rose-400/60" />
              </div>
            )}
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
                  <DropdownMenuItem>View Linked Products</DropdownMenuItem>
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
                    doc.source_type === DataSourceType.WebScrape ? "bg-blue-500/15 text-blue-400" : "bg-white/10"
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
                    <span className={cn("text-xs px-1.5 py-0.5 rounded capitalize", LAYER_COLORS[doc.data_layer])}>
                      {doc.data_layer}
                    </span>
                    {doc.is_wiki_page && (
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25">
                        Wiki Page
                      </span>
                    )}
                    {doc.pipeline_stage && doc.source_type === DataSourceType.EmailTemplate && (
                      <span className="text-[10px] text-rose-400/60 bg-rose-500/5 px-1.5 py-0.5 rounded">
                        {PIPELINE_STAGE_LABEL_MAP[doc.pipeline_stage]}
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
                  {doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/[0.06]"
                        >
                          {t}
                        </span>
                      ))}
                      {doc.tags.length > 3 && (
                        <span className="text-xs text-[rgba(245,245,245,0.5)]">+{doc.tags.length - 3}</span>
                      )}
                    </div>
                  )}
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
