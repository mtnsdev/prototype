"use client";

import { Clipboard } from "lucide-react";
import { useCallback } from "react";
import { useToast } from "@/contexts/ToastContext";
import { copyRichTextToClipboard } from "@/lib/destinationClipboard";
import { logDestinationEvent } from "@/lib/destinationAnalytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  plain: string;
  html: string;
  label?: string;
  className?: string;
  itemId?: string;
  destinationSlug?: string;
};

export function QuickCopyButton({
  plain,
  html,
  label = "Copy contact block",
  className,
  itemId,
  destinationSlug,
}: Props) {
  const toast = useToast();

  const onCopy = useCallback(async () => {
    try {
      await copyRichTextToClipboard(plain, html);
      toast({ title: "Copied!", tone: "success" });
      logDestinationEvent(
        "copy_clicked",
        { destination: destinationSlug ?? "", item: itemId ?? "" },
        undefined,
      );
    } catch {
      toast({ title: "Could not copy", tone: "destructive" });
    }
  }, [plain, html, toast, itemId, destinationSlug]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("size-8 shrink-0 text-muted-foreground hover:text-foreground", className)}
      aria-label={label}
      title={label}
      onClick={onCopy}
      onContextMenu={(e) => {
        e.preventDefault();
        void onCopy();
      }}
    >
      <Clipboard className="size-4" aria-hidden />
    </Button>
  );
}
