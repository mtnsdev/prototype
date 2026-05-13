"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, CircleAlert, Loader2 } from "lucide-react";
import type { Destination } from "@/data/destinations";
import { usePermissions } from "@/hooks/usePermissions";
import {
  DESTINATION_STORAGE_EVENT,
  destinationPublishedStorageKey,
  loadPublishedDestination,
  publishDestination,
} from "@/lib/destinationLocalEdits";
import { ensureEditorWorkspace } from "@/lib/destinationEditorTabs";
import { safeParseDestination } from "@/lib/destinationEditorSchema";
import { cn } from "@/lib/utils";
import { DestinationDetailView } from "./DestinationDetailView";
import { BuildEditorProvider } from "./editor/DestinationEditorForms";

type Props = {
  canonical: Destination;
};

export function DestinationDetailClient({ canonical }: Props) {
  const { isAdmin } = usePermissions();
  const slug = canonical.slug;
  const [destination, setDestination] = useState<Destination>(() => loadPublishedDestination(slug, canonical));
  const [adminDraft, setAdminDraft] = useState<Destination | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  /** JSON snapshot of the last successfully-saved draft. Used to detect dirtiness without re-render churn. */
  const lastSavedJsonRef = useRef<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  const refreshPublished = useCallback(() => {
    const next = loadPublishedDestination(slug, canonical);
    setDestination(next);
    if (isAdmin) {
      const seeded = { ...next, editorWorkspace: ensureEditorWorkspace(next) };
      setAdminDraft(seeded);
      lastSavedJsonRef.current = JSON.stringify(seeded);
    }
  }, [slug, canonical, isAdmin]);

  useEffect(() => {
    refreshPublished();
  }, [refreshPublished]);

  useLayoutEffect(() => {
    if (!isAdmin) {
      setAdminDraft(null);
      lastSavedJsonRef.current = null;
      return;
    }
    const d = loadPublishedDestination(slug, canonical);
    const seeded = { ...d, editorWorkspace: ensureEditorWorkspace(d) };
    setAdminDraft(seeded);
    lastSavedJsonRef.current = JSON.stringify(seeded);
  }, [isAdmin, slug, canonical]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === destinationPublishedStorageKey(slug)) refreshPublished();
    };
    window.addEventListener(DESTINATION_STORAGE_EVENT, refreshPublished);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(DESTINATION_STORAGE_EVENT, refreshPublished);
      window.removeEventListener("storage", onStorage);
    };
  }, [slug, refreshPublished]);

  const persistDraft = useCallback(() => {
    if (!adminDraft) return;
    const normalized = { ...adminDraft, slug, editorWorkspace: ensureEditorWorkspace(adminDraft) };
    const parsed = safeParseDestination(normalized);
    if (!parsed.success) {
      setSaveStatus("error");
      return;
    }
    const toSave = { ...parsed.data, slug, editorWorkspace: ensureEditorWorkspace(parsed.data as Destination) };
    if (!publishDestination(slug, toSave)) {
      setSaveStatus("error");
      return;
    }
    lastSavedJsonRef.current = JSON.stringify(adminDraft);
    setDestination(loadPublishedDestination(slug, canonical));
    setSaveStatus("saved");
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      setSaveStatus((s) => (s === "saved" ? "idle" : s));
    }, 1400);
  }, [adminDraft, slug, canonical]);

  // Auto-save: debounce 600ms after the last change.
  useEffect(() => {
    if (!isAdmin || !adminDraft || lastSavedJsonRef.current == null) return;
    const currentJson = JSON.stringify(adminDraft);
    if (currentJson === lastSavedJsonRef.current) return;
    setSaveStatus("saving");
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      persistDraft();
    }, 600);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [adminDraft, isAdmin, persistDraft]);

  // Guard navigation while a save is still in-flight (debounce window or active write).
  useEffect(() => {
    if (saveStatus !== "saving") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saveStatus]);

  const showSaveBar = isAdmin && saveStatus !== "idle";

  const saveBar = showSaveBar ? (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-[min(100%,32rem)] flex-col gap-2">
        <div
          className={cn(
            "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-2xl backdrop-blur-sm",
            saveStatus === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-border bg-popover/95 text-foreground",
          )}
        >
          {saveStatus === "saving" ? (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden />
          ) : saveStatus === "saved" ? (
            <Check className="size-3.5 text-brand-cta" aria-hidden />
          ) : (
            <CircleAlert className="size-3.5" aria-hidden />
          )}
          <span>
            {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : "Save failed"}
          </span>
        </div>
        {saveStatus === "error" ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-2xs leading-snug text-destructive shadow-lg"
          >
            Changes could not be saved. Fix validation issues (check required fields), then edit again. If storage is
            full or unavailable, try freeing space or reloading the page.
          </div>
        ) : null}
      </div>
    </div>
  ) : null;

  const patchAdminDraft: Dispatch<SetStateAction<Destination>> = useCallback(
    (action) => {
      setAdminDraft((prev) => {
        const base = prev ?? loadPublishedDestination(slug, canonical);
        return typeof action === "function" ? (action as (d: Destination) => Destination)(base) : action;
      });
    },
    [slug, canonical],
  );

  if (isAdmin && adminDraft) {
    return (
      <BuildEditorProvider draft={adminDraft} setDraft={patchAdminDraft} enableDndShell={false}>
        <DestinationDetailView
          destination={{ ...adminDraft, editorWorkspace: ensureEditorWorkspace(adminDraft) }}
          previewMode={false}
          inlineOverviewEdit={{ setDraft: patchAdminDraft }}
        />
        {saveBar}
      </BuildEditorProvider>
    );
  }

  return (
    <>
      <DestinationDetailView destination={destination} />
      {saveBar}
    </>
  );
}
