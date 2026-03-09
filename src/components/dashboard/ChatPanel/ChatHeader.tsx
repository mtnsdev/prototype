"use client";

import { ArrowLeft } from "lucide-react";

type ChatHeaderProps = {
  isEmptyState: boolean;
  sessionTitle: string;
  firstMessagePreview: string | null;
  onBackToHome?: () => void;
};

export function ChatHeader({ isEmptyState, sessionTitle, firstMessagePreview, onBackToHome }: ChatHeaderProps) {
  if (isEmptyState) {
    return (
      <div className="shrink-0 px-5 py-4 border-b border-[rgba(255,255,255,0.08)]">
        <h2 className="text-[14px] font-semibold text-[#F5F5F5]">Chat</h2>
        <p className="text-[12px] text-[rgba(245,245,245,0.5)] mt-0.5">Ask questions about your documents</p>
      </div>
    );
  }

  return (
    <div className="shrink-0 px-5 py-4 border-b border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onBackToHome?.()}
          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/8 transition-colors text-[rgba(245,245,245,0.6)] hover:text-[#F5F5F5]"
          title="Back to new chat"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-semibold text-[#F5F5F5] truncate">
            {sessionTitle || "Conversation"}
          </h2>
          {firstMessagePreview != null && (
            <p className="text-[12px] text-[rgba(245,245,245,0.5)] mt-0.5 truncate">
              {firstMessagePreview}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
