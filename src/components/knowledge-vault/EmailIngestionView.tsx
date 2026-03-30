"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ExternalLink,
  FileText,
  Image,
  Info,
  Mail,
  Paperclip,
  Search,
  Share2,
  Table,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { useKnowledgeVaultEmails } from "@/contexts/KnowledgeVaultEmailContext";
import { useToast } from "@/contexts/ToastContext";
import type { EmailAttachment, EmailIngestion } from "@/types/email-ingestion";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonRow, Spinner } from "@/components/ui/SkeletonPatterns";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import { ShareWithTeamDropdown } from "@/components/ui/ShareWithTeamDropdown";
import { MOCK_TEAMS } from "@/lib/teamsMock";

type ListFilter = "all" | "recent" | "unprocessed";

type Panel =
  | { kind: "email"; id: string }
  | { kind: "attachment"; emailId: string; attachmentId: string }
  | null;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatReceived(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function withinLastDays(iso: string, days: number): boolean {
  const t = new Date(iso).getTime();
  return Date.now() - t < days * 86400000;
}

function getAttachmentIcon(mimeType: string) {
  if (mimeType.startsWith("image/"))
    return <Image className="w-3.5 h-3.5 text-[var(--muted-info-text)]" aria-hidden />;
  if (mimeType === "application/pdf")
    return <FileText className="w-3.5 h-3.5 text-[var(--muted-error-text)]" aria-hidden />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return <Table className="w-3.5 h-3.5 text-[var(--muted-success-text)]" aria-hidden />;
  if (mimeType.includes("document") || mimeType.includes("word"))
    return <FileText className="w-3.5 h-3.5 text-[var(--muted-info-text)]" aria-hidden />;
  return <Paperclip className="w-3.5 h-3.5 text-muted-foreground/90" aria-hidden />;
}

type EmailIngestionViewProps = {
  loading?: boolean;
};

export default function EmailIngestionView({ loading = false }: EmailIngestionViewProps) {
  const router = useRouter();
  const { kvViewAsAdmin } = useUser();
  const toast = useToast();
  const {
    emails,
    unprocessedCount,
    shareEmailWithTeam,
    shareAttachmentWithTeam,
    markEmailProcessed,
    addEmailTag,
    removeEmailTag,
    addAttachmentTag,
    removeAttachmentTag,
  } = useKnowledgeVaultEmails();

  const isAdmin = kvViewAsAdmin;

  const [filter, setFilter] = useState<ListFilter>("all");
  const [panel, setPanel] = useState<Panel>(null);
  const [tagInputEmail, setTagInputEmail] = useState(false);
  const [tagInputAtt, setTagInputAtt] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [markingReview, setMarkingReview] = useState(false);

  const teamShareToast = (teamId: string) => {
    const t = MOCK_TEAMS.find((x) => x.id === teamId);
    toast(`Shared with ${t?.name ?? "team"}`);
  };

  const filtered = useMemo(() => {
    let list = emails;
    if (filter === "recent") list = list.filter((e) => withinLastDays(e.receivedAt, 7));
    if (filter === "unprocessed") list = list.filter((e) => e.status === "unprocessed");
    return list;
  }, [emails, filter]);

  const emailForPanel = panel?.kind === "email" ? emails.find((e) => e.id === panel.id) : undefined;
  const attachmentPanel =
    panel?.kind === "attachment"
      ? (() => {
          const e = emails.find((x) => x.id === panel.emailId);
          const a = e?.attachments.find((x) => x.id === panel.attachmentId);
          return e && a ? { email: e, attachment: a } : undefined;
        })()
      : undefined;

  const openEmail = (e: EmailIngestion) => {
    setPanel({ kind: "email", id: e.id });
    setTagInputEmail(false);
    setTagInputAtt(false);
  };

  const openAttachment = (email: EmailIngestion, att: EmailAttachment) => {
    setPanel({ kind: "attachment", emailId: email.id, attachmentId: att.id });
    setTagInputEmail(false);
    setTagInputAtt(false);
  };

  const filterBar = (
    <div className="space-y-2 mb-2">
    <div className="flex items-center gap-2 flex-wrap">
      {(["all", "recent", "unprocessed"] as const).map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => setFilter(f)}
          className={cn(
            "text-2xs px-3 py-1.5 rounded-lg transition-colors",
            filter === f
              ? "bg-[var(--muted-info-bg)] text-[var(--muted-info-text)] border border-[var(--muted-info-border)]"
              : "text-muted-foreground hover:text-foreground border border-transparent"
          )}
        >
          {f === "all" ? "All" : f === "recent" ? "Last 7 days" : "Unprocessed"}
          {f === "unprocessed" && unprocessedCount > 0 && (
            <span className="ml-1 text-[var(--muted-info-text)]">{unprocessedCount}</span>
          )}
        </button>
      ))}
    </div>
      {isAdmin ? (
        <p className="text-2xs text-muted-foreground/70 flex items-start gap-1.5 leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" aria-hidden />
          Thread and attachment access changes are recorded in the session log below (scroll down).
        </p>
      ) : null}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-2 min-h-[480px]">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card min-h-[400px] flex items-center justify-center">
        <EmptyState
          icon={Mail}
          title="No emails yet"
          description="Forward any email to your agency's Enable address and it will appear here."
          action={{
            label: "View forwarding address →",
            onClick: () => router.push("/dashboard/settings/integrations"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[480px] min-w-0">
      <div className="flex-1 min-w-0 space-y-4 pr-0 md:pr-4">
        {filterBar}

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-8">
            <EmptyState
              icon={Search}
              title="No emails match this filter"
              description="Try broadening the date range or switch to All."
            />
          </div>
        ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              role="button"
              tabIndex={0}
              onClick={() => openEmail(entry)}
              onKeyDown={(ev) => ev.key === "Enter" && openEmail(entry)}
              className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                {entry.attachments.length > 0 ? (
                  <Paperclip className="w-3.5 h-3.5 text-[var(--muted-info-text)]" />
                ) : (
                  <Mail className="w-3.5 h-3.5 text-[var(--muted-info-text)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white truncate">{entry.subject}</span>
                  {entry.status === "unprocessed" && (
                    <span className="w-1.5 h-1.5 bg-[color-mix(in_srgb,var(--color-info)_72%,transparent)] rounded-full flex-shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {entry.senderName} · {formatReceived(entry.receivedAt)}
                </span>
              </div>
              {entry.attachments.length > 0 && (
                <span className="text-2xs text-muted-foreground bg-white/[0.03] px-2 py-1 rounded flex-shrink-0">
                  {entry.attachments.length} file{entry.attachments.length > 1 ? "s" : ""}
                </span>
              )}
              <div className="hidden sm:flex gap-1 flex-shrink-0 max-w-[120px] flex-wrap justify-end">
                {entry.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-2xs text-muted-foreground bg-white/[0.03] px-1.5 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <ScopeBadge scope={entry.scope} teams={MOCK_TEAMS} className="flex-shrink-0" />
            </div>
          ))}
        </div>
        )}
      </div>

      {(emailForPanel || attachmentPanel) && (
        <>
        <aside className="hidden md:flex w-[380px] shrink-0 flex-col border-l border-border bg-inset overflow-hidden">
          <div className="shrink-0 flex items-center justify-between p-3 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground/90">Details</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPanel(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {emailForPanel && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-[var(--muted-info-text)]" />
                    <span className="text-2xs text-[var(--muted-info-text)] uppercase tracking-wider font-semibold">
                      Forwarded Email
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-white">{emailForPanel.subject}</h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground/90">
                    <span>From: {emailForPanel.senderName}</span>
                    <span className="text-muted-foreground/70">·</span>
                    <span className="text-muted-foreground">{formatReceived(emailForPanel.receivedAt)}</span>
                    <span className="text-muted-foreground/70">·</span>
                    <span className="text-muted-foreground">
                      Forwarded by {emailForPanel.forwardedByName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <ScopeBadge scope={emailForPanel.scope} teams={MOCK_TEAMS} />
                  {emailForPanel.scope === "private" && isAdmin && (
                    <ShareWithTeamDropdown
                      teams={MOCK_TEAMS}
                      onSelect={(teamId) => {
                        shareEmailWithTeam(emailForPanel.id, teamId);
                        teamShareToast(teamId);
                      }}
                      trigger={
                        <button
                          type="button"
                          className="text-2xs text-muted-foreground hover:text-[var(--muted-info-text)] transition-colors flex items-center gap-1"
                        >
                          <Share2 className="w-3 h-3" />
                          Share with…
                        </button>
                      }
                    />
                  )}
                </div>

                <div>
                  <span className="text-2xs text-muted-foreground/70 uppercase tracking-wider">Tags</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {emailForPanel.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-2xs text-muted-foreground/90 bg-white/[0.04] px-2 py-1 rounded-lg flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeEmailTag(emailForPanel.id, tag)}
                          className="text-muted-foreground/70 hover:text-muted-foreground"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    {!tagInputEmail ? (
                      <button
                        type="button"
                        onClick={() => setTagInputEmail(true)}
                        className="text-2xs text-muted-foreground/70 hover:text-muted-foreground px-2 py-1"
                      >
                        + Add tag
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          value={tagDraft}
                          onChange={(e) => setTagDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              addEmailTag(emailForPanel.id, tagDraft);
                              setTagDraft("");
                              setTagInputEmail(false);
                            }
                          }}
                          className="text-2xs bg-white/[0.03] border border-border rounded px-2 py-1 w-28 text-foreground/88 outline-none"
                          placeholder="tag"
                        />
                        <button
                          type="button"
                          className="text-2xs text-[var(--muted-info-text)]"
                          onClick={() => {
                            addEmailTag(emailForPanel.id, tagDraft);
                            setTagDraft("");
                            setTagInputEmail(false);
                          }}
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-2xs text-muted-foreground/70 uppercase tracking-wider mb-2 block">
                    Email Content
                  </span>
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 max-h-48 overflow-y-auto">
                    <p className="text-xs text-foreground/88 leading-relaxed whitespace-pre-wrap">
                      {emailForPanel.bodyText}
                    </p>
                  </div>
                </div>

                {emailForPanel.attachments.length > 0 && (
                  <div>
                    <span className="text-2xs text-muted-foreground/70 uppercase tracking-wider mb-2 block">
                      Attachments ({emailForPanel.attachments.length})
                    </span>
                    <div className="space-y-2">
                      {emailForPanel.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:bg-white/[0.04] transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => openAttachment(emailForPanel, att)}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                              {getAttachmentIcon(att.mimeType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs text-white truncate block">{att.filename}</span>
                              <span className="text-2xs text-muted-foreground/70">{formatFileSize(att.size)}</span>
                            </div>
                          </button>
                          <ScopeBadge scope={att.scope} teams={MOCK_TEAMS} className="flex-shrink-0" />
                          {att.scope === "private" && isAdmin && (
                            <ShareWithTeamDropdown
                              teams={MOCK_TEAMS}
                              onSelect={(teamId) => {
                                shareAttachmentWithTeam(att.id, teamId);
                                teamShareToast(teamId);
                              }}
                              trigger={
                                <button
                                  type="button"
                                  className="text-2xs text-muted-foreground/70 hover:text-[var(--muted-info-text)] transition-colors flex-shrink-0"
                                  title="Share with…"
                                >
                                  <Share2 className="w-3 h-3" />
                                </button>
                              }
                            />
                          )}
                          <button
                            type="button"
                            className="text-muted-foreground/70 hover:text-muted-foreground flex-shrink-0 p-0.5"
                            aria-label="Open attachment details"
                            onClick={() => openAttachment(emailForPanel, att)}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {emailForPanel.status === "unprocessed" && (
                  <button
                    type="button"
                    disabled={markingReview}
                    onClick={() => {
                      setMarkingReview(true);
                      window.setTimeout(() => {
                        markEmailProcessed(emailForPanel.id);
                        toast("Marked as reviewed");
                        setMarkingReview(false);
                      }, 280);
                    }}
                    className="w-full mt-2 bg-white/[0.06] text-[var(--muted-info-text)] hover:bg-white/[0.1] text-xs font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {markingReview ? <Spinner size="md" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Mark as reviewed
                  </button>
                )}
              </>
            )}

            {attachmentPanel && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Paperclip className="w-4 h-4 text-[var(--muted-info-text)]" />
                    <span className="text-2xs text-[var(--muted-info-text)] uppercase tracking-wider font-semibold">
                      Email Attachment
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-white">{attachmentPanel.attachment.filename}</h2>
                  <button
                    type="button"
                    onClick={() => setPanel({ kind: "email", id: attachmentPanel.email.id })}
                    className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-[var(--muted-info-text)] transition-colors text-left"
                  >
                    <Mail className="w-3 h-3 shrink-0" />
                    From: &quot;{attachmentPanel.email.subject}&quot;
                  </button>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <ScopeBadge scope={attachmentPanel.attachment.scope} teams={MOCK_TEAMS} />
                  {attachmentPanel.attachment.scope === "private" && isAdmin && (
                    <ShareWithTeamDropdown
                      teams={MOCK_TEAMS}
                      onSelect={(teamId) => {
                        shareAttachmentWithTeam(attachmentPanel.attachment.id, teamId);
                        teamShareToast(teamId);
                      }}
                      trigger={
                        <button
                          type="button"
                          className="text-2xs text-muted-foreground hover:text-[var(--muted-info-text)] transition-colors flex items-center gap-1"
                        >
                          <Share2 className="w-3 h-3" />
                          Share with…
                        </button>
                      }
                    />
                  )}
                </div>

                <div>
                  <span className="text-2xs text-muted-foreground/70 uppercase tracking-wider">Tags</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(attachmentPanel.attachment.tags ?? []).map((tag) => (
                      <span
                        key={tag}
                        className="text-2xs text-muted-foreground/90 bg-white/[0.04] px-2 py-1 rounded-lg flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() =>
                            removeAttachmentTag(
                              attachmentPanel.email.id,
                              attachmentPanel.attachment.id,
                              tag
                            )
                          }
                          className="text-muted-foreground/70 hover:text-muted-foreground"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    {!tagInputAtt ? (
                      <button
                        type="button"
                        onClick={() => setTagInputAtt(true)}
                        className="text-2xs text-muted-foreground/70 hover:text-muted-foreground px-2 py-1"
                      >
                        + Add tag
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          value={tagDraft}
                          onChange={(e) => setTagDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              addAttachmentTag(
                                attachmentPanel.email.id,
                                attachmentPanel.attachment.id,
                                tagDraft
                              );
                              setTagDraft("");
                              setTagInputAtt(false);
                            }
                          }}
                          className="text-2xs bg-white/[0.03] border border-border rounded px-2 py-1 w-28 text-foreground/88 outline-none"
                          placeholder="tag"
                        />
                        <button
                          type="button"
                          className="text-2xs text-[var(--muted-info-text)]"
                          onClick={() => {
                            addAttachmentTag(
                              attachmentPanel.email.id,
                              attachmentPanel.attachment.id,
                              tagDraft
                            );
                            setTagDraft("");
                            setTagInputAtt(false);
                          }}
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 text-center">
                  {attachmentPanel.attachment.mimeType === "application/pdf" ? (
                    <div className="text-xs text-muted-foreground">
                      <FileText className="w-8 h-8 text-muted-foreground/70 mx-auto mb-2" />
                      <p>PDF Preview</p>
                      <p className="text-2xs text-muted-foreground/70 mt-1">
                        {attachmentPanel.attachment.filename} ·{" "}
                        {formatFileSize(attachmentPanel.attachment.size)}
                      </p>
                    </div>
                  ) : attachmentPanel.attachment.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={attachmentPanel.attachment.url}
                      alt={attachmentPanel.attachment.filename}
                      className="max-w-full rounded-lg"
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      <Paperclip className="w-8 h-8 text-muted-foreground/70 mx-auto mb-2" />
                      <p>{attachmentPanel.attachment.filename}</p>
                      <p className="text-2xs text-muted-foreground/70 mt-1">
                        {formatFileSize(attachmentPanel.attachment.size)}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </aside>

        <div className="md:hidden fixed inset-0 z-50 bg-background flex flex-col">
          <div className="shrink-0 flex items-center justify-between p-3 border-b border-border">
            <span className="text-sm font-medium text-white">Details</span>
            <Button variant="ghost" size="icon" onClick={() => setPanel(null)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* same blocks as desktop — duplicated structure kept in sync with aside above */}
            {emailForPanel && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-[var(--muted-info-text)]" />
                    <span className="text-2xs text-[var(--muted-info-text)] uppercase tracking-wider font-semibold">
                      Forwarded Email
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-white">{emailForPanel.subject}</h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground/90">
                    <span>From: {emailForPanel.senderName}</span>
                    <span className="text-muted-foreground/70">·</span>
                    <span className="text-muted-foreground">{formatReceived(emailForPanel.receivedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <ScopeBadge scope={emailForPanel.scope} teams={MOCK_TEAMS} />
                  {emailForPanel.scope === "private" && isAdmin && (
                    <ShareWithTeamDropdown
                      teams={MOCK_TEAMS}
                      onSelect={(teamId) => {
                        shareEmailWithTeam(emailForPanel.id, teamId);
                        teamShareToast(teamId);
                      }}
                      trigger={
                        <button
                          type="button"
                          className="text-2xs text-muted-foreground hover:text-[var(--muted-info-text)] transition-colors flex items-center gap-1"
                        >
                          <Share2 className="w-3 h-3" />
                          Share with…
                        </button>
                      }
                    />
                  )}
                </div>
                <div>
                  <span className="text-2xs text-muted-foreground/70 uppercase tracking-wider">Email Content</span>
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 mt-2 max-h-64 overflow-y-auto">
                    <p className="text-xs text-foreground/88 leading-relaxed whitespace-pre-wrap">
                      {emailForPanel.bodyText}
                    </p>
                  </div>
                </div>
                {emailForPanel.status === "unprocessed" && (
                  <button
                    type="button"
                    disabled={markingReview}
                    onClick={() => {
                      setMarkingReview(true);
                      window.setTimeout(() => {
                        markEmailProcessed(emailForPanel.id);
                        toast("Marked as reviewed");
                        setMarkingReview(false);
                      }, 280);
                    }}
                    className="w-full bg-white/[0.06] text-[var(--muted-info-text)] hover:bg-white/[0.1] text-xs font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {markingReview ? <Spinner size="md" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Mark as reviewed
                  </button>
                )}
              </>
            )}
            {attachmentPanel && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Paperclip className="w-4 h-4 text-[var(--muted-info-text)]" />
                    <span className="text-2xs text-[var(--muted-info-text)] uppercase tracking-wider font-semibold">
                      Email Attachment
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-white">{attachmentPanel.attachment.filename}</h2>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 text-center text-xs text-muted-foreground">
                  Preview / download — see desktop for full controls.
                </div>
              </>
            )}
          </div>
        </div>
        </>
      )}
    </div>
  );
}
