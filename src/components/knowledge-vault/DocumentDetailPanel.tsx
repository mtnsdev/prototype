"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  FileText,
  RefreshCw,
  Download,
  Trash2,
  ExternalLink,
  Package,
  User,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { KnowledgeDocument } from "@/types/knowledge-vault";
import { cn } from "@/lib/utils";

const LAYER_COLORS: Record<string, string> = {
  enable: "bg-[var(--muted-info-bg)] text-[var(--muted-info-text)] border-[var(--muted-info-border)]",
  agency: "bg-[var(--muted-success-bg)] text-[var(--muted-success-text)] border-[var(--muted-success-border)]",
  advisor: "bg-[var(--muted-amber-bg)] text-[var(--muted-amber-text)] border-[var(--muted-amber-border)]",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  destination_guide: "Destination Guide",
  property_profile: "Property Profile",
  rate_sheet: "Rate Sheet",
  policy: "Policy",
  contract: "Contract",
  training_material: "Training Material",
  newsletter: "Newsletter",
  client_report: "Client Report",
  marketing_collateral: "Marketing Collateral",
  internal_memo: "Internal Memo",
  partner_directory: "Partner Directory",
  travel_advisory: "Travel Advisory",
};

type Props = {
  document: KnowledgeDocument | null;
  loading?: boolean;
  onClose: () => void;
  onUpdate: () => void;
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

export default function DocumentDetailPanel({ document: doc, loading = false, onClose, onUpdate }: Props) {
  const [tagInput, setTagInput] = useState("");

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
      ) : !doc ? null : (
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-[#F5F5F5]">
            <FileText size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[#F5F5F5]">{doc.title}</h3>
            <p className="text-sm text-[rgba(245,245,245,0.5)] mt-0.5">
              {doc.file_type.toUpperCase()} · {(doc.file_size_kb / 1024).toFixed(1)} MB
            </p>
          </div>
        </div>

        <section>
          <h4 className="text-xs font-semibold uppercase text-[rgba(245,245,245,0.5)] mb-2">Source</h4>
          <p className="text-sm text-[#F5F5F5]">{doc.source_name}</p>
          <span className={cn("inline-block text-xs px-2 py-0.5 rounded border mt-1", LAYER_COLORS[doc.data_layer])}>
            {doc.data_layer}
          </span>
          {doc.ingested_at && (
            <p className="text-xs text-[rgba(245,245,245,0.5)] mt-1">
              Ingested {new Date(doc.ingested_at).toLocaleDateString()}
            </p>
          )}
          <p className="text-xs text-[rgba(245,245,245,0.5)]">
            Updated {new Date(doc.last_updated).toLocaleDateString()} · {doc.freshness}
          </p>
        </section>

        {doc.content_summary && (
          <section>
            <h4 className="text-xs font-semibold uppercase text-[rgba(245,245,245,0.5)] mb-2">Summary</h4>
            <div className="rounded-lg bg-white/5 border border-[rgba(255,255,255,0.06)] p-3">
              <p className="text-sm text-[rgba(245,245,245,0.9)]">{doc.content_summary}</p>
            </div>
          </section>
        )}

        {doc.quality_score != null && (
          <section>
            <h4 className="text-xs font-semibold uppercase text-[rgba(245,245,245,0.5)] mb-2">Quality</h4>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--muted-success-text)]"
                style={{ width: (doc.quality_score ?? 0) + "%" }}
              />
            </div>
            <p className="text-xs text-[rgba(245,245,245,0.5)] mt-1">{doc.quality_score}/100</p>
          </section>
        )}

        <section>
          <h4 className="text-xs font-semibold uppercase text-[rgba(245,245,245,0.5)] mb-2">Tags</h4>
          <div className="flex flex-wrap gap-1.5">
            {doc.tags.map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-0.5 rounded bg-white/10 text-[rgba(245,245,245,0.8)]"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tag…"
              className="flex-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-[#F5F5F5]"
            />
            <Button variant="ghost" size="sm">
              <Plus size={14} />
            </Button>
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
