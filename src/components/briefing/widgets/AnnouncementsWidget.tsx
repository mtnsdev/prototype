"use client";

import { useState, useMemo } from "react";
import { Megaphone, Pin } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { BRIEFING_WIDGET_SURFACE } from "@/lib/briefingSurface";
import { cn } from "@/lib/utils";
import BriefingEmptyState from "../BriefingEmptyState";

export type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  author: string;
  pinned: boolean;
  data_layer: "agency";
  timeAgo: string;
};

const MOCK_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: "ann-001",
    title: "2026 Hotel Launches",
    content:
      "New openings to watch:\n• Aman Kyoto — Q4 2026 (24 suites)\n• Four Seasons Mallorca — June 2026\n• Rosewood São Paulo — March 2026\n\nReach out to me if you want early access to any of these.",
    author: "Kristin",
    pinned: true,
    data_layer: "agency",
    timeAgo: "2 days ago",
  },
  {
    id: "ann-002",
    title: "Virtuoso Travel Week Reminder",
    content: "Registration closes April 15. Please submit your preferred sessions by Friday.",
    author: "Kristin",
    pinned: false,
    data_layer: "agency",
    timeAgo: "5 days ago",
  },
];

type Props = {
  isAdmin: boolean;
  staggerIndex?: number;
};

export default function AnnouncementsWidget({ isAdmin, staggerIndex = 0 }: Props) {
  const showToast = useToast();
  const [list, setList] = useState<AnnouncementItem[]>(MOCK_ANNOUNCEMENTS);
  const [showEditor, setShowEditor] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pin, setPin] = useState(false);

  const sorted = useMemo(() => {
    const pinned = list.filter((a) => a.pinned);
    const rest = list.filter((a) => !a.pinned);
    return [...pinned, ...rest];
  }, [list]);

  const publish = () => {
    if (!title.trim() || !body.trim()) return;
    const newItem: AnnouncementItem = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      content: body.trim(),
      author: "Kristin",
      pinned: pin,
      data_layer: "agency",
      timeAgo: "Just now",
    };
    setList((prev) => [newItem, ...prev]);
    setTitle("");
    setBody("");
    setPin(false);
    setShowEditor(false);
    showToast("Announcement published");
  };

  return (
    <article
      className={cn(BRIEFING_WIDGET_SURFACE, "animate-briefing-fade-in")}
      style={{ animationDelay: `${staggerIndex * 36}ms` }}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border/70 px-5 pb-4 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-muted/45 text-primary/90 ring-1 ring-inset ring-border/80">
            <Megaphone className="size-[18px]" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">Announcements</h3>
            <p className="text-2xs text-muted-foreground/80">Team updates on the briefing</p>
          </div>
        </div>
        {isAdmin ? (
          <button
            type="button"
            onClick={() => setShowEditor(true)}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-2xs font-medium text-primary transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            + New
          </button>
        ) : null}
      </header>

      <div className="px-5 pb-5 pt-4">
        {showEditor && isAdmin ? (
          <div className="mb-4 rounded-xl border border-border bg-muted/20 p-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title…"
              className="mb-2 w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your announcement…"
              className="h-20 w-full resize-none bg-transparent text-xs leading-relaxed text-foreground/88 outline-none placeholder:text-muted-foreground"
            />
            <div className="mt-2 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-1.5 text-2xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={pin}
                  onChange={(e) => setPin(e.target.checked)}
                  className="checkbox-on-dark checkbox-on-dark-sm"
                />
                Pin to top
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="rounded-md text-2xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={publish}
                  className="rounded-md text-2xs font-medium text-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Publish
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {sorted.length > 0 ? (
          <div className="space-y-3">
            {sorted.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-border/80 bg-muted/12 p-3.5 transition-colors hover:bg-muted/18"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">{a.title}</span>
                  {a.pinned ? <Pin className="size-3 shrink-0 text-primary/70" aria-hidden /> : null}
                </div>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground/90">{a.content}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-2xs text-muted-foreground/70">
                    {a.author} · {a.timeAgo}
                  </span>
                  {a.data_layer === "agency" ? (
                    <span className="text-2xs rounded-md border border-[var(--muted-info-border)] bg-[var(--muted-info-bg)] px-1.5 py-0.5 text-[var(--muted-info-text)]">
                      Agency
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <BriefingEmptyState
            icon={<Megaphone />}
            title="No announcements yet"
            description={isAdmin ? "Publish the first note for your advisors." : "Your agency hasn’t posted anything here."}
            action={
              isAdmin ? (
                <button
                  type="button"
                  onClick={() => setShowEditor(true)}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Write announcement
                </button>
              ) : undefined
            }
          />
        )}
      </div>
    </article>
  );
}
