"use client";

import {
  FileText,
  FileSpreadsheet,
  MoreHorizontal,
  CheckCircle,
  Loader2,
  AlertCircle,
  Clock,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { KnowledgeDocument } from "@/types/knowledge-vault";
import { DocumentType } from "@/types/knowledge-vault";
import { cn } from "@/lib/utils";
import { DemoBadge } from "@/components/ui/DemoBadge";

const DOC_TYPE_LABELS: Record<string, string> = {
  destination_guide: "Destination Guide",
  property_profile: "Property Profile",
  rate_sheet: "Rate Sheet",
  policy: "Policy",
  contract: "Contract",
  training_material: "Training",
  newsletter: "Newsletter",
  client_report: "Client Report",
  marketing_collateral: "Marketing",
  internal_memo: "Memo",
  partner_directory: "Partner Dir",
  travel_advisory: "Advisory",
};

const LAYER_COLORS: Record<string, string> = {
  enable: "bg-[var(--muted-info-bg)] text-[var(--muted-info-text)]",
  agency: "bg-[var(--muted-success-bg)] text-[var(--muted-success-text)]",
  advisor: "bg-[var(--muted-amber-bg)] text-[var(--muted-amber-text)]",
};

const FRESHNESS_COLORS: Record<string, string> = {
  fresh: "text-[var(--muted-success-text)]",
  recent: "text-[var(--muted-info-text)]",
  aging: "text-[var(--muted-amber-text)]",
  stale: "text-[var(--muted-error-text)]",
};

function fileIcon(fileType: string) {
  if (fileType === "xlsx" || fileType === "csv") return FileSpreadsheet;
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
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161616] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.08)] text-left text-[rgba(245,245,245,0.5)]">
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Source</th>
              <th className="p-3 font-medium">Layer</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Freshness</th>
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
                  doc.ingestion_status === "failed" && "border-l-4 border-l-[var(--muted-error-border)]"
                )}
              >
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => onSelectDocument(doc)}
                    className="font-medium text-[#F5F5F5] hover:underline text-left truncate max-w-[200px] block"
                  >
                    {doc.title}
                  </button>
                </td>
                <td className="p-3 text-[rgba(245,245,245,0.7)]">{doc.source_name}</td>
                <td className="p-3">
                  <span className={cn("text-xs px-1.5 py-0.5 rounded", LAYER_COLORS[doc.data_layer])}>
                    {doc.data_layer}
                  </span>
                </td>
                <td className="p-3 text-[rgba(245,245,245,0.7)]">
                  {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                </td>
                <td className={cn("p-3", FRESHNESS_COLORS[doc.freshness])}>{doc.freshness}</td>
                <td className="p-3">
                  {doc.ingestion_status === "indexed" && <CheckCircle size={14} className="text-[var(--muted-success-text)]" />}
                  {doc.ingestion_status === "processing" && <Loader2 size={14} className="animate-spin text-[var(--muted-info-text)]" />}
                  {doc.ingestion_status === "failed" && <AlertCircle size={14} className="text-[var(--muted-error-text)]" />}
                  {doc.ingestion_status === "pending" && <Clock size={14} className="text-[rgba(245,245,245,0.5)]" />}
                  {doc.ingestion_status === "stale" && <AlertCircle size={14} className="text-[var(--muted-amber-text)]" />}
                </td>
                <td className="p-3 text-[rgba(245,245,245,0.5)]">{(doc.file_size_kb / 1024).toFixed(1)} MB</td>
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
        const Icon = fileIcon(doc.file_type);
        return (
          <div
            key={doc.id}
            className={cn(
              "rounded-xl border bg-[#161616] overflow-hidden flex flex-col transition-shadow hover:shadow-lg relative",
              "border-[rgba(255,255,255,0.08)]",
              doc.ingestion_status === "failed" && "border-[var(--muted-error-border)]"
            )}
          >
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
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-[rgba(245,245,245,0.9)]">
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-[#F5F5F5] line-clamp-2">{doc.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-xs text-[rgba(245,245,245,0.5)] flex items-center gap-0.5">
                      <Cloud size={10} /> {doc.source_name}
                    </span>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded", LAYER_COLORS[doc.data_layer])}>
                      {doc.data_layer}
                    </span>
                    <span className="text-xs text-[rgba(245,245,245,0.5)]">
                      {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn("text-xs", FRESHNESS_COLORS[doc.freshness])}>
                      {doc.freshness}
                    </span>
                    {doc.ingestion_status === "indexed" && <CheckCircle size={12} className="text-[var(--muted-success-text)]" />}
                    {doc.ingestion_status === "processing" && <Loader2 size={12} className="animate-spin text-[var(--muted-info-text)]" />}
                    {doc.ingestion_status === "failed" && <AlertCircle size={12} className="text-[var(--muted-error-text)]" />}
                  </div>
                  {doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-xs lowercase border border-gray-600 text-gray-400 rounded-full px-2 py-0.5"
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
              <span>{(doc.file_size_kb / 1024).toFixed(1)} MB</span>
              <span>{new Date(doc.last_updated).toLocaleDateString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
