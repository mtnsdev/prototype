"use client";

import { useState, useEffect } from "react";
import { Globe, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "briefing_publication_sources_v1";

function loadSources(): string[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const j = JSON.parse(raw) as unknown;
        return Array.isArray(j) ? j.filter((x): x is string => typeof x === "string") : [];
    } catch {
        return [];
    }
}

function saveSources(urls: string[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
    } catch {
        /* ignore */
    }
}

export default function BriefingPublicationsStub() {
    const [sources, setSources] = useState<string[]>([]);
    const [draft, setDraft] = useState("");

    useEffect(() => {
        setSources(loadSources());
    }, []);

    const add = () => {
        const u = draft.trim();
        if (!u) return;
        const next = [...sources, u];
        setSources(next);
        saveSources(next);
        setDraft("");
    };

    return (
        <section
            className="mb-10 rounded-2xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur-sm"
            aria-label="Publication sources"
        >
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Globe className="size-4 text-muted-foreground/80" aria-hidden />
                        Publications &amp; briefs
                    </h2>
                    <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                        Attach sites you follow. Daily briefs from these sources will appear here when the feed
                        integration is connected (prototype: saved locally only).
                    </p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <Input
                    type="url"
                    inputMode="url"
                    placeholder="https://example.com/travel-news"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="max-w-md flex-1 min-w-[200px] border-border bg-background"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") add();
                    }}
                />
                <Button type="button" variant="secondary" size="sm" className="gap-1.5" onClick={add}>
                    <Plus className="size-4" aria-hidden />
                    Add source
                </Button>
            </div>

            {sources.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {sources.map((url) => (
                        <li key={url} className="truncate font-mono text-xs text-foreground/90">
                            {url}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-4 text-sm text-muted-foreground/80">No sources yet.</p>
            )}

            <div className="mt-6 rounded-xl border border-dashed border-border/80 bg-muted/10 px-4 py-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                    Today&apos;s brief (sample)
                </p>
                <p className="mt-2 text-sm text-foreground/90 leading-relaxed">
                    When connected, a short digest from your publications will show up here each morning—similar
                    to your Catch up queue, scoped to external reading.
                </p>
            </div>
        </section>
    );
}
