"use client";

import { useState, useMemo } from "react";
import { Megaphone, Pin } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

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
    <div
      className="bg-white/[0.02] border border-border rounded-[20px] p-5 animate-briefing-fade-in"
      style={{ animationDelay: `${staggerIndex * 50}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-[var(--color-warning)]" />
          <span className="text-xs font-semibold tracking-wider text-muted-foreground/90 uppercase">
            Announcements
          </span>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowEditor(true)}
            className="text-2xs text-[var(--color-warning)] hover:text-amber-300"
          >
            + New
          </button>
        )}
      </div>

      {showEditor && isAdmin && (
        <div className="bg-white/[0.04] rounded-xl p-3 border border-amber-500/10 mb-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title..."
            className="w-full bg-transparent text-sm text-white placeholder:text-muted-foreground/55 font-medium mb-2 outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your announcement..."
            className="w-full bg-transparent text-xs text-foreground/88 placeholder:text-muted-foreground/55 resize-none h-20 outline-none leading-relaxed"
          />
          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center gap-1.5 text-2xs text-muted-foreground cursor-pointer">
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
                className="text-2xs text-muted-foreground hover:text-muted-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={publish}
                className="text-2xs text-[var(--color-warning)] hover:text-amber-300 font-medium"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((a) => (
          <div
            key={a.id}
            className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-white">{a.title}</span>
              {a.pinned && <Pin className="w-3 h-3 text-[var(--color-warning)]/60 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground/90 leading-relaxed whitespace-pre-wrap">
              {a.content}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-2xs text-muted-foreground/70">
                {a.author} · {a.timeAgo}
              </span>
              {a.data_layer === "agency" && (
                <span className="text-2xs text-blue-400/60 bg-blue-500/5 px-1.5 py-0.5 rounded">
                  Agency
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <p className="text-xs text-muted-foreground/70 text-center py-4">No announcements yet</p>
      )}
    </div>
  );
}
