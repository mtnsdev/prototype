"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Destination } from "@/data/destinations";
import { usePermissions } from "@/hooks/usePermissions";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/contexts/ToastContext";
import {
  clearAllDestinationOverrides,
  clearDraftDestination,
  DESTINATION_STORAGE_EVENT,
  hasDraftDestination,
  loadEditorBootstrap,
  loadPublishedDestination,
  publishDestination,
  saveDraftDestination,
} from "@/lib/destinationLocalEdits";
import { safeParseDestination } from "@/lib/destinationEditorSchema";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { DestinationDetailView } from "@/components/destinations/DestinationDetailView";
import { cn } from "@/lib/utils";
import {
  EditorOverview,
  EditorDMCList,
  EditorRestaurantMap,
  EditorHotelMap,
  EditorYachtList,
  EditorTourismList,
  EditorDocuments,
} from "./DestinationEditorForms";

const SECTIONS = [
  { id: "overview", label: "Overview & regions" },
  { id: "dmc", label: "DMC partners" },
  { id: "restaurants", label: "Restaurants" },
  { id: "hotels", label: "Hotels" },
  { id: "yachts", label: "Yacht charters" },
  { id: "tourism", label: "Tourism" },
  { id: "documents", label: "Documents" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function DestinationEditorPage({ canonical }: { canonical: Destination }) {
  const { isAdmin } = usePermissions();
  const { isLoading } = useUser();
  const router = useRouter();
  const toast = useToast();
  const slug = canonical.slug;

  const [draft, setDraft] = useState<Destination>(() => loadEditorBootstrap(slug, canonical));
  const [section, setSection] = useState<SectionId>("overview");
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(loadEditorBootstrap(slug, canonical)));
  const [hasDraftKey, setHasDraftKey] = useState(() =>
    typeof window !== "undefined" ? hasDraftDestination(slug) : false,
  );

  const dirty = useMemo(() => JSON.stringify(draft) !== savedSnapshot, [draft, savedSnapshot]);

  useEffect(() => {
    const sync = () => setHasDraftKey(hasDraftDestination(slug));
    sync();
    window.addEventListener(DESTINATION_STORAGE_EVENT, sync);
    return () => window.removeEventListener(DESTINATION_STORAGE_EVENT, sync);
  }, [slug]);

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

  const handleSaveDraft = useCallback(() => {
    const parsed = safeParseDestination({ ...draft, slug });
    if (!parsed.success) {
      toast({
        title: "Validation failed",
        description: "Fix invalid fields (empty names, malformed rows) and try again.",
        tone: "destructive",
      });
      return;
    }
    const toSave = { ...parsed.data, slug };
    if (!saveDraftDestination(slug, toSave)) {
      toast({ title: "Could not save draft", description: "Data failed validation.", tone: "destructive" });
      return;
    }
    setDraft(toSave);
    setSavedSnapshot(JSON.stringify(toSave));
    toast({
      title: "Draft saved",
      description: "Advisors still see the last published version until you publish.",
      tone: "success",
    });
  }, [draft, slug, toast]);

  const handlePublish = useCallback(() => {
    const parsed = safeParseDestination({ ...draft, slug });
    if (!parsed.success) {
      toast({
        title: "Cannot publish",
        description: "Fix validation errors first.",
        tone: "destructive",
      });
      return;
    }
    const toSave = { ...parsed.data, slug };
    if (!publishDestination(slug, toSave)) {
      toast({ title: "Publish failed", tone: "destructive" });
      return;
    }
    setDraft(toSave);
    setSavedSnapshot(JSON.stringify(toSave));
    toast({
      title: "Published",
      description: "Advisors now see this version on the destination page (this browser).",
      tone: "success",
    });
  }, [draft, slug, toast]);

  const handleDiscardDraft = useCallback(() => {
    if (!window.confirm("Discard the saved draft and reload the last published version?")) return;
    clearDraftDestination(slug);
    const next = loadPublishedDestination(slug, canonical);
    setDraft(next);
    setSavedSnapshot(JSON.stringify(next));
    toast({ title: "Draft discarded", tone: "default" });
  }, [canonical, slug, toast]);

  const handleReset = useCallback(() => {
    if (!window.confirm("Remove published overrides and draft for this destination, restoring bundled seed data?")) return;
    clearAllDestinationOverrides(slug);
    setDraft(canonical);
    setSavedSnapshot(JSON.stringify(canonical));
    toast({ title: "Restored seed data", tone: "default" });
  }, [canonical, slug, toast]);

  if (isLoading || !isAdmin) {
    return (
      <div className="px-6 py-10 text-sm text-muted-foreground">{isLoading ? "Loading…" : "Redirecting…"}</div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-border bg-background/95 px-4 py-4 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-2">
            <Breadcrumbs
              items={[
                { label: "Products", href: "/dashboard/products" },
                { label: "Destinations", href: "/dashboard/products/destinations" },
                { label: canonical.name, href: `/dashboard/products/destinations/${slug}` },
                { label: "Edit" },
              ]}
            />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Edit destination</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick catalog products to hydrate rows. <span className="text-foreground">Save draft</span> is local
                only; <span className="text-foreground">Publish</span> updates what advisors see.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {dirty ? (
              <span className="text-xs font-medium text-brand-cta" aria-live="polite">
                Unsaved changes
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">In sync with last save</span>
            )}
            {hasDraftKey ? (
              <span className="text-xs text-muted-foreground">Draft on disk</span>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={handleReset}>
              Reset to seed
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleDiscardDraft} disabled={!hasDraftKey}>
              Discard draft
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleSaveDraft} disabled={!dirty}>
              Save draft
            </Button>
            <Button type="button" variant="cta" size="sm" onClick={handlePublish}>
              Publish
            </Button>
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/products/destinations/${slug}`}>View published</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-0 lg:flex-row lg:min-h-0">
        <aside className="flex w-full shrink-0 flex-col border-border lg:w-56 lg:border-r">
          <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible" aria-label="Editor sections">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  section === s.id
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] lg:gap-0">
          <div className="min-h-0 overflow-y-auto border-border p-4 md:p-6 lg:border-r">
            <div className="mx-auto max-w-3xl pb-24">
              {section === "overview" ? <EditorOverview draft={draft} setDraft={setDraft} /> : null}
              {section === "dmc" ? <EditorDMCList draft={draft} setDraft={setDraft} /> : null}
              {section === "restaurants" ? <EditorRestaurantMap draft={draft} setDraft={setDraft} /> : null}
              {section === "hotels" ? <EditorHotelMap draft={draft} setDraft={setDraft} /> : null}
              {section === "yachts" ? <EditorYachtList draft={draft} setDraft={setDraft} /> : null}
              {section === "tourism" ? <EditorTourismList draft={draft} setDraft={setDraft} /> : null}
              {section === "documents" ? <EditorDocuments draft={draft} setDraft={setDraft} /> : null}
            </div>
          </div>

          <div className="hidden min-h-0 flex-col border-t border-border bg-background/50 lg:flex lg:border-t-0 lg:border-l">
            <div className="shrink-0 border-b border-border px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live preview</p>
              <p className="mt-0.5 text-2xs text-muted-foreground">Shows your current editor state (draft).</p>
            </div>
            <div className="min-h-0 max-h-[calc(100vh-12rem)] flex-1 overflow-y-auto p-3">
              <DestinationDetailView destination={draft} previewMode />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
