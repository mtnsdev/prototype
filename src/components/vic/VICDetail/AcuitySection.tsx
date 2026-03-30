"use client";

import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import type { VIC } from "@/types/vic";
import { triggerAcuitySingle, getVICId } from "@/lib/vic-api";
import { Button } from "@/components/ui/button";
import AcuityStatusBadge from "../AcuityStatusBadge";
import { cn } from "@/lib/utils";

type Props = {
  vic: VIC;
  onUpdate: () => void;
};

function formatDate(iso: string | undefined) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return null;
  }
}

function confidenceBadgeClass(level: string): string {
  switch (level.toUpperCase()) {
    case "HIGH":
      return "bg-[var(--muted-success-bg)] text-[var(--muted-success-text)] border border-[var(--muted-success-border)]";
    case "MEDIUM":
      return "bg-[var(--muted-amber-bg)] text-[var(--muted-amber-text)] border border-[var(--muted-amber-border)]";
    case "LOW":
      return "bg-[var(--muted-error-bg)] text-[var(--muted-error-text)] border border-[var(--muted-error-border)]";
    default:
      return "bg-white/10 text-muted-foreground";
  }
}

function SectionHeader({ children, ...props }: React.ComponentPropsWithoutRef<"h2">) {
  return (
    <h2 {...props} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-2 first:mt-0 border-b border-border pb-1.5">
      {children}
    </h2>
  );
}

function H3Header({ children, ...props }: React.ComponentPropsWithoutRef<"h3">) {
  return (
    <h3 {...props} className="text-sm font-semibold text-foreground mt-3 mb-1.5">
      {children}
    </h3>
  );
}

export default function AcuitySection({ vic, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setError(null);
    setLoading(true);
    try {
      await triggerAcuitySingle(getVICId(vic));
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run Acuity");
    } finally {
      setLoading(false);
    }
  };

  const acuityStatus = vic.acuity_status ?? (vic as unknown as { acuityStatus?: string }).acuityStatus;
  if (acuityStatus === "not_run") {
    return (
      <section id="acuity" className="rounded-xl border border-border bg-[rgba(255,255,255,0.03)] p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Acuity Intelligence Profile</h3>
        <p className="text-sm text-muted-foreground mb-4">
          No intelligence profile yet. Run Acuity to generate a detailed profile for this VIC.
        </p>
        <Button onClick={handleRun} disabled={loading}>
          {loading ? "Running…" : "Run Acuity"}
        </Button>
      </section>
    );
  }

  if (acuityStatus === "running") {
    return (
      <section id="acuity" className="rounded-xl border border-border bg-[rgba(255,255,255,0.03)] p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Acuity Intelligence Profile</h3>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/10 rounded w-full" />
          <div className="h-4 bg-white/10 rounded w-5/6" />
        </div>
        <p className="text-sm text-[var(--muted-info-text)] mt-3">Running Acuity…</p>
      </section>
    );
  }

  if (acuityStatus === "failed") {
    return (
      <section id="acuity" className="rounded-xl border border-border bg-[rgba(255,255,255,0.03)] p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Acuity Intelligence Profile</h3>
        <p className="text-sm text-[var(--muted-error-text)] mb-4">Acuity failed for this VIC.</p>
        <Button onClick={handleRun} disabled={loading}>
          {loading ? "Retrying…" : "Retry"}
        </Button>
      </section>
    );
  }

  return (
    <section id="acuity" className="rounded-xl border border-border bg-[rgba(255,255,255,0.03)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Acuity Intelligence Profile</h3>
          <AcuityStatusBadge status={(acuityStatus ?? "not_run") as "not_run" | "running" | "complete" | "failed"} />
          {(vic.acuity_last_run ?? (vic as unknown as { acuityLastRun?: string }).acuityLastRun) && (
            <span className="text-xs text-muted-foreground/75">
              Last run: {formatDate(vic.acuity_last_run ?? (vic as unknown as { acuityLastRun?: string }).acuityLastRun)}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleRun} disabled={loading}>
          {loading ? "Re-running…" : "Re-run Acuity"}
        </Button>
      </div>
      {error && <p className="text-sm text-[var(--muted-error-text)] mb-2">{error}</p>}
      {(vic.acuity_profile ?? (vic as unknown as { acuityProfile?: string }).acuityProfile) ? (
        <AcuityProfileContent
          content={vic.acuity_profile ?? (vic as unknown as { acuityProfile?: string }).acuityProfile ?? ""}
        />
      ) : (
        <p className="text-sm text-muted-foreground/75">No profile content.</p>
      )}
    </section>
  );
}

function AcuityProfileContent({ content }: { content: string }) {
  const processed = useMemo(() => {
    return content.replace(/\bConfidence:\s*(HIGH|MEDIUM|LOW)\b/gi, " **CONFIDENCE_BADGE_$1** ");
  }, [content]);

  const components = useMemo(
    () => ({
      h2: SectionHeader,
      h3: H3Header,
      strong: ({ children, ...props }: React.ComponentPropsWithoutRef<"strong">) => {
        const str = typeof children === "string" ? children : Array.isArray(children) ? children.join("") : String(children ?? "");
        const m = str.match(/CONFIDENCE_BADGE_(HIGH|MEDIUM|LOW)/i);
        if (m) {
          return (
            <span
              className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium ml-1", confidenceBadgeClass(m[1]))}
            >
              {m[1]}
            </span>
          );
        }
        return <strong {...props}>{children}</strong>;
      },
    }),
    []
  );

  return (
    <div className="prose prose-invert prose-sm max-w-none text-[rgba(245,245,245,0.9)] [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_p]:my-2">
      <ReactMarkdown components={components}>{processed}</ReactMarkdown>
    </div>
  );
}
