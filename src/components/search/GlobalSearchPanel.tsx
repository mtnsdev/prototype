"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Building2, FileText, Map, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { globalSearch, type CmdKResult } from "@/lib/globalSearchIndex";
import { chipStyleFromProductTypeLabel } from "@/components/products/productDirectoryProductTypes";
import { cn } from "@/lib/utils";

function avatarStyle(initials: string) {
  const a = initials.charCodeAt(0) || 65;
  const b = initials.charCodeAt(1) || 66;
  const hue = (a * 37 + b * 13) % 360;
  return {
    backgroundColor: `hsla(${hue}, 15%, 20%, 0.5)`,
    color: `hsla(${hue}, 20%, 60%, 0.85)`,
    border: `1px solid hsla(${hue}, 15%, 30%, 0.3)`,
  };
}

export default function GlobalSearchPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CmdKResult[]>([]);

  // Load query from URL params on mount
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
    }
  }, [searchParams]);

  // Perform search whenever query changes
  useEffect(() => {
    if (query.trim()) {
      const searchResults = globalSearch(query);
      setResults(searchResults);
      // Update URL without full page reload
      const url = new URL(window.location.href);
      url.searchParams.set("q", query);
      window.history.replaceState({}, "", url);
    } else {
      setResults([]);
      const url = new URL(window.location.href);
      url.searchParams.delete("q");
      window.history.replaceState({}, "", url);
    }
  }, [query]);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router]
  );

  // Group results by type
  const groupedResults = useMemo(() => {
    const grouped: Record<string, CmdKResult[]> = {
      doc: [],
      product: [],
      vic: [],
      itinerary: [],
    };

    results.forEach((r) => {
      if (r.kind === "doc") grouped.doc.push(r);
      else if (r.kind === "product") grouped.product.push(r);
      else if (r.kind === "vic") grouped.vic.push(r);
      else if (r.kind === "itinerary") grouped.itinerary.push(r);
    });

    return grouped;
  }, [results]);

  const totalResults = results.length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Search Header */}
      <div className="shrink-0 rounded-xl border border-border bg-popover p-4">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search VICs, products, itineraries, documents…"
            aria-label="Global search"
            className="flex-1 bg-transparent text-base focus-visible:ring-0"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setQuery("")}
              className="text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        {!query ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-center text-muted-foreground">
              Start typing to search across VICs, products, itineraries, and documents
            </p>
          </div>
        ) : totalResults === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-center text-muted-foreground">
              No results found for "{query}"
            </p>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {/* Documents */}
            {groupedResults.doc.length > 0 && (
              <div className="shrink-0 border-b border-border">
                <div className="sticky top-0 bg-muted/20 px-4 py-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Documents ({groupedResults.doc.length})
                  </h3>
                </div>
                <ul className="divide-y divide-border">
                  {groupedResults.doc.map((result) => (
                    <li key={result.id}>
                      <button
                        type="button"
                        onClick={() => navigate(result.href)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                      >
                        <FileText className="h-5 w-5 shrink-0 text-muted-foreground/65" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{result.title}</p>
                          <p className="text-xs text-muted-foreground/65">{result.subtitle}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Products */}
            {groupedResults.product.length > 0 && (
              <div className="shrink-0 border-b border-border">
                <div className="sticky top-0 bg-muted/20 px-4 py-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Products ({groupedResults.product.length})
                  </h3>
                </div>
                <ul className="divide-y divide-border">
                  {groupedResults.product.map((result) => {
                    if (result.kind !== "product") return null;
                    const chip = chipStyleFromProductTypeLabel(result.typeLabel);
                    return (
                      <li key={result.id}>
                        <button
                          type="button"
                          onClick={() => navigate(result.href)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                        >
                          <Building2 className="h-5 w-5 shrink-0 text-muted-foreground/65" aria-hidden />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{result.title}</p>
                            <p className="text-xs text-muted-foreground/65">{result.subtitle}</p>
                          </div>
                          <span
                            className="shrink-0 rounded border px-2 py-1 text-[9px] font-medium tracking-[0.04em]"
                            style={{
                              background: chip.bg,
                              color: chip.color,
                              borderColor: chip.border,
                            }}
                          >
                            {result.typeLabel}
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* VICs */}
            {groupedResults.vic.length > 0 && (
              <div className="shrink-0 border-b border-border">
                <div className="sticky top-0 bg-muted/20 px-4 py-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    VICs ({groupedResults.vic.length})
                  </h3>
                </div>
                <ul className="divide-y divide-border">
                  {groupedResults.vic.map((result) => {
                    if (result.kind !== "vic") return null;
                    return (
                      <li key={result.id}>
                        <button
                          type="button"
                          onClick={() => navigate(result.href)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                        >
                          <div
                            style={avatarStyle(result.initials)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium"
                          >
                            {result.initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{result.title}</p>
                            <p className="text-xs text-muted-foreground/65">{result.subtitle}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Itineraries */}
            {groupedResults.itinerary.length > 0 && (
              <div className="shrink-0 border-b border-border">
                <div className="sticky top-0 bg-muted/20 px-4 py-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Itineraries ({groupedResults.itinerary.length})
                  </h3>
                </div>
                <ul className="divide-y divide-border">
                  {groupedResults.itinerary.map((result) => {
                    if (result.kind !== "itinerary") return null;
                    return (
                      <li key={result.id}>
                        <button
                          type="button"
                          onClick={() => navigate(result.href)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                        >
                          <Map className="h-5 w-5 shrink-0 text-muted-foreground/65" aria-hidden />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{result.title}</p>
                            <p className="text-xs text-muted-foreground/65">{result.subtitle}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Results summary */}
        {query && totalResults > 0 && (
          <div className="shrink-0 border-t border-border bg-muted/20 px-4 py-2">
            <p className="text-xs text-muted-foreground">
              Found <span className="font-medium text-foreground">{totalResults}</span> results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
