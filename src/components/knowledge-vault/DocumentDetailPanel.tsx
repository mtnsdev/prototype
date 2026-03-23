"use client";

import {
  X,
  RefreshCw,
  Download,
  Trash2,
  ExternalLink,
  Info,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { KnowledgeDocument } from "@/types/knowledge-vault";
import { DataSourceType } from "@/types/knowledge-vault";
import { cn } from "@/lib/utils";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import { MOCK_TEAMS } from "@/lib/teamsMock";
import {
  canAdminRescopeDocument,
  effectivePrivateOwnerId,
  effectiveUiScope,
  type KvScopeOverrides,
} from "@/lib/knowledgeVaultVisibility";
import { useToast } from "@/contexts/ToastContext";
import { Cloud, Database, Globe, Mail, Upload } from "lucide-react";

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
      return "Agency-wide reference";
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
  return (
    <div className={wrap}>
      <Upload size={24} />
    </div>
  );
}

type Props = {
  document: KnowledgeDocument | null;
  loading?: boolean;
  oversightPrivate?: boolean;
  scopeOverrides: KvScopeOverrides;
  isAdmin: boolean;
  currentUserOwnerId: string;
  onScopeChange: (scope: "private" | string) => void;
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

export default function DocumentDetailPanel({
  document: doc,
  loading = false,
  oversightPrivate = false,
  scopeOverrides,
  isAdmin,
  currentUserOwnerId,
  onScopeChange,
  onClose,
  onUpdate,
}: Props) {
  const toast = useToast();

  return (
    <aside
      className={cn(
        "flex flex-col overflow-hidden bg-[#161616] border-[rgba(255,255,255,0.08)]",
        "fixed inset-0 z-50 md:relative md:inset-auto md:w-96 md:shrink-0 md:border-l md:z-auto",
        oversightPrivate && "opacity-60"
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
        <DetailBody
          doc={doc}
          oversightPrivate={oversightPrivate}
          scopeOverrides={scopeOverrides}
          isAdmin={isAdmin}
          currentUserOwnerId={currentUserOwnerId}
          onScopeChange={onScopeChange}
          onUpdate={onUpdate}
          toast={toast}
        />
      )}
    </aside>
  );
}

function DetailBody({
  doc,
  oversightPrivate,
  scopeOverrides,
  isAdmin,
  currentUserOwnerId,
  onScopeChange,
  onUpdate,
  toast,
}: {
  doc: KnowledgeDocument;
  oversightPrivate: boolean;
  scopeOverrides: KvScopeOverrides;
  isAdmin: boolean;
  currentUserOwnerId: string;
  onScopeChange: (scope: "private" | string) => void;
  onUpdate: () => void;
  toast: (msg: string) => void;
}) {
  const eff = effectiveUiScope(doc, scopeOverrides);
  const canEditScope = isAdmin && !oversightPrivate && canAdminRescopeDocument(doc);
  const isOwner = effectivePrivateOwnerId(doc, currentUserOwnerId) === currentUserOwnerId;
  const showDelete = eff === "private" && !oversightPrivate && (isOwner || isAdmin);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {oversightPrivate && (
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] text-gray-400">
          <Shield className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span>Other advisor&apos;s private document — oversight view (read-only context).</span>
        </div>
      )}
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
              <ScopeBadge scope={eff} teams={MOCK_TEAMS} />
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

      {canEditScope && (
        <section>
          <h4 className="text-xs font-semibold uppercase text-[rgba(245,245,245,0.5)] mb-2">Sharing &amp; scope</h4>
          <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
            Share with a team or return visibility to the owner as private. Applies to new indexing rules when the API
            is connected; this demo keeps changes in your session.
          </p>
          <select
            value={eff}
            onChange={(e) => {
              const v = e.target.value as "private" | string;
              onScopeChange(v);
              toast("Scope updated");
            }}
            className="w-full text-xs bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-gray-300 outline-none"
          >
            <option value="private">Private</option>
            {MOCK_TEAMS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </section>
      )}

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
        <Button variant="outline" size="sm" className="border-white/10 text-[#F5F5F5]" onClick={() => onUpdate()}>
          <RefreshCw size={14} className="mr-1" /> Re-index
        </Button>
        <Button variant="outline" size="sm" className="border-white/10 text-[#F5F5F5]">
          View Original
        </Button>
        <Button variant="outline" size="sm" className="border-white/10 text-[#F5F5F5]">
          <Download size={14} className="mr-1" /> Download
        </Button>
        {showDelete && (
          <Button
            variant="outline"
            size="sm"
            className="border-[var(--muted-error-border)] text-[var(--muted-error-text)]"
          >
            <Trash2 size={14} className="mr-1" /> Delete
          </Button>
        )}
      </section>
    </div>
  );
}
