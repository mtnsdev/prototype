"use client";

import Image from "next/image";
import { SUGGESTION_CHIPS } from "./constants";
import { EmptyChat } from "@/components/ui/empty-states";

type EmptyStateProps = {
  displayName: string;
  onSuggestionClick: (suggestion: string) => void;
};

export function EmptyState({ displayName, onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      {/* Personalized greeting with logo */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center mb-8 border border-input shadow-lg">
        <Image src="/TL_logo.svg" alt="Enable" width={48} height={48} />
      </div>
      <h2 className="text-2xl font-semibold text-foreground mb-3 tracking-tight">
        Hey {displayName}, how can I help?
      </h2>
      <p className="text-muted-foreground/75 mb-2 max-w-md text-base leading-relaxed">
        Ask a question or choose a suggestion below
      </p>
      <p className="mb-10 max-w-md text-sm leading-relaxed text-muted-foreground/55">
        Tip: press{" "}
        <kbd className="rounded border border-input bg-white/[0.04] px-1.5 py-0.5 text-xs text-muted-foreground/75">
          ⌘K
        </kbd>{" "}
        anywhere in the app to open search
      </p>

      {/* Use the unified empty chat component with custom prompts from constants */}
      <div className="w-full max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUGGESTION_CHIPS.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestionClick(suggestion)}
              className={[
                "px-4 py-3.5 rounded-xl text-left",
                "bg-card hover:bg-accent",
                "text-compact text-muted-foreground hover:text-foreground",
                "transition-all duration-150 ease-out",
                "border border-border hover:border-border-strong",
                "shadow-sm hover:shadow-md",
              ].join(" ")}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
