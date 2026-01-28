"use client";

import { useState } from "react";
import { FileText, AlertTriangle, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import PdfModal from "./PdfModal";
import { backendUrl } from "@/lib/claromentis/backendApi";

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

// Function to get PDF preview URL from filename and page number
function getPdfPreviewUrlFromFilename(filename: string, pageNumber: number | string, pdfPath?: string): string {
    // Extract filename from pdf_path if it's a full path, otherwise use filename
    let finalFilename = filename;
    
    if (pdfPath) {
        // If pdf_path contains a filename, extract it
        const pathParts = pdfPath.split(/[/\\]/);
        const pdfFilename = pathParts[pathParts.length - 1];
        if (pdfFilename && pdfFilename.endsWith('.pdf')) {
            finalFilename = pdfFilename;
        } else if (!finalFilename.endsWith('.pdf') && pdfFilename) {
            finalFilename = pdfFilename;
        }
    }
    
    // Ensure filename has .pdf extension if not present
    if (!finalFilename.endsWith('.pdf')) {
        finalFilename = `${finalFilename}.pdf`;
    }
    
    // Build the PDF preview URL with page parameter
    const baseUrl = backendUrl(`/api/document/pdf/${encodeURIComponent(finalFilename)}`);
    const url = new URL(baseUrl);
    url.searchParams.set('page', String(pageNumber));
    
    return url.toString();
}

export default function ChatPanel() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "bot", text: "Hello! I'm here to help answer your questions. What would you like to know?" },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
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

    async function send() {
        const text = input.trim();
        if (!text || loading) return;

        setInput("");
        setMessages((m) => [...m, { role: "user", text }]);
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: text }),
            });

            const data: BotResponse = await res.json().catch(() => null);
            setLoading(false);

            if (!res.ok || !data) {
                setMessages((m) => [
                    ...m,
                    {
                        role: "bot",
                        text: "Sorry, I encountered an error processing your request. Please try again.",
                    },
                ]);
                return;
            }

            setMessages((m) => [
                ...m,
                {
                    role: "bot",
                    text: data.can_answer
                        ? "" // Don't show duplicate answer text when we have structured response
                        : "I'm sorry, I don't have enough information to answer that question accurately.",
                    response: data,
                },
            ]);
        } catch {
            setLoading(false);
            setMessages((m) => [
                ...m,
                {
                    role: "bot",
                    text: "Failed to connect to the server. Please check if the API is running.",
                },
            ]);
        }
    }

    return (
        <>
            <section className="h-full flex flex-col">
                <div className="px-4 py-3 border-b border-white/10">
                    <h2 className="text-sm font-semibold">Chat</h2>
                    <p className="text-xs text-white/60 mt-1">Ask questions about your documents</p>
                </div>

                <div className="flex-1 overflow-auto px-4 py-4 space-y-6">
                    {messages.map((m, i) => (
                        <div key={i} className="space-y-3">
                            {/* User Message */}
                            {m.role === "user" && (
                                <div className="ml-auto max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed shadow-sm bg-linear-gradient-to-br from-white to-white/95 text-black font-medium">
                                    {m.text}
                                </div>
                            )}

                            {/* Bot Response */}
                            {m.role === "bot" && m.response && (
                                <div className="mr-auto max-w-[85%] bg-linear-gradient-to-br from-white/10 to-white/5 text-white backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-6 shadow-lg">
                                    {/* Status Indicators */}
                                    {m.response.can_answer && (
                                        <div className="flex items-center gap-4 text-xs text-white/70 border-b border-white/10 pb-3">
                                            <span className="flex items-center gap-1 text-green-400/80">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Can answer
                                            </span>
                                        </div>
                                    )}

                                    {/* Answer Section */}
                                    {m.response.answer && (
                                        <div className="space-y-2">
                                            <div className="prose prose-sm max-w-none text-white/90 prose-headings:font-semibold prose-headings:text-white prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-strong:text-white">
                                                <ReactMarkdown
                                                    components={{
                                                        p: ({ children }) => <p className="mb-2 text-white/90">{children}</p>,
                                                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-white/90">{children}</ul>,
                                                        li: ({ children }) => <li className="ml-4 text-white/90">{children}</li>,
                                                        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                                                        h1: ({ children }) => <h1 className="text-white font-semibold">{children}</h1>,
                                                        h2: ({ children }) => <h2 className="text-white font-semibold">{children}</h2>,
                                                        h3: ({ children }) => <h3 className="text-white font-semibold">{children}</h3>,
                                                    }}
                                                >
                                                    {m.response.answer}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}

                                    {/* Excerpts Section */}
                                    {m.response.citations && m.response.citations.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-semibold text-white">Excerpts:</h3>
                                            <ul className="space-y-3 list-disc list-inside">
                                                {m.response.citations.map((citation, idx) => (
                                                    <li key={idx} className="text-white/90">
                                                        <span className="text-sm">
                                                            {citation.excerpt}
                                                        </span>
                                                        <span className="text-xs text-white/60 ml-2">
                                                            [Source: {citation.filename || citation.source}, Page: {citation.page_number}]
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Citations Section */}
                                    {m.response.citations && m.response.citations.length > 0 && (() => {
                                        const consolidated = consolidateCitations(m.response.citations);
                                        return (
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-semibold text-white">Citations:</h3>
                                                <ul className="space-y-2 list-disc list-inside">
                                                    {consolidated.map((citation, idx) => (
                                                        <li key={idx} className="text-white/90">
                                                            <button
                                                                onClick={() => openPdfModal(
                                                                    citation.filename,
                                                                    citation.page_number,
                                                                    citation.pdf_path
                                                                )}
                                                                className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 transition-colors"
                                                            >
                                                                {citation.filename} (Page {citation.page_number})
                                                                <ExternalLink className="w-3 h-3" />
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })()}

                                    {/* Conflicts / Disagreements Section */}
                                    {m.response.conflicts && m.response.conflicts.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="text-lg font-semibold text-white">Conflicts / Disagreements:</h3>
                                            {m.response.conflicts.map((conflict, idx) => (
                                                <div key={idx} className="bg-amber-500/20 border-l-4 border-amber-400/50 p-4 rounded">
                                                    <h4 className="font-semibold text-amber-200 mb-2 flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        {conflict.attribute.replace(/_/g, " ")}
                                                    </h4>
                                                    <ul className="space-y-2 ml-6">
                                                        {conflict.claims.map((claim, claimIdx) => (
                                                            <li key={claimIdx} className="text-white/90">
                                                                <div className="font-medium mb-1 text-white">
                                                                    Claim {claimIdx + 1}:
                                                                </div>
                                                                <div className="text-sm mb-2">
                                                                    {claim.claim}
                                                                </div>
                                                                {claim.excerpt && (
                                                                    <div className="text-xs text-white/70 italic mb-1 pl-3 border-l-2 border-amber-400/50">
                                                                        &ldquo;{claim.excerpt}&rdquo;
                                                                    </div>
                                                                )}
                                                                <div className="text-xs text-white/70">
                                                                    <button
                                                                        onClick={() => openPdfModal(claim.source, claim.page_number)}
                                                                        className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                                                                    >
                                                                        ({claim.source}, Page {claim.page_number})
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


                                    {/* Conflicting Information Warning */}
                                    {m.response.conflicts && m.response.conflicts.length > 0 && (
                                        <div className="bg-amber-500/15 border-l-4 border-amber-400/50 p-4 rounded">
                                            <div className="flex items-start gap-2 mb-2">
                                                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-amber-200 mb-2">Conflicting Information:</h4>
                                                    {m.response.conflicts.map((conflict, idx) => (
                                                        <div key={idx} className="mb-3 last:mb-0">
                                                            <div className="font-medium text-amber-200 mb-1">
                                                                {conflict.attribute.replace(/_/g, " ")}:
                                                            </div>
                                                            <ul className="list-disc list-inside space-y-1 ml-2">
                                                                {conflict.claims.map((claim, claimIdx) => (
                                                                    <li key={claimIdx} className="text-sm text-white/90">
                                                                        {claim.claim}
                                                                        <button
                                                                            onClick={() => openPdfModal(claim.source, claim.page_number)}
                                                                            className="text-xs text-blue-400 hover:text-blue-300 hover:underline ml-1 transition-colors"
                                                                        >
                                                                            ({claim.source}, Page {claim.page_number})
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Simple Bot Message (no response data) */}
                            {m.role === "bot" && !m.response && m.text && (
                                <div className="mr-auto max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed shadow-sm bg-gradient-to-br from-white/10 to-white/5 text-white backdrop-blur-sm border border-white/10">
                                    {m.text}
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="mr-auto max-w-[85%] bg-white/10 text-white rounded-xl px-4 py-3 text-sm flex items-center gap-2 border border-white/10">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Thinking...</span>
                        </div>
                    )}
                </div>

                <div className="p-3 border-t border-white/10">
                    <div className="flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
                            placeholder="Ask about products, destinations..."
                            className="flex-1 rounded-md border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                        <button
                            type="button"
                            onClick={send}
                            disabled={loading}
                            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-50"
                        >
                            Send
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
