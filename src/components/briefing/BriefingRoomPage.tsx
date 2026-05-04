"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, ArrowUp, Sparkles } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { IS_PREVIEW_MODE } from "@/config/preview";
import { cn } from "@/lib/utils";

/**
 * Briefing Room — full-screen Claire chat surface.
 *
 * Layout: 200px thread sidebar + main chat column (760px max-width centered).
 * The ClaireFab hides on this route — Claire IS the page here.
 */
type BriefingRoomPageProps = {
  /** Retained for compatibility with /dashboard/briefing-room. No-op in this surface. */
  desktopMode?: boolean;
};

type Source = {
  n: number;
  type: "PDF" | "DOC" | "XLS";
  title: string;
  meta: string;
};

type Message = {
  id: string;
  role: "user" | "claire";
  body: string;
  /** Optional ordered citation list — referenced inline by `[n]` markers in body. */
  sources?: Source[];
};

type ThreadGroup = "Today" | "Yesterday" | "Earlier";

type Thread = {
  id: string;
  title: string;
  timestamp: string;
  group: ThreadGroup;
  messages: Message[];
};

const SUGGESTED_PROMPTS = [
  "Find me an Aman alternative",
  "Compare Tokyo properties",
  "What's new this week?",
  "Build a Provence itinerary",
] as const;

const MOCK_THREADS: Thread[] = [
  {
    id: "t-aman-tokyo",
    title: "Aman Tokyo commission",
    timestamp: "Just now",
    group: "Today",
    messages: [],
  },
  {
    id: "t-chen-tokyo",
    title: "Mrs. Chen Tokyo trip",
    timestamp: "1h ago",
    group: "Today",
    messages: [],
  },
  {
    id: "t-provence-villas",
    title: "Provence villas Aug",
    timestamp: "Yesterday",
    group: "Yesterday",
    messages: [],
  },
  {
    id: "t-forbes-refresh",
    title: "Forbes 5★ refresh",
    timestamp: "Yesterday",
    group: "Yesterday",
    messages: [],
  },
  {
    id: "t-maldives-q2",
    title: "Maldives Q2 calendar",
    timestamp: "Apr 28",
    group: "Earlier",
    messages: [],
  },
];

const GROUPS: ThreadGroup[] = ["Today", "Yesterday", "Earlier"];

/** Hardcoded responses for v1. Unknown prompts fall back to a generic placeholder. */
function buildMockResponse(prompt: string): Message {
  const id = `m-${Math.random().toString(36).slice(2, 9)}`;
  const lower = prompt.toLowerCase();

  if (lower.includes("aman tokyo") && lower.includes("commission")) {
    return {
      id,
      role: "claire",
      body:
        "Aman Tokyo runs through Aman Insider. Base commission is 10% on all room categories[1], with no tier differentiation by suite vs. standard[2]. Bookings of 4+ nights between November and March qualify for a 12% promotional uplift through Q1 2026.",
      sources: [
        { n: 1, type: "PDF", title: "Aman Insider 2026 rate sheet", meta: "Brand portal · 2026-01-14" },
        { n: 2, type: "DOC", title: "Aman commission audit Q1 2026", meta: "Internal · 2026-03-22" },
      ],
    };
  }

  if (lower.includes("aman alternative") || lower.includes("alternative to aman")) {
    return {
      id,
      role: "claire",
      body:
        "Three properties match Aman's quiet-luxe profile with comparable commission and stronger Q3 availability: Six Senses Kyoto[1], Hoshinoya Tokyo[2], and Capella Bangkok[1]. Six Senses pays 12% base; Hoshinoya runs through a Virtuoso preferred contract at 10% plus a $200 amenity.",
      sources: [
        { n: 1, type: "DOC", title: "Asia luxe alternatives shortlist", meta: "Internal · 2026-04-22" },
        { n: 2, type: "PDF", title: "Hoshinoya Virtuoso contract 2026", meta: "Brand portal · 2026-02-08" },
      ],
    };
  }

  return {
    id,
    role: "claire",
    body:
      "Working on it — I'll have a fuller answer for you shortly. In the meantime, you can refine the question and I'll narrow the search.",
  };
}

function getFirstName(username?: string, email?: string): string {
  if (username) {
    const first = username.split(/[\s@.]/)[0]?.trim();
    if (first) return first;
  }
  if (email) {
    const first = email.split("@")[0]?.trim();
    if (first) return first;
  }
  return "there";
}

export default function BriefingRoomPage(_props: BriefingRoomPageProps = {}) {
  const { user } = useUser();
  const firstName = useMemo(
    () => getFirstName(user?.username, user?.email) || (IS_PREVIEW_MODE && user == null ? "Constantin" : "there"),
    [user?.username, user?.email, user]
  );

  const [threads, setThreads] = useState<Thread[]>(MOCK_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [pendingClaire, setPendingClaire] = useState(false);

  const activeThread = useMemo(
    () => (activeThreadId ? threads.find((t) => t.id === activeThreadId) ?? null : null),
    [threads, activeThreadId]
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [activeThread?.messages.length, pendingClaire]);

  const startThreadFromPrompt = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    const id = `t-${Math.random().toString(36).slice(2, 9)}`;
    const userMsg: Message = {
      id: `m-${Math.random().toString(36).slice(2, 9)}`,
      role: "user",
      body: trimmed,
    };
    const newThread: Thread = {
      id,
      title: trimmed.length > 38 ? trimmed.slice(0, 38).trim() + "…" : trimmed,
      timestamp: "Just now",
      group: "Today",
      messages: [userMsg],
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(id);
    setPendingClaire(true);
    window.setTimeout(() => {
      const reply = buildMockResponse(trimmed);
      setThreads((prev) =>
        prev.map((t) => (t.id === id ? { ...t, messages: [...t.messages, reply] } : t))
      );
      setPendingClaire(false);
    }, 1200);
  };

  const sendInActiveThread = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || !activeThreadId) return;
    const userMsg: Message = {
      id: `m-${Math.random().toString(36).slice(2, 9)}`,
      role: "user",
      body: trimmed,
    };
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThreadId ? { ...t, messages: [...t.messages, userMsg] } : t))
    );
    setPendingClaire(true);
    window.setTimeout(() => {
      const reply = buildMockResponse(trimmed);
      setThreads((prev) =>
        prev.map((t) => (t.id === activeThreadId ? { ...t, messages: [...t.messages, reply] } : t))
      );
      setPendingClaire(false);
    }, 1200);
  };

  const onSubmit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (activeThreadId) {
      sendInActiveThread(trimmed);
    } else {
      startThreadFromPrompt(trimmed);
    }
    setDraft("");
  };

  const onNewThread = () => {
    setActiveThreadId(null);
    setDraft("");
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) return; // newline
      // Plain Enter or Cmd/Ctrl+Enter → submit
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 bg-[color:var(--surface-base)]">
      <ThreadSidebar
        threads={threads}
        search={search}
        onSearchChange={setSearch}
        activeThreadId={activeThreadId}
        onSelectThread={setActiveThreadId}
        onNewThread={onNewThread}
      />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {activeThread ? (
          <ConversationView thread={activeThread} pending={pendingClaire} bottomRef={messagesEndRef} />
        ) : (
          <EmptyState
            firstName={firstName}
            onPickPrompt={(p) => startThreadFromPrompt(p)}
          />
        )}

        <ChatInput
          inputRef={inputRef}
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={onSubmit}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Thread sidebar
   ───────────────────────────────────────────────── */

function ThreadSidebar({
  threads,
  search,
  onSearchChange,
  activeThreadId,
  onSelectThread,
  onNewThread,
}: {
  threads: Thread[];
  search: string;
  onSearchChange: (s: string) => void;
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
}) {
  const grouped = useMemo(() => {
    const out: Record<ThreadGroup, Thread[]> = { Today: [], Yesterday: [], Earlier: [] };
    for (const t of threads) out[t.group].push(t);
    return out;
  }, [threads]);

  return (
    <aside
      aria-label="Threads"
      className="flex w-[200px] shrink-0 flex-col border-r border-[color:var(--border-subtle)] bg-[color:var(--surface-base)]"
    >
      <div className="flex flex-col gap-2 p-3">
        <button
          type="button"
          onClick={onNewThread}
          className={cn(
            "inline-flex w-full items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5",
            "text-[12px] font-medium",
            "bg-[color:var(--brand-primary)] text-[color:var(--brand-cta-foreground)]",
            "transition-colors hover:bg-[color:var(--brand-cta-hover,var(--brand-primary))]",
            "focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary)]/30"
          )}
        >
          <Plus size={12} aria-hidden />
          New thread
        </button>

        <label className="relative block">
          <span className="sr-only">Search threads</span>
          <Search
            size={11}
            aria-hidden
            className="absolute left-2 top-1/2 -translate-y-1/2 text-[color:var(--text-quaternary)]"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search threads"
            className={cn(
              "w-full rounded-md border border-transparent bg-[color:var(--surface-interactive)]",
              "py-1.5 pl-6 pr-2 text-[11px] text-[color:var(--text-primary)]",
              "placeholder:text-[color:var(--text-quaternary)]",
              "focus:border-[color:var(--border-default)] focus:outline-none focus:ring-1 focus:ring-[color:var(--brand-primary)]/25"
            )}
          />
        </label>
      </div>

      <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-2 pb-4">
        {GROUPS.map((g) => {
          const items = grouped[g];
          if (!items || items.length === 0) return null;
          return (
            <div key={g} className="flex flex-col gap-0.5">
              <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-quaternary)]">
                {g}
              </p>
              <ul className="flex flex-col gap-0.5">
                {items.map((t) => {
                  const active = t.id === activeThreadId;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => onSelectThread(t.id)}
                        className={cn(
                          "flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left",
                          "transition-colors",
                          active
                            ? "bg-[rgba(58,89,56,0.10)]"
                            : "hover:bg-[color:var(--surface-interactive)]"
                        )}
                      >
                        <span className="line-clamp-1 text-[11px] font-medium text-[color:var(--text-primary)]">
                          {t.title}
                        </span>
                        <span className="text-[10px] text-[color:var(--text-quaternary)]">
                          {t.timestamp}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

/* ─────────────────────────────────────────────────
   Empty state
   ───────────────────────────────────────────────── */

function EmptyState({
  firstName,
  onPickPrompt,
}: {
  firstName: string;
  onPickPrompt: (p: string) => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-12">
      <div className="flex w-full max-w-[760px] flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-[14px] font-medium text-[color:var(--text-primary)]">
            Hi {firstName}
          </h1>
          <p className="text-[12px] text-[color:var(--text-quaternary)]">
            What can I help with?
          </p>
        </div>

        <ul className="flex w-full max-w-[360px] flex-col gap-2">
          {SUGGESTED_PROMPTS.map((p) => (
            <li key={p}>
              <button
                type="button"
                onClick={() => onPickPrompt(p)}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-full",
                  "border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)]",
                  "px-3.5 py-2 text-left",
                  "transition-colors hover:bg-[color:var(--surface-card-hover,var(--surface-card))]",
                  "focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary)]/25"
                )}
              >
                <span
                  aria-hidden
                  className="size-1.5 shrink-0 rounded-full bg-[color:var(--brand-accent)]"
                />
                <span className="text-[12px] text-[color:var(--text-primary)]">{p}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Conversation view
   ───────────────────────────────────────────────── */

function ConversationView({
  thread,
  pending,
  bottomRef,
}: {
  thread: Thread;
  pending: boolean;
  bottomRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8">
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4">
        {thread.messages.map((m) =>
          m.role === "user" ? (
            <UserBubble key={m.id} body={m.body} />
          ) : (
            <ClaireReply key={m.id} body={m.body} sources={m.sources} />
          )
        )}
        {pending ? <ClaireThinking /> : null}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function UserBubble({ body }: { body: string }) {
  return (
    <div className="flex justify-end">
      <div
        className={cn(
          "max-w-[70%] rounded-full px-4 py-2",
          "bg-[color:var(--surface-interactive)] text-[color:var(--text-primary)]",
          "text-[12px] leading-snug"
        )}
      >
        {body}
      </div>
    </div>
  );
}

function ClaireReply({ body, sources }: { body: string; sources?: Source[] }) {
  return (
    <div className="flex justify-start">
      <div
        className={cn(
          "max-w-[88%] rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)]",
          "px-4 py-3.5 text-[12px] leading-relaxed text-[color:var(--text-primary)]"
        )}
        style={{ padding: "14px 16px" }}
      >
        <ProseWithCitations body={body} />
        {sources && sources.length > 0 ? (
          <div className="mt-3 flex flex-col gap-1.5 border-t border-[color:var(--border-subtle)] pt-2.5">
            {sources.map((s) => (
              <div key={s.n} className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-[14px] min-w-[14px] items-center justify-center rounded-full",
                    "bg-[color:var(--surface-interactive)] px-1 text-[9px] font-semibold leading-none",
                    "text-[color:var(--brand-primary)]"
                  )}
                >
                  {s.n}
                </span>
                <span
                  className={cn(
                    "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm",
                    "text-[7px] font-bold uppercase text-white",
                    s.type === "PDF"
                      ? "bg-[color:var(--color-error,#b13a3a)]"
                      : s.type === "XLS"
                      ? "bg-[color:var(--color-success,#2f7a3f)]"
                      : "bg-[color:var(--color-info,#3a6db1)]"
                  )}
                >
                  {s.type}
                </span>
                <span className="flex-1 truncate text-[11px] font-medium text-[color:var(--text-primary)]">
                  {s.title}
                </span>
                <span className="shrink-0 text-[10px] text-[color:var(--text-quaternary)]">
                  {s.meta}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Renders body text with `[1]` style markers replaced by superscript moss-tinted citation pills. */
function ProseWithCitations({ body }: { body: string }) {
  const parts = useMemo(() => {
    const out: Array<{ kind: "text"; value: string } | { kind: "cite"; n: number }> = [];
    const re = /\[(\d+)\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(body)) !== null) {
      if (match.index > lastIndex) {
        out.push({ kind: "text", value: body.slice(lastIndex, match.index) });
      }
      out.push({ kind: "cite", n: Number(match[1]) });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < body.length) {
      out.push({ kind: "text", value: body.slice(lastIndex) });
    }
    return out;
  }, [body]);

  return (
    <p className="whitespace-pre-wrap">
      {parts.map((p, i) =>
        p.kind === "text" ? (
          <span key={i}>{p.value}</span>
        ) : (
          <sup
            key={i}
            className={cn(
              "ml-0.5 inline-flex min-w-[16px] items-center justify-center rounded-full px-1",
              "bg-[color:var(--surface-interactive)] text-[color:var(--brand-primary)]",
              "text-[9px] font-semibold leading-[14px] align-super"
            )}
          >
            {p.n}
          </sup>
        )
      )}
    </p>
  );
}

function ClaireThinking() {
  return (
    <div className="flex justify-start">
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-[color:var(--border-subtle)]",
          "bg-[color:var(--surface-card)] px-3 py-2 text-[11px] text-[color:var(--text-quaternary)]"
        )}
      >
        <Sparkles size={12} className="text-[color:var(--brand-primary)]" aria-hidden />
        <span className="inline-flex items-center gap-1">
          Claire is thinking
          <span className="inline-flex gap-0.5">
            <Dot delay={0} />
            <Dot delay={150} />
            <Dot delay={300} />
          </span>
        </span>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="size-1 animate-pulse rounded-full bg-[color:var(--text-quaternary)]"
      style={{ animationDelay: `${delay}ms` }}
      aria-hidden
    />
  );
}

/* ─────────────────────────────────────────────────
   Bottom input
   ───────────────────────────────────────────────── */

function ChatInput({
  inputRef,
  draft,
  onDraftChange,
  onSubmit,
  onKeyDown,
}: {
  inputRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  draft: string;
  onDraftChange: (s: string) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div
      className={cn(
        "shrink-0 border-t border-[color:var(--border-subtle)] bg-[color:var(--surface-base)]"
      )}
      style={{ padding: "14px 28px" }}
    >
      <div className="mx-auto w-full max-w-[760px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className={cn(
            "flex items-end gap-2 rounded-md border border-[color:var(--border-default)]",
            "bg-[color:var(--surface-card)]",
            "focus-within:border-[color:var(--brand-primary)] focus-within:ring-2 focus-within:ring-[color:var(--brand-primary)]/20"
          )}
          style={{ padding: "10px 14px" }}
        >
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask Claire anything…"
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent text-[12px] leading-relaxed text-[color:var(--text-primary)]",
              "placeholder:text-[color:var(--text-quaternary)] focus:outline-none",
              "max-h-[140px] min-h-[20px]"
            )}
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send"
            className={cn(
              "inline-flex size-[26px] shrink-0 items-center justify-center rounded-full",
              "bg-[color:var(--brand-primary)] text-[color:var(--brand-cta-foreground)]",
              "transition-opacity hover:opacity-90 disabled:opacity-30"
            )}
          >
            <ArrowUp size={13} aria-hidden />
          </button>
        </form>
        <p className="mt-1.5 px-1 text-[10px] text-[color:var(--text-quaternary)]">
          <kbd className="font-sans">⌘ Enter</kbd> to send · <kbd className="font-sans">Shift Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
