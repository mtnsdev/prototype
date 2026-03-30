"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InlineFieldError } from "@/components/ui/page-state";
import { cn } from "@/lib/utils";

export type DestructiveConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Primary explanation (what will happen). */
  description: React.ReactNode;
  /** Optional second line (e.g. irreversibility). */
  consequence?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  /** Extra friction: confirm disabled until checked. */
  acknowledgement?: { label: string };
  contentClassName?: string;
  confirmDisabled?: boolean;
};

export function DestructiveConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  consequence,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
  error,
  acknowledgement,
  contentClassName,
  confirmDisabled = false,
}: DestructiveConfirmDialogProps) {
  const [ack, setAck] = useState(false);

  useEffect(() => {
    if (!open) setAck(false);
  }, [open]);

  const canConfirm = !acknowledgement || ack;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("border-border bg-background", contentClassName)}>
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-left">
              <div className="text-sm text-muted-foreground">{description}</div>
              {consequence ? (
                <p className="text-sm text-muted-foreground/80">{consequence}</p>
              ) : null}
            </div>
          </DialogDescription>
        </DialogHeader>

        {acknowledgement ? (
          <label className="flex cursor-pointer items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              className="checkbox-on-dark checkbox-on-dark-sm mt-0.5 shrink-0"
            />
            <span>{acknowledgement.label}</span>
          </label>
        ) : null}

        {error ? <InlineFieldError message={error} /> : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-border text-foreground"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={loading || !canConfirm || confirmDisabled}
          >
            {loading ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
