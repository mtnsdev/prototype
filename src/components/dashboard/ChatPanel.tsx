"use client";

import { useState } from "react";

type Msg = { role: "user" | "bot"; text: string };

export default function ChatPanel() {
    const [messages, setMessages] = useState<Msg[]>([
        { role: "bot", text: "This is the chat area. Replace with real bot later." },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    async function send() {
        const text = input.trim();
        if (!text || loading) return;

        setInput("");
        setMessages((m) => [...m, { role: "user", text }]);
        setLoading(true);

        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text }),
        });

        const data = await res.json().catch(() => null);
        setLoading(false);

        if (!res.ok) {
            setMessages((m) => [...m, { role: "bot", text: data?.error || "Error" }]);
            return;
        }

        setMessages((m) => [...m, { role: "bot", text: data.reply }]);
    }

    return (
        <section className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-white/10">
                <h2 className="text-sm font-semibold">Chat</h2>
                <p className="text-xs text-white/60 mt-1">Left panel workspace</p>
            </div>

            <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={[
                            "max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                            m.role === "user"
                                ? "ml-auto bg-white text-black"
                                : "mr-auto bg-white/10 text-white",
                        ].join(" ")}
                    >
                        {m.text}
                    </div>
                ))}

                {loading && (
                    <div className="mr-auto bg-white/10 text-white rounded-lg px-3 py-2 text-sm">
                        Thinking...
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
