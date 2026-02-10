"use client";

import { useState, useEffect, useCallback } from "react";
import React from "react";
import { AlertTriangle, Loader2, ExternalLink, Send, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import PdfModal from "./PdfModal";
import { useUserOptional } from "@/contexts/UserContext";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

type Citation = {
    chunk_id?: string;
    source: string;
    page_number: number;
    excerpt: string;
    filename: string;
    pdf_path: string;
};

type ConflictClaim = {
    claim: string;
    filename: string;
    page_number: number;
    excerpt: string;
    effective_date: string;
    pdf_path: string;
};

type Conflict = {
    attribute: string;
    claims: ConflictClaim[];
};

type BotResponse = {
    session_id?: number;
    answer: string;
    can_answer: boolean;
    citations: Citation[];
    conflicts: Conflict[];
    open_source?: boolean;
};

type Message = {
    role: "user" | "bot";
    text: string;
    response?: BotResponse;
};

type Props = {
    conversationId: number | null;
    onConversationCreated?: (id: number) => void;
    userName?: string;
    onBackToHome?: () => void;
};

const SUGGESTION_CHIPS = [
    "What is the commission rate for Rosewood Elite bookings?",
    "What amenities does Four Seasons Abu Dhabi offer?",
    "What are the 'Four Approaches' to designing itineraries?",
    "What's the GDS code for FSPP?",
];


// Inline citation marker: dark blue circle with number, hover = popover (excerpt + source), click = PDF modal
function InlineCitationMarker({
    citation,
    displayNumber,
    onCitationClick,
}: {
    citation: Citation;
    displayNumber: number;
    onCitationClick: (filename: string, pageNumber: number | string, pdfPath?: string) => void;
}) {
    const [hover, setHover] = useState(false);
    const filename = citation.filename || citation.source;
    const pageNumber = citation.page_number;
    const pdf_path = citation.pdf_path

    return (
        <span
            className="relative inline-flex align-baseline"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    onCitationClick(filename, pageNumber, pdf_path);
                }}
                className={[
                    "inline-flex items-center justify-center min-w-[1.25em] h-[1.25em] rounded-full text-white text-[11px] font-semibold",
                    "bg-[#3C4472] hover:bg-[#4a5285] border border-[rgba(255,255,255,0.15)]",
                    "cursor-pointer transition-colors duration-150 align-[0.2em] ml-1.5",
                ].join(" ")}
                title={`${filename}, page ${pageNumber}`}
                aria-label={`Citation ${displayNumber}: ${filename} page ${pageNumber}`}
            >
                {displayNumber}
            </button>
            {hover && (
                <>
                    {/* Invisible bridge so moving mouse to the panel doesn't trigger onMouseLeave (span to avoid <div> inside <p>) */}
                    <span className="absolute left-0 top-full min-w-[540px] w-full h-3 z-40 block" aria-hidden style={{ width: "max(100%, 240px)" }} />
                    <span
                        className="absolute left-0 top-full mt-1.5 z-50 min-w-[540px] max-w-[580px] max-h-[320px] rounded-lg shadow-xl border border-[rgba(255,255,255,0.12)] bg-[#1a1a1a] p-4 flex flex-col"
                        role="tooltip"
                    >
                        <span className="text-[13px] text-[rgba(245,245,245,0.9)] leading-relaxed whitespace-pre-wrap overflow-y-auto min-h-0 flex-1 pr-1 block">
                            {citation.excerpt}
                        </span>
                        <span className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.08)] text-[11px] text-[rgba(245,245,245,0.55)] shrink-0 block">
                            {filename}
                            {pageNumber != null && ` · Page ${pageNumber}`}
                        </span>
                    </span>
                </>
            )}
        </span>
    );
}

// Ellipsis for 3+ citations: shows "..." until clicked, then expands to show all citation circles; collapse button returns to first + "..."
function InlineCitationMarkerEllipsis({
    chunkIds,
    citationByChunkId,
    chunkIdToDisplayNumber,
    onCitationClick,
}: {
    chunkIds: string[];
    citationByChunkId: Map<string, Citation>;
    chunkIdToDisplayNumber: Map<string, number>;
    onCitationClick: (filename: string, pageNumber: number | string, pdfPath?: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const citations = chunkIds.map((id) => citationByChunkId.get(id)).filter(Boolean) as Citation[];
    if (citations.length === 0) return null;

    if (expanded) {
        return (
            <span className="inline-flex items-center flex-nowrap gap-0 align-baseline">
                {citations.map((citation, i) => (
                    <InlineCitationMarker
                        key={chunkIds[i]}
                        citation={citation}
                        displayNumber={chunkIdToDisplayNumber.get(chunkIds[i]) ?? i + 1}
                        onCitationClick={onCitationClick}
                    />
                ))}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        setExpanded(false);
                    }}
                    className={[
                        "inline-flex items-center justify-center min-w-[1.25em] h-[1.25em] rounded-full text-[11px] font-semibold",
                        "bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.3)] text-white border border-[rgba(255,255,255,0.2)]",
                        "cursor-pointer transition-colors duration-150 align-[0.2em] ml-1.5",
                    ].join(" ")}
                    title="Collapse citations"
                    aria-label="Collapse citations"
                >
                    ←
                </button>
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                setExpanded(true);
            }}
            className={[
                "inline-flex items-center justify-center min-w-[1.25em] h-[1.25em] rounded-full text-white text-[11px] font-semibold",
                "bg-[#3C4472] hover:bg-[#4a5285] border border-[rgba(255,255,255,0.15)]",
                "cursor-pointer transition-colors duration-150 align-[0.2em] ml-1.5",
            ].join(" ")}
            title="Show all citations"
            aria-label="Show all citations"
        >
            …
        </button>
    );
}

// Function to process answer text and create clickable citations
function AnswerWithCitations({
    answer,
    citations,
    onCitationClick
}: {
    answer: string;
    citations: Citation[];
    onCitationClick: (filename: string, pageNumber: number | string, pdfPath?: string) => void;
}) {
    // New format: [^chunk_id] or [^chunk_id_1,^chunk_id_2] — replace with markdown links so citations render inline
    const citationBlockPattern = /\[\^([^\]]+)\]/gi;
    const citationByChunkId = new Map<string, Citation>(
        (citations || []).filter((c): c is Citation & { chunk_id: string } => !!c.chunk_id).map((c) => [c.chunk_id!.toLowerCase(), c])
    );

    function parseCitationIds(inner: string): string[] {
        return inner
            .split(",")
            .map((s) => s.trim().replace(/^\^/, "").trim().toLowerCase())
            .filter((id) => /^[a-f0-9-]{36}$/.test(id));
    }

    const allMatches: { index: number; ids: string[] }[] = [];
    let match;
    citationBlockPattern.lastIndex = 0;
    while ((match = citationBlockPattern.exec(answer)) !== null) {
        const ids = parseCitationIds(match[1]);
        if (ids.length > 0) allMatches.push({ index: match.index, ids });
    }

    if (allMatches.length > 0 && citationByChunkId.size > 0) {
        const orderedChunkIds: string[] = [];
        const seen = new Set<string>();
        for (const { ids } of allMatches) {
            for (const id of ids) {
                if (!seen.has(id)) {
                    seen.add(id);
                    orderedChunkIds.push(id);
                }
            }
        }
        const chunkIdToDisplayNumber = new Map<string, number>();
        orderedChunkIds.forEach((id, idx) => chunkIdToDisplayNumber.set(id, idx + 1));

        // Replace so each citation is separate: 1 id → [1](#citation:id); 2 ids → [1][2] two links; 3+ → [1] + [...](#citation-more:id2;id3)
        const answerWithLinks = answer.replace(citationBlockPattern, (_, inner) => {
            const ids = parseCitationIds(inner).filter((id) => citationByChunkId.has(id));
            if (ids.length === 0) return "";
            if (ids.length === 1) {
                const num = chunkIdToDisplayNumber.get(ids[0]) ?? 0;
                return num ? `[${num}](#citation:${ids[0]})` : "";
            }
            if (ids.length === 2) {
                const n1 = chunkIdToDisplayNumber.get(ids[0]) ?? 0;
                const n2 = chunkIdToDisplayNumber.get(ids[1]) ?? 0;
                if (!n1 || !n2) return "";
                return `[${n1}](#citation:${ids[0]})[${n2}](#citation:${ids[1]})`;
            }
            const firstNum = chunkIdToDisplayNumber.get(ids[0]) ?? 0;
            if (!firstNum) return "";
            // Use citation-group so first circle and ellipsis render in one no-wrap container (same line)
            return `[${firstNum} …](#citation-group:${ids.join(";")})`;
        });

        const blockMarkdownComponents = {
            p: ({ children }: { children?: React.ReactNode }) => <p className="mb-3 text-[rgba(245,245,245,0.88)] leading-relaxed">{children}</p>,
            ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc list-outside pl-6 mb-3 space-y-1.5 text-[rgba(245,245,245,0.88)]">{children}</ul>,
            ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal list-outside pl-6 mb-3 space-y-1.5 text-[rgba(245,245,245,0.88)]">{children}</ol>,
            li: ({ children }: { children?: React.ReactNode }) => <li className="pl-1 text-[rgba(245,245,245,0.88)] [&>p]:inline [&>p]:my-0">{children}</li>,
            strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold text-[#F5F5F5]">{children}</strong>,
            h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-[#F5F5F5] font-semibold text-lg mb-2">{children}</h1>,
            h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-[#F5F5F5] font-semibold text-base mb-2">{children}</h2>,
            h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-[#F5F5F5] font-semibold text-sm mb-2">{children}</h3>,
            a: ({ href, children: linkChildren }: { href?: string; children?: React.ReactNode }) => {
                if (href?.startsWith("#citation-group:")) {
                    const payload = href.slice("#citation-group:".length);
                    const allIds = payload.split(";").map((id) => id.trim().toLowerCase()).filter(Boolean);
                    if (allIds.length >= 2) {
                        const firstId = allIds[0];
                        const restIds = allIds.slice(1);
                        const firstCitation = citationByChunkId.get(firstId);
                        const firstNum = chunkIdToDisplayNumber.get(firstId);
                        if (firstCitation != null && firstNum != null) {
                            return (
                                <span className="inline-flex items-center flex-nowrap align-baseline">
                                    <InlineCitationMarker
                                        citation={firstCitation}
                                        displayNumber={firstNum}
                                        onCitationClick={onCitationClick}
                                    />
                                    <InlineCitationMarkerEllipsis
                                        chunkIds={restIds}
                                        citationByChunkId={citationByChunkId}
                                        chunkIdToDisplayNumber={chunkIdToDisplayNumber}
                                        onCitationClick={onCitationClick}
                                    />
                                </span>
                            );
                        }
                    }
                }
                if (href?.startsWith("#citation-more:")) {
                    const payload = href.slice("#citation-more:".length);
                    const chunkIds = payload.split(";").map((id) => id.trim().toLowerCase()).filter(Boolean);
                    if (chunkIds.length > 0) {
                        return (
                            <InlineCitationMarkerEllipsis
                                chunkIds={chunkIds}
                                citationByChunkId={citationByChunkId}
                                chunkIdToDisplayNumber={chunkIdToDisplayNumber}
                                onCitationClick={onCitationClick}
                            />
                        );
                    }
                }
                if (href?.startsWith("#citation:")) {
                    const chunkId = href.slice("#citation:".length).toLowerCase();
                    const citation = citationByChunkId.get(chunkId);
                    const displayNumber = chunkIdToDisplayNumber.get(chunkId) ?? 0;
                    if (citation) {
                        return (
                            <InlineCitationMarker
                                citation={citation}
                                displayNumber={displayNumber}
                                onCitationClick={onCitationClick}
                            />
                        );
                    }
                }
                return <a href={href}>{linkChildren}</a>;
            },
        };

        return (
            <ReactMarkdown components={blockMarkdownComponents}>
                {answerWithLinks}
            </ReactMarkdown>
        );
    }

    // Legacy format: [Source: filename, Page: 1] or [Source: filename, Pages: 1, 24, 25, 27]
    const citationPattern = /\[Source:\s*([^,\]]+),\s*Pages?:\s*([^\]]+)\]/gi;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let legacyMatch;
    let citationIndex = 0;
    citationPattern.lastIndex = 0;

    while ((legacyMatch = citationPattern.exec(answer)) !== null) {
        // Add text before the citation
        if (legacyMatch.index > lastIndex) {
            const textBefore = answer.substring(lastIndex, legacyMatch.index);
            if (textBefore) {
                parts.push(textBefore);
            }
        }

        const filename = legacyMatch[1].trim();
        const pageNumbersStr = legacyMatch[2].trim();
        // Parse page numbers (can be single number or comma-separated list)
        const pageNumbers = pageNumbersStr.split(',').map(p => p.trim()).filter(Boolean);

        // Find matching citation from the citations array to get pdf_path
        const matchingCitation = citations.find(
            c => (c.filename || c.source) === filename ||
                (c.filename || c.source)?.toLowerCase() === filename.toLowerCase()
        );

        const pdfPath = matchingCitation?.pdf_path;

        // Create concise, appealing citation badges with modern design
        parts.push(
            <span key={`citation-group-${citationIndex++}`} className="inline-flex items-center gap-1 ml-1.5">
                <span className="text-[rgba(245,245,245,0.4)] text-xs">[</span>
                <span className="text-[rgba(245,245,245,0.6)] text-xs font-medium truncate max-w-30" title={filename}>
                    {filename}
                </span>
                <span className="text-[rgba(245,245,245,0.4)] text-xs">:</span>
                {pageNumbers.map((pageNum, pageIdx) => (
                    <React.Fragment key={`page-${pageIdx}`}>
                        <button
                            onClick={() => onCitationClick(filename, pageNum, pdfPath)}
                            className="text-[#7AA3C8] hover:text-[#9BBDD8] hover:bg-[rgba(122,163,200,0.12)] px-1.5 py-0.5 rounded-md cursor-pointer transition-all duration-150 inline-flex items-center gap-1 text-xs font-semibold border border-[rgba(122,163,200,0.2)] hover:border-[rgba(122,163,200,0.4)]"
                            title={`View ${filename} page ${pageNum}`}
                        >
                            {pageNum}
                            <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                        {pageIdx < pageNumbers.length - 1 && <span className="text-[rgba(245,245,245,0.3)] text-xs mx-0.5">,</span>}
                    </React.Fragment>
                ))}
                <span className="text-[rgba(245,245,245,0.4)] text-xs">]</span>
            </span>
        );

        lastIndex = citationPattern.lastIndex;
    }

    // Add remaining text after last citation
    if (lastIndex < answer.length) {
        const textAfter = answer.substring(lastIndex);
        if (textAfter) {
            parts.push(textAfter);
        }
    }

    // If no citations found, return the original answer rendered with ReactMarkdown
    if (parts.length === 0 || (parts.length === 1 && typeof parts[0] === 'string')) {
        return (
            <ReactMarkdown
                components={{
                    p: ({ children }) => <p className="mb-3 text-[rgba(245,245,245,0.88)] leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-outside pl-6 mb-3 space-y-1.5 text-[rgba(245,245,245,0.88)]">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-outside pl-6 mb-3 space-y-1.5 text-[rgba(245,245,245,0.88)]">{children}</ol>,
                    li: ({ children }) => <li className="pl-1 text-[rgba(245,245,245,0.88)] [&>p]:inline [&>p]:my-0">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-[#F5F5F5]">{children}</strong>,
                    h1: ({ children }) => <h1 className="text-[#F5F5F5] font-semibold text-lg mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-[#F5F5F5] font-semibold text-base mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-[#F5F5F5] font-semibold text-sm mb-2">{children}</h3>,
                }}
            >
                {answer}
            </ReactMarkdown>
        );
    }

    // Render mixed content: process text parts with ReactMarkdown, render buttons as-is
    return (
        <>
            {parts.map((part, idx) => {
                if (React.isValidElement(part)) {
                    // It's a React element (clickable citation button) - render inline
                    return <React.Fragment key={`citation-${idx}`}>{part}</React.Fragment>;
                }
                // It's a string - render with ReactMarkdown
                const textPart = String(part);
                if (!textPart.trim()) return null;

                return (
                    <ReactMarkdown
                        key={`text-${idx}`}
                        components={{
                            p: ({ children }) => <p className="mb-3 text-[rgba(245,245,245,0.88)] leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-outside pl-6 mb-3 space-y-1.5 text-[rgba(245,245,245,0.88)]">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-outside pl-6 mb-3 space-y-1.5 text-[rgba(245,245,245,0.88)]">{children}</ol>,
                            li: ({ children }) => <li className="pl-1 text-[rgba(245,245,245,0.88)] [&>p]:inline [&>p]:my-0">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-[#F5F5F5]">{children}</strong>,
                            h1: ({ children }) => <h1 className="text-[#F5F5F5] font-semibold text-lg mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-[#F5F5F5] font-semibold text-base mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-[#F5F5F5] font-semibold text-sm mb-2">{children}</h3>,
                        }}
                    >
                        {textPart}
                    </ReactMarkdown>
                );
            })}
        </>
    );
}

export default function ChatPanel({ conversationId, onConversationCreated, userName = "there", onBackToHome }: Props) {
    const userContext = useUserOptional();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingConversation, setLoadingConversation] = useState(false);
    /** Steps received via SSE during thinking; cleared when result or error arrives. */
    const [thinkingSteps, setThinkingSteps] = useState<{ stepIndex: number; message: string }[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(conversationId);
    const [sessionTitle, setSessionTitle] = useState<string>("");
    const [pdfModal, setPdfModal] = useState<{
        isOpen: boolean;
        filename: string;
        pageNumber: number | string;
        pdfPath?: string;
    }>({
        isOpen: false,
        filename: "",
        pageNumber: 1,
    });

    // Delayed loading states to prevent flickering
    const showSendingLoader = useDelayedLoading(loading);
    const showConversationLoader = useDelayedLoading(loadingConversation);

    // Get first name from user context or fall back to prop
    const displayName = userContext?.getFirstName?.() || userName;

    // Load session messages when conversationId changes
    const loadSession = useCallback(async (id: number) => {
        setLoadingConversation(true);
        try {
            const token = localStorage.getItem("auth_token");
            // Using /api/chat/sessions/{id}/messages endpoint (Swagger-compliant)
            const response = await fetch(`/api/chat/sessions/${id}/messages`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Convert API messages (ChatMessageResponse) to local format
                const loadedMessages: Message[] = data.map((msg: {
                    role: string;
                    answer: string;
                    citations?: Citation[];
                    conflicts?: Conflict[];
                    can_answer?: boolean;
                }) => ({
                    role: msg.role === "assistant" ? "bot" : "user",
                    text: msg.role === "user" ? msg.answer : "",
                    response: msg.role === "assistant" ? {
                        answer: msg.answer,
                        can_answer: msg.can_answer ?? true,
                        citations: msg.citations || [],
                        conflicts: msg.conflicts || [],
                    } : undefined,
                }));
                setMessages(loadedMessages);
                setCurrentSessionId(id);
                // Session title can be fetched separately if needed, or set from first message
                const firstUserMsg = loadedMessages.find(m => m.role === "user");
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
            // Reset to empty state for new session
            setMessages([]);
            setCurrentSessionId(null);
            setSessionTitle("");
        }
    }, [conversationId, loadSession]);

    const openPdfModal = (filename: string, pageNumber: number | string, pdfPath?: string) => {
        setPdfModal({
            isOpen: true,
            filename,
            pageNumber,
            pdfPath,
        });
    };

    const closePdfModal = () => {
        setPdfModal({ isOpen: false, filename: "", pageNumber: 1 });
    };

    async function send(messageText?: string) {
        const text = (messageText || input).trim();
        if (!text || loading) return;

        setInput("");
        setMessages((m) => [...m, { role: "user", text }]);
        setLoading(true);
        setThinkingSteps([]);

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
                }),
            });

            if (!res.ok || !res.body) {
                setLoading(false);
                setThinkingSteps([]);
                const errorMsg = "Sorry, I encountered an error processing your request. Please try again.";
                setMessages((m) => [...m, { role: "bot", text: errorMsg }]);
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
                                // ignore malformed step
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
                    text: data.can_answer
                        ? ""
                        : "I'm sorry, I don't have enough information to answer that question accurately.",
                    response: data,
                };
                setMessages((m) => [...m, botMessage]);
            } else if (!streamErrorReceived) {
                setMessages((m) => [
                    ...m,
                    { role: "bot", text: "Sorry, I encountered an error processing your request. Please try again." },
                ]);
            }
        } catch {
            setLoading(false);
            setThinkingSteps([]);
            setMessages((m) => [
                ...m,
                { role: "bot", text: "Failed to connect to the server. Please check if the API is running." },
            ]);
        }
    }

    const handleSuggestionClick = (suggestion: string) => {
        send(suggestion);
    };

    const isEmptyState = messages.length === 0 && !loadingConversation;

    return (
        <>
            <section className="h-full flex flex-col overflow-hidden bg-[#0C0C0C]">
                {/* Header */}
                <div className="shrink-0 px-5 py-4 border-b border-[rgba(255,255,255,0.08)]">
                    {isEmptyState ? (
                        <>
                            <h2 className="text-[14px] font-semibold text-[#F5F5F5]">Chat</h2>
                            <p className="text-[12px] text-[rgba(245,245,245,0.5)] mt-0.5">Ask questions about your documents</p>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => onBackToHome?.()}
                                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/8 transition-colors text-[rgba(245,245,245,0.6)] hover:text-[#F5F5F5]"
                                title="Back to new chat"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-[14px] font-semibold text-[#F5F5F5] truncate">
                                    {sessionTitle || "Conversation"}
                                </h2>
                                {messages.length > 0 && messages[0].role === "user" && (
                                    <p className="text-[12px] text-[rgba(245,245,245,0.5)] mt-0.5 truncate">
                                        {messages[0].text.slice(0, 60)}{messages[0].text.length > 60 ? "..." : ""}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-6 space-y-6" style={{ minHeight: 0 }}>
                    {/* Empty State */}
                    {isEmptyState && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center mb-8 border border-white/10 shadow-lg">
                                <Image src="/TL_logo.svg" alt="Enable" width={48} height={48} />
                            </div>
                            <h2 className="text-[24px] font-semibold text-[#F5F5F5] mb-3 tracking-tight">
                                Hey {displayName}, how can I help?
                            </h2>
                            <p className="text-[rgba(245,245,245,0.5)] mb-10 max-w-md text-[14px] leading-relaxed">
                                Ask a question or choose a suggestion below
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
                                {SUGGESTION_CHIPS.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className={[
                                            "px-4 py-3.5 rounded-xl text-left",
                                            "bg-[#161616] hover:bg-[#1a1a1a]",
                                            "text-[13px] text-[rgba(245,245,245,0.75)] hover:text-[#F5F5F5]",
                                            "transition-all duration-150 ease-out",
                                            "border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]",
                                            "shadow-sm hover:shadow-md",
                                        ].join(" ")}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading conversation */}
                    {showConversationLoader && (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-[rgba(245,245,245,0.4)]" />
                                <span className="text-[13px] text-[rgba(245,245,245,0.5)]">Loading conversation...</span>
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {!isEmptyState && !showConversationLoader && messages.map((m, i) => (
                        <div key={i} className="space-y-4">
                            {/* User Message */}
                            {m.role === "user" && (
                                <div className="ml-auto max-w-[80%]">
                                    <div className="rounded-2xl rounded-br-md px-4 py-3 text-[14px] leading-relaxed bg-[#AE8550] text-white font-medium shadow-md">
                                        {m.text}
                                    </div>
                                </div>
                            )}

                            {/* Bot Response */}
                            {m.role === "bot" && m.response && (
                                <div className="mr-auto max-w-[85%]">
                                    <div className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-2xl rounded-bl-md p-5 space-y-5 shadow-lg">
                                        {/* Answer Section */}
                                        {m.response.answer && (
                                            <div className="space-y-3">
                                                <div className="prose prose-sm max-w-none prose-p:text-[rgba(245,245,245,0.88)] prose-headings:text-[#F5F5F5] prose-strong:text-[#F5F5F5] [&_ul]:list-outside [&_ul]:pl-6 [&_ol]:list-outside [&_ol]:pl-6 [&_li>p]:inline [&_li>p]:my-0">
                                                    <AnswerWithCitations
                                                        answer={m.response.answer}
                                                        citations={m.response.citations || []}
                                                        onCitationClick={openPdfModal}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                     
                                        {/* Conflicts / Disagreements Section */}
                                        {m.response.conflicts && m.response.conflicts.length > 0 && (
                                            <div className="space-y-3 pt-2">
                                                <h4 className="text-[12px] font-medium uppercase tracking-wider text-[#D4A574]">Conflicts Found</h4>
                                                {m.response.conflicts.map((conflict, idx) => (
                                                    <div key={idx} className="bg-[rgba(212,165,116,0.1)] border border-[rgba(212,165,116,0.2)] p-4 rounded-xl">
                                                        <h5 className="font-medium text-[#D4A574] mb-3 flex items-center gap-2 text-[13px]">
                                                            <AlertTriangle className="w-4 h-4" />
                                                            {conflict.attribute.replace(/_/g, " ")}
                                                        </h5>
                                                        <ul className="space-y-3">
                                                            {conflict.claims.map((claim, claimIdx) => (
                                                                <li key={claimIdx} className="text-[rgba(245,245,245,0.8)]">
                                                                    <div className="font-medium mb-1 text-[13px] text-[#F5F5F5]">
                                                                        Claim {claimIdx + 1}:
                                                                    </div>
                                                                    <div className="text-[13px] mb-2 leading-relaxed">
                                                                        {claim.claim}
                                                                    </div>
                                                                    {claim.excerpt && (
                                                                        <div className="text-[12px] text-[rgba(245,245,245,0.6)] italic mb-2 pl-3 border-l-2 border-[rgba(212,165,116,0.4)]">
                                                                            &ldquo;{claim.excerpt}&rdquo;
                                                                        </div>
                                                                    )}
                                                                    <div className="text-[11px] text-[rgba(245,245,245,0.5)]">
                                                                        <button
                                                                            onClick={() => openPdfModal(claim.filename, claim.page_number, claim.pdf_path)}
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
                                    </div>
                                </div>
                            )}

                            {/* Simple Bot Message (no response data) */}
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
                </div>

                {/* Input Area */}
                <div className="shrink-0 p-4 bg-[#0C0C0C]">
                    <div className="flex gap-3 items-center max-w-4xl mx-auto">
                        <div className="flex-1 relative">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => (e.key === "Enter" && !e.shiftKey ? send() : null)}
                                placeholder="Ask Enable a question..."
                                className={[
                                    "w-full rounded-xl px-4 py-3 text-[14px]",
                                    "bg-[#161616] text-[#F5F5F5] placeholder-[rgba(245,245,245,0.35)]",
                                    "border border-[rgba(255,255,255,0.1)] hover:border-[rgba(174,133,80,0.3)]",
                                    "focus:outline-none focus:border-[rgba(174,133,80,0.5)] focus:ring-1 focus:ring-[rgba(174,133,80,0.2)]",
                                    "transition-all duration-150",
                                ].join(" ")}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => send()}
                            disabled={loading || !input.trim()}
                            className={[
                                "h-11 w-11 rounded-xl flex items-center justify-center",
                                "bg-[#AE8550] hover:bg-[#C4975E] text-white",
                                "disabled:opacity-40 disabled:cursor-not-allowed",
                                "transition-all duration-150",
                                "shadow-sm hover:shadow-md",
                            ].join(" ")}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </section>

            {/* PDF Modal */}
            <PdfModal
                isOpen={pdfModal.isOpen}
                onClose={closePdfModal}
                filename={pdfModal.filename}
                pageNumber={pdfModal.pageNumber}
                pdfPath={pdfModal.pdfPath}
            />
        </>
    );
}