"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      // Always show a generic success message (avoid email enumeration)
      if (!res.ok) {
        // Still keep it generic; log details in console for local dev
        const data = await res.json().catch(() => null);
        // eslint-disable-next-line no-console
        console.warn("password reset request failed", res.status, data);
      }

      setInfo("If your email is in our system, you will receive a reset link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <h1 className="text-xl font-semibold text-foreground mb-2">Reset your password</h1>
          <p className="text-base text-muted-foreground/75 mb-6">
            Enter your email and we’ll send you a reset link.
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
            <div>
              <label htmlFor="email" className="block text-compact font-medium text-muted-foreground mb-2">
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
                autoComplete="email"
                className={[
                  "w-full px-4 py-3 rounded-xl text-base",
                  "bg-background text-foreground placeholder-[rgba(245,245,245,0.3)]",
                  "border border-input hover:border-border-strong",
                  "focus:outline-none focus:border-[rgba(255,255,255,0.25)] focus:ring-1 focus:ring-[rgba(255,255,255,0.1)]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all duration-150",
                ].join(" ")}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className={[
                "w-full py-3 px-4 rounded-xl text-base font-medium",
                "bg-[#F5F5F5] hover:bg-white text-[#0C0C0C]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-150",
                "shadow-sm hover:shadow-md",
                "flex items-center justify-center gap-2",
              ].join(" ")}
            >
              {isLoading ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-foreground hover:underline transition-colors text-compact">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


