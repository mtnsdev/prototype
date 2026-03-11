"use client";

import { Button } from "@/components/ui/button";

type FeedbackCommentModalProps = {
  messageId: number;
  draftComment: string;
  isSubmitting: boolean;
  onDraftChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function FeedbackCommentModal({
  messageId,
  draftComment,
  isSubmitting,
  onDraftChange,
  onClose,
  onSubmit,
}: FeedbackCommentModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.12)] rounded-xl shadow-xl max-w-md w-full p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="feedback-comment-title"
      >
        <h3 id="feedback-comment-title" className="text-[14px] font-semibold text-[#F5F5F5]">
          Add feedback comment
        </h3>
        <textarea
          placeholder="Your comment (optional)"
          value={draftComment}
          onChange={(e) => onDraftChange(e.target.value)}
          className="min-h-[100px] w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.2)] px-3 py-2 text-[13px] text-[#F5F5F5] placeholder:text-[rgba(245,245,245,0.4)] focus:outline-none focus:ring-1 focus:ring-[#AE8550] resize-y max-h-48"
          maxLength={2000}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-[rgba(245,245,245,0.7)]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-[rgba(174,133,80,0.2)] text-[#D4A574] hover:bg-[rgba(174,133,80,0.3)] border-[rgba(174,133,80,0.3)]"
          >
            {isSubmitting ? "Saving…" : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
