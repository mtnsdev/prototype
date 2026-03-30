"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Check,
  FileText,
  Info,
  Mail,
  Paperclip,
  X,
} from "lucide-react";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import { useTeams } from "@/contexts/TeamsContext";
import { TEAM_EVERYONE_ID } from "@/types/teams";
import { cn } from "@/lib/utils";
import { PageSearchField } from "@/components/ui/page-search-field";
import { useUser } from "@/contexts/UserContext";
import { useKnowledgeVaultEmails } from "@/contexts/KnowledgeVaultEmailContext";
import { useToast } from "@/contexts/ToastContext";
import type { EmailIngestion } from "@/types/email-ingestion";
import { AGENCY_EMAIL_INGEST_ADDRESS } from "@/config/emailIngest";
import {
  listSurfaceClass,
  listScrollClass,
  listTableClass,
  listTheadRowClass,
  listTbodyRowClass,
} from "@/lib/list-ui";

const TOTAL_EMAILS_DEMO = 47;
const ATTACHMENTS_INDEXED_DEMO = 82;

type FilterPill = "All" | "Last 7 days" | "Unprocessed";

function withinLastDays(iso: string, days: number): boolean {
  const t = new Date(iso).getTime();
  return Date.now() - t < days * 86400000;
}

function formatTableDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDetailDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function mimeToLabel(mime: string): string {
  if (mime === "application/pdf") return "PDF";
  if (mime.includes("spreadsheet")) return "Sheet";
  return mime.split("/").pop()?.toUpperCase() ?? "File";
}

export default function EmailIngestionPage() {
  const { user, kvViewAsAdmin } = useUser();
  const { teams } = useTeams();
  const toast = useToast();
  const {
    emails,
    unprocessedCount,
    shareEmailWithTeam,
    markEmailProcessed,
    addEmailTag,
    removeEmailTag,
  } = useKnowledgeVaultEmails();

  const isAdmin =
    kvViewAsAdmin || user?.role === "admin" || user?.role === "agency_admin";

  const [activeFilter, setActiveFilter] = useState<FilterPill>("All");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddTag, setShowAddTag] = useState(false);
  const [tagDraft, setTagDraft] = useState("");

  const selected = useMemo(
    () => (selectedId ? emails.find((e) => e.id === selectedId) ?? null : null),
    [emails, selectedId]
  );

  const filtered = useMemo(() => {
    let list = emails;
    if (activeFilter === "Unprocessed") list = list.filter((e) => e.status === "unprocessed");
    if (activeFilter === "Last 7 days") list = list.filter((e) => withinLastDays(e.receivedAt, 7));
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.senderName.toLowerCase().includes(q) ||
          e.senderEmail.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [emails, activeFilter, search]);

  const copyAddress = useCallback(() => {
    void navigator.clipboard?.writeText(AGENCY_EMAIL_INGEST_ADDRESS);
    toast({ title: "Email address copied", tone: "success" });
  }, [toast]);

  const markReviewed = useCallback(
    (id: string) => {
      markEmailProcessed(id);
      toast({ title: "Marked as reviewed", tone: "success" });
    },
    [markEmailProcessed, toast]
  );

  const updateScope = useCallback(
    (id: string, scope: string) => {
      shareEmailWithTeam(id, scope);
      toast({ title: "Scope updated", tone: "success" });
    },
    [shareEmailWithTeam, toast]
  );

  const removeTag = useCallback(
    (emailId: string, tag: string) => {
      removeEmailTag(emailId, tag);
    },
    [removeEmailTag]
  );

  const commitTag = useCallback(
    (emailId: string) => {
      const t = tagDraft.trim();
      if (!t) return;
      addEmailTag(emailId, t);
      setTagDraft("");
      setShowAddTag(false);
    },
    [addEmailTag, tagDraft]
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between px-6 py-4 border-b border-border">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-white">Email Ingestion</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Forward emails to your agency address. Content and attachments land in the Knowledge Vault.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-white/[0.02] rounded-lg px-4 py-2 border border-white/[0.04]">
            <Mail className="w-4 h-4 text-sky-400 shrink-0" />
            <code className="text-sm text-foreground/88 truncate max-w-[min(100vw-8rem,22rem)]">
              {AGENCY_EMAIL_INGEST_ADDRESS}
            </code>
            <button
              type="button"
              onClick={copyAddress}
              className="text-xs text-blue-400/50 hover:text-blue-400/70 ml-2 shrink-0"
            >
              Copy
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto min-h-0">
        <div className="px-6 py-6 max-w-[1200px]">

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
              <span className="text-2xs text-muted-foreground uppercase tracking-wider">Total Emails</span>
              <div className="text-2xl font-semibold text-white mt-1">{TOTAL_EMAILS_DEMO}</div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
              <span className="text-2xs text-muted-foreground uppercase tracking-wider">Unprocessed</span>
              <div className="text-2xl font-semibold text-[var(--color-warning)] mt-1">{unprocessedCount}</div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
              <span className="text-2xs text-muted-foreground uppercase tracking-wider">Attachments Indexed</span>
              <div className="text-2xl font-semibold text-emerald-400 mt-1">{ATTACHMENTS_INDEXED_DEMO}</div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
            <div className="flex flex-wrap gap-1">
              {(["All", "Last 7 days", "Unprocessed"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-2xs font-medium transition-colors",
                    activeFilter === filter
                      ? "border-[rgba(201,169,110,0.25)] bg-[rgba(201,169,110,0.08)] text-brand-cta"
                      : "border-transparent text-muted-foreground hover:text-muted-foreground"
                  )}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="hidden sm:block flex-1" />
            <PageSearchField
              className="w-full sm:w-64 sm:max-w-xs"
              placeholder="Search emails…"
              aria-label="Search emails"
              value={search}
              onChange={setSearch}
            />
          </div>

          <div className={cn(listSurfaceClass, listScrollClass, "overflow-hidden")}>
            <table className={listTableClass("min-w-[800px]")}>
                <thead>
                  <tr className={cn(listTheadRowClass, "text-2xs uppercase tracking-wider text-muted-foreground/80")}>
                    <th className="text-left py-3 pl-4">Subject</th>
                    <th className="text-left py-3">From</th>
                    <th className="text-left py-3">Date</th>
                    <th className="text-left py-3">Attachments</th>
                    <th className="text-left py-3">Tags</th>
                    <th className="text-left py-3">Access</th>
                    <th className="text-left py-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((email) => (
                    <tr
                      key={email.id}
                      onClick={() => setSelectedId(email.id)}
                      className={cn(
                        listTbodyRowClass,
                        "cursor-pointer",
                        email.status === "unprocessed" && "bg-amber-500/[0.02]"
                      )}
                    >
                      <td className="py-3 pl-4">
                        <div className="flex items-center gap-2">
                          {email.status === "unprocessed" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          )}
                          <span className="text-sm text-foreground truncate max-w-[300px]">{email.subject}</span>
                          {email.attachments.length > 0 && (
                            <Paperclip className="w-3 h-3 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-sm text-muted-foreground/90">{email.senderName}</td>
                      <td className="py-3 text-sm text-muted-foreground">{formatTableDate(email.receivedAt)}</td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {email.attachments.length || "—"}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {email.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-2xs text-muted-foreground bg-white/[0.04] px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3">
                        <ScopeBadge scope={email.scope} teams={teams} />
                      </td>
                      <td className="py-3 pr-4">
                        {email.status === "unprocessed" ? (
                          <span className="text-2xs text-[var(--color-warning)]">Unprocessed</span>
                        ) : (
                          <span className="text-2xs text-muted-foreground">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
            <p className="px-4 py-2.5 text-2xs text-muted-foreground/70 border-t border-white/[0.06] flex items-start gap-2 leading-relaxed">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" aria-hidden />
              <span>
                Changing email or attachment access is recorded in the Knowledge Vault session log. If you use the email
                tab inside Knowledge Vault, scroll to the bottom on that page. From here, open{" "}
                <Link href="/dashboard/knowledge-vault" className="text-muted-foreground/90 underline-offset-2 hover:underline">
                  Knowledge Vault
                </Link>{" "}
                and expand{" "}
                <span className="text-muted-foreground/90 font-medium">Access change log — vault &amp; email</span>.
              </span>
            </p>
          </div>
        </div>
      </div>

      {selected && (
        <>
          <button
            type="button"
            className="fixed inset-0 bg-black/50 z-40"
            aria-label="Close panel"
            onClick={() => setSelectedId(null)}
          />
          <aside className="fixed right-0 top-0 h-full w-full max-w-[440px] bg-background border-l border-border z-50 overflow-y-auto p-6 shadow-2xl">
            <EmailDetailBody
              email={selected}
              isAdmin={isAdmin}
              showAddTag={showAddTag}
              tagDraft={tagDraft}
              onClose={() => {
                setSelectedId(null);
                setShowAddTag(false);
                setTagDraft("");
              }}
              onMarkReviewed={() => markReviewed(selected.id)}
              onScopeChange={(v) => updateScope(selected.id, v)}
              onRemoveTag={(tag) => removeTag(selected.id, tag)}
              onShowAddTag={() => setShowAddTag(true)}
              onTagDraftChange={setTagDraft}
              onCommitTag={() => commitTag(selected.id)}
              onCancelTag={() => {
                setShowAddTag(false);
                setTagDraft("");
              }}
            />
          </aside>
        </>
      )}
    </div>
  );
}

function EmailDetailBody({
  email,
  isAdmin,
  showAddTag,
  tagDraft,
  onClose,
  onMarkReviewed,
  onScopeChange,
  onRemoveTag,
  onShowAddTag,
  onTagDraftChange,
  onCommitTag,
  onCancelTag,
}: {
  email: EmailIngestion;
  isAdmin: boolean;
  showAddTag: boolean;
  tagDraft: string;
  onClose: () => void;
  onMarkReviewed: () => void;
  onScopeChange: (v: string) => void;
  onRemoveTag: (tag: string) => void;
  onShowAddTag: () => void;
  onTagDraftChange: (v: string) => void;
  onCommitTag: () => void;
  onCancelTag: () => void;
}) {
  const { teams } = useTeams();
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-white">Email Details</h2>
        <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06]" aria-label="Close">
          <X className="w-4 h-4 text-muted-foreground/90" />
        </button>
      </div>

      <h3 className="text-base text-white mb-1">{email.subject}</h3>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-4">
        <span>{email.senderName}</span>
        <span>·</span>
        <span>{email.senderEmail}</span>
        <span>·</span>
        <span>{formatTableDate(email.receivedAt)}</span>
      </div>

      <div className="mb-4">
        <span className="text-2xs text-muted-foreground/70 uppercase tracking-wider">Access</span>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <ScopeBadge scope={email.scope} teams={teams} />
          {isAdmin && (
            <select
              value={email.scope}
              onChange={(e) => onScopeChange(e.target.value)}
              className="text-xs bg-white/[0.04] border border-border rounded-lg px-2 py-1 text-foreground/88 outline-none"
            >
              <option value="private">Private</option>
              {teams.filter((t) => t.id !== TEAM_EVERYONE_ID).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
              <option value={TEAM_EVERYONE_ID}>Everyone</option>
            </select>
          )}
        </div>
      </div>

      <div className="mb-4">
        <span className="text-2xs text-muted-foreground/70 uppercase tracking-wider">Tags</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {email.tags.map((tag) => (
            <span
              key={tag}
              className="text-2xs text-muted-foreground bg-white/[0.04] px-2 py-0.5 rounded flex items-center gap-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="text-muted-foreground/70 hover:text-muted-foreground"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onShowAddTag}
            className="text-2xs text-muted-foreground/70 hover:text-muted-foreground bg-white/[0.02] border border-dashed border-border px-2 py-0.5 rounded"
          >
            + Add tag
          </button>
        </div>
        {showAddTag && (
          <div className="flex items-center gap-1.5 mt-2">
            <input
              value={tagDraft}
              onChange={(e) => onTagDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onCommitTag();
                if (e.key === "Escape") onCancelTag();
              }}
              placeholder="Tag…"
              autoFocus
              className="text-2xs bg-white/[0.03] border border-border rounded px-2 py-0.5 text-foreground/88 outline-none w-28"
            />
            <button type="button" onClick={onCancelTag} className="text-2xs text-muted-foreground/70">
              Cancel
            </button>
          </div>
        )}
      </div>

      {email.status === "unprocessed" && (
        <button
          type="button"
          onClick={onMarkReviewed}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-4"
        >
          <Check className="w-3.5 h-3.5" />
          Mark as reviewed
        </button>
      )}

      <div className="mb-6">
        <span className="text-2xs text-muted-foreground/70 uppercase tracking-wider">Email Body</span>
        <div className="mt-2 bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 text-sm text-foreground/88 leading-relaxed whitespace-pre-wrap">
          {email.bodyText}
        </div>
      </div>

      {email.attachments.length > 0 && (
        <div>
          <span className="text-2xs text-muted-foreground/70 uppercase tracking-wider">
            Attachments ({email.attachments.length})
          </span>
          <div className="mt-2 space-y-2">
            {email.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 hover:bg-white/[0.03] cursor-default"
              >
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-white truncate block">{att.filename}</span>
                  <span className="text-2xs text-muted-foreground">
                    {formatFileSize(att.size)} · {mimeToLabel(att.mimeType)}
                  </span>
                </div>
                <ScopeBadge scope={att.scope} teams={teams} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-white/[0.04]">
        <span className="text-2xs text-muted-foreground/70 uppercase tracking-wider">Metadata</span>
        {email.forwarder_departed ? (
          <div className="mt-2 mb-2 flex items-start gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-2xs text-amber-100/90">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--color-warning)]/90" aria-hidden />
            <span>
              Forwarder <span className="font-medium text-amber-50">{email.forwardedByName}</span> no longer has an
              account. Vault access and retention follow the same rules as other leaver content; confirm attachment access
              with an admin if unsure.
            </span>
          </div>
        ) : null}
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <div>Forwarded by: {email.forwardedByName}</div>
          <div>Received: {formatDetailDateTime(email.receivedAt)}</div>
          <div>
            Indexed:{" "}
            {email.processedAt
              ? formatDetailDateTime(email.processedAt)
              : formatDetailDateTime(email.receivedAt)}
          </div>
        </div>
      </div>
    </>
  );
}
