"use client";

import { useState, useEffect, useCallback } from "react";
import React from "react";
import { AlertTriangle, Loader2, ExternalLink, Send, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import PdfModal from "./PdfModal";
import { useUserOptional } from "@/contexts/UserContext";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type Citation = {
    source: string;
    page_number: number;
    excerpt: string;
    filename: string;
    pdf_path: string;
};

type ConflictClaim = {
    claim: string;
    source: string;
    page_number: number;
    excerpt: string;
    effective_date: string;
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

// Consolidated citation type for grouping
type ConsolidatedCitation = {
    filename: string;
    page_number: number;
    excerpts: string[];
    pdf_path: string;
    source: string;
};

// Function to consolidate citations by filename and page number
function consolidateCitations(citations: Citation[]): ConsolidatedCitation[] {
    const grouped = new Map<string, ConsolidatedCitation>();

    for (const citation of citations) {
        // Create a key from filename and page number
        const key = `${citation.filename || citation.source}_${citation.page_number}`;

        if (grouped.has(key)) {
            const existing = grouped.get(key)!;
            // Add excerpt if it's different from existing ones
            if (!existing.excerpts.includes(citation.excerpt)) {
                existing.excerpts.push(citation.excerpt);
            }
        } else {
            grouped.set(key, {
                filename: citation.filename || citation.source,
                page_number: citation.page_number,
                excerpts: [citation.excerpt],
                pdf_path: citation.pdf_path,
                source: citation.source,
            });
        }
    }

    return Array.from(grouped.values());
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
    // Pattern to match citations like [Source: filename, Page: 1] or [Source: filename, Pages: 1, 24, 25, 27]
    const citationPattern = /\[Source:\s*([^,\]]+),\s*Pages?:\s*([^\]]+)\]/gi;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let citationIndex = 0;

    // Reset regex lastIndex
    citationPattern.lastIndex = 0;

    while ((match = citationPattern.exec(answer)) !== null) {
        // Add text before the citation
        if (match.index > lastIndex) {
            const textBefore = answer.substring(lastIndex, match.index);
            if (textBefore) {
                parts.push(textBefore);
            }
        }

        const filename = match[1].trim();
        const pageNumbersStr = match[2].trim();
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
                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1.5 text-[rgba(245,245,245,0.88)]">{children}</ul>,
                    li: ({ children }) => <li className="ml-4 text-[rgba(245,245,245,0.88)]">{children}</li>,
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
                            ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1.5 text-[rgba(245,245,245,0.88)]">{children}</ul>,
                            li: ({ children }) => <li className="ml-4 text-[rgba(245,245,245,0.88)]">{children}</li>,
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
            const response = await fetch(`${API_URL}/api/chat/sessions/${id}/messages`, {
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

        try {
            const token = localStorage.getItem("auth_token");
            // Send query with session_id if we have one (Swagger-compliant)
            // Backend will create session if session_id is not provided
            const res = await fetch(`${API_URL}/api/chat/query`, {
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

            const data: BotResponse = await res.json().catch(() => null);
            setLoading(false);

            if (!res.ok || !data) {
                const errorMsg = "Sorry, I encountered an error processing your request. Please try again.";
                setMessages((m) => [
                    ...m,
                    {
                        role: "bot",
                        text: errorMsg,
                    },
                ]);
                return;
            }

            // Update session ID from response (backend creates session if needed)
            if (data.session_id && !currentSessionId) {
                setCurrentSessionId(data.session_id);
                setSessionTitle(text.slice(0, 50) + (text.length > 50 ? "..." : ""));
                onConversationCreated?.(data.session_id);
            }

            const botMessage: Message = {
                role: "bot",
                text: data.can_answer
                    ? "" // Don't show duplicate answer text when we have structured response
                    : "I'm sorry, I don't have enough information to answer that question accurately.",
                response: data,
            };

            setMessages((m) => [...m, botMessage]);
        } catch {
            setLoading(false);
            const errorMsg = "Failed to connect to the server. Please check if the API is running.";
            setMessages((m) => [
                ...m,
                {
                    role: "bot",
                    text: errorMsg,
                },
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
                                                <div className="prose prose-sm max-w-none">
                                                    <AnswerWithCitations
                                                        answer={m.response.answer}
                                                        citations={m.response.citations || []}
                                                        onCitationClick={openPdfModal}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Excerpts Section */}
                                        {m.response.citations && m.response.citations.length > 0 && (
                                            <div className="space-y-3 pt-2">
                                                <h4 className="text-[12px] font-medium uppercase tracking-wider text-[rgba(245,245,245,0.4)]">Sources</h4>
                                                <div className="space-y-2">
                                                    {m.response.citations.map((citation, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="text-[rgba(245,245,245,0.75)] pl-3 border-l-2 border-[rgba(255,255,255,0.15)] py-1"
                                                        >
                                                            <div className="text-[13px] leading-relaxed">
                                                                {citation.excerpt}
                                                            </div>
                                                            <div className="text-[11px] text-[rgba(245,245,245,0.45)] mt-1.5">
                                                                {citation.filename || citation.source} • Page {citation.page_number}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Citations Section */}
                                        {m.response.citations && m.response.citations.length > 0 && (() => {
                                            const consolidated = consolidateCitations(m.response.citations);
                                            return (
                                                <div className="space-y-3 pt-2">
                                                    <h4 className="text-[12px] font-medium uppercase tracking-wider text-[rgba(245,245,245,0.4)]">References</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {consolidated.map((citation, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => openPdfModal(
                                                                    citation.filename,
                                                                    citation.page_number,
                                                                    citation.pdf_path
                                                                )}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(122,163,200,0.1)] hover:bg-[rgba(122,163,200,0.18)] border border-[rgba(122,163,200,0.2)] hover:border-[rgba(122,163,200,0.35)] transition-all duration-150 text-[12px] font-medium text-[#7AA3C8] hover:text-[#9BBDD8]"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                                <span className="truncate max-w-[150px]">{citation.filename}</span>
                                                                <span className="text-[rgba(245,245,245,0.5)]">p.{citation.page_number}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}

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
                                                                            onClick={() => openPdfModal(claim.source, claim.page_number)}
                                                                            className="text-[#7AA3C8] hover:text-[#9BBDD8] hover:underline transition-colors"
                                                                        >
                                                                            {claim.source}, Page {claim.page_number}
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
                            <div className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-3 shadow-sm">
                                <Loader2 className="w-4 h-4 animate-spin text-[rgba(245,245,245,0.5)]" />
                                <span className="text-[14px] text-[rgba(245,245,245,0.6)]">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="shrink-0 p-4 border-t border-[rgba(255,255,255,0.08)] bg-[#0C0C0C]">
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