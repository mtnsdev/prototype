"use client";

import { useState } from "react";
import { Pin, Pencil } from "lucide-react";
import type { FreeTextContent } from "@/types/briefing";
import { Button } from "@/components/ui/button";

type Props = { content: FreeTextContent };

function simpleMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="font-semibold text-[#F5F5F5] mb-1">{line.slice(2, -2)}</p>;
    }
    return <p key={i} className="text-sm text-[rgba(245,245,245,0.8)] mb-1">{line}</p>;
  });
}

export default function FreeTextWidget({ content }: Props) {
  const [body, setBody] = useState(content.body);
  const [editing, setEditing] = useState(false);
  const [author] = useState(content.author);

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F5F5F5]"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setEditing(false)} className="bg-white/10 text-[#F5F5F5]">
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setBody(content.body); setEditing(false); }}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {content.pinned && (
        <div className="flex items-center gap-1 text-xs text-[rgba(245,245,245,0.5)]">
          <Pin size={12} /> Pinned
        </div>
      )}
      <div className="text-sm prose prose-invert max-w-none">{simpleMarkdown(body)}</div>
      {(author || content.author) && (
        <p className="text-xs text-[rgba(245,245,245,0.5)]">{content.author ?? author}</p>
      )}
      <Button
        variant="ghost"
        size="xs"
        className="text-[rgba(245,245,245,0.6)]"
        onClick={() => setEditing(true)}
      >
        <Pencil size={12} className="mr-1" /> Edit
      </Button>
    </div>
  );
}
