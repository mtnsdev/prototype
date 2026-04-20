"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!token) {
      setError("Missing reset token.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          (data && typeof data === "object" && "detail" in data && typeof (data as any).detail === "string"
            ? (data as any).detail
            : null) || "Reset failed.";
        throw new Error(msg);
      }

      setInfo("Password reset successfully. Redirecting to sign in…");
      setTimeout(() => router.push("/login"), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <h1 className="text-xl font-semibold text-foreground mb-2">Set a new password</h1>
          <p className="text-base text-muted-foreground/75 mb-6">
            Choose a new password for your account.
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
              <label
                htmlFor="newPassword"
                className="block text-compact font-medium text-muted-foreground mb-2"
              >
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                autoComplete="new-password"
                className={[
                  "w-full px-4 py-3 rounded-xl text-base",
                  "bg-background text-foreground placeholder-[rgba(245,245,245,0.3)]",
                  "border border-input hover:border-border-strong",
                  "focus:outline-none focus:border-primary/35 focus:ring-1 focus:ring-ring/25",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all duration-150",
                ].join(" ")}
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block text-compact font-medium text-muted-foreground mb-2"
              >
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                autoComplete="new-password"
                className={[
                  "w-full px-4 py-3 rounded-xl text-base",
                  "bg-background text-foreground placeholder-[rgba(245,245,245,0.3)]",
                  "border border-input hover:border-border-strong",
                  "focus:outline-none focus:border-primary/35 focus:ring-1 focus:ring-ring/25",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all duration-150",
                ].join(" ")}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !newPassword || !confirm}
              className={[
                "w-full py-3 px-4 rounded-xl text-base font-medium",
                "bg-[#F5F5F5] hover:bg-white text-[#0C0C0C]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-150",
                "shadow-sm hover:shadow-md",
                "flex items-center justify-center gap-2",
              ].join(" ")}
            >
              {isLoading ? "Updating…" : "Update password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}


