"use client";

import React from "react";
import { AlertTriangle, ThumbsUp, ThumbsDown, MessageSquare, LayoutGrid, Shield } from "lucide-react";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import { useTeamsOptional } from "@/contexts/TeamsContext";
import { INITIAL_MOCK_TEAMS } from "@/lib/teamsMock";
import { TEAM_EVERYONE_ID, type Team } from "@/types/teams";
import { AnswerWithCitations, getOrderedCitations } from "./AnswerWithCitations";
import type { Citation, Message } from "./types";

function KnowledgeCitationFooter({
  answer,
  citations,
  teams,
  onCitationClick,
}: {
  answer: string;
  citations: Citation[];
  teams: Team[];
  onCitationClick: (filename: string, pageNumber: number | string, pdfPath?: string) => void;
}) {
  if (!citations.length) return null;
  const ordered = (() => {
    const o = getOrderedCitations(answer, citations);
    return o.length > 0 ? o : citations;
  })();

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-2">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground/75">
        Sources
      </div>
      <ul className="space-y-2">
        {ordered.map((c, i) => (
          <li key={c.chunk_id ?? `${c.filename}-${c.page_number}-${i}`}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCitationClick(c.filename, c.page_number, c.pdf_path);
              }}
              className="w-full text-left rounded-lg border border-border bg-[rgba(255,255,255,0.03)] px-3 py-2 hover:border-[rgba(174,133,80,0.35)] transition-colors"
            >
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <ScopeBadge scope={c.kv_scope ?? TEAM_EVERYONE_ID} teams={teams} />
                {c.is_other_user_private ? (
                  <span
                    className="inline-flex text-[rgba(160,140,180,0.65)]"
                    title="Private document from another user"
                  >
                    <Shield className="w-3.5 h-3.5" aria-hidden />
                  </span>
                ) : null}
                <span className="text-compact font-medium text-foreground">{c.filename}</span>
                <span className="text-xs text-muted-foreground/75">p.{c.page_number}</span>
              </div>
              {c.excerpt ? (
                <p className="text-sm text-muted-foreground/75 line-clamp-2">{c.excerpt}</p>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

type BotMessageCardProps = {
  message: Message;
  messageIndex: number;
  currentSessionId: number | null;
  rightPanelMessageIndex: number | null;
  rightPanelMode: "places" | "sources" | "knowledge" | null;
  hintPulseSeen: Set<number>;
  feedbackSubmitting: number | null;
  onCitationClick: (filename: string, pageNumber: number | string, pdfPath?: string) => void;
  onViewPlaces: (index: number) => void;
  onViewSources: (index: number) => void;
  onViewKnowledge: (index: number) => void;
  onCitationHover?: (displayNumber: number | null) => void;
  onCloseRightPanel: () => void;
  onSubmitFeedback: (messageId: number, update: { rating?: number | null; comment?: string | null }) => void;
  onOpenFeedbackComment: (messageId: number) => void;
};

export function BotMessageCard({
  message,
  messageIndex,
  currentSessionId,
  rightPanelMessageIndex,
  rightPanelMode,
  hintPulseSeen,
  feedbackSubmitting,
  onCitationClick,
  onViewPlaces,
  onViewSources,
  onViewKnowledge,
  onCitationHover,
  onCloseRightPanel,
  onSubmitFeedback,
  onOpenFeedbackComment,
}: BotMessageCardProps) {
  const teams = useTeamsOptional()?.teams ?? INITIAL_MOCK_TEAMS;

  if (message.role !== "bot" || !message.response) return null;

  const hasCards = (message.response?.cards?.length ?? 0) > 0;
  const hasWebCitations = (message.response?.web_citations?.length ?? 0) > 0;
  const hasCitations = (message.response?.citations?.length ?? 0) > 0;
  const hasPanelContent = hasCards || hasWebCitations || hasCitations;
  const isPanelOpen = rightPanelMessageIndex === messageIndex && rightPanelMode !== null;
  const citationCount = message.response?.citations?.length ?? 0;

  return (
    <div
      onClick={
        hasPanelContent
          ? (e: React.MouseEvent) => {
              if ((e.target as HTMLElement).closest("a, button")) return;
              if (isPanelOpen) {
                onCloseRightPanel();
                return;
              }
              if (hasCards) {
                onViewPlaces(messageIndex);
              } else if (hasWebCitations) {
                onViewSources(messageIndex);
              } else if (hasCitations) {
                onViewKnowledge(messageIndex);
              }
            }
          : undefined
      }
      className={[
        "bg-card rounded-2xl rounded-bl-md p-5 space-y-5 shadow-lg border transition-colors duration-200",
        hasPanelContent ? "cursor-pointer" : "",
        isPanelOpen ? "border-[rgba(174,133,80,0.6)]" : hasPanelContent ? "border-border group-hover:border-[rgba(174,133,80,0.6)]" : "border-border",
      ].join(" ")}
    >
      {/* Header: badges + View/Hide hint */}
      {hasPanelContent && (
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex flex-wrap gap-2">
            {hasCards && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[rgba(212,165,116,0.2)] text-[rgba(212,165,116,0.95)]">
                {message.response!.cards!.length} place{message.response!.cards!.length !== 1 ? "s" : ""} found
              </span>
            )}
            {hasWebCitations && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[rgba(212,165,116,0.2)] text-[rgba(212,165,116,0.95)]">
                {message.response!.web_citations!.length} web source{message.response!.web_citations!.length !== 1 ? "s" : ""} found
              </span>
            )}
            {hasCitations && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[rgba(212,165,116,0.2)] text-[rgba(212,165,116,0.95)]">
                {citationCount} knowledge source{citationCount !== 1 ? "s" : ""} found
              </span>
            )}
          </div>
          <div
            className={[
              "flex items-center gap-2 shrink-0 transition-opacity duration-150",
              isPanelOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            ].join(" ")}
          >
            {hasCards && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (rightPanelMessageIndex === messageIndex && rightPanelMode === "places") {
                    onCloseRightPanel();
                  } else {
                    onViewPlaces(messageIndex);
                  }
                }}
                className={[
                  "inline-flex items-center gap-2 text-sm font-medium text-[rgba(212,165,116,0.95)] hover:text-[var(--color-warning)] transition-colors",
                  !hintPulseSeen.has(messageIndex) && hasCards ? "animate-places-hint-pulse" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" aria-hidden />
                {rightPanelMessageIndex === messageIndex && rightPanelMode === "places"
                  ? `Hide place${message.response!.cards!.length !== 1 ? "s" : ""}`
                  : `View ${message.response!.cards!.length ?? 0} place${message.response!.cards!.length !== 1 ? "s" : ""}`}
              </button>
            )}
            {hasWebCitations && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (rightPanelMessageIndex === messageIndex && rightPanelMode === "sources") {
                    onCloseRightPanel();
                  } else {
                    onViewSources(messageIndex);
                  }
                }}
                className={[
                  "inline-flex items-center gap-2 text-sm font-medium text-[rgba(212,165,116,0.95)] hover:text-[var(--color-warning)] transition-colors",
                  !hintPulseSeen.has(messageIndex) && hasWebCitations ? "animate-places-hint-pulse" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" aria-hidden />
                {rightPanelMessageIndex === messageIndex && rightPanelMode === "sources"
                  ? `Hide web source${message.response!.web_citations!.length !== 1 ? "s" : ""}`
                  : `View ${message.response!.web_citations!.length ?? 0} web source${message.response!.web_citations!.length !== 1 ? "s" : ""}`}
              </button>
            )}
            {hasCitations && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (rightPanelMessageIndex === messageIndex && rightPanelMode === "knowledge") {
                    onCloseRightPanel();
                  } else {
                    onViewKnowledge(messageIndex);
                  }
                }}
                className={[
                  "inline-flex items-center gap-2 text-sm font-medium text-[rgba(212,165,116,0.95)] hover:text-[var(--color-warning)] transition-colors",
                  !hintPulseSeen.has(messageIndex) && hasCitations ? "animate-places-hint-pulse" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" aria-hidden />
                {rightPanelMessageIndex === messageIndex && rightPanelMode === "knowledge"
                  ? `Hide knowledge source${citationCount !== 1 ? "s" : ""}`
                  : `View ${citationCount} knowledge source${citationCount !== 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Answer */}
      {message.response.can_answer === false &&
      (!message.response.answer || !message.response.answer.trim()) ? (
        <div className="space-y-3">
          <p className="text-base leading-relaxed text-[rgba(245,245,245,0.85)]">
            No documents in your Knowledge Vault matched this question closely enough to answer with
            confidence.
          </p>
          <p className="text-compact text-muted-foreground/75">
            Add or connect sources in Knowledge Vault, or try rephrasing your question.
          </p>
        </div>
      ) : message.response.answer?.trim() ? (
        <div className="space-y-3">
          <div className="prose prose-sm max-w-none prose-p:text-foreground/90 prose-headings:text-foreground prose-strong:text-foreground [&_ul]:list-outside [&_ul]:pl-6 [&_ol]:list-outside [&_ol]:pl-6 [&_li>p]:inline [&_li>p]:my-0">
            <AnswerWithCitations
              answer={message.response.answer}
              citations={message.response.citations || []}
              onCitationClick={onCitationClick}
              onCitationHover={onCitationHover}
              onOpenKnowledgePanel={hasCitations ? () => onViewKnowledge(messageIndex) : undefined}
            />
          </div>
        </div>
      ) : null}

      <KnowledgeCitationFooter
        answer={message.response.answer || ""}
        citations={message.response.citations || []}
        teams={teams}
        onCitationClick={onCitationClick}
      />

      {/* Conflicts */}
      {message.response.conflicts && message.response.conflicts.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-medium uppercase tracking-wider text-[var(--color-warning)]">Conflicts Found</h4>
          {message.response.conflicts.map((conflict, idx) => (
            <div key={idx} className="bg-[rgba(212,165,116,0.1)] border border-[rgba(212,165,116,0.2)] p-4 rounded-xl">
              <h5 className="font-medium text-[var(--color-warning)] mb-3 flex items-center gap-2 text-compact">
                <AlertTriangle className="w-4 h-4" />
                {conflict.attribute.replace(/_/g, " ")}
              </h5>
              <ul className="space-y-3">
                {conflict.claims.map((claim, claimIdx) => (
                  <li key={claimIdx} className="text-muted-foreground">
                    <div className="font-medium mb-1 text-compact text-foreground">Claim {claimIdx + 1}:</div>
                    <div className="text-compact mb-2 leading-relaxed">{claim.claim}</div>
                    {claim.excerpt && (
                      <div className="text-sm text-muted-foreground italic mb-2 pl-3 border-l-2 border-[rgba(212,165,116,0.4)]">
                        &ldquo;{claim.excerpt}&rdquo;
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground/75">
                      <button
                        onClick={() => onCitationClick(claim.filename, claim.page_number, claim.pdf_path)}
                        className="text-[#7AA3C8] hover:text-[#9BBDD8] hover:underline transition-colors"
                      >
                        {claim.filename}, Page {claim.page_number}
                      </button>
                      {claim.effective_date && ` • Effective: ${claim.effective_date}`}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Feedback */}
      {message.id != null && currentSessionId != null && message.feedback_rating == null && (message.feedback_comment == null || message.feedback_comment === "") && (
        <div className="pt-3 mt-3 border-t border-border">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSubmitFeedback(message.id!, { rating: 1 })}
              disabled={feedbackSubmitting === message.id}
              className="inline-flex items-center justify-center p-2 rounded-lg bg-[rgba(255,255,255,0.06)] text-muted-foreground hover:bg-[rgba(255,255,255,0.1)] border border-transparent transition-colors"
              title="Thumbs up"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onSubmitFeedback(message.id!, { rating: -1 })}
              disabled={feedbackSubmitting === message.id}
              className="inline-flex items-center justify-center p-2 rounded-lg bg-[rgba(255,255,255,0.06)] text-muted-foreground hover:bg-[rgba(255,255,255,0.1)] border border-transparent transition-colors"
              title="Thumbs down"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onOpenFeedbackComment(message.id!)}
              className="inline-flex items-center justify-center p-2 rounded-lg bg-[rgba(255,255,255,0.06)] text-muted-foreground hover:bg-[rgba(255,255,255,0.1)] border border-transparent transition-colors"
              title="Add a comment"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
