"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useBuildEditorOptional } from "@/components/destinations/editor/DestinationEditorForms";
import { createBlankSection } from "@/lib/destinationEditorTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Page-level "Add section" — simplified to inline title input.
 * No presets, no slot picking. Just name it and go.
 */
export function DestinationWorkspaceFooter() {
  const ctx = useBuildEditorOptional();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  if (!ctx) return null;

  const submit = () => {
    const section = createBlankSection(title);
    ctx.patchSections((rows) => {
      rows.push(section);
    });
    setTitle("");
    setAdding(false);
  };

  const cancel = () => {
    setTitle("");
    setAdding(false);
  };

  if (!adding) {
    return (
      <div className="mt-10 border-t border-dashed border-border/60 pt-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 border-dashed text-muted-foreground hover:text-foreground"
          onClick={() => setAdding(true)}
        >
          <Plus className="size-4" aria-hidden />
          New section
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-10 border-t border-dashed border-border/60 pt-6">
      <div className="flex items-center gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Section title…"
          className="h-9 max-w-xs text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") cancel();
          }}
        />
        <Button type="button" size="sm" onClick={submit}>
          Add
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={cancel}>
          Cancel
        </Button>
      </div>
      <p className="mt-2 text-2xs text-muted-foreground">
        Add products, text, or files inside the section after creating it.
      </p>
    </div>
  );
}
