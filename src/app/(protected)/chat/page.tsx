"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Msg = { role: "user" | "bot"; text: string };

export default function ChatPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // sanity-check session; middleware already blocks, but this helps UX
        fetch("/api/auth/me").then(async (r) => {
            const data = await r.json();
            if (!data?.user) router.push("/login");
        });
    }, [router]);

    async function send() {
        if (!input.trim() || loading) return;
        const text = input.trim();
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

    async function logout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    }

    return (
        <main style={{ maxWidth: 700, margin: "40px auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1>Chat</h1>
                <button onClick={logout}>Logout</button>
            </div>

            <div style={{ border: "1px solid #ddd", padding: 12, minHeight: 300, borderRadius: 8 }}>
                {messages.map((m, i) => (
                    <div key={i} style={{ margin: "8px 0" }}>
                        <strong>{m.role === "user" ? "You" : "Bot"}:</strong> {m.text}
                    </div>
                ))}
                {loading ? <p>Thinking...</p> : null}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message"
                    style={{ flex: 1 }}
                    onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
                />
                <button onClick={send}>Send</button>
            </div>
        </main>
    );
}
