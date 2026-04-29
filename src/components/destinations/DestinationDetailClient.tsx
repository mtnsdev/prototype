"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { useToast } from "@/contexts/ToastContext";
import { DestinationDetailView } from "./DestinationDetailView";
import { BuildEditorProvider } from "./editor/DestinationEditorForms";

type Props = {
  canonical: Destination;
};

export function DestinationDetailClient({ canonical }: Props) {
  const { isAdmin } = usePermissions();
  const slug = canonical.slug;
  const toast = useToast();
  const [destination, setDestination] = useState<Destination>(() => loadPublishedDestination(slug, canonical));
  const [adminDraft, setAdminDraft] = useState<Destination | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const refreshPublished = useCallback(() => {
    const next = loadPublishedDestination(slug, canonical);
    setDestination(next);
    if (isAdmin) {
      setAdminDraft({ ...next, editorWorkspace: ensureEditorWorkspace(next) });
    }
  }, [slug, canonical, isAdmin]);

  useEffect(() => {
    refreshPublished();
  }, [refreshPublished]);

  useLayoutEffect(() => {
    if (!isAdmin) {
      setAdminDraft(null);
      return;
    }
    const d = loadPublishedDestination(slug, canonical);
    setAdminDraft({ ...d, editorWorkspace: ensureEditorWorkspace(d) });
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

  const hasUnsavedChanges = isAdmin && adminDraft != null && saveStatus !== "saved";

  // Warn on navigate-away with unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const handleSave = useCallback(() => {
    if (!adminDraft) return;
    setSaveStatus("saving");
    const normalized = { ...adminDraft, slug, editorWorkspace: ensureEditorWorkspace(adminDraft) };
    const parsed = safeParseDestination(normalized);
    if (!parsed.success) {
      setSaveStatus("error");
      toast({
        title: "Cannot save",
        description: "Fix validation errors first.",
        tone: "destructive",
      });
      return;
    }
    const toSave = { ...parsed.data, slug, editorWorkspace: ensureEditorWorkspace(parsed.data as Destination) };
    if (!publishDestination(slug, toSave)) {
      setSaveStatus("error");
      toast({ title: "Save failed", tone: "destructive" });
      return;
    }
    setDestination(loadPublishedDestination(slug, canonical));
    setSaveStatus("saved");
    window.setTimeout(() => setSaveStatus("idle"), 1400);
  }, [adminDraft, slug, canonical, toast]);

  const headerAside = isAdmin ? (
    <div className="pointer-events-none flex max-w-[min(100%,18rem)] flex-col items-end gap-2 text-right [&>*]:pointer-events-auto">
      <div className="flex items-center gap-2">
        {hasUnsavedChanges && saveStatus !== "saving" ? (
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-brand-cta px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-brand-cta/90"
          >
            Save
          </button>
        ) : null}
        {saveStatus === "saving" ? <span className="text-2xs text-muted-foreground">Saving…</span> : null}
        {saveStatus === "saved" ? <span className="text-2xs text-muted-foreground">Saved</span> : null}
        {saveStatus === "error" ? <span className="text-2xs font-medium text-destructive">Save failed</span> : null}
      </div>
      {saveStatus === "error" ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-2 text-left text-2xs leading-snug text-destructive"
        >
          Changes could not be saved. Fix validation issues (check required fields), then edit again. If storage is full or
          unavailable, try freeing space or reloading the page.
        </div>
      ) : null}
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
          headerAside={headerAside}
        />
      </BuildEditorProvider>
    );
  }

  return <DestinationDetailView destination={destination} headerAside={headerAside} />;
}
