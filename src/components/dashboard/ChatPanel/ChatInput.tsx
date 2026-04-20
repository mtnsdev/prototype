"use client";

import { useRef, useState, useEffect } from "react";
import { Check, Send, Plus, Globe, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ChatInputProps = {
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  onSend: (messageText?: string) => void;
  externalSearchMode: boolean;
  setExternalSearchMode: (value: boolean | ((v: boolean) => boolean)) => void;
  searchPlacesMode: boolean;
  setSearchPlacesMode: (value: boolean | ((v: boolean) => boolean)) => void;
};

export function ChatInput({
  input,
  setInput,
  loading,
  onSend,
  externalSearchMode,
  setExternalSearchMode,
  searchPlacesMode,
  setSearchPlacesMode,
}: ChatInputProps) {
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  useEffect(() => {
    if (!toolsMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setToolsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [toolsMenuOpen]);

  return (
    <div className="shrink-0 p-4 bg-background">
      <div className="max-w-4xl mx-auto" ref={toolsMenuRef}>
        <div className="flex gap-3 items-center">
          <div className="chat-input-bar flex-1 flex items-center gap-2 rounded-xl bg-card border border-input pl-1.5 pr-1 py-1 focus-within:border-primary/45 transition-colors relative">
            <button
              type="button"
              aria-label="Add tools"
              aria-expanded={toolsMenuOpen}
              aria-haspopup="true"
              onClick={() => setToolsMenuOpen((v) => !v)}
              className={[
                "flex items-center justify-center h-8 w-8 rounded-lg shrink-0 transition-colors",
                toolsMenuOpen
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
              ].join(" ")}
            >
              <Plus size={18} strokeWidth={2.25} />
            </button>
            {toolsMenuOpen && (
              <div
                className="absolute left-0 bottom-full mb-2 z-50 min-w-[220px] rounded-xl bg-popover border border-input shadow-xl py-1.5"
                role="menu"
                aria-label="Tools"
              >
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={externalSearchMode}
                  onClick={() => {
                    setExternalSearchMode((v) => !v);
                    if (!externalSearchMode) setSearchPlacesMode(false);
                    setToolsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-compact text-foreground hover:bg-foreground/[0.05] transition-colors"
                >
                  <div
                    className={[
                      "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
                      externalSearchMode ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    <Globe size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-medium">Search web</span>
                    <p className="text-xs text-muted-foreground/75 mt-0.5">Include external web search</p>
                  </div>
                  {externalSearchMode && <span className="ml-auto text-primary" aria-hidden>✓</span>}
                </button>
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={searchPlacesMode}
                  onClick={() => {
                    setSearchPlacesMode((v) => !v);
                    if (!searchPlacesMode) setExternalSearchMode(false);
                    setToolsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-compact text-foreground hover:bg-foreground/[0.05] transition-colors"
                >
                  <div
                    className={[
                      "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
                      searchPlacesMode ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    <MapPin size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-medium">Search Google Places</span>
                    <p className="text-xs text-muted-foreground/75 mt-0.5">Include place recommendations</p>
                  </div>
                  <span
                    className={cn(
                      "ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      searchPlacesMode
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted"
                    )}
                    aria-hidden
                  >
                    {searchPlacesMode ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
                  </span>
                </button>
              </div>
            )}
            {externalSearchMode && (
              <button
                type="button"
                aria-label="Search web on (click to turn off)"
                title="Search web on — click to turn off"
                onClick={() => setExternalSearchMode(false)}
                className="group/ws flex items-center justify-center h-8 w-8 rounded-lg shrink-0 bg-primary/15 text-primary hover:bg-primary/25 transition-colors relative"
              >
                <Globe size={16} className="opacity-100 group-hover/ws:opacity-0 transition-opacity" aria-hidden />
                <X size={14} className="absolute inset-0 m-auto opacity-0 group-hover/ws:opacity-100 transition-opacity pointer-events-none" aria-hidden />
              </button>
            )}
            {searchPlacesMode && (
              <button
                type="button"
                aria-label="Search Google Places on (click to turn off)"
                title="Search Google Places on — click to turn off"
                onClick={() => setSearchPlacesMode(false)}
                className="group/pl flex items-center justify-center h-8 w-8 rounded-lg shrink-0 bg-primary/15 text-primary hover:bg-primary/25 transition-colors relative"
              >
                <MapPin size={16} className="opacity-100 group-hover/pl:opacity-0 transition-opacity" aria-hidden />
                <X size={14} className="absolute inset-0 m-auto opacity-0 group-hover/pl:opacity-100 transition-opacity pointer-events-none" aria-hidden />
              </button>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => (e.key === "Enter" && !e.shiftKey ? onSend() : null)}
              placeholder="Ask Enable a question…"
              className="flex-1 min-w-0 rounded-lg border-0 bg-transparent px-2 py-2.5 text-base text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button
            type="button"
            size="icon"
            onClick={() => onSend()}
            disabled={loading || !input.trim()}
            className="h-11 w-11 rounded-xl bg-brand-chat-user hover:brightness-105 text-primary-foreground border-0 shrink-0"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
