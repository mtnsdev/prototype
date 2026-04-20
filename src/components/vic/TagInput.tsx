"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;
const TAG_REGEX = /^[a-zA-Z0-9\-]+$/;

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
};

export default function TagInput({
  value,
  onChange,
  placeholder = "Add tag…",
  suggestions = [],
  className,
}: Props) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const t = tag.trim().slice(0, MAX_TAG_LENGTH);
    if (!t || value.length >= MAX_TAGS) return;
    const normalized = t.toLowerCase();
    if (!TAG_REGEX.test(t)) return;
    if (value.includes(normalized)) return;
    onChange([...value, normalized]);
    setInput("");
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase().startsWith(input.toLowerCase()) && !value.includes(s.toLowerCase())
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2 p-2 rounded-md border border-input bg-foreground/[0.05] min-h-[38px]">
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-sm text-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="hover:text-red-400 rounded p-0.5"
              aria-label={`Remove ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {value.length < MAX_TAGS && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => input.trim() && addTag(input)}
            placeholder={placeholder}
            className="flex-1 min-w-[80px] h-7 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/75"
            maxLength={MAX_TAG_LENGTH}
          />
        )}
      </div>
      {value.length >= MAX_TAGS && (
        <p className="text-xs text-muted-foreground/75">Max {MAX_TAGS} tags</p>
      )}
      {input && filteredSuggestions.length > 0 && (
        <ul className="rounded-xl border border-border bg-popover py-1 text-popover-foreground max-h-32 overflow-y-auto shadow-2xl">
          {filteredSuggestions.slice(0, 8).map((s) => (
            <li key={s}>
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 text-sm text-[rgba(245,245,245,0.9)] hover:bg-white/10"
                onClick={() => addTag(s)}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
