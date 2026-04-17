"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Destination } from "@/data/destinations";
import { ensureEditorWorkspace, GUIDE_TAB_ID } from "@/lib/destinationEditorTabs";
import { usePermissions } from "@/hooks/usePermissions";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/contexts/ToastContext";
import { loadPublishedDestination, publishDestination } from "@/lib/destinationLocalEdits";
import { safeParseDestination } from "@/lib/destinationEditorSchema";
import { Button } from "@/components/ui/button";
import { DestinationDetailView } from "@/components/destinations/DestinationDetailView";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BuildEditorProvider,
  BuildGuideCanvas,
  BuildPaletteToolbar,
  EditorOverview,
} from "./DestinationEditorForms";

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
  const [activeTabId, setActiveTabId] = useState("overview");
  const [savedSnapshot, setSavedSnapshot] = useState(() => {
    const d = loadPublishedDestination(slug, canonical);
    return JSON.stringify({ ...d, editorWorkspace: ensureEditorWorkspace(d) });
  });

  const workspace = useMemo(() => ensureEditorWorkspace(draft), [draft]);

  const dirty = useMemo(() => JSON.stringify(draft) !== savedSnapshot, [draft, savedSnapshot]);

  useEffect(() => {
    if (activeTabId === "overview" || activeTabId === GUIDE_TAB_ID) return;
    setActiveTabId(GUIDE_TAB_ID);
  }, [activeTabId]);

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

  const setGuideLabel = useCallback((label: string) => {
    setDraft((d) => {
      const w = structuredClone(ensureEditorWorkspace(d));
      w.guideLabel = label;
      return { ...d, editorWorkspace: w };
    });
  }, []);

  const handlePublish = useCallback(() => {
    const normalized = { ...draft, slug, editorWorkspace: ensureEditorWorkspace(draft) };
    const parsed = safeParseDestination(normalized);
    if (!parsed.success) {
      toast({
        title: "Cannot publish",
        description: "Fix validation errors first.",
        tone: "destructive",
      });
      return;
    }
    const toSave = { ...parsed.data, slug, editorWorkspace: ensureEditorWorkspace(parsed.data as Destination) };
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
            <div>
              <h1 className="text-lg font-semibold text-foreground">Edit destination</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Switch <span className="text-foreground">Overview</span> or <span className="text-foreground">Build</span>{" "}
                in the sidebar. One page scrolls — guide tools on top, then the advisor page.{" "}
                <span className="text-foreground">Publish</span> saves locally for advisors.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {dirty ? (
              <span className="text-xs font-medium text-brand-cta" aria-live="polite">
                Unpublished changes
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Matches published</span>
            )}
            <Button type="button" variant="cta" size="sm" onClick={handlePublish} disabled={!dirty}>
              Publish
            </Button>
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/products/destinations/${slug}`}>View published</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 min-h-0 flex-col gap-0 lg:flex-row">
        {activeTabId === GUIDE_TAB_ID ? (
          <BuildEditorProvider draft={draft} setDraft={setDraft}>
            <aside className="flex w-full shrink-0 flex-col border-border lg:w-56 lg:min-h-0 lg:border-r">
              <nav className="flex flex-col gap-0.5 p-2" aria-label="Editor">
                <button
                  type="button"
                  onClick={() => setActiveTabId("overview")}
                  className="rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabId(GUIDE_TAB_ID)}
                  className="rounded-lg bg-muted/50 px-3 py-2 text-left text-sm font-medium text-foreground transition-colors"
                >
                  Build
                </button>
              </nav>
            </aside>

            <div className="min-h-0 flex-1 overflow-y-auto border-border lg:border-l">
              <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6 lg:py-8">
                <div className="space-y-2">
                  <Label htmlFor="guide-tab-label">Guide label</Label>
                  <Input
                    id="guide-tab-label"
                    value={workspace.guideLabel ?? ""}
                    onChange={(e) => setGuideLabel(e.target.value)}
                    placeholder="Optional label in the destination sidebar"
                  />
                </div>
                <BuildPaletteToolbar />
                <BuildGuideCanvas />
              </div>
              <div className="border-t border-border/70">
                <DestinationDetailView
                  destination={{ ...draft, editorWorkspace: ensureEditorWorkspace(draft) }}
                  previewMode
                />
              </div>
            </div>
          </BuildEditorProvider>
        ) : (
          <>
            <aside className="flex w-full shrink-0 flex-col border-border lg:w-56 lg:min-h-0 lg:border-r">
              <nav className="flex flex-col gap-0.5 p-2" aria-label="Editor">
                <button
                  type="button"
                  onClick={() => setActiveTabId("overview")}
                  className="rounded-lg bg-muted/50 px-3 py-2 text-left text-sm font-medium text-foreground transition-colors"
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabId(GUIDE_TAB_ID)}
                  className="rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                >
                  Build
                </button>
              </nav>
            </aside>

            <div className="min-h-0 flex-1 overflow-y-auto border-border lg:border-l">
              <div className="mx-auto max-w-3xl p-4 md:p-6 lg:py-8">
                <EditorOverview draft={draft} setDraft={setDraft} />
              </div>
              <div className="border-t border-border/70">
                <DestinationDetailView
                  destination={{ ...draft, editorWorkspace: ensureEditorWorkspace(draft) }}
                  previewMode
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
