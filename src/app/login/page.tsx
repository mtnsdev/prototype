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

    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [forgotError, setForgotError] = useState("");

    const [showForceChangeModal, setShowForceChangeModal] = useState(false);
    const [forceNewPassword, setForceNewPassword] = useState("");
    const [forceConfirmPassword, setForceConfirmPassword] = useState("");
    const [forceChangeError, setForceChangeError] = useState("");
    const [forceChangeLoading, setForceChangeLoading] = useState(false);
    const [forceChangeSucceeded, setForceChangeSucceeded] = useState(false);

    const redirectUrl = searchParams.get("redirect") || "/dashboard/chat";
    const reason = searchParams.get("reason");
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    useEffect(() => {
        if (reason === "session_expired") {
            setInfo("Your session has expired. Please sign in again.");
        } else if (reason === "password_changed") {
            setInfo("Password updated successfully. Please sign in with your new password.");
        }
    }, [reason]);

    const setAuthCookie = useCallback((token: string) => {
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `auth_token=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
    }, []);

    const handleGoogleCallback = useCallback(
        async (response: { credential: string }) => {
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
                    if (res.status === 403) {
                        router.push("/access-denied");
                        return;
                    }
                    throw new Error(data.detail || "Google sign-in failed");
                }

                localStorage.setItem("auth_token", data.token.access_token);
                localStorage.setItem("user_data", JSON.stringify(data.user));
                setAuthCookie(data.token.access_token);

                router.push(redirectUrl);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Google sign-in failed");
            } finally {
                setIsLoading(false);
            }
        },
        [router, redirectUrl, setAuthCookie]
    );

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
                if (res.status === 403) {
                    router.push("/access-denied?reason=disabled");
                    return;
                }
                throw new Error(data.detail || "Invalid email or password");
            }

            localStorage.setItem("auth_token", data.token.access_token);
            localStorage.setItem("user_data", JSON.stringify(data.user));
            setAuthCookie(data.token.access_token);

            if (data.user?.must_change_password) {
                setShowForceChangeModal(true);
                return;
            }

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
        if (
            forceNewPassword.length < 8 ||
            !/[a-zA-Z]/.test(forceNewPassword) ||
            !/[0-9]/.test(forceNewPassword)
        ) {
            setForceChangeError(
                "Password must be at least 8 characters with at least one letter and one number"
            );
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
                body: JSON.stringify({
                    current_password: password,
                    new_password: forceNewPassword,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to change password");
            }

            succeeded = true;
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user_data");
            document.cookie = "auth_token=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            setForceChangeSucceeded(true);
            router.push("/login?reason=password_changed");
            setTimeout(() => setForceChangeLoading(false), 10000);
        } catch (err) {
            setForceChangeError(err instanceof Error ? err.message : "Failed to change password");
        } finally {
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
        <div
            id="main-content"
            tabIndex={-1}
            className="flex min-h-screen items-center justify-center bg-background px-4 outline-none"
        >
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-input mb-5 shadow-lg">
                        <Image
                            src="/TL_logo.svg"
                            alt="Travel Lustre Logo"
                            width={32}
                            height={32}
                            className="opacity-90"
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">TRAVELLUSTRE</h1>
                    <p className="text-base text-muted-foreground/75 mt-1">Created by Enable VIC</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                    <h2 className="text-lg font-semibold text-foreground mb-1.5">Welcome back</h2>
                    <p className="text-base text-muted-foreground/75 mb-6">
                        Sign in to your account to continue
                    </p>

                    {info && (
                        <div className="mb-5 p-3.5 rounded-xl bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)]">
                            <p className="text-compact text-[var(--color-warning)]">{info}</p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-5 p-3.5 rounded-xl bg-[rgba(200,122,122,0.1)] border border-[rgba(200,122,122,0.2)]">
                            <p className="text-compact text-[var(--color-error)]">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="text-compact text-muted-foreground"
                            >
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
                                className="rounded-xl bg-background border-input py-3"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="password"
                                    className="text-compact text-muted-foreground"
                                >
                                    Password
                                </Label>
                                <Button
                                    type="button"
                                    variant="link"
                                    className="text-sm text-muted-foreground/75 hover:text-muted-foreground p-0 h-auto font-normal"
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
                                className="rounded-xl bg-background border-input py-3"
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

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-card text-muted-foreground/55">
                                or continue with
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <div id="google-signin-button"></div>
                    </div>

                    {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                        <Button
                            type="button"
                            disabled
                            variant="outline"
                            className="w-full py-3 bg-[rgba(255,255,255,0.04)] border-border text-muted-foreground/55 cursor-not-allowed"
                        >
                            Google Sign-In not configured
                        </Button>
                    )}
                </div>

                <p className="text-center text-muted-foreground/55 text-compact mt-6">
                    Don&apos;t have an account?{" "}
                    <a
                        href="#"
                        className="text-foreground hover:underline transition-colors"
                    >
                        Contact admin
                    </a>
                </p>
            </div>

            <Dialog open={showForgotModal} onOpenChange={setShowForgotModal}>
                <DialogContent className="max-w-md border-input bg-card">
                    <DialogHeader>
                        <DialogTitle className="text-[17px] text-foreground">
                            Reset your password
                        </DialogTitle>
                        <p className="text-compact text-muted-foreground/75 mt-1">
                            Enter your email and we&apos;ll send you a temporary password.
                        </p>
                    </DialogHeader>

                    {forgotSuccess ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-[rgba(134,239,172,0.08)] border border-[rgba(134,239,172,0.2)]">
                                <p className="text-base text-[#86EFAC] font-medium mb-1">Check your inbox</p>
                                <p className="text-compact text-muted-foreground">
                                    If an account exists for that email, you&apos;ll receive a temporary password
                                    shortly. Use it to log in, then set a new permanent password.
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
                                    <p className="text-compact text-[var(--color-error)]">{forgotError}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-compact text-muted-foreground">
                                    Email address
                                </Label>
                                <Input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    disabled={forgotLoading}
                                    className="rounded-xl bg-background border-input py-3"
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

            <Dialog open={showForceChangeModal} onOpenChange={() => {}}>
                <DialogContent
                    className="max-w-md border-input bg-card"
                    showCloseButton={false}
                >
                    <DialogHeader>
                        <DialogTitle className="text-[17px] text-foreground">Set a new password</DialogTitle>
                        <p className="text-compact text-muted-foreground/75 mt-1">
                            Your account was set up with a temporary password. You must choose a new password before
                            continuing.
                        </p>
                    </DialogHeader>

                    <form onSubmit={handleForcePasswordChange} className="space-y-4">
                        {forceChangeError && (
                            <div className="p-3.5 rounded-xl bg-[rgba(200,122,122,0.1)] border border-[rgba(200,122,122,0.2)]">
                                <p className="text-compact text-[var(--color-error)]">{forceChangeError}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-compact text-muted-foreground">New Password</Label>
                            <Input
                                type="password"
                                value={forceNewPassword}
                                onChange={(e) => setForceNewPassword(e.target.value)}
                                placeholder="At least 8 characters"
                                required
                                disabled={forceChangeLoading}
                                className="rounded-xl bg-background border-input py-3"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-compact text-muted-foreground">Confirm New Password</Label>
                            <Input
                                type="password"
                                value={forceConfirmPassword}
                                onChange={(e) => setForceConfirmPassword(e.target.value)}
                                placeholder="Repeat new password"
                                required
                                disabled={forceChangeLoading}
                                className="rounded-xl bg-background border-input py-3"
                            />
                        </div>

                        <p className="text-sm text-muted-foreground/55">
                            Must be at least 8 characters with at least one letter and one number.
                        </p>

                        {forceChangeSucceeded && !forceChangeLoading ? (
                            <Button
                                asChild
                                className="w-full py-3 bg-[#F5F5F5] hover:bg-white text-[#0C0C0C]"
                            >
                                <a href="/login?reason=password_changed">Continue to Login →</a>
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={
                                    forceChangeLoading || !forceNewPassword || !forceConfirmPassword
                                }
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
        <Suspense
            fallback={<div className="min-h-screen flex items-center justify-center bg-background" />}
        >
            <LoginContent />
        </Suspense>
    );
}
