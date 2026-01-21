"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);

        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setErr(data?.error || "Login failed");
            return;
        }

        router.push("/chat");
    }

    return (
        <main style={{ maxWidth: 420, margin: "40px auto" }}>
            <h1>Login</h1>
            <form onSubmit={onSubmit}>
                <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit">Login</button>
            </form>
            {err ? <p style={{ color: "red" }}>{err}</p> : null}
            {/* <p>
                No account? <a href="/signup">Sign up</a>
            </p> */}
        </main>
    );
}
