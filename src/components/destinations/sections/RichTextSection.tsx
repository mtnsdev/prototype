"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { VirtualRichTextSection } from "@/lib/destinationSectionModel";
import { useBuildEditorOptional } from "@/components/destinations/editor/DestinationEditorForms";
import { cn } from "@/lib/utils";

type Props = {
  section: VirtualRichTextSection;
};

/**
 * Rich text narrative block — admins edit via workspace `textBody`; advisors see rendered markdown.
 */
export function RichTextSection({ section }: Props) {
  const ctx = useBuildEditorOptional();
  const [body, setBody] = useState(section.text);

  useEffect(() => {
    setBody(section.text);
  }, [section.text]);

  const ref = section.editorRef;
  const editable = ctx && ref?.kind === "workspace" && ref.slice === "text";

  const persist = (next: string) => {
    if (!editable || ref?.kind !== "workspace") return;
    ctx.patchSection(ref.workspaceIndex, {
      includeText: true,
      textBody: next,
    });
  };

  if (editable && ctx) {
    return (
      <div className="space-y-2">
        <textarea
          value={body}
          onChange={(e) => {
            const v = e.target.value;
            setBody(v);
            persist(v);
          }}
          placeholder="Add narrative for this section…"
          rows={Math.min(24, Math.max(6, body.split("\n").length + 2))}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground shadow-xs outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary/35 focus-visible:ring-[3px] focus-visible:ring-ring/30"
        />
      </div>
    );
  }

  const raw = section.text?.trim() ?? "";
  if (!raw) {
    return (
      <p className="text-sm italic text-muted-foreground">No narrative in this block yet.</p>
    );
  }

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-foreground",
        "prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary",
        "[&_ul]:list-outside [&_ul]:pl-6 [&_ol]:list-outside [&_ol]:pl-6 [&_p]:my-2 [&_li]:my-0.5",
      )}
    >
      <ReactMarkdown>{raw}</ReactMarkdown>
    </div>
  );
}
