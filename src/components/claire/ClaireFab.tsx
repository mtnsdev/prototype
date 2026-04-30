"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles, X, Minus, ExternalLink, Send } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating Claire entry point — bottom-right pill on every dashboard page.
 * State machine: closed → open → minimized → open → closed.
 * Non-blocking: no backdrop, the page underneath stays fully interactive.
 *
 * Briefing Room is the full-screen Claire surface; this is the "quick ask"
 * popup version. They share the same conversation thread (state TODO).
 */
type FabState = "closed" | "open" | "minimized" | "thinking";

export function ClaireFab() {
  const [state, setState] = useState<FabState>("closed");
  const [hasUnread, setHasUnread] = useState(false);
  const [draft, setDraft] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  // Hide on Briefing Room — Claire IS the page there.
  const isBriefingRoom = pathname === "/dashboard" || pathname === "/dashboard/";
  if (isBriefingRoom) return null;

  const open = () => {
    setState("open");
    setHasUnread(false);
  };
  const close = () => setState("closed");
  const minimize = () => setState("minimized");
  const openInBriefingRoom = () => {
    setState("closed");
    router.push("/dashboard");
  };

  // Esc to minimize (not close — that would lose the conversation).
  useEffect(() => {
    if (state !== "open") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") minimize();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state]);

  // Demo: typing → "thinking" → "minimized" → unread badge.
  const sendDemo = () => {
    if (!draft.trim()) return;
    setDraft("");
    setState("thinking");
    setTimeout(() => {
      setState((prev) => (prev === "thinking" ? "minimized" : prev));
      setHasUnread(true);
    }, 2400);
  };

  return (
    <>
      {state === "open" ? (
        <ClairePopup
          onMinimize={minimize}
          onClose={close}
          onOpenInBriefing={openInBriefingRoom}
          onNavigateToSource={(docId, cite) => {
            minimize();
            const fragment = cite ? `#cite=${cite}` : "";
            router.push(`/dashboard/knowledge-vault/${docId}${fragment}`);
          }}
          draft={draft}
          onDraftChange={setDraft}
          onSend={sendDemo}
        />
      ) : null}

      <button
        type="button"
        onClick={state === "open" ? minimize : open}
        aria-label={state === "open" ? "Minimize Claire" : "Open Claire"}
        className={cn(
          "fixed bottom-4 right-4 z-50",
          "inline-flex items-center gap-2 rounded-full px-4 py-2.5",
          "text-[12px] font-medium text-[color:var(--brand-cta-foreground)]",
          "shadow-[0_8px_24px_rgba(28,26,22,0.18)] transition-all",
          "hover:scale-[1.03] active:scale-[0.98]",
          state === "thinking"
            ? "bg-[color:var(--brand-cta-hover)]"
            : "bg-[color:var(--brand-primary)]",
          // soft pulse ring when there's an unread response
          hasUnread &&
            state !== "open" &&
            "after:absolute after:inset-0 after:rounded-full after:ring-4 after:ring-[color:var(--brand-accent)]/35 after:animate-ping"
        )}
      >
        {state === "thinking" ? (
          <span
            aria-hidden
            className="size-3 animate-spin rounded-full border-[1.5px] border-[color:var(--brand-cta-foreground)]/30 border-t-[color:var(--brand-cta-foreground)]"
          />
        ) : (
          <Sparkles size={14} aria-hidden />
        )}
        {state === "thinking" ? "Claire is thinking..." : "Ask Claire"}
        {hasUnread && state !== "open" ? (
          <span
            aria-label="1 unread response"
            className="ml-0.5 rounded-full bg-[color:var(--brand-accent)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[color:var(--brand-cta-foreground)]"
          >
            1
          </span>
        ) : null}
      </button>
    </>
  );
}

/* ─────────────────────────────────────────────────
   Popup — non-blocking floating panel
   ───────────────────────────────────────────────── */

type PopupProps = {
  onMinimize: () => void;
  onClose: () => void;
  onOpenInBriefing: () => void;
  onNavigateToSource: (docId: string, cite?: string) => void;
  draft: string;
  onDraftChange: (s: string) => void;
  onSend: () => void;
};

function ClairePopup({
  onMinimize,
  onClose,
  onOpenInBriefing,
  onNavigateToSource,
  draft,
  onDraftChange,
  onSend,
}: PopupProps) {
  return (
    <div
      role="dialog"
      aria-label="Claire chat"
      className={cn(
        "fixed bottom-[60px] right-4 z-50",
        "flex w-[380px] max-w-[calc(100vw-2rem)] flex-col",
        "max-h-[min(70vh,520px)] min-h-[280px]",
        "rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)]",
        "shadow-[0_16px_40px_rgba(28,26,22,0.18)]",
        "animate-[claire-pop_180ms_ease-out]"
      )}
      style={{
        animation: "claire-pop 180ms ease-out",
      }}
    >
      <style>{`
        @keyframes claire-pop {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <header className="flex items-center justify-between border-b border-[color:var(--border-subtle)] px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--text-primary)]">
          <Sparkles size={13} className="text-[color:var(--brand-primary)]" aria-hidden />
          Claire
        </span>
        <span className="inline-flex items-center gap-0.5 text-[color:var(--chrome-icon)]">
          <button
            type="button"
            onClick={onOpenInBriefing}
            aria-label="Open in Briefing Room"
            title="Open in Briefing Room"
            className="rounded p-1 transition-colors hover:bg-[color:var(--surface-interactive)] hover:text-[color:var(--brand-primary)]"
          >
            <ExternalLink size={13} />
          </button>
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Minimize"
            title="Minimize"
            className="rounded p-1 transition-colors hover:bg-[color:var(--surface-interactive)]"
          >
            <Minus size={13} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            title="Close"
            className="rounded p-1 transition-colors hover:bg-[color:var(--surface-interactive)]"
          >
            <X size={13} />
          </button>
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <PlaceholderConversation onNavigate={onNavigateToSource} />
      </div>

      <footer className="border-t border-[color:var(--border-subtle)] p-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
          className="flex items-center gap-1.5 rounded-lg border border-[color:var(--border-default)] bg-[color:var(--surface-card)] px-2.5 py-1.5 focus-within:border-[color:var(--brand-cta)] focus-within:ring-2 focus-within:ring-[color:var(--brand-cta)]/20"
        >
          <input
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="Ask Claire..."
            className="flex-1 bg-transparent text-[12px] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-quaternary)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send"
            className="rounded p-1 text-[color:var(--brand-primary)] transition-opacity disabled:opacity-30 hover:bg-[color:var(--surface-interactive)]"
          >
            <Send size={13} />
          </button>
        </form>
      </footer>
    </div>
  );
}

function PlaceholderConversation({ onNavigate }: { onNavigate: (docId: string, cite?: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "self-end rounded-lg px-3 py-2 text-[12px] leading-snug",
          "max-w-[85%] bg-[color:var(--surface-interactive)] text-[color:var(--text-primary)]"
        )}
      >
        What\'s the commission tier for Aman Tokyo?
      </div>
      <div
        className={cn(
          "self-start rounded-lg px-3 py-2 text-[12px] leading-snug",
          "max-w-[95%] border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] text-[color:var(--text-primary)]"
        )}
      >
        Aman Tokyo runs through Aman Insider. Base commission is 10% on all room categories
        <CitationPill n={1} docId="aman-insider-2026-rate-sheet" cite="p1-rates" onNavigate={onNavigate} />, with no tier differentiation by suite vs. standard
        <CitationPill n={2} docId="aman-commission-audit-q1-2026" cite="p1-findings" onNavigate={onNavigate} />.
        <InlineSources onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function CitationPill({ n, docId, cite, onNavigate }: { n: number; docId?: string; cite?: string; onNavigate: (docId: string, cite?: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => docId && onNavigate(docId, cite)}
      title={docId ? `Open source ${n}` : undefined}
      className={cn(
        "ml-0.5 align-super inline-flex items-center justify-center",
        "min-w-[16px] h-[14px] px-1 rounded-full",
        "bg-[color:var(--surface-interactive)] text-[color:var(--brand-primary)]",
        "text-[9px] font-semibold leading-none",
        "hover:bg-[color:var(--surface-interactive-hover)] hover:scale-110 transition-transform"
      )}
    >
      {n}
    </button>
  );
}

function InlineSources({ onNavigate }: { onNavigate: (docId: string, cite?: string) => void }) {
  const sources = [
    { n: 1, type: "PDF", title: "Aman Insider 2026 rate sheet", meta: "Brand portal · 2026-01-14", docId: "aman-insider-2026-rate-sheet", cite: "p1-rates" },
    { n: 2, type: "DOC", title: "Aman commission audit Q1 2026", meta: "Internal · 2026-03-22", docId: "aman-commission-audit-q1-2026", cite: "p1-findings" },
  ];
  return (
    <div className="mt-2 flex flex-col gap-1 border-t border-[color:var(--border-subtle)] pt-2">
      {sources.map((s) => (
        <button
          key={s.n}
          type="button"
          onClick={() => onNavigate(s.docId, s.cite)}
          className={cn(
            "flex items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors",
            "hover:bg-[color:var(--surface-interactive)]"
          )}
        >
          <span className="inline-flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[color:var(--surface-interactive)] px-1 text-[9px] font-semibold leading-none text-[color:var(--brand-primary)]">
            {s.n}
          </span>
          <span
            className={cn(
              "inline-flex h-4 w-3.5 shrink-0 items-center justify-center rounded-sm text-[7px] font-bold uppercase text-white",
              s.type === "PDF"
                ? "bg-[color:var(--color-error)]"
                : "bg-[color:var(--color-info)]"
            )}
          >
            {s.type.slice(0, 3)}
          </span>
          <span className="flex-1 truncate text-[11px] font-medium text-[color:var(--text-primary)]">
            {s.title}
          </span>
          <span className="shrink-0 text-[9px] text-[color:var(--text-quaternary)]">{s.meta}</span>
        </button>
      ))}
    </div>
  );
}
