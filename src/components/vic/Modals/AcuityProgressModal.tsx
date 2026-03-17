"use client";

import { useState, useEffect } from "react";
import { fetchVICList } from "@/lib/vic-api";
import type { VIC } from "@/types/vic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 10000;

type Props = {
  vicIds: string[];
  onClose: () => void;
  onStart?: () => void | Promise<void>;
};

type VicProgress = { id: string; name: string; status: VIC["acuityStatus"] };

export default function AcuityProgressModal({ vicIds, onClose, onStart }: Props) {
  const [progress, setProgress] = useState<VicProgress[]>(vicIds.map((id) => ({ id, name: id, status: "running" as const })));

  useEffect(() => {
    onStart?.();
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await fetchVICList({ limit: 1000 });
        const byId = new Map(data.vics.map((v) => [v._id, v]));
        setProgress((prev) =>
          prev.map((p) => {
            const v = byId.get(p.id);
            return {
              ...p,
              name: v?.full_name ?? p.name,
              status: v?.acuityStatus ?? p.status,
            };
          })
        );
      } catch (_) {}
    };
    poll();
    const t = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [vicIds.length]);

  const total = progress.length;
  const doneCount = progress.filter((p) => p.status === "complete" || p.status === "failed").length;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Running Acuity Intelligence</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[var(--muted-info-text)]/60 transition-all duration-300"
                style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-sm text-[rgba(245,245,245,0.7)] mt-2">
              {doneCount} / {total} complete
            </p>
          </div>
          <ul className="max-h-48 overflow-y-auto space-y-1 text-sm">
            {progress.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-[rgba(245,245,245,0.9)]">{p.name}</span>
                <span
                  className={
                    p.status === "complete"
                      ? "text-green-400"
                      : p.status === "failed"
                        ? "text-red-400"
                        : "text-blue-400"
                  }
                >
                  {p.status === "complete" ? "Complete" : p.status === "failed" ? "Failed" : "Running…"}
                </span>
              </li>
            ))}
          </ul>
          <Button variant="outline" onClick={onClose} className="w-full">
            Run in Background
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
