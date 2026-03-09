"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import PdfModal from "../PdfModal";
import { useUserOptional } from "@/contexts/UserContext";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import type { Message, ChatPanelProps, BotResponse, Citation, WebCitation, Conflict, PlaceCard } from "./types";
import { ChatHeader } from "./ChatHeader";
import { EmptyState } from "./EmptyState";
import { BotMessageCard } from "./BotMessageCard";
import { ChatInput } from "./ChatInput";
import { RightPanel } from "./RightPanel";
import { FeedbackCommentModal } from "./FeedbackCommentModal";

export default function ChatPanel({
  conversationId,
  onConversationCreated,
  userName = "there",
  onBackToHome,
}: ChatPanelProps) {
  const userContext = useUserOptional();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<{ stepIndex: number; message: string }[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(conversationId);
  const [sessionTitle, setSessionTitle] = useState<string>("");
  const [pdfModal, setPdfModal] = useState<{
    isOpen: boolean;
    filename: string;
    pageNumber: number | string;
    pdfPath?: string;
  }>({ isOpen: false, filename: "", pageNumber: 1 });
  const [feedbackCommentDraft, setFeedbackCommentDraft] = useState<Record<number, string>>({});
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<number | null>(null);
  const [feedbackCommentPopupMessageId, setFeedbackCommentPopupMessageId] = useState<number | null>(null);
  const [externalSearchMode, setExternalSearchMode] = useState(false);
  const [searchPlacesMode, setSearchPlacesMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const cardsMessageRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const [scrollActiveCardsMessageIndex, setScrollActiveCardsMessageIndex] = useState<number | null>(null);
  const [rightPanelMessageIndex, setRightPanelMessageIndex] = useState<number | null>(null);
  const [rightPanelMode, setRightPanelMode] = useState<"places" | "sources" | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [hintPulseSeen, setHintPulseSeen] = useState<Set<number>>(new Set());
  const hintPulseStartedRef = useRef<Set<number>>(new Set());

  const showSendingLoader = useDelayedLoading(loading);
  const showConversationLoader = useDelayedLoading(loadingConversation);
  const displayName = userContext?.getFirstName?.() || userName;

  const loadSession = useCallback(async (id: number) => {
    setLoadingConversation(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/chat/sessions/${id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const loadedMessages: Message[] = data.map(
          (msg: {
            id: number;
            role: string;
            answer: string;
            citations?: Citation[];
            web_citations?: WebCitation[];
            conflicts?: Conflict[];
            can_answer?: boolean;
            feedback_rating?: number | null;
            feedback_comment?: string | null;
            cards?: PlaceCard[];
          }) => ({
            role: msg.role === "assistant" ? "bot" : "user",
            text: msg.role === "user" ? msg.answer : "",
            id: msg.role === "assistant" ? msg.id : undefined,
            feedback_rating: msg.role === "assistant" ? (msg.feedback_rating ?? null) : undefined,
            feedback_comment: msg.role === "assistant" ? (msg.feedback_comment ?? null) : undefined,
            response:
              msg.role === "assistant"
                ? {
                    answer: msg.answer,
                    can_answer: msg.can_answer ?? true,
                    citations: msg.citations || [],
                    web_citations: msg.web_citations || [],
                    conflicts: msg.conflicts || [],
                    cards: msg.cards || [],
                    message_id: msg.id,
                  }
                : undefined,
          })
        );
        setMessages(loadedMessages);
        setCurrentSessionId(id);
        const firstUserMsg = loadedMessages.find((m) => m.role === "user");
        setSessionTitle(firstUserMsg?.text?.slice(0, 50) || `Chat ${id}`);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setLoadingConversation(false);
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadSession(conversationId);
    } else {
      setMessages([]);
      setCurrentSessionId(null);
      setSessionTitle("");
    }
  }, [conversationId, loadSession]);

  useEffect(() => {
    setRightPanelMessageIndex(null);
    setRightPanelMode(null);
  }, [conversationId]);

  useEffect(() => {
    const root = messagesScrollRef.current;
    if (!root) return;
    const entriesByIndex = new Map<number, IntersectionObserverEntry>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idxAttr = (entry.target as HTMLElement).getAttribute("data-cards-message-index");
          const idx = idxAttr ? Number(idxAttr) : NaN;
          if (!Number.isFinite(idx)) continue;
          entriesByIndex.set(idx, entry);
        }
        let bestIdx: number | null = null;
        let bestRatio = 0;
        for (const [idx, entry] of entriesByIndex.entries()) {
          if (!entry.isIntersecting) continue;
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIdx = idx;
          }
        }
        setScrollActiveCardsMessageIndex(bestIdx);
      },
      { root, threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    );
    for (const [idx, el] of cardsMessageRefs.current.entries()) {
      if (!el) continue;
      el.setAttribute("data-cards-message-index", String(idx));
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, [messages.length]);

  const openPdfModalFn = useCallback((filename: string, pageNumber: number | string, pdfPath?: string) => {
    setPdfModal({ isOpen: true, filename, pageNumber, pdfPath });
  }, []);

  const closePdfModal = useCallback(() => {
    setPdfModal({ isOpen: false, filename: "", pageNumber: 1 });
  }, []);

  async function submitFeedback(
    messageId: number,
    update: { rating?: number | null; comment?: string | null }
  ) {
    if (!currentSessionId) return;
    setFeedbackSubmitting(messageId);
    try {
      const token = localStorage.getItem("auth_token");
      const body: { rating?: number | null; comment?: string | null } = {};
      if (update.rating !== undefined) body.rating = update.rating;
      if (update.comment !== undefined) body.comment = update.comment;
      const res = await fetch(
        `/api/chat/sessions/${currentSessionId}/messages/${messageId}/feedback`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) return;
      const updated = await res.json();
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, feedback_rating: updated.feedback_rating ?? null, feedback_comment: updated.feedback_comment ?? null }
            : msg
        )
      );
      setFeedbackCommentDraft((d) => {
        const next = { ...d };
        delete next[messageId];
        return next;
      });
      setFeedbackCommentPopupMessageId((openId) => (openId === messageId ? null : openId));
    } finally {
      setFeedbackSubmitting(null);
    }
  }

  async function send(messageText?: string) {
    const text = (messageText || input).trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    setThinkingSteps([]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/chat/query/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: text,
          session_id: currentSessionId || undefined,
          external_search: externalSearchMode,
          search_places: searchPlacesMode,
        }),
      });

      if (!res.ok || !res.body) {
        setLoading(false);
        setThinkingSteps([]);
        setMessages((m) => [...m, { role: "bot", text: "Sorry, I encountered an error processing your request. Please try again." }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let lastEventType = "";
      let data: BotResponse | null = null;
      let streamErrorReceived = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith("event:")) {
            lastEventType = line.slice(6).trim();
          } else if (line.startsWith("data:") && lastEventType) {
            const payload = line.slice(5).trim();
            if (lastEventType === "step") {
              try {
                const { step_index, message } = JSON.parse(payload) as { step_index: number; message: string };
                setThinkingSteps((prev) => {
                  const next = [...prev];
                  const idx = next.findIndex((s) => s.stepIndex === step_index);
                  if (idx >= 0) next[idx] = { stepIndex: step_index, message };
                  else next.push({ stepIndex: step_index, message });
                  return next.sort((a, b) => a.stepIndex - b.stepIndex);
                });
              } catch {
                // ignore
              }
            } else if (lastEventType === "result") {
              try {
                data = JSON.parse(payload) as BotResponse;
              } catch {
                // ignore
              }
            } else if (lastEventType === "error") {
              streamErrorReceived = true;
              try {
                const { detail } = JSON.parse(payload) as { detail?: string };
                setMessages((m) => [...m, { role: "bot", text: detail || "An error occurred." }]);
              } catch {
                setMessages((m) => [...m, { role: "bot", text: "An error occurred." }]);
              }
            }
            lastEventType = "";
          }
        }
      }

      setLoading(false);
      setThinkingSteps([]);

      if (data) {
        if (data.session_id && !currentSessionId) {
          setCurrentSessionId(data.session_id);
          setSessionTitle(text.slice(0, 50) + (text.length > 50 ? "..." : ""));
          onConversationCreated?.(data.session_id);
        }
        const botMessage: Message = {
          role: "bot",
          text: data.can_answer ? "" : "I'm sorry, I don't have enough information to answer that question accurately.",
          response: data,
          id: data.message_id,
          feedback_rating: null,
          feedback_comment: null,
        };
        setMessages((m) => [...m, botMessage]);
      } else if (!streamErrorReceived) {
        setMessages((m) => [...m, { role: "bot", text: "Sorry, I encountered an error processing your request. Please try again." }]);
      }
    } catch {
      setLoading(false);
      setThinkingSteps([]);
      setMessages((m) => [...m, { role: "bot", text: "Failed to connect to the server. Please check if the API is running." }]);
    }
  }

  const checkShowScrollToBottom = useCallback(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const threshold = 80;
    setShowScrollToBottom(scrollHeight > clientHeight && scrollHeight - scrollTop - clientHeight > threshold);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesScrollRef.current?.scrollTo({ top: messagesScrollRef.current.scrollHeight, behavior: "smooth" });
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages.length === 0 && !loadingConversation) return;
    const t = setTimeout(checkShowScrollToBottom, 100);
    return () => clearTimeout(t);
  }, [messages.length, loading, showConversationLoader, loadingConversation, checkShowScrollToBottom]);

  const isEmptyState = messages.length === 0 && !loadingConversation;

  const panelMessage = rightPanelMessageIndex != null ? messages[rightPanelMessageIndex] : null;
  const panelPlaceCards =
    rightPanelMode === "places" && panelMessage?.role === "bot" ? (panelMessage.response?.cards || []) : [];
  const panelWebCitations =
    rightPanelMode === "sources" && panelMessage?.role === "bot" ? (panelMessage.response?.web_citations || []) : [];
  const isRightPanelOpen = rightPanelMessageIndex != null && rightPanelMode != null;
  const closeRightPanel = useCallback(() => {
    setRightPanelMessageIndex(null);
    setRightPanelMode(null);
  }, []);

  useEffect(() => {
    if (rightPanelMessageIndex != null) {
      setHintPulseSeen((prev) => new Set(prev).add(rightPanelMessageIndex));
    }
  }, [rightPanelMessageIndex]);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    messages.forEach((m, i) => {
      if (m.role !== "bot" || !m.response) return;
      const hasHint = (m.response.cards?.length ?? 0) > 0 || (m.response.web_citations?.length ?? 0) > 0;
      if (!hasHint || hintPulseSeen.has(i) || hintPulseStartedRef.current.has(i)) return;
      hintPulseStartedRef.current.add(i);
      timeouts.push(setTimeout(() => setHintPulseSeen((prev) => new Set(prev).add(i)), 2500));
    });
    return () => timeouts.forEach((t) => clearTimeout(t));
  }, [messages, hintPulseSeen]);

  const firstMessagePreview =
    messages.length > 0 && messages[0].role === "user"
      ? messages[0].text.slice(0, 60) + (messages[0].text.length > 60 ? "..." : "")
      : null;

  return (
    <>
      <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-[#0C0C0C]">
        <section className="h-full flex flex-col overflow-hidden flex-1 min-w-0">
          <ChatHeader
            isEmptyState={isEmptyState}
            sessionTitle={sessionTitle}
            firstMessagePreview={firstMessagePreview}
            onBackToHome={onBackToHome}
          />

          <div
            ref={messagesScrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-6 space-y-6"
            style={{ minHeight: 0 }}
            onScroll={checkShowScrollToBottom}
          >
            {isEmptyState && (
              <EmptyState displayName={displayName} onSuggestionClick={(s) => send(s)} />
            )}

            {showConversationLoader && (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[rgba(245,245,245,0.4)]" />
                  <span className="text-[13px] text-[rgba(245,245,245,0.5)]">Loading conversation...</span>
                </div>
              </div>
            )}

            {!isEmptyState && !showConversationLoader &&
              messages.map((m, i) => (
                <div key={i} className="space-y-4">
                  {m.role === "user" && (
                    <div className="ml-auto max-w-[80%]">
                      <div className="rounded-2xl rounded-br-md px-4 py-3 text-[14px] leading-relaxed bg-[#AE8550] text-white font-medium shadow-md">
                        {m.text}
                      </div>
                    </div>
                  )}

                  {m.role === "bot" && m.response && (
                    <div
                      ref={(el) => {
                        const hasCards = (m.response?.cards?.length ?? 0) > 0;
                        if (!hasCards) {
                          cardsMessageRefs.current.delete(i);
                          return;
                        }
                        if (el) {
                          cardsMessageRefs.current.set(i, el);
                          el.setAttribute("data-cards-message-index", String(i));
                        } else {
                          cardsMessageRefs.current.delete(i);
                        }
                      }}
                      className={
                        "mr-auto max-w-[85%]" +
                        ((m.response?.cards?.length ?? 0) > 0 || (m.response?.web_citations?.length ?? 0) > 0 ? " group" : "")
                      }
                    >
                      <BotMessageCard
                        message={m}
                        messageIndex={i}
                        currentSessionId={currentSessionId}
                        rightPanelMessageIndex={rightPanelMessageIndex}
                        rightPanelMode={rightPanelMode}
                        hintPulseSeen={hintPulseSeen}
                        feedbackSubmitting={feedbackSubmitting}
                        onCitationClick={openPdfModalFn}
                        onViewPlaces={(idx) => {
                          setRightPanelMessageIndex(idx);
                          setRightPanelMode("places");
                        }}
                        onViewSources={(idx) => {
                          setRightPanelMessageIndex(idx);
                          setRightPanelMode("sources");
                        }}
                        onCloseRightPanel={closeRightPanel}
                        onSubmitFeedback={submitFeedback}
                        onOpenFeedbackComment={(messageId) => {
                          setFeedbackCommentPopupMessageId(messageId);
                          setFeedbackCommentDraft((d) => ({ ...d, [messageId]: d[messageId] ?? "" }));
                        }}
                      />
                    </div>
                  )}

                  {m.role === "bot" && !m.response && m.text && (
                    <div className="mr-auto max-w-[85%]">
                      <div className="rounded-2xl rounded-bl-md px-4 py-3 text-[14px] leading-relaxed bg-[#161616] text-[rgba(245,245,245,0.88)] border border-[rgba(255,255,255,0.08)] shadow-sm">
                        {m.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}

            {showSendingLoader && !isEmptyState && (
              <div className="mr-auto max-w-[85%]">
                <div className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-2xl rounded-bl-md px-4 py-3 shadow-sm space-y-2">
                  {thinkingSteps.length === 0 ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin text-[rgba(245,245,245,0.5)] shrink-0" />
                      <span className="text-[14px] text-[rgba(245,245,245,0.6)]">Thinking...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-[14px] text-[rgba(245,245,245,0.9)]">
                      <Loader2 className="w-4 h-4 animate-spin text-[rgba(245,245,245,0.6)] shrink-0" />
                      <span>{thinkingSteps[thinkingSteps.length - 1].message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} aria-hidden />
          </div>

          {showScrollToBottom && !isEmptyState && (
            <div className="shrink-0 flex justify-center py-1 bg-[#0C0C0C]">
              <button
                type="button"
                onClick={scrollToBottom}
                className={[
                  "flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium",
                  "bg-[#161616] hover:bg-[#1e1e1e] text-[rgba(245,245,245,0.9)]",
                  "border border-[rgba(255,255,255,0.1)] hover:border-[rgba(174,133,80,0.3)]",
                  "shadow-md hover:shadow-lg transition-all duration-150",
                ].join(" ")}
                title="Scroll to bottom"
                aria-label="Scroll to bottom"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}

          <ChatInput
            input={input}
            setInput={setInput}
            loading={loading}
            onSend={send}
            externalSearchMode={externalSearchMode}
            setExternalSearchMode={setExternalSearchMode}
            searchPlacesMode={searchPlacesMode}
            setSearchPlacesMode={setSearchPlacesMode}
          />
        </section>

        <RightPanel
          isOpen={isRightPanelOpen}
          mode={rightPanelMode}
          placeCards={panelPlaceCards}
          webCitations={panelWebCitations}
          onClose={closeRightPanel}
        />
      </div>

      <PdfModal
        isOpen={pdfModal.isOpen}
        onClose={closePdfModal}
        filename={pdfModal.filename}
        pageNumber={pdfModal.pageNumber}
        pdfPath={pdfModal.pdfPath}
      />

      {feedbackCommentPopupMessageId != null && (
        <FeedbackCommentModal
          messageId={feedbackCommentPopupMessageId}
          draftComment={feedbackCommentDraft[feedbackCommentPopupMessageId] ?? ""}
          isSubmitting={feedbackSubmitting === feedbackCommentPopupMessageId}
          onDraftChange={(value) =>
            setFeedbackCommentDraft((d) => ({ ...d, [feedbackCommentPopupMessageId]: value }))
          }
          onClose={() => setFeedbackCommentPopupMessageId(null)}
          onSubmit={() => {
            const comment = (feedbackCommentDraft[feedbackCommentPopupMessageId]?.trim() ?? "") || null;
            submitFeedback(feedbackCommentPopupMessageId, { comment });
          }}
        />
      )}
    </>
  );
}
