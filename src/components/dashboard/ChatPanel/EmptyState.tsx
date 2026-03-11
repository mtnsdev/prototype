"use client";

import Image from "next/image";
import { SUGGESTION_CHIPS } from "./constants";

type EmptyStateProps = {
  displayName: string;
  onSuggestionClick: (suggestion: string) => void;
};

export function EmptyState({ displayName, onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center mb-8 border border-white/10 shadow-lg">
        <Image src="/TL_logo.svg" alt="Enable" width={48} height={48} />
      </div>
      <h2 className="text-[24px] font-semibold text-[#F5F5F5] mb-3 tracking-tight">
        Hey {displayName}, how can I help?
      </h2>
      <p className="text-[rgba(245,245,245,0.5)] mb-10 max-w-md text-[14px] leading-relaxed">
        Ask a question or choose a suggestion below
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {SUGGESTION_CHIPS.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSuggestionClick(suggestion)}
            className={[
              "px-4 py-3.5 rounded-xl text-left",
              "bg-[#161616] hover:bg-[#1a1a1a]",
              "text-[13px] text-[rgba(245,245,245,0.75)] hover:text-[#F5F5F5]",
              "transition-all duration-150 ease-out",
              "border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]",
              "shadow-sm hover:shadow-md",
            ].join(" ")}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
