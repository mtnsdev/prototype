"use client";

import { useState, useEffect } from "react";
import {
  X,
  Download,
  ExternalLink,
  Info,
  Shield,
  Lock,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { KnowledgeDocument } from "@/types/knowledge-vault";
import { DataSourceType } from "@/types/knowledge-vault";
import { cn } from "@/lib/utils";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import {
  effectivePrivateOwnerId,
  effectiveUiScope,
  type KvScopeOverrides,
} from "@/lib/knowledgeVaultVisibility";
import { useToast, type ToastInput } from "@/contexts/ToastContext";
import { Cloud, Database, Globe, Mail, Upload } from "lucide-react";
import { IngestionStatusBadge } from "@/components/ui/IngestionStatusBadge";
import { useTeams } from "@/contexts/TeamsContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TEAM_EVERYONE_ID } from "@/types/teams";
import { offboardingRulesApplyToDocument } from "@/lib/knowledgeVaultOffboardingPolicy";

function accessScopeLabel(doc: KnowledgeDocument): string {
  switch (doc.source_type) {
    case DataSourceType.GoogleDriveAdmin:
      return "Visible to all agency advisors";
    case DataSourceType.GoogleDrivePersonal:
      return "Private — only visible to you";
    case DataSourceType.IntranetDocuments:
    case DataSourceType.IntranetPages:
      return "Matches your intranet permissions";
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
  if (doc.source_type === DataSourceType.IntranetDocuments || doc.source_type === DataSourceType.IntranetPages)
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
  canExportDocuments?: boolean;
  /** Effective tag list (includes local edits) */
  documentTags: string[];
  onAddDocumentTag?: (tag: string) => void;
  onRemoveDocumentTag?: (tag: string) => void;
  onRenameDocumentTag?: (oldTag: string, newTag: string) => void;
  onSuggestShareWithTeam?: (teamId: string, teamName: string) => void;
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
  canExportDocuments = true,
  documentTags,
  onAddDocumentTag,
  onRemoveDocumentTag,
  onRenameDocumentTag,
  onSuggestShareWithTeam,
}: Props) {
  const toast = useToast();

  useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable=true]")) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc, onClose]);

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
          toast={toast}
          canExportDocuments={canExportDocuments}
          documentTags={documentTags}
          onAddDocumentTag={onAddDocumentTag}
          onRemoveDocumentTag={onRemoveDocumentTag}
          onRenameDocumentTag={onRenameDocumentTag}
          onSuggestShareWithTeam={onSuggestShareWithTeam}
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
  toast,
  canExportDocuments,
  documentTags,
  onAddDocumentTag,
  onRemoveDocumentTag,
  onRenameDocumentTag,
  onSuggestShareWithTeam,
}: {
  doc: KnowledgeDocument;
  oversightPrivate: boolean;
  scopeOverrides: KvScopeOverrides;
  isAdmin: boolean;
  currentUserOwnerId: string;
  onScopeChange: (scope: "private" | string) => void;
  toast: (input: ToastInput) => void;
  canExportDocuments: boolean;
  documentTags: string[];
  onAddDocumentTag?: (tag: string) => void;
  onRemoveDocumentTag?: (tag: string) => void;
  onRenameDocumentTag?: (oldTag: string, newTag: string) => void;
  onSuggestShareWithTeam?: (teamId: string, teamName: string) => void;
}) {
  const { teams } = useTeams();
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [tagBeingRenamed, setTagBeingRenamed] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    setTagBeingRenamed(null);
    setRenameValue("");
    setShowAddTag(false);
    setNewTag("");
  }, [doc.id]);
  const eff = effectiveUiScope(doc, scopeOverrides);
  const scopeLocked = eff === "mirrors_source";
  const showScopeSelect = isAdmin && !oversightPrivate && !scopeLocked;
  const isPrivateDoc = eff === "private";
  const isOwner = effectivePrivateOwnerId(doc, currentUserOwnerId) === currentUserOwnerId;
  const canEditTags =
    isAdmin && !oversightPrivate && Boolean(onAddDocumentTag && onRemoveDocumentTag);
  const canRenameTags = Boolean(onRenameDocumentTag);
  const advisorCanSuggest =
    !isAdmin && isPrivateDoc && !oversightPrivate && isOwner && Boolean(onSuggestShareWithTeam);

  /** Advisor-layer doc widened via kv_scope / admin — API can still return `data_layer: advisor`. */
  const widenedFromPersonal =
    doc.data_layer === "advisor" && eff !== "private" && eff !== "mirrors_source";
  const widenedAccessLabel =
    eff === TEAM_EVERYONE_ID
      ? "agency-wide"
      : teams.find((t) => t.id === eff)?.name ?? "shared access";

  const ownerDeparted = doc.owner_departed === true;
  const formerContributorLabel = doc.uploaded_by_name?.trim() || "A former teammate";

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
          <p className="text-sm text-[rgba(245,245,245,0.5)] mt-0.5 flex flex-wrap items-center gap-2">
            {doc.file_type.toUpperCase()} · {(doc.file_size_kb / 1024).toFixed(2)} MB
            <IngestionStatusBadge status={doc.ingestion_status} />
          </p>
          </div>
        </div>

        <section>
          <h4 className="text-xs font-semibold uppercase text-[rgba(245,245,245,0.5)] mb-2">Source</h4>
          <div className="min-w-0 space-y-1.5">
            <p className="text-sm font-medium text-[#F5F5F5]">{doc.source_name}</p>
            <p className="text-xs text-[rgba(245,245,245,0.65)] leading-relaxed">{accessScopeLabel(doc)}</p>
            {(doc.source_type === DataSourceType.IntranetDocuments ||
              doc.source_type === DataSourceType.IntranetPages) && (
              <div className="flex items-start gap-1.5 mt-2 text-[10px] text-gray-500">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                <span>Not edited here — who can open it is determined in your intranet.</span>
              </div>
            )}
              {doc.is_wiki_page && (
                <p className="text-xs">
                <span className="px-2 py-0.5 rounded-md bg-[var(--muted-info-bg)] text-[var(--muted-info-text)] border border-[var(--muted-info-border)]">
                    Wiki Page
                  </span>
                  <span className="text-[rgba(245,245,245,0.45)] ml-2">HTML content (not a file upload)</span>
                </p>
              )}
            <div className="flex flex-col items-start gap-1 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-quaternary)]">
                  Access
                </span>
                {showScopeSelect ? (
                  <select
                    value={eff}
                    onChange={(e) => {
                      const v = e.target.value as "private" | string;
                      onScopeChange(v);
                      const label =
                        v === "private" ? "Private" : teams.find((t) => t.id === v)?.name ?? "team";
                      toast(`Access: ${label}`);
                    }}
                    className="text-[10px] bg-white/[0.03] border border-white/[0.06] rounded-lg px-2 py-1 text-gray-400 cursor-pointer hover:border-white/[0.1] outline-none max-w-[200px]"
                  >
                    <option value="private">Private</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                ) : scopeLocked ? (
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-gray-600 shrink-0" aria-hidden />
                    <ScopeBadge scope="mirrors_source" teams={teams} />
                  </div>
                ) : (
                  <ScopeBadge scope={eff} teams={teams} />
                )}
              </div>
              {advisorCanSuggest && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="text-[10px] text-blue-400/50 hover:text-blue-400/70 mt-0.5 text-left"
                    >
                      Suggest sharing…
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {teams.map((team) => (
                      <DropdownMenuItem
                        key={team.id}
                        className="text-xs text-gray-400 focus:text-white"
                        onClick={() => onSuggestShareWithTeam?.(team.id, team.name)}
                      >
                        {team.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            {doc.requires_access_review && isAdmin && offboardingRulesApplyToDocument(doc) ? (
              <div className="flex items-start gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/[0.08] px-3 py-2 text-[10px] text-rose-100/90">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400/90" aria-hidden />
                <span>
                  Flagged for <span className="font-medium text-rose-50">access review</span> (e.g. widened or leaver-tied
                  content). Confirm with legal/comms before treating as fully trusted in search and RAG; clear the flag in
                  your source system when review is complete.
                </span>
              </div>
            ) : null}
            {ownerDeparted && isPrivateDoc && isAdmin ? (
              <div className="flex items-start gap-1.5 rounded-lg border border-sky-500/25 bg-sky-500/[0.08] px-3 py-2 text-[10px] text-sky-100/90">
                <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sky-400/90" aria-hidden />
                <span>
                  Private to <span className="font-medium text-sky-50">{formerContributorLabel}</span>, who no longer has an
                  account. Retention, export, reassign, or removal follows your org policy — use access below to control who
                  can use this in Enable now.
                  {doc.departed_at ? (
                    <>
                      {" "}
                      Marked inactive {new Date(doc.departed_at).toLocaleDateString()}.
                    </>
                  ) : null}
                </span>
              </div>
            ) : null}
            {ownerDeparted && !isPrivateDoc ? (
              <div
                className={cn(
                  "flex items-start gap-1.5 rounded-lg border px-3 py-2 text-[10px]",
                  isAdmin
                    ? "border-violet-500/25 bg-violet-500/[0.08] text-violet-100/90"
                    : "border-white/10 bg-white/[0.04] text-gray-400"
                )}
              >
                <Info
                  className={cn(
                    "w-3.5 h-3.5 shrink-0 mt-0.5",
                    isAdmin ? "text-violet-400/90" : "text-gray-500"
                  )}
                  aria-hidden
                />
                <span>
                  {isAdmin ? (
                    <>
                      Originally contributed by{" "}
                      <span className="font-medium text-violet-50">{formerContributorLabel}</span>, who no longer has an
                      account. The file stays available under the access above; you can change or revoke it.
                    </>
                  ) : (
                    <>
                      Originally added by{" "}
                      <span className="font-medium text-gray-300">{formerContributorLabel}</span>, who is no longer with the
                      agency. You can still use it under the current access rules.
                    </>
                  )}
                  {doc.departed_at ? (
                    <> Marked inactive {new Date(doc.departed_at).toLocaleDateString()}.</>
                  ) : null}
                </span>
              </div>
            ) : null}
            {widenedFromPersonal && isOwner && !oversightPrivate && !ownerDeparted ? (
              <div className="flex items-start gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2 text-[10px] text-amber-100/90">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400/90" aria-hidden />
                <span>
                  This was private to you; access is now <span className="font-medium text-amber-50">{widenedAccessLabel}</span>.
                  Others with that access can open it.
                </span>
              </div>
            ) : null}
            {doc.ingested_at && (
              <p className="text-xs text-[rgba(245,245,245,0.5)] pt-1">
                Ingested {new Date(doc.ingested_at).toLocaleDateString()}
              </p>
            )}
            <p className="text-xs text-[rgba(245,245,245,0.5)]">
              Updated {new Date(doc.last_updated).toLocaleDateString()}
            </p>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-semibold uppercase text-[rgba(245,245,245,0.5)] mb-2">Tags</h4>
          <p className="text-[10px] text-gray-600 mb-2 leading-relaxed">
            Auto-tagged from folder paths
            {canEditTags ? (canRenameTags ? " · add, remove, or rename" : " · add or remove") : ""}
          </p>
          {doc.source_type === DataSourceType.Email || doc.source_type === DataSourceType.EmailTemplate ? (
            <p className="text-[11px] text-[var(--text-quaternary)]">
              No tags — email has no folder path to derive from.
            </p>
          ) : documentTags.length === 0 && !canEditTags ? (
            <p className="text-[11px] text-[var(--text-quaternary)]">No tags</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1">
                {documentTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded inline-flex items-center gap-1"
                  >
                    {tagBeingRenamed === tag ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        autoFocus
                        className="min-w-[4rem] max-w-[140px] text-[10px] bg-white/[0.06] border border-white/[0.12] rounded px-1 py-0.5 text-gray-300 outline-none focus:border-white/20"
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setTagBeingRenamed(null);
                            setRenameValue("");
                          }
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const t = renameValue.trim();
                            if (!t) {
                              toast("Tag name can’t be empty.");
                              return;
                            }
                            if (t === tag) {
                              setTagBeingRenamed(null);
                              return;
                            }
                            const taken = documentTags.some((x) => x !== tag && x === t);
                            if (taken) {
                              toast("A tag with that name already exists.");
                              return;
                            }
                            onRenameDocumentTag?.(tag, t);
                            setTagBeingRenamed(null);
                            setRenameValue("");
                          }
                        }}
                        onBlur={() => {
                          const t = renameValue.trim();
                          if (!t || t === tag) {
                            setTagBeingRenamed(null);
                            setRenameValue("");
                            return;
                          }
                          const taken = documentTags.some((x) => x !== tag && x === t);
                          if (taken) {
                            toast("A tag with that name already exists.");
                            setRenameValue(tag);
                            setTagBeingRenamed(null);
                            return;
                          }
                          onRenameDocumentTag?.(tag, t);
                          setTagBeingRenamed(null);
                          setRenameValue("");
                        }}
                      />
                    ) : (
                      <>
                        <span className="truncate max-w-[120px]" title={tag}>
                          {tag}
                        </span>
                        {canEditTags && (
                          <>
                            {canRenameTags && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTagBeingRenamed(tag);
                                  setRenameValue(tag);
                                }}
                                className="text-gray-600 hover:text-gray-400"
                                aria-label={`Rename tag ${tag}`}
                              >
                                <Pencil className="w-2.5 h-2.5" aria-hidden />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onRemoveDocumentTag?.(tag)}
                              className="text-gray-600 hover:text-gray-400 ml-0.5"
                              aria-label={`Remove tag ${tag}`}
                            >
                              <X className="w-2.5 h-2.5" aria-hidden />
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </span>
                ))}
                {canEditTags && (
                  <button
                    type="button"
                    onClick={() => setShowAddTag(true)}
                    className="text-[10px] text-gray-600 hover:text-gray-400 bg-white/[0.02] border border-dashed border-white/[0.06] px-2 py-0.5 rounded"
                  >
                    + Add tag
                  </button>
                )}
              </div>
              {canEditTags && showAddTag && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTag.trim()) {
                        onAddDocumentTag?.(newTag.trim());
                        setNewTag("");
                        setShowAddTag(false);
                      }
                      if (e.key === "Escape") {
                        setShowAddTag(false);
                        setNewTag("");
                      }
                    }}
                    placeholder="Tag name…"
                    autoFocus
                    className="text-[10px] bg-white/[0.03] border border-white/[0.06] rounded px-2 py-0.5 text-gray-300 outline-none w-28"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTag(false);
                      setNewTag("");
                    }}
                    className="text-[10px] text-gray-600 hover:text-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <section className="flex flex-wrap gap-2">
          {doc.url ? (
            <Button variant="outline" size="sm" className="border-white/10 text-[#F5F5F5]" asChild>
              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} className="mr-1" /> View Original
              </a>
            </Button>
          ) : null}
        {canExportDocuments ? (
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-[#F5F5F5]"
            onClick={() => toast("Download started (demo)")}
          >
            <Download size={14} className="mr-1" /> Download
          </Button>
        ) : null}
        </section>
      </div>
  );
}
