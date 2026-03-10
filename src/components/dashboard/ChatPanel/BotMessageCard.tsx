"use client";

import React from "react";
import { AlertTriangle, ThumbsUp, ThumbsDown, MessageSquare, LayoutGrid } from "lucide-react";
import { AnswerWithCitations } from "./AnswerWithCitations";
import type { Message } from "./types";

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
        "bg-[#161616] rounded-2xl rounded-bl-md p-5 space-y-5 shadow-lg border transition-colors duration-200",
        hasPanelContent ? "cursor-pointer" : "",
        isPanelOpen ? "border-[rgba(174,133,80,0.6)]" : hasPanelContent ? "border-[rgba(255,255,255,0.08)] group-hover:border-[rgba(174,133,80,0.6)]" : "border-[rgba(255,255,255,0.08)]",
      ].join(" ")}
    >
      {/* Header: badges + View/Hide hint */}
      {hasPanelContent && (
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[rgba(255,255,255,0.08)]">
          <div className="flex flex-wrap gap-2">
            {hasCards && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-[rgba(212,165,116,0.2)] text-[rgba(212,165,116,0.95)]">
                {message.response!.cards!.length} place{message.response!.cards!.length !== 1 ? "s" : ""} found
              </span>
            )}
            {hasWebCitations && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-[rgba(212,165,116,0.2)] text-[rgba(212,165,116,0.95)]">
                {message.response!.web_citations!.length} web source{message.response!.web_citations!.length !== 1 ? "s" : ""} found
              </span>
            )}
            {hasCitations && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-[rgba(212,165,116,0.2)] text-[rgba(212,165,116,0.95)]">
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
                  "inline-flex items-center gap-2 text-[12px] font-medium text-[rgba(212,165,116,0.95)] hover:text-[#D4A574] transition-colors",
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
                  "inline-flex items-center gap-2 text-[12px] font-medium text-[rgba(212,165,116,0.95)] hover:text-[#D4A574] transition-colors",
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
                  "inline-flex items-center gap-2 text-[12px] font-medium text-[rgba(212,165,116,0.95)] hover:text-[#D4A574] transition-colors",
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
      {message.response.answer && (
        <div className="space-y-3">
          <div className="prose prose-sm max-w-none prose-p:text-[rgba(245,245,245,0.88)] prose-headings:text-[#F5F5F5] prose-strong:text-[#F5F5F5] [&_ul]:list-outside [&_ul]:pl-6 [&_ol]:list-outside [&_ol]:pl-6 [&_li>p]:inline [&_li>p]:my-0">
            <AnswerWithCitations
              answer={message.response.answer}
              citations={message.response.citations || []}
              onCitationClick={onCitationClick}
              onCitationHover={onCitationHover}
              onOpenKnowledgePanel={hasCitations ? () => onViewKnowledge(messageIndex) : undefined}
            />
          </div>
        </div>
      )}

      {/* Conflicts */}
      {message.response.conflicts && message.response.conflicts.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-[12px] font-medium uppercase tracking-wider text-[#D4A574]">Conflicts Found</h4>
          {message.response.conflicts.map((conflict, idx) => (
            <div key={idx} className="bg-[rgba(212,165,116,0.1)] border border-[rgba(212,165,116,0.2)] p-4 rounded-xl">
              <h5 className="font-medium text-[#D4A574] mb-3 flex items-center gap-2 text-[13px]">
                <AlertTriangle className="w-4 h-4" />
                {conflict.attribute.replace(/_/g, " ")}
              </h5>
              <ul className="space-y-3">
                {conflict.claims.map((claim, claimIdx) => (
                  <li key={claimIdx} className="text-[rgba(245,245,245,0.8)]">
                    <div className="font-medium mb-1 text-[13px] text-[#F5F5F5]">Claim {claimIdx + 1}:</div>
                    <div className="text-[13px] mb-2 leading-relaxed">{claim.claim}</div>
                    {claim.excerpt && (
                      <div className="text-[12px] text-[rgba(245,245,245,0.6)] italic mb-2 pl-3 border-l-2 border-[rgba(212,165,116,0.4)]">
                        &ldquo;{claim.excerpt}&rdquo;
                      </div>
                    )}
                    <div className="text-[11px] text-[rgba(245,245,245,0.5)]">
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
        <div className="pt-3 mt-3 border-t border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSubmitFeedback(message.id!, { rating: 1 })}
              disabled={feedbackSubmitting === message.id}
              className="inline-flex items-center justify-center p-2 rounded-lg bg-[rgba(255,255,255,0.06)] text-[rgba(245,245,245,0.6)] hover:bg-[rgba(255,255,255,0.1)] border border-transparent transition-colors"
              title="Thumbs up"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onSubmitFeedback(message.id!, { rating: -1 })}
              disabled={feedbackSubmitting === message.id}
              className="inline-flex items-center justify-center p-2 rounded-lg bg-[rgba(255,255,255,0.06)] text-[rgba(245,245,245,0.6)] hover:bg-[rgba(255,255,255,0.1)] border border-transparent transition-colors"
              title="Thumbs down"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onOpenFeedbackComment(message.id!)}
              className="inline-flex items-center justify-center p-2 rounded-lg bg-[rgba(255,255,255,0.06)] text-[rgba(245,245,245,0.6)] hover:bg-[rgba(255,255,255,0.1)] border border-transparent transition-colors"
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
