"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Destination } from "@/data/destinations";
import { ensureEditorWorkspace } from "@/lib/destinationEditorTabs";
import { usePermissions } from "@/hooks/usePermissions";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/contexts/ToastContext";
import { loadPublishedDestination, publishDestination } from "@/lib/destinationLocalEdits";
import { safeParseDestination } from "@/lib/destinationEditorSchema";
import { Button } from "@/components/ui/button";
import { DestinationDetailView } from "@/components/destinations/DestinationDetailView";
import { BuildEditorProvider, BuildGuideCanvas, BuildPaletteToolbar } from "./DestinationEditorForms";

export function DestinationEditorPage({ canonical }: { canonical: Destination }) {
  const { isAdmin } = usePermissions();
  const { isLoading } = useUser();
  const router = useRouter();
  const toast = useToast();
  const slug = canonical.slug;

  const [draft, setDraft] = useState<Destination>(() => {
    const d = loadPublishedDestination(slug, canonical);
    return { ...d, editorWorkspace: ensureEditorWorkspace(d) };
  });
  const [savedSnapshot, setSavedSnapshot] = useState(() => {
    const d = loadPublishedDestination(slug, canonical);
    return JSON.stringify({ ...d, editorWorkspace: ensureEditorWorkspace(d) });
  });

  const dirty = useMemo(() => JSON.stringify(draft) !== savedSnapshot, [draft, savedSnapshot]);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace(`/dashboard/products/destinations/${slug}`);
    }
  }, [isLoading, isAdmin, router, slug]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const handleSave = useCallback(() => {
    const normalized = { ...draft, slug, editorWorkspace: ensureEditorWorkspace(draft) };
    const parsed = safeParseDestination(normalized);
    if (!parsed.success) {
      toast({
        title: "Cannot save",
        description: "Fix validation errors first.",
        tone: "destructive",
      });
      return;
    }
    const toSave = { ...parsed.data, slug, editorWorkspace: ensureEditorWorkspace(parsed.data as Destination) };
    if (!publishDestination(slug, toSave)) {
      toast({ title: "Save failed", tone: "destructive" });
      return;
    }
    setDraft(toSave);
    setSavedSnapshot(JSON.stringify(toSave));
    toast({
      title: "Saved",
      description: "Advisors see this version on the destination page (this browser).",
      tone: "success",
    });
  }, [draft, slug, toast]);

  const handleCancel = useCallback(() => {
    const href = `/dashboard/products/destinations/${slug}`;
    if (dirty && !window.confirm("Discard unsaved changes and leave the editor?")) return;
    router.push(href);
  }, [dirty, router, slug]);

  if (isLoading || !isAdmin) {
    return (
      <div className="px-6 py-10 text-sm text-muted-foreground">{isLoading ? "Loading…" : "Redirecting…"}</div>
    );
  }

  const sectionStructureEditor = (
    <div className="space-y-4">
      <BuildPaletteToolbar />
      <BuildGuideCanvas />
    </div>
  );

  return (
    <BuildEditorProvider draft={draft} setDraft={setDraft}>
      <DestinationDetailView
        destination={{ ...draft, editorWorkspace: ensureEditorWorkspace(draft) }}
        previewMode={false}
        inlineOverviewEdit={{ setDraft }}
        sectionStructureEditor={sectionStructureEditor}
        headerAside={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" variant="cta" size="sm" onClick={handleSave} disabled={!dirty}>
              Save
            </Button>
          </div>
        }
      />
    </BuildEditorProvider>
  );
}
