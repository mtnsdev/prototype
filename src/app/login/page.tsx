"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

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

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Forgot password state
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [forgotError, setForgotError] = useState("");

    // Forced password change state
    const [showForceChangeModal, setShowForceChangeModal] = useState(false);
    const [forceNewPassword, setForceNewPassword] = useState("");
    const [forceConfirmPassword, setForceConfirmPassword] = useState("");
    const [forceChangeError, setForceChangeError] = useState("");
    const [forceChangeLoading, setForceChangeLoading] = useState(false);
    const [forceChangeSucceeded, setForceChangeSucceeded] = useState(false);

    // Get redirect URL and reason from query params
    const redirectUrl = searchParams.get("redirect") || "/dashboard/chat";
    const reason = searchParams.get("reason");
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    // Show session expired / password changed messages
    useEffect(() => {
        if (reason === "session_expired") {
            setInfo("Your session has expired. Please sign in again.");
        } else if (reason === "password_changed") {
            setInfo("Password updated successfully. Please sign in with your new password.");
        }
    }, [reason]);

    const setAuthCookie = useCallback((token: string) => {
        // `src/proxy.ts` runs server-side and cannot read localStorage.
        // Mirror the token into a cookie so route protection can see it.
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `auth_token=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
    }, []);

    const handleGoogleCallback = useCallback(async (response: { credential: string }) => {
        setIsLoading(true);
        setError("");
        setInfo("");

        try {
            const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: response.credential }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Handle access denied (not invited)
                if (res.status === 403) {
                    router.push("/access-denied");
                    return;
                }
                throw new Error(data.detail || "Google sign-in failed");
            }

            // Store token and user data in localStorage
            localStorage.setItem("auth_token", data.token.access_token);
            localStorage.setItem("user_data", JSON.stringify(data.user));
            setAuthCookie(data.token.access_token);

            // Redirect to requested page or dashboard
            router.push(redirectUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Google sign-in failed");
        } finally {
            setIsLoading(false);
        }
    }, [router, redirectUrl, setAuthCookie]);

    // Initialize Google Sign-In
    useEffect(() => {
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
    }, [googleClientId, handleGoogleCallback]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setInfo("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Handle access denied (disabled account)
                if (res.status === 403) {
                    router.push("/access-denied?reason=disabled");
                    return;
                }
                throw new Error(data.detail || "Invalid email or password");
            }

            // Store token and user data in localStorage
            localStorage.setItem("auth_token", data.token.access_token);
            localStorage.setItem("user_data", JSON.stringify(data.user));
            setAuthCookie(data.token.access_token);

            // If the user was given a temporary password, force them to change it first
            if (data.user?.must_change_password) {
                setShowForceChangeModal(true);
                return;
            }

            // Redirect to requested page or dashboard
            router.push(redirectUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sign in failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleForcePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setForceChangeError("");

        if (forceNewPassword !== forceConfirmPassword) {
            setForceChangeError("Passwords do not match");
            return;
        }
        if (forceNewPassword.length < 8 || !/[a-zA-Z]/.test(forceNewPassword) || !/[0-9]/.test(forceNewPassword)) {
            setForceChangeError("Password must be at least 8 characters with at least one letter and one number");
            return;
        }

        setForceChangeLoading(true);
        let succeeded = false;
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch("/api/auth/me/password", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ current_password: password, new_password: forceNewPassword }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to change password");
            }

            succeeded = true;
            // Clear the now-invalid session and redirect to login with success message
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user_data");
            document.cookie = "auth_token=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            setForceChangeSucceeded(true);
            router.push("/login?reason=password_changed");
            // Fallback: if navigation hasn't completed in 10s, show a manual button
            setTimeout(() => setForceChangeLoading(false), 10000);
        } catch (err) {
            setForceChangeError(err instanceof Error ? err.message : "Failed to change password");
        } finally {
            // Keep button disabled after success so the user cannot re-submit
            // while the router navigates away
            if (!succeeded) {
                setForceChangeLoading(false);
            }
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotError("");
        setForgotLoading(true);
        try {
            await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: forgotEmail }),
            });
            setForgotSuccess(true);
        } catch {
            setForgotError("Something went wrong. Please try again.");
        } finally {
            setForgotLoading(false);
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
                            alt="Travel Lustre Logo"
                            width={32}
                            height={32}
                            className="opacity-90"
                        />
                    </div>
                    <h1 className="text-[28px] font-bold text-[#F5F5F5] tracking-tight">TRAVELLUSTRE</h1>
                    <p className="text-[14px] text-[rgba(245,245,245,0.45)] mt-1">Created by Enable VIC</p>
                </div>

                {/* Card */}
                <div className="bg-[#161616] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 shadow-xl">
                    <h2 className="text-[18px] font-semibold text-[#F5F5F5] mb-1.5">Welcome back</h2>
                    <p className="text-[14px] text-[rgba(245,245,245,0.5)] mb-6">Sign in to your account to continue</p>

                    {/* Info Message */}
                    {info && (
                        <div className="mb-5 p-3.5 rounded-xl bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)]">
                            <p className="text-[13px] text-amber-400">{info}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-5 p-3.5 rounded-xl bg-[rgba(200,122,122,0.1)] border border-[rgba(200,122,122,0.2)]">
                            <p className="text-[13px] text-[#C87A7A]">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[13px] text-[rgba(245,245,245,0.7)]">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                disabled={isLoading}
                                className="rounded-xl bg-[#0C0C0C] border-[rgba(255,255,255,0.1)] py-3"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-[13px] text-[rgba(245,245,245,0.7)]">
                                    Password
                                </Label>
                                <Button
                                    type="button"
                                    variant="link"
                                    className="text-[12px] text-[rgba(245,245,245,0.45)] hover:text-[rgba(245,245,245,0.75)] p-0 h-auto font-normal"
                                    onClick={() => {
                                        setForgotEmail(email);
                                        setForgotSuccess(false);
                                        setForgotError("");
                                        setShowForgotModal(true);
                                    }}
                                >
                                    Forgot password?
                                </Button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                                className="rounded-xl bg-[#0C0C0C] border-[rgba(255,255,255,0.1)] py-3"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-[#F5F5F5] hover:bg-white text-[#0C0C0C]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
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
                        <Button
                            type="button"
                            disabled
                            variant="outline"
                            className="w-full py-3 bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[rgba(245,245,245,0.4)] cursor-not-allowed"
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
                        </Button>
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

            {/* Forgot password modal */}
            <Dialog open={showForgotModal} onOpenChange={setShowForgotModal}>
                <DialogContent className="max-w-md border-[rgba(255,255,255,0.1)] bg-[#161616]">
                    <DialogHeader>
                        <DialogTitle className="text-[17px] text-[#F5F5F5]">Reset your password</DialogTitle>
                        <p className="text-[13px] text-[rgba(245,245,245,0.5)] mt-1">
                            Enter your email and we&apos;ll send you a temporary password.
                        </p>
                    </DialogHeader>

                    {forgotSuccess ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-[rgba(134,239,172,0.08)] border border-[rgba(134,239,172,0.2)]">
                                <p className="text-[14px] text-[#86EFAC] font-medium mb-1">Check your inbox</p>
                                <p className="text-[13px] text-[rgba(245,245,245,0.6)]">
                                    If an account exists for that email, you&apos;ll receive a temporary password shortly.
                                    Use it to log in, then set a new permanent password.
                                </p>
                            </div>
                            <Button
                                type="button"
                                onClick={() => setShowForgotModal(false)}
                                className="w-full py-3 bg-[#F5F5F5] hover:bg-white text-[#0C0C0C]"
                            >
                                Back to Login
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            {forgotError && (
                                <div className="p-3.5 rounded-xl bg-[rgba(200,122,122,0.1)] border border-[rgba(200,122,122,0.2)]">
                                    <p className="text-[13px] text-[#C87A7A]">{forgotError}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-[13px] text-[rgba(245,245,245,0.7)]">Email address</Label>
                                <Input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    disabled={forgotLoading}
                                    className="rounded-xl bg-[#0C0C0C] border-[rgba(255,255,255,0.1)] py-3"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={forgotLoading || !forgotEmail}
                                className="w-full py-3 bg-[#F5F5F5] hover:bg-white text-[#0C0C0C]"
                            >
                                {forgotLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    "Send email"
                                )}
                            </Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Forced password change modal */}
            <Dialog open={showForceChangeModal} onOpenChange={() => {}}>
                <DialogContent className="max-w-md border-[rgba(255,255,255,0.1)] bg-[#161616]" showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle className="text-[17px] text-[#F5F5F5]">Set a new password</DialogTitle>
                        <p className="text-[13px] text-[rgba(245,245,245,0.5)] mt-1">
                            Your account was set up with a temporary password. You must choose a new password before continuing.
                        </p>
                    </DialogHeader>

                    <form onSubmit={handleForcePasswordChange} className="space-y-4">
                        {forceChangeError && (
                            <div className="p-3.5 rounded-xl bg-[rgba(200,122,122,0.1)] border border-[rgba(200,122,122,0.2)]">
                                <p className="text-[13px] text-[#C87A7A]">{forceChangeError}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-[13px] text-[rgba(245,245,245,0.7)]">New Password</Label>
                            <Input
                                type="password"
                                value={forceNewPassword}
                                onChange={(e) => setForceNewPassword(e.target.value)}
                                placeholder="At least 8 characters"
                                required
                                disabled={forceChangeLoading}
                                className="rounded-xl bg-[#0C0C0C] border-[rgba(255,255,255,0.1)] py-3"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[13px] text-[rgba(245,245,245,0.7)]">Confirm New Password</Label>
                            <Input
                                type="password"
                                value={forceConfirmPassword}
                                onChange={(e) => setForceConfirmPassword(e.target.value)}
                                placeholder="Repeat new password"
                                required
                                disabled={forceChangeLoading}
                                className="rounded-xl bg-[#0C0C0C] border-[rgba(255,255,255,0.1)] py-3"
                            />
                        </div>

                        <p className="text-[12px] text-[rgba(245,245,245,0.4)]">
                            Must be at least 8 characters with at least one letter and one number.
                        </p>

                        {forceChangeSucceeded && !forceChangeLoading ? (
                            <Button asChild className="w-full py-3 bg-[#F5F5F5] hover:bg-white text-[#0C0C0C]">
                                <a href="/login?reason=password_changed">Continue to Login →</a>
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={forceChangeLoading || !forceNewPassword || !forceConfirmPassword}
                                className="w-full py-3 bg-[#F5F5F5] hover:bg-white text-[#0C0C0C]"
                            >
                                {forceChangeLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Set New Password"
                                )}
                            </Button>
                        )}
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0C0C0C]" />}>
            <LoginContent />
        </Suspense>
    );
}
