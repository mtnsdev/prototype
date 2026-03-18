"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  RefreshCw,
  Download,
  Trash2,
  ExternalLink,
  Package,
  User,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { KnowledgeDocument } from "@/types/knowledge-vault";
import { DataSourceType } from "@/types/knowledge-vault";
import { cn } from "@/lib/utils";
import { Cloud, Database, Globe, Mail, Upload } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { PIPELINE_STAGE_LABEL_MAP } from "@/config/pipelineStages";

function accessScopeLabel(doc: KnowledgeDocument): string {
  switch (doc.source_type) {
    case DataSourceType.GoogleDriveAdmin:
      return "Visible to all agency advisors";
    case DataSourceType.GoogleDrivePersonal:
      return "Private — only visible to you";
    case DataSourceType.ClaromentisDocuments:
    case DataSourceType.ClaromentisPages:
      return "Permission-based — synced from Claromentis access groups";
    case DataSourceType.ManualUpload:
      if (doc.data_layer === "advisor") return "Private — uploaded by you";
      if (doc.data_layer === "agency") return "Shared with agency";
      return "Available to all Enable users";
    case DataSourceType.Virtuoso:
      return "Available to all Enable users";
    case DataSourceType.EmailTemplate:
      return "Agency email templates — visible to all advisors";
    case DataSourceType.WebScrape:
      return "Personal web saves — only visible to you";
    default:
      return "See access policy in source settings";
  }
}

function SourceIcon({ doc }: { doc: KnowledgeDocument }) {
  const wrap = "w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-[#F5F5F5] shrink-0";
  if (doc.source_type === DataSourceType.GoogleDriveAdmin || doc.source_type === DataSourceType.GoogleDrivePersonal)
    return (
      <div className={wrap}>
        <Cloud size={24} />
      </div>
    );
  if (doc.source_type === DataSourceType.ClaromentisDocuments || doc.source_type === DataSourceType.ClaromentisPages)
    return (
      <div className={wrap}>
        <Database size={24} />
      </div>
    );
  if (doc.source_type === DataSourceType.Virtuoso)
    return (
      <div className={wrap}>
        <Globe size={24} />
      </div>
    );
  if (doc.source_type === DataSourceType.Email)
    return (
      <div className={wrap}>
        <Mail size={24} />
      </div>
    );
  if (doc.source_type === DataSourceType.EmailTemplate)
    return (
      <div className="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-300 shrink-0 border border-rose-500/25">
        <Mail size={24} />
      </div>
    );
  if (doc.source_type === DataSourceType.WebScrape)
    return (
      <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/25">
        <Globe size={24} />
      </div>
    );
  return (
    <div className={wrap}>
      <Upload size={24} />
    </div>
  );
}

const LAYER_COLORS: Record<string, string> = {
  enable: "bg-[var(--muted-info-bg)] text-[var(--muted-info-text)] border-[var(--muted-info-border)]",
  agency: "bg-[var(--muted-success-bg)] text-[var(--muted-success-text)] border-[var(--muted-success-border)]",
  advisor: "bg-[var(--muted-amber-bg)] text-[var(--muted-amber-text)] border-[var(--muted-amber-border)]",
};

type Props = {
  document: KnowledgeDocument | null;
  loading?: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onTagsChange?: (documentId: string, tags: string[]) => void;
};

function DetailPanelSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/10" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 rounded bg-white/10 w-3/4" />
          <div className="h-4 rounded bg-white/10 w-1/3" />
        </div>
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <section key={i}>
          <div className="h-3 rounded bg-white/10 w-24 mb-2" />
          <div className="h-4 rounded bg-white/10 w-full mb-1" />
          <div className="h-4 rounded bg-white/10 w-2/3" />
        </section>
      ))}
    </div>
  );
}

export default function DocumentDetailPanel({
  document: doc,
  loading = false,
  onClose,
  onUpdate,
  onTagsChange,
}: Props) {
  const [newTag, setNewTag] = useState("");
  const showToast = useToast();

  const addTag = () => {
    const t = newTag.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || !doc || doc.tags.some((x) => x.toLowerCase() === t)) return;
    const next = [...doc.tags, t];
    onTagsChange?.(doc.id, next);
    setNewTag("");
    showToast("Tag added");
  };

  const removeTag = (tag: string) => {
    if (!doc) return;
    onTagsChange?.(
      doc.id,
      doc.tags.filter((x) => x !== tag)
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col overflow-hidden bg-[#161616] border-[rgba(255,255,255,0.08)]",
        "fixed inset-0 z-50 md:relative md:inset-auto md:w-96 md:shrink-0 md:border-l md:z-auto"
      )}
    >
      <div className="shrink-0 flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.08)]">
        <h2 className="font-semibold text-[#F5F5F5] truncate">Document details</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose} aria-label="Close">
          <X size={18} />
        </Button>
      </div>
      {loading ? (
        <DetailPanelSkeleton />
      ) : !doc ? null : doc.source_type === DataSourceType.EmailTemplate ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4 text-rose-400" />
              <span className="text-[10px] text-rose-400 uppercase tracking-wider font-medium">Email Template</span>
            </div>
            <h3 className="text-base font-medium text-white">{doc.title}</h3>
            <p className="text-xs text-gray-400 mt-1">{doc.content_summary ?? ""}</p>
          </div>
          {doc.pipeline_stage && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Sales Cycle Stage</p>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {PIPELINE_STAGE_LABEL_MAP[doc.pipeline_stage]}
              </span>
            </div>
          )}
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
            <p className="text-xs text-gray-500 italic">Template preview and VIC auto-fill coming in v2</p>
          </div>
          <button
            type="button"
            className="w-full py-2 rounded-xl text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/15 transition-colors"
            onClick={() => showToast("Template editor — coming in v2")}
          >
            Use Template
          </button>
        </div>
      ) : (
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex items-start gap-3">
          <SourceIcon doc={doc} />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[#F5F5F5]">{doc.title}</h3>
            <p className="text-sm text-[rgba(245,245,245,0.5)] mt-0.5">
              {doc.file_type.toUpperCase()} · {(doc.file_size_kb / 1024).toFixed(2)} MB
              {doc.source_url && (
                <>
                  {" · "}
                  <span className="text-blue-400/80">{doc.source_url}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <section>
          <h4 className="text-xs font-semibold uppercase text-[rgba(245,245,245,0.5)] mb-2">Source</h4>
          <div className="flex items-start gap-3">
            <SourceIcon doc={doc} />
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-sm font-medium text-[#F5F5F5]">{doc.source_name}</p>
              <p className="text-xs text-[rgba(245,245,245,0.65)] leading-relaxed">{accessScopeLabel(doc)}</p>
              {(doc.source_type === DataSourceType.ClaromentisDocuments ||
                doc.source_type === DataSourceType.ClaromentisPages) && (
                <div className="flex items-start gap-1.5 mt-2 text-[10px] text-gray-500">
                  <Info className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>
                    You see this because you&apos;re in the &quot;Europe Team&quot; and &quot;Senior Advisors&quot;
                    groups in Claromentis.
                  </span>
                </div>
              )}
              {doc.is_wiki_page && (
                <p className="text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/25">
                    Wiki Page
                  </span>
                  <span className="text-[rgba(245,245,245,0.45)] ml-2">HTML content (not a file upload)</span>
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={cn("text-xs px-2 py-0.5 rounded border capitalize", LAYER_COLORS[doc.data_layer])}>
                  {doc.data_layer}
                </span>
              </div>
              {doc.ingested_at && (
                <p className="text-xs text-[rgba(245,245,245,0.5)]">
                  Ingested {new Date(doc.ingested_at).toLocaleDateString()}
                </p>
              )}
              <p className="text-xs text-[rgba(245,245,245,0.5)]">
                Updated {new Date(doc.last_updated).toLocaleDateString()}
              </p>
            </div>
          </div>
        </section>

        <section>
          <p className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase mb-2">Tags</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {doc.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/[0.06] flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-gray-600 hover:text-gray-400 leading-none"
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="Add tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
              className="text-[10px] bg-white/[0.03] border border-white/[0.06] rounded px-2 py-1 text-gray-300 placeholder:text-gray-600 w-28 outline-none"
            />
            <button
              type="button"
              onClick={addTag}
              className="text-[10px] text-blue-400 hover:text-blue-300"
            >
              +
            </button>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-semibold uppercase text-[rgba(245,245,245,0.5)] mb-2">Linked products</h4>
          {doc.linked_products.length === 0 ? (
            <p className="text-sm text-[rgba(245,245,245,0.5)]">None</p>
          ) : (
            <ul className="space-y-1">
              {doc.linked_products.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/products/${p.id}`}
                    className="text-sm text-[#F5F5F5] hover:underline flex items-center gap-1"
                  >
                    <Package size={12} /> {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Button variant="outline" size="sm" className="mt-2 border-white/10 text-[#F5F5F5]">
            Link Product
          </Button>
        </section>

        <section>
          <h4 className="text-xs font-semibold uppercase text-[rgba(245,245,245,0.5)] mb-2">Linked VICs</h4>
          {doc.linked_vics.length === 0 ? (
            <p className="text-sm text-[rgba(245,245,245,0.5)]">None</p>
          ) : (
            <ul className="space-y-1">
              {doc.linked_vics.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/dashboard/vics/${v.id}`}
                    className="text-sm text-[#F5F5F5] hover:underline flex items-center gap-1"
                  >
                    <User size={12} /> {v.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Button variant="outline" size="sm" className="mt-2 border-white/10 text-[#F5F5F5]">
            Link VIC
          </Button>
        </section>

        <section>
          <h4 className="text-xs font-semibold uppercase text-[rgba(245,245,245,0.5)] mb-2">Provenance</h4>
          {doc.uploaded_by_name && (
            <p className="text-sm text-[rgba(245,245,245,0.8)]">Uploaded by {doc.uploaded_by_name}</p>
          )}
          {!doc.uploaded_by && (
            <p className="text-sm text-[rgba(245,245,245,0.8)]">Synced from {doc.source_name}</p>
          )}
          {doc.url && (
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[rgba(245,245,245,0.8)] hover:underline flex items-center gap-1"
            >
              <ExternalLink size={12} /> Original URL
            </a>
          )}
        </section>

        <section className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="border-white/10 text-[#F5F5F5]">
            <RefreshCw size={14} className="mr-1" /> Re-index
          </Button>
          <Button variant="outline" size="sm" className="border-white/10 text-[#F5F5F5]">
            View Original
          </Button>
          <Button variant="outline" size="sm" className="border-white/10 text-[#F5F5F5]">
            <Download size={14} className="mr-1" /> Download
          </Button>
          {doc.data_layer === "advisor" && (
            <Button variant="outline" size="sm" className="border-[var(--muted-error-border)] text-[var(--muted-error-text)]">
              <Trash2 size={14} className="mr-1" /> Delete
            </Button>
          )}
        </section>
      </div>
      )}
    </aside>
  );
}
