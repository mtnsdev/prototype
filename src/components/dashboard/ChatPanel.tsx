"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import React from "react";
import { AlertTriangle, Loader2, ExternalLink, Send, ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare, ChevronDown, Plus, Globe, X, Star, LayoutGrid, MapPin } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import PdfModal from "./PdfModal";
import { Button } from "@/components/ui/button";
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

type PlaceCard = {
    name: string;
    address: string;
    city: string;
    country: string;
    google_maps_url: string;
    google_rating?: number | null;
    google_types?: string[];
    contact_phone: string;
    website: string;
    primary_image_url: string;
};

type WebCitation = {
    url: string;
    title: string;
    snippet?: string;
    favicon?: string;
};

type BotResponse = {
    session_id?: number;
    message_id?: number;
    answer: string;
    can_answer: boolean;
    citations: Citation[];
    web_citations?: WebCitation[];
    conflicts: Conflict[];
    cards?: PlaceCard[];
    open_source?: boolean;
};

type Message = {
    role: "user" | "bot";
    text: string;
    response?: BotResponse;
    /** Backend message id (for assistant messages); used for feedback */
    id?: number;
    feedback_rating?: number | null;
    feedback_comment?: string | null;
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

/** Displays a 0–5 rating as stars; supports float (e.g. 4.2 = 4 full + 1 partial). */
function StarRating({ value, max = 5, size = 12, className = "" }: { value: number; max?: number; size?: number; className?: string }) {
    const full = Math.floor(value);
    const fraction = value - full;
    const empty = max - Math.ceil(value);
    return (
        <div className={`flex items-center gap-0.5 ${className}`} aria-label={`Rating: ${value} out of ${max}`}>
            {Array.from({ length: full }, (_, i) => (
                <Star key={`f-${i}`} size={size} className="shrink-0 fill-current" strokeWidth={1.5} />
            ))}
            {fraction > 0 && (
                <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
                    <Star size={size} className="fill-none stroke-current opacity-40" strokeWidth={1.5} />
                    <span className="absolute inset-0 overflow-hidden" style={{ width: `${fraction * 100}%` }}>
                        <Star size={size} className="fill-current" strokeWidth={1.5} />
                    </span>
                </span>
            )}
            {Array.from({ length: empty }, (_, i) => (
                <Star key={`e-${i}`} size={size} className="shrink-0 fill-none stroke-current opacity-40" strokeWidth={1.5} />
            ))}
        </div>
    );
}

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
            <Button
                type="button"
                size="icon"
                onClick={(e) => {
                    e.preventDefault();
                    onCitationClick(filename, pageNumber, pdf_path);
                }}
                className={[
                    "inline-flex items-center justify-center w-[1.35em] h-[1.35em] shrink-0 rounded-full text-white text-[10px] font-semibold p-1 leading-none",
                    "bg-[rgba(212,165,116,0.4)] hover:bg-[rgba(212,165,116,0.6)] border border-[rgba(212,165,116,0.5)]",
                    "cursor-pointer align-[0.15em] ml-1",
                ].join(" ")}
                title={`${filename}, page ${pageNumber}`}
                aria-label={`Citation ${displayNumber}: ${filename} page ${pageNumber}`}
            >
                {displayNumber}
            </Button>
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
                        "inline-flex items-center justify-center w-[1.35em] h-[1.35em] shrink-0 rounded-full text-[10px] font-semibold p-1 leading-none",
                        "bg-[rgba(212,165,116,0.4)] hover:bg-[rgba(212,165,116,0.6)] text-white border border-[rgba(212,165,116,0.5)]",
                        "cursor-pointer transition-colors duration-150 align-[0.15em] ml-1",
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
                "inline-flex items-center justify-center w-[1.35em] h-[1.35em] shrink-0 rounded-full text-white text-[10px] font-semibold p-1 leading-none",
                "bg-[rgba(212,165,116,0.4)] hover:bg-[rgba(212,165,116,0.6)] border border-[rgba(212,165,116,0.5)]",
                "cursor-pointer transition-colors duration-150 align-[0.15em] ml-1",
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
                            className="text-[#D4A574] hover:text-[#E5B87A] hover:bg-[rgba(212,165,116,0.12)] px-1.5 py-0.5 rounded-md cursor-pointer transition-all duration-150 inline-flex items-center gap-1 text-xs font-semibold border border-[rgba(212,165,116,0.3)] hover:border-[rgba(212,165,116,0.5)]"
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
    /** Draft comment per message id (for feedback form) */
    const [feedbackCommentDraft, setFeedbackCommentDraft] = useState<Record<number, string>>({});
    const [feedbackSubmitting, setFeedbackSubmitting] = useState<number | null>(null);
    /** Message id for which the comment popup is open (null = closed) */
    const [feedbackCommentPopupMessageId, setFeedbackCommentPopupMessageId] = useState<number | null>(null);
    /** When true, backend routes to B4 (Facts & Logistics) and includes Google Places in the answer */
    const [externalSearchMode, setExternalSearchMode] = useState(false);

    /** Ref for the bottom of the messages area; scroll here after sending so the new question is visible */
    const messagesEndRef = useRef<HTMLDivElement>(null);
    /** Ref for the scrollable messages container; used for scroll-to-bottom button and scroll detection */
    const messagesScrollRef = useRef<HTMLDivElement>(null);
    /** Track bot messages that have cards so we can scroll-link the right panel */
    const cardsMessageRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
    /** The message index (in `messages`) whose cards should be shown based on scroll position */
    const [scrollActiveCardsMessageIndex, setScrollActiveCardsMessageIndex] = useState<number | null>(null);
    /** Right panel: opened by "View web sources" / "View places" buttons; which message and which mode */
    const [rightPanelMessageIndex, setRightPanelMessageIndex] = useState<number | null>(null);
    const [rightPanelMode, setRightPanelMode] = useState<"places" | "sources" | null>(null);
    /** Ref for tools (plus) menu; used for click-outside to close */
    const toolsMenuRef = useRef<HTMLDivElement>(null);
    const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
    /** Show "scroll to bottom" button when user has scrolled up and content overflows */
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    /** Message indices for which the "View N places/sources" hint has already pulsed (or panel was opened) */
    const [hintPulseSeen, setHintPulseSeen] = useState<Set<number>>(new Set());
    const hintPulseStartedRef = useRef<Set<number>>(new Set());

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
                    response: msg.role === "assistant" ? {
                        answer: msg.answer,
                        can_answer: msg.can_answer ?? true,
                        citations: msg.citations || [],
                        web_citations: msg.web_citations || [],
                        conflicts: msg.conflicts || [],
                        cards: msg.cards || [],
                        message_id: msg.id,
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

    // Deactivate right panel when switching chat session
    useEffect(() => {
        setRightPanelMessageIndex(null);
        setRightPanelMode(null);
    }, [conversationId]);

    // Close tools menu when clicking outside
    useEffect(() => {
        if (!toolsMenuOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
                setToolsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [toolsMenuOpen]);

    // Scroll-linked cards selection: observe only bot messages that contain cards and pick the most-visible one.
    useEffect(() => {
        const root = messagesScrollRef.current;
        if (!root) return;

        // Only observe currently-mounted refs (bot messages with cards).
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
            {
                root,
                threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
            }
        );

        // Observe all current elements.
        for (const [idx, el] of cardsMessageRefs.current.entries()) {
            if (!el) continue;
            el.setAttribute("data-cards-message-index", String(idx));
            observer.observe(el);
        }

        return () => {
            observer.disconnect();
        };
    }, [messages.length]);

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
                        ? {
                              ...msg,
                              feedback_rating: updated.feedback_rating ?? null,
                              feedback_comment: updated.feedback_comment ?? null,
                          }
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
        // Scroll to the new question after React commits the new message to the DOM
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
                    id: data.message_id,
                    feedback_rating: null,
                    feedback_comment: null,
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

    const checkShowScrollToBottom = useCallback(() => {
        const el = messagesScrollRef.current;
        if (!el) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const threshold = 80;
        const isOverflowing = scrollHeight > clientHeight;
        const isNearBottom = scrollHeight - scrollTop - clientHeight <= threshold;
        setShowScrollToBottom(isOverflowing && !isNearBottom);
    }, []);

    const scrollToBottom = useCallback(() => {
        messagesScrollRef.current?.scrollTo({ top: messagesScrollRef.current.scrollHeight, behavior: "smooth" });
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // Re-check scroll position when messages or loading state changes (layout may have changed)
    useEffect(() => {
        if (messages.length === 0 && !loadingConversation) return;
        const t = setTimeout(checkShowScrollToBottom, 100);
        return () => clearTimeout(t);
    }, [messages.length, loading, showConversationLoader, loadingConversation, checkShowScrollToBottom]);

    const isEmptyState = messages.length === 0 && !loadingConversation;

    const latestCards: PlaceCard[] = (() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            if (msg.role !== "bot") continue;
            const cards = msg.response?.cards;
            if (cards && cards.length > 0) return cards;
        }
        return [];
    })();

    const _activeCards: PlaceCard[] = (() => {
        if (scrollActiveCardsMessageIndex != null) {
            const msg = messages[scrollActiveCardsMessageIndex];
            const cards = msg?.role === "bot" ? msg.response?.cards : undefined;
            if (cards && cards.length > 0) return cards;
        }
        return latestCards;
    })();
    void _activeCards; // reserved for scroll-linked display if needed

    /** Right panel content: when opened via button, show that message's places or web sources */
    const panelMessage = rightPanelMessageIndex != null ? messages[rightPanelMessageIndex] : null;
    const panelPlaceCards: PlaceCard[] = rightPanelMode === "places" && panelMessage?.role === "bot" ? (panelMessage.response?.cards || []) : [];
    const panelWebCitations: WebCitation[] = rightPanelMode === "sources" && panelMessage?.role === "bot" ? (panelMessage.response?.web_citations || []) : [];
    const isRightPanelOpen = rightPanelMessageIndex != null && rightPanelMode != null;
    const closeRightPanel = () => {
        setRightPanelMessageIndex(null);
        setRightPanelMode(null);
    };

    // Stop hint pulse when user opens the panel for a message
    useEffect(() => {
        if (rightPanelMessageIndex != null) {
            setHintPulseSeen((prev) => new Set(prev).add(rightPanelMessageIndex));
        }
    }, [rightPanelMessageIndex]);

    // One-time pulse for "View N places/sources" hint: mark as seen after 2.5s
    useEffect(() => {
        const timeouts: ReturnType<typeof setTimeout>[] = [];
        messages.forEach((m, i) => {
            if (m.role !== "bot" || !m.response) return;
            const hasHint =
                (m.response.cards?.length ?? 0) > 0 || (m.response.web_citations?.length ?? 0) > 0;
            if (!hasHint || hintPulseSeen.has(i) || hintPulseStartedRef.current.has(i)) return;
            hintPulseStartedRef.current.add(i);
            timeouts.push(
                setTimeout(() => setHintPulseSeen((prev) => new Set(prev).add(i)), 2500)
            );
        });
        return () => timeouts.forEach((t) => clearTimeout(t));
    }, [messages, hintPulseSeen]);

    return (
        <>
            <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-[#0C0C0C]">
                <section className="h-full flex flex-col overflow-hidden flex-1 min-w-0">
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
                <div
                    ref={messagesScrollRef}
                    className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-6 space-y-6"
                    style={{ minHeight: 0 }}
                    onScroll={checkShowScrollToBottom}
                >
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
                                        ((m.response?.cards?.length ?? 0) > 0 || (m.response?.web_citations?.length ?? 0) > 0
                                            ? " group"
                                            : "")
                                    }
                                >
                                    <div
                                        onClick={
                                            ((m.response?.cards?.length ?? 0) > 0 || (m.response?.web_citations?.length ?? 0) > 0)
                                                ? (e: React.MouseEvent) => {
                                                      if ((e.target as HTMLElement).closest("a, button")) return;
                                                      if (rightPanelMessageIndex === i && rightPanelMode !== null) {
                                                          closeRightPanel();
                                                          return;
                                                      }
                                                      if ((m.response?.cards?.length ?? 0) > 0) {
                                                          setRightPanelMessageIndex(i);
                                                          setRightPanelMode("places");
                                                      } else if ((m.response?.web_citations?.length ?? 0) > 0) {
                                                          setRightPanelMessageIndex(i);
                                                          setRightPanelMode("sources");
                                                      }
                                                  }
                                                : undefined
                                        }
                                        className={[
                                            "bg-[#161616] rounded-2xl rounded-bl-md p-5 space-y-5 shadow-lg border transition-colors duration-200",
                                            (m.response?.cards?.length ?? 0) > 0 || (m.response?.web_citations?.length ?? 0) > 0
                                                ? "cursor-pointer"
                                                : "",
                                            rightPanelMessageIndex === i && rightPanelMode !== null
                                                ? "border-[rgba(174,133,80,0.6)]"
                                                : (m.response?.cards?.length ?? 0) > 0 || (m.response?.web_citations?.length ?? 0) > 0
                                                    ? "border-[rgba(255,255,255,0.08)] group-hover:border-[rgba(174,133,80,0.6)]"
                                                    : "border-[rgba(255,255,255,0.08)]",
                                        ].join(" ")}
                                    >
                                        {/* Header: badge (left) + View/Hide hint (right) when places or web sources exist */}
                                        {((m.response?.cards?.length ?? 0) > 0 ||
                                            (m.response?.web_citations?.length ?? 0) > 0) && (
                                            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[rgba(255,255,255,0.08)]">
                                                <div className="flex flex-wrap gap-2">
                                                    {(m.response?.cards?.length ?? 0) > 0 && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-[rgba(212,165,116,0.2)] text-[rgba(212,165,116,0.95)]">
                                                            {m.response.cards!.length} place
                                                            {(m.response.cards!.length ?? 0) !== 1
                                                                ? "s"
                                                                : ""}{" "}
                                                            found
                                                        </span>
                                                    )}
                                                    {(m.response?.web_citations?.length ?? 0) > 0 && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-[rgba(212,165,116,0.2)] text-[rgba(212,165,116,0.95)]">
                                                            {m.response.web_citations!.length} web
                                                            source
                                                            {(m.response.web_citations!.length ?? 0) !==
                                                            1
                                                                ? "s"
                                                                : ""}{" "}
                                                            found
                                                        </span>
                                                    )}
                                                </div>
                                                <div
                                                    className={[
                                                        "flex items-center gap-2 shrink-0 transition-opacity duration-150",
                                                        rightPanelMessageIndex === i && rightPanelMode !== null
                                                            ? "opacity-100"
                                                            : "opacity-0 group-hover:opacity-100",
                                                    ].join(" ")}
                                                >
                                                    {(m.response?.cards?.length ?? 0) > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (rightPanelMessageIndex === i && rightPanelMode === "places") {
                                                                    closeRightPanel();
                                                                } else {
                                                                    setRightPanelMessageIndex(i);
                                                                    setRightPanelMode("places");
                                                                }
                                                            }}
                                                            className={[
                                                                "inline-flex items-center gap-2 text-[12px] font-medium text-[rgba(212,165,116,0.95)] hover:text-[#D4A574] transition-colors",
                                                                !hintPulseSeen.has(i) &&
                                                                (m.response?.cards?.length ?? 0) > 0
                                                                    ? "animate-places-hint-pulse"
                                                                    : "",
                                                            ]
                                                                .filter(Boolean)
                                                                .join(" ")}
                                                        >
                                                            <LayoutGrid className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                                            {rightPanelMessageIndex === i &&
                                                            rightPanelMode === "places"
                                                                ? `Hide place${(m.response?.cards?.length ?? 0) !== 1 ? "s" : ""}`
                                                                : `View ${m.response?.cards?.length ?? 0} place${(m.response?.cards?.length ?? 0) !== 1 ? "s" : ""}`}
                                                        </button>
                                                    )}
                                                    {(m.response?.web_citations?.length ?? 0) > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (rightPanelMessageIndex === i && rightPanelMode === "sources") {
                                                                    closeRightPanel();
                                                                } else {
                                                                    setRightPanelMessageIndex(i);
                                                                    setRightPanelMode("sources");
                                                                }
                                                            }}
                                                            className={[
                                                                "inline-flex items-center gap-2 text-[12px] font-medium text-[rgba(212,165,116,0.95)] hover:text-[#D4A574] transition-colors",
                                                                !hintPulseSeen.has(i) &&
                                                                (m.response?.web_citations?.length ??
                                                                    0) > 0
                                                                    ? "animate-places-hint-pulse"
                                                                    : "",
                                                            ]
                                                                .filter(Boolean)
                                                                .join(" ")}
                                                        >
                                                            <LayoutGrid className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                                            {rightPanelMessageIndex === i &&
                                                            rightPanelMode === "sources"
                                                                ? `Hide web source${(m.response?.web_citations?.length ?? 0) !== 1 ? "s" : ""}`
                                                                : `View ${m.response?.web_citations?.length ?? 0} web source${(m.response?.web_citations?.length ?? 0) !== 1 ? "s" : ""}`}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

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

                                        {/* Feedback: thumbs up/down + optional comment */}
                                        {m.id != null && currentSessionId != null && (
                                            <div className="pt-3 mt-3 border-t border-[rgba(255,255,255,0.08)] space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[11px] uppercase tracking-wider text-[rgba(245,245,245,0.45)] mr-1">Was this helpful?</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => submitFeedback(m.id!, { rating: m.feedback_rating === 1 ? null : 1 })}
                                                        disabled={feedbackSubmitting === m.id}
                                                        className={[
                                                            "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors",
                                                            m.feedback_rating === 1
                                                                ? "bg-[#2d4a2d] text-[#86ef86] border border-[rgba(134,239,134,0.3)]"
                                                                : "bg-[rgba(255,255,255,0.06)] text-[rgba(245,245,245,0.6)] hover:bg-[rgba(255,255,255,0.1)] border border-transparent",
                                                        ].join(" ")}
                                                        title="Thumbs up"
                                                    >
                                                        <ThumbsUp className="w-3.5 h-3.5" />
                                                        Yes
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => submitFeedback(m.id!, { rating: m.feedback_rating === -1 ? null : -1 })}
                                                        disabled={feedbackSubmitting === m.id}
                                                        className={[
                                                            "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors",
                                                            m.feedback_rating === -1
                                                                ? "bg-[#4a2d2d] text-[#f87171] border border-[rgba(248,113,113,0.3)]"
                                                                : "bg-[rgba(255,255,255,0.06)] text-[rgba(245,245,245,0.6)] hover:bg-[rgba(255,255,255,0.1)] border border-transparent",
                                                        ].join(" ")}
                                                        title="Thumbs down"
                                                    >
                                                        <ThumbsDown className="w-3.5 h-3.5" />
                                                        No
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFeedbackCommentPopupMessageId(m.id!);
                                                            setFeedbackCommentDraft((d) => ({
                                                                ...d,
                                                                [m.id!]: d[m.id!] ?? m.feedback_comment ?? "",
                                                            }));
                                                        }}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium bg-[rgba(255,255,255,0.06)] text-[rgba(245,245,245,0.6)] hover:bg-[rgba(255,255,255,0.1)] border border-transparent transition-colors"
                                                        title="Add a comment"
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                        {m.feedback_comment ? "Edit comment" : "Comment"}
                                                    </button>
                                                </div>
                                                {m.feedback_comment != null && m.feedback_comment !== "" && (
                                                    <div className="flex items-start gap-2 text-[12px] text-[rgba(245,245,245,0.7)] mt-2">
                                                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[rgba(245,245,245,0.5)]" />
                                                        <span className="italic">&ldquo;{m.feedback_comment}&rdquo;</span>
                                                    </div>
                                                )}
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
                    <div ref={messagesEndRef} aria-hidden />
                </div>

                {/* Scroll to bottom button - above input when messages overflow and user has scrolled up */}
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

                {/* Input Area - OpenAI-style: plus opens tools, Web search shows as icon when on */}
                <div className="shrink-0 p-4 bg-[#0C0C0C]">
                    <div className="max-w-4xl mx-auto" ref={toolsMenuRef}>
                        <div className="flex gap-3 items-center">
                            <div className="flex-1 flex items-center gap-2 rounded-xl bg-[#161616] border border-[rgba(255,255,255,0.1)] pl-1.5 pr-1 py-1 focus-within:border-[rgba(174,133,80,0.5)] focus-within:ring-1 focus-within:ring-[rgba(174,133,80,0.2)] transition-shadow relative">
                                {/* Plus button - opens tools menu */}
                                <button
                                    type="button"
                                    aria-label="Add tools"
                                    aria-expanded={toolsMenuOpen}
                                    aria-haspopup="true"
                                    onClick={() => setToolsMenuOpen((v) => !v)}
                                    className={[
                                        "flex items-center justify-center h-8 w-8 rounded-lg shrink-0 transition-colors",
                                        toolsMenuOpen ? "bg-[rgba(255,255,255,0.12)] text-[#F5F5F5]" : "text-[rgba(245,245,245,0.6)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[rgba(245,245,245,0.9)]",
                                    ].join(" ")}
                                >
                                    <Plus size={18} strokeWidth={2.25} />
                                </button>
                                {/* Tools dropdown (Web search option) */}
                                {toolsMenuOpen && (
                                    <div
                                        className="absolute left-0 bottom-full mb-2 z-50 min-w-[200px] rounded-xl bg-[#1a1a1a] border border-[rgba(255,255,255,0.12)] shadow-xl py-1.5"
                                        role="menu"
                                        aria-label="Tools"
                                    >
                                        <button
                                            type="button"
                                            role="menuitemcheckbox"
                                            aria-checked={externalSearchMode}
                                            onClick={() => {
                                                setExternalSearchMode((v) => !v);
                                                setToolsMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-[13px] text-[rgba(245,245,245,0.9)] hover:bg-[rgba(255,255,255,0.08)] transition-colors"
                                        >
                                            <div className={[
                                                "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
                                                externalSearchMode ? "bg-[rgba(174,133,80,0.25)] text-[#AE8550]" : "bg-[rgba(255,255,255,0.08)] text-[rgba(245,245,245,0.6)]",
                                            ].join(" ")}>
                                                <Globe size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="font-medium">Web search</span>
                                                <p className="text-[11px] text-[rgba(245,245,245,0.5)] mt-0.5">Search the web and places</p>
                                            </div>
                                            {externalSearchMode && (
                                                <span className="ml-auto text-[#AE8550]" aria-hidden>✓</span>
                                            )}
                                        </button>
                                    </div>
                                )}
                                {/* Web search icon when enabled - hover shows X to remove */}
                                {externalSearchMode && (
                                    <button
                                        type="button"
                                        aria-label="Web search on (click to turn off)"
                                        title="Web search on — click to turn off"
                                        onClick={() => setExternalSearchMode(false)}
                                        className="group/ws flex items-center justify-center h-8 w-8 rounded-lg shrink-0 bg-[rgba(174,133,80,0.2)] text-[#AE8550] hover:bg-[rgba(174,133,80,0.3)] transition-colors relative"
                                    >
                                        <Globe size={16} className="opacity-100 group-hover/ws:opacity-0 transition-opacity" aria-hidden />
                                        <X size={14} className="absolute inset-0 m-auto opacity-0 group-hover/ws:opacity-100 transition-opacity pointer-events-none" aria-hidden />
                                    </button>
                                )}
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => (e.key === "Enter" && !e.shiftKey ? send() : null)}
                                    placeholder="Ask Enable a question..."
                                    className="chat-input-no-focus-outline flex-1 min-w-0 rounded-lg border-0 bg-transparent px-2 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[rgba(245,245,245,0.4)] outline-none focus:ring-0 focus:border-0 focus:shadow-none"
                                />
                            </div>
                            <Button
                                type="button"
                                size="icon"
                                onClick={() => send()}
                                disabled={loading || !input.trim()}
                                className="h-11 w-11 rounded-xl bg-[#AE8550] hover:bg-[#C4975E] text-white border-0 shrink-0"
                            >
                                <Send size={18} />
                            </Button>
                        </div>
                    </div>
                </div>
                </section>

                {/* Right panel: Places or Web sources — 350ms slide transition; always in DOM for animation */}
                <aside
                    className={[
                        "shrink-0 overflow-hidden border-[rgba(255,255,255,0.08)] bg-[#0C0C0C] ease-out",
                        "w-full border-t lg:border-t-0 lg:border-l",
                        "max-h-[38vh] lg:max-h-none",
                        isRightPanelOpen
                            ? "lg:w-[420px] xl:w-[460px] min-w-0"
                            : "w-0 min-w-0 lg:w-0 border-l-0",
                    ].join(" ")}
                    style={{ transition: "width 350ms ease-out" }}
                    aria-hidden={!isRightPanelOpen}
                    aria-label={rightPanelMode === "sources" ? "Web sources panel" : "Places panel"}
                >
                        <div className="h-full flex flex-col">
                            <div className="shrink-0 px-5 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-2">
                                <div>
                                    <h3 className="text-[14px] font-semibold text-[#F5F5F5]">
                                        {rightPanelMode === "sources" ? "Web sources" : "Places"}
                                    </h3>
                                    <p className="text-[12px] text-[rgba(245,245,245,0.5)] mt-0.5">
                                        {rightPanelMode === "sources"
                                            ? `${panelWebCitations.length} result${panelWebCitations.length !== 1 ? "s" : ""}`
                                            : `${panelPlaceCards.length} result${panelPlaceCards.length !== 1 ? "s" : ""}`}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeRightPanel}
                                    className="shrink-0 p-2 rounded-lg text-[rgba(245,245,245,0.6)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[#F5F5F5] transition-colors"
                                    aria-label="Close panel"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-5" style={{ minHeight: 0 }}>
                                {rightPanelMode === "sources" && (
                                    <div className="grid grid-cols-1 gap-3">
                                        {panelWebCitations.map((wc, idx) => (
                                            <div
                                                key={`${wc.url}-${idx}`}
                                                className="bg-[#161616] border border-[rgba(255,255,255,0.1)] rounded-xl p-3 hover:border-[rgba(174,133,80,0.3)] transition-colors relative group"
                                            >
                                                <div className="flex items-start gap-3">
                                                    {wc.favicon ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={wc.favicon}
                                                            alt=""
                                                            className="w-8 h-8 shrink-0 rounded object-contain"
                                                            width={32}
                                                            height={32}
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 shrink-0 rounded bg-[rgba(255,255,255,0.08)] flex items-center justify-center">
                                                            <Globe className="w-4 h-4 text-[rgba(245,245,245,0.5)]" aria-hidden />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <a
                                                            href={wc.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-semibold text-[13px] leading-snug line-clamp-2 text-[#F5F5F5] hover:text-[#D4A574] hover:underline block"
                                                        >
                                                            {wc.title || wc.url || "Web source"}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {rightPanelMode === "places" && (
                                    <div className="grid grid-cols-1 gap-3">
                                        {panelPlaceCards.map((card, idx) => {
                                            const placeUrl =
                                                card.google_maps_url || card.website || null;
                                            const placeType =
                                                card.google_types?.[0] != null && card.google_types[0] !== ""
                                                    ? card.google_types[0].charAt(0).toUpperCase() + card.google_types[0].slice(1).toLowerCase().replace(/_/g, " ")
                                                    : null;
                                            const cardContent = (
                                                <>
                                                    {card.primary_image_url ? (
                                                        <div className="aspect-video relative bg-[#0C0C0C] overflow-hidden rounded-t-xl">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={card.primary_image_url}
                                                                alt={card.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ) : null}
                                                    <div className="p-3 space-y-2">
                                                        <div>
                                                            <h4 className="font-semibold text-[#F5F5F5] text-[14px] leading-snug line-clamp-2">{card.name}</h4>
                                                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                                {placeType && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[rgba(212,165,116,0.2)] text-[rgba(212,165,116,0.95)]">
                                                                        {placeType}
                                                                    </span>
                                                                )}
                                                                {card.google_rating != null && (
                                                                    <StarRating
                                                                        value={Math.min(5, Math.max(0, Number(card.google_rating)))}
                                                                        max={5}
                                                                        className="text-[#D4A574]"
                                                                        size={12}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                        {(card.address || card.city || card.country) && (
                                                            <p className="text-[12px] text-[rgba(245,245,245,0.7)] flex items-start gap-1.5 line-clamp-2">
                                                                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[rgba(245,245,245,0.5)]" aria-hidden />
                                                                <span>{[card.address, card.city, card.country].filter(Boolean).join(", ")}</span>
                                                            </p>
                                                        )}
                                                        {card.contact_phone && (
                                                            <a
                                                                href={`tel:${card.contact_phone}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-[12px] text-[#D4A574] hover:text-[#E5B87A] hover:underline block truncate"
                                                            >
                                                                {card.contact_phone}
                                                            </a>
                                                        )}
                                                        <div className="flex flex-wrap gap-3 pt-1">
                                                            {card.google_maps_url && (
                                                                <a
                                                                    href={card.google_maps_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="inline-flex items-center gap-1 text-[12px] text-[#D4A574] hover:text-[#E5B87A]"
                                                                >
                                                                    <ExternalLink className="w-3 h-3 shrink-0" aria-hidden />
                                                                    Map
                                                                </a>
                                                            )}
                                                            {card.website && (
                                                                <a
                                                                    href={card.website}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="inline-flex items-center gap-1 text-[12px] text-[#D4A574] hover:text-[#E5B87A]"
                                                                >
                                                                    <ExternalLink className="w-3 h-3 shrink-0" aria-hidden />
                                                                    Website
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                            const cardClass =
                                                "bg-[#161616] border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden hover:border-[rgba(174,133,80,0.5)] transition-colors relative group block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(174,133,80,0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161616] animate-card-slide-in";
                                            return (
                                                <div
                                                    key={`${card.google_maps_url || card.website || card.name}-${idx}`}
                                                    className={cardClass}
                                                    style={{
                                                        animationDelay: `${idx * 60}ms`,
                                                    }}
                                                    role={placeUrl ? "link" : undefined}
                                                    tabIndex={placeUrl ? 0 : undefined}
                                                    onClick={
                                                        placeUrl
                                                            ? (e: React.MouseEvent) => {
                                                                  if ((e.target as HTMLElement).closest("a, button")) return;
                                                                  window.open(placeUrl, "_blank", "noopener,noreferrer");
                                                              }
                                                            : undefined
                                                    }
                                                    onKeyDown={
                                                        placeUrl
                                                            ? (e: React.KeyboardEvent) => {
                                                                  if (e.key === "Enter" || e.key === " ") {
                                                                      e.preventDefault();
                                                                      window.open(placeUrl, "_blank", "noopener,noreferrer");
                                                                  }
                                                              }
                                                            : undefined
                                                    }
                                                >
                                                    {cardContent}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
            </div>

            {/* PDF Modal */}
            <PdfModal
                isOpen={pdfModal.isOpen}
                onClose={closePdfModal}
                filename={pdfModal.filename}
                pageNumber={pdfModal.pageNumber}
                pdfPath={pdfModal.pdfPath}
            />

            {/* Feedback comment popup */}
            {feedbackCommentPopupMessageId != null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
                    onClick={() => setFeedbackCommentPopupMessageId(null)}
                    role="presentation"
                >
                    <div
                        className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.12)] rounded-xl shadow-xl max-w-md w-full p-5 flex flex-col gap-4"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-labelledby="feedback-comment-title"
                    >
                        <h3 id="feedback-comment-title" className="text-[14px] font-semibold text-[#F5F5F5]">
                            Add feedback comment
                        </h3>
                        <textarea
                            placeholder="Your comment (optional)"
                            value={feedbackCommentDraft[feedbackCommentPopupMessageId] ?? ""}
                            onChange={(e) =>
                                setFeedbackCommentDraft((d) => ({
                                    ...d,
                                    [feedbackCommentPopupMessageId]: e.target.value,
                                }))
                            }
                            className="min-h-[100px] w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.2)] px-3 py-2 text-[13px] text-[#F5F5F5] placeholder:text-[rgba(245,245,245,0.4)] focus:outline-none focus:ring-1 focus:ring-[#AE8550] resize-y max-h-48"
                            maxLength={2000}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setFeedbackCommentPopupMessageId(null)}
                                className="text-[rgba(245,245,245,0.7)]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                    const comment = feedbackCommentDraft[feedbackCommentPopupMessageId]?.trim() ?? "";
                                    submitFeedback(feedbackCommentPopupMessageId, { comment: comment || null });
                                }}
                                disabled={feedbackSubmitting === feedbackCommentPopupMessageId}
                                className="bg-[rgba(174,133,80,0.2)] text-[#D4A574] hover:bg-[rgba(174,133,80,0.3)] border-[rgba(174,133,80,0.3)]"
                            >
                                {feedbackSubmitting === feedbackCommentPopupMessageId ? "Saving…" : "Submit"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}