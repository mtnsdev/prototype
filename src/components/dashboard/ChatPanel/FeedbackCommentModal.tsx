"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type FeedbackCommentModalProps = {
  messageId: number; // retained for parent keying / future analytics
  draftComment: string;
  isSubmitting: boolean;
  onDraftChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function FeedbackCommentModal({
  messageId: _messageId,
  draftComment,
  isSubmitting,
  onDraftChange,
  onClose,
  onSubmit,
}: FeedbackCommentModalProps) {
  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="max-w-md border-border bg-card p-5 text-card-foreground sm:max-w-md"
        showCloseButton
      >
        <DialogHeader className="space-y-0 text-left">
          <DialogTitle className="text-base font-semibold text-foreground">Add feedback comment</DialogTitle>
        </DialogHeader>
        <textarea
          placeholder="Your comment (optional)"
          value={draftComment}
          onChange={(e) => onDraftChange(e.target.value)}
          className="min-h-[100px] w-full max-h-48 resize-y rounded-lg border border-input bg-inset px-3 py-2 text-compact text-foreground placeholder:text-muted-foreground/75 focus:outline-none focus:ring-1 focus:ring-brand-chat-user"
          maxLength={2000}
          autoFocus
          aria-label="Feedback comment"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="border border-[var(--color-warning)]/30 bg-[var(--color-warning-muted)] text-[var(--color-warning)] hover:bg-[var(--color-warning-muted)]/80"
          >
            {isSubmitting ? "Saving…" : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
