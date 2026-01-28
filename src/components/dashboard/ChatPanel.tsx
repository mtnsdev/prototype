"use client";

import { useState } from "react";
import { FileText, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

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
};

type Message = {
    role: "user" | "bot";
    text: string;
    response?: BotResponse;
};

export default function ChatPanel() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "bot", text: "Hello! I'm here to help answer your questions. What would you like to know?" },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

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
                        ? data.answer
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
        <section className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-white/10">
                <h2 className="text-sm font-semibold">Chat</h2>
                <p className="text-xs text-white/60 mt-1">Ask questions about your documents</p>
            </div>

            <div className="flex-1 overflow-auto px-4 py-4 space-y-6">
                {messages.map((m, i) => (
                    <div key={i} className="space-y-3">
                        <div
                            className={[
                                "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all",
                                m.role === "user"
                                    ? "ml-auto bg-gradient-to-br from-white to-white/95 text-black font-medium"
                                    : "mr-auto bg-gradient-to-br from-white/10 to-white/5 text-white backdrop-blur-sm border border-white/10",
                            ].join(" ")}
                        >
                            {m.text}
                        </div>

                        {m.role === "bot" && m.response && (
                            <div className="mr-auto max-w-[85%] space-y-4">
                                {m.response.can_answer && (
                                    <div className="flex items-start gap-2 text-green-400/80 mb-2">
                                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span className="text-xs font-medium">Confident Answer</span>
                                    </div>
                                )}

                                {m.response.citations && m.response.citations.length > 0 && (
                                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/5 rounded-xl p-4 border border-blue-500/20 shadow-lg backdrop-blur-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FileText className="w-4 h-4 text-blue-400" />
                                            <h4 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                                                Sources ({m.response.citations.length})
                                            </h4>
                                        </div>
                                        <div className="space-y-3">
                                            {m.response.citations.map((citation, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-white/5 rounded-lg p-3 border-l-4 border-blue-400/50 hover:bg-white/10 transition-colors group"
                                                >
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-semibold text-white/95 text-sm flex items-center gap-2">
                                                                <FileText className="w-3.5 h-3.5 text-blue-400/70 shrink-0" />
                                                                <span className="truncate">{citation.filename}</span>
                                                            </div>
                                                            {citation.source !== citation.filename && (
                                                                <div className="text-xs text-white/60 mt-1 ml-5">
                                                                    Source: {citation.source}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-medium text-blue-400/80 bg-blue-500/20 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                                                            Page {citation.page_number}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 text-white/75 text-xs leading-relaxed pl-5 border-l-2 border-white/10 italic">
                                                        &ldquo;{citation.excerpt}&rdquo;
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {m.response.conflicts && m.response.conflicts.length > 0 && (
                                    <div className="bg-gradient-to-br from-amber-500/15 to-orange-500/10 rounded-xl p-4 border-2 border-amber-500/30 shadow-lg backdrop-blur-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                                            <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                                                Conflicting Information
                                            </h4>
                                        </div>
                                        <div className="space-y-4">
                                            {m.response.conflicts.map((conflict, idx) => (
                                                <div key={idx} className="space-y-2">
                                                    <div className="font-semibold text-amber-200 text-sm flex items-center gap-2">
                                                        <AlertTriangle className="w-3.5 h-3.5" />
                                                        {conflict.attribute.replace(/_/g, " ")}
                                                    </div>
                                                    <div className="space-y-2 pl-5">
                                                        {conflict.claims.map((claim, claimIdx) => (
                                                            <div
                                                                key={claimIdx}
                                                                className="bg-white/10 rounded-lg p-3 border border-amber-500/20 hover:bg-white/15 transition-colors"
                                                            >
                                                                <div className="text-white/95 text-sm mb-2 leading-relaxed">
                                                                    {claim.claim}
                                                                </div>
                                                                {claim.excerpt && (
                                                                    <div className="text-white/70 text-xs mb-2 pl-3 border-l-2 border-amber-500/30 italic">
                                                                        &ldquo;{claim.excerpt}&rdquo;
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-3 text-xs text-white/60 flex-wrap">
                                                                    <span className="flex items-center gap-1">
                                                                        <FileText className="w-3 h-3 shrink-0" />
                                                                        {claim.source}
                                                                    </span>
                                                                    <span className="text-white/40">•</span>
                                                                    <span>Page {claim.page_number}</span>
                                                                    <span className="text-white/40">•</span>
                                                                    <span className="text-amber-300/80">
                                                                        Effective: {claim.effective_date}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                        placeholder="Type a message..."
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
    );
}
