"use client";

import { ArrowLeft } from "lucide-react";

type ChatHeaderProps = {
  isEmptyState: boolean;
  sessionTitle: string;
  firstMessagePreview: string | null;
  onBackToHome?: () => void;
};

/** Matches sidebar header: `px-3 py-3` so the bar aligns with TravelLustre / Enable VIC row */
const headerBarClass =
  "shrink-0 border-b border-border px-3 py-3";

export function ChatHeader({ isEmptyState, sessionTitle, firstMessagePreview, onBackToHome }: ChatHeaderProps) {
  if (isEmptyState) {
    return (
      <div className={headerBarClass}>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-none text-foreground">Chat</h2>
          <p className="mt-1 text-xs leading-snug text-muted-foreground/75">
            Ask questions about your documents
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={headerBarClass}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={() => onBackToHome?.()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/8 hover:text-foreground"
          title="Back to new chat"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold leading-none text-foreground">
            {sessionTitle || "Conversation"}
          </h2>
          {firstMessagePreview != null && (
            <p className="mt-1 truncate text-xs leading-snug text-muted-foreground/75">
              {firstMessagePreview}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
