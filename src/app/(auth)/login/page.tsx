"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";


export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setLoading(true);

        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        setLoading(false);

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setErr(data?.error || "Login failed");
            return;
        }

        router.push("/dashboard");
    }

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
            {/* LEFT SIDE */}
            <div className="hidden md:flex items-center justify-center bg-gray-100">
                <div className="w-3/4 h-3/4 border-3 border-dashed border-gray-300 rounded-xl flex items-center justify-center" >
                    <p className="text-black font-bold  text-8xl ">PlaceHolder</p>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center justify-center">
                <div className="w-full max-w-md px-6">
                    <h1 className="text-2xl font-semibold mb-6">Login</h1>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                                required
                            />
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-md border border-gray-500 bg-transparent px-3 py-2 pr-10  text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-2/3 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {err && (
                            <p className="text-sm text-red-600">{err}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-md bg-black py-2 text-white hover:bg-gray-800 disabled:opacity-50 font-bold"
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
