"use client";

import { useState } from "react";
import type { VIC } from "@/types/vic";
import { deleteVIC, getVICId } from "@/lib/vic-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  vic: VIC;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmModal({ vic, onClose, onConfirm }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete VIC</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[rgba(245,245,245,0.8)]">
          Delete <strong>{vic.full_name}</strong>? This will also remove their Acuity intelligence profile.
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
