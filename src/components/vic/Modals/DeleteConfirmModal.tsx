"use client";

import { useState } from "react";
import type { VIC } from "@/types/vic";
import { deleteVIC, getVICId } from "@/lib/vic-api";
import { DestructiveConfirmDialog } from "@/components/ui/destructive-confirm-dialog";

type Props = {
  open: boolean;
  vic: VIC | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmModal({ open, vic, onClose, onConfirm }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!vic) return;
    setError(null);
    setDeleting(true);
    try {
      await deleteVIC(getVICId(vic));
      onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DestructiveConfirmDialog
      open={open && vic != null}
      onOpenChange={(o) => !o && onClose()}
      title="Delete VIC"
      description={
        vic ? (
          <>
            Delete <span className="font-medium text-foreground">{vic.full_name}</span>? Their Acuity
            intelligence profile will also be removed.
          </>
        ) : null
      }
      consequence="This cannot be undone."
      onConfirm={handleConfirm}
      loading={deleting}
      error={error}
      confirmLabel="Delete"
    />
  );
}
