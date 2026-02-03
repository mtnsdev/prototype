"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Image from "next/image";

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: { credential: string }) => void;
                    }) => void;
                    renderButton: (
                        element: HTMLElement,
                        config: {
                            theme: string;
                            size: string;
                            width: number;
                            text: string;
                            locale?: string;
                        }
                    ) => void;
                };
            };
        };
    }
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Initialize Google Sign-In
    useEffect(() => {
        const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!googleClientId) return;

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client?hl=en";
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: googleClientId,
                    callback: handleGoogleCallback,
                });

                const buttonDiv = document.getElementById("google-signin-button");
                if (buttonDiv) {
                    window.google.accounts.id.renderButton(buttonDiv, {
                        theme: "outline",
                        size: "large",
                        width: 320,
                        text: "signin_with",
                        locale: "en",
                    });
                }
            }
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleGoogleCallback = async (response: { credential: string }) => {
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: response.credential }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Google sign-in failed");
            }

            // Store token and user data in localStorage
            localStorage.setItem("auth_token", data.token.access_token);
            localStorage.setItem("user_data", JSON.stringify(data.user));

            // Redirect to dashboard
            router.push("/dashboard/chat");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Google sign-in failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Invalid email or password");
            }

            // Store token and user data in localStorage
            localStorage.setItem("auth_token", data.token.access_token);
            localStorage.setItem("user_data", JSON.stringify(data.user));

            // Redirect to dashboard
            router.push("/dashboard/chat");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sign in failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0C0C0C] px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 mb-5 shadow-lg">
                        <Image
                            src="/TL_logo.svg"
                            alt="Enable Logo"
                            width={32}
                            height={32}
                            className="opacity-90"
                        />
                    </div>
                    <h1 className="text-[28px] font-bold text-[#F5F5F5] tracking-tight">Enable</h1>
                    <p className="text-[14px] text-[rgba(245,245,245,0.45)] mt-1">AI Assistant</p>
                </div>

                {/* Card */}
                <div className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 shadow-xl">
                    <h2 className="text-[18px] font-semibold text-[#F5F5F5] mb-1.5">Welcome back</h2>
                    <p className="text-[14px] text-[rgba(245,245,245,0.5)] mb-6">Sign in to your account to continue</p>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-5 p-3.5 rounded-xl bg-[rgba(200,122,122,0.1)] border border-[rgba(200,122,122,0.2)]">
                            <p className="text-[13px] text-[#C87A7A]">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-[13px] font-medium text-[rgba(245,245,245,0.7)] mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                disabled={isLoading}
                                className={[
                                    "w-full px-4 py-3 rounded-xl text-[14px]",
                                    "bg-[#0C0C0C] text-[#F5F5F5] placeholder-[rgba(245,245,245,0.3)]",
                                    "border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.15)]",
                                    "focus:outline-none focus:border-[rgba(255,255,255,0.25)] focus:ring-1 focus:ring-[rgba(255,255,255,0.1)]",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "transition-all duration-150",
                                ].join(" ")}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-[13px] font-medium text-[rgba(245,245,245,0.7)] mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                                className={[
                                    "w-full px-4 py-3 rounded-xl text-[14px]",
                                    "bg-[#0C0C0C] text-[#F5F5F5] placeholder-[rgba(245,245,245,0.3)]",
                                    "border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.15)]",
                                    "focus:outline-none focus:border-[rgba(255,255,255,0.25)] focus:ring-1 focus:ring-[rgba(255,255,255,0.1)]",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "transition-all duration-150",
                                ].join(" ")}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={[
                                "w-full py-3 px-4 rounded-xl text-[14px] font-medium",
                                "bg-[#F5F5F5] hover:bg-white text-[#0C0C0C]",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                "transition-all duration-150",
                                "shadow-sm hover:shadow-md",
                                "flex items-center justify-center gap-2",
                            ].join(" ")}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[rgba(255,255,255,0.08)]"></div>
                        </div>
                        <div className="relative flex justify-center text-[12px]">
                            <span className="px-4 bg-[#161616] text-[rgba(245,245,245,0.4)]">or continue with</span>
                        </div>
                    </div>

                    {/* Google Sign-In Button */}
                    <div className="flex justify-center">
                        <div id="google-signin-button"></div>
                    </div>

                    {/* Fallback Google Button (if script fails to load) */}
                    {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                        <button
                            type="button"
                            disabled
                            className={[
                                "w-full py-3 px-4 rounded-xl text-[14px] font-medium",
                                "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]",
                                "text-[rgba(245,245,245,0.4)]",
                                "flex items-center justify-center gap-3 cursor-not-allowed",
                            ].join(" ")}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Google Sign-In not configured
                        </button>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-[rgba(245,245,245,0.4)] text-[13px] mt-6">
                    Don&apos;t have an account?{" "}
                    <a href="#" className="text-[#F5F5F5] hover:underline transition-colors">
                        Contact admin
                    </a>
                </p>
            </div>
        </div>
    );
}
