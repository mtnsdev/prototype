"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

/**
 * Global “Report issue” entry (dashboard shell). Submit is demo-only.
 */
interface ReportIssueLauncherProps {
  floating?: boolean;
  compact?: boolean;
  className?: string;
}

export default function ReportIssueLauncher({
  floating = true,
  compact = false,
  className,
}: ReportIssueLauncherProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("wrong");
  const [details, setDetails] = useState("");
  const toast = useToast();

  const submit = () => {
    setOpen(false);
    setDetails("");
    toast({ title: "Issue reported — we'll look into it.", tone: "success" });
  };

  return (
    <>
      <div className={cn(floating ? "fixed bottom-4 right-4 z-40" : "", className)}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex items-center gap-1 rounded-lg border border-border bg-card/40 py-1.5 text-2xs text-muted-foreground backdrop-blur-sm hover:text-muted-foreground/75",
            compact ? "justify-center px-2" : "px-2.5"
          )}
          aria-label="Report issue"
          title="Report issue"
        >
          <Flag className="h-3 w-3" aria-hidden />
          {!compact && "Report issue"}
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm border-border bg-inset p-5 sm:max-w-sm">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle id="report-issue-title" className="text-sm font-medium text-foreground">
              Report an issue
            </DialogTitle>
            <p className="text-2xs text-muted-foreground/75">Let us know if something isn&apos;t right.</p>
          </DialogHeader>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mb-3 w-full rounded-lg border border-border bg-popover px-3 py-2 text-xs text-muted-foreground outline-none"
          >
            <option value="wrong">Something looks wrong</option>
            <option value="indexing">Document not indexing</option>
            <option value="missing">Missing content</option>
            <option value="other">Other</option>
          </select>

          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe what you're seeing…"
            className="mb-3 h-20 w-full resize-none rounded-lg border border-border bg-popover px-3 py-2 text-xs text-muted-foreground outline-none placeholder:text-muted-foreground"
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-2xs text-muted-foreground/75 hover:text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 border-[var(--color-info)]/25 bg-[var(--color-info-muted)] text-2xs text-[var(--color-info)] hover:bg-[var(--color-info-muted)]/80"
              onClick={submit}
            >
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
