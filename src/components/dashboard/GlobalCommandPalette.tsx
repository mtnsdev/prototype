"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Building2, FileText, Search, Map } from "lucide-react";
import { useGlobalSearch } from "@/contexts/GlobalSearchContext";
import { useTeams } from "@/contexts/TeamsContext";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import {
  buildCmdKIndex,
  filterCmdKIndex,
  sortCmdKByPathScope,
  globalSearch,
  type CmdKResult,
} from "@/lib/globalSearchIndex";
import { getCmdKRecents, pushCmdKRecent, type CmdKRecent } from "@/lib/cmdkRecents";
import { chipStyleFromProductTypeLabel } from "@/components/products/productDirectoryProductTypes";
import { cn } from "@/lib/utils";

function avatarStyle(initials: string): CSSProperties {
  const a = initials.charCodeAt(0) || 65;
  const b = initials.charCodeAt(1) || 66;
  const hue = (a * 37 + b * 13) % 360;
  return {
    backgroundColor: `hsla(${hue}, 15%, 20%, 0.5)`,
    color: `hsla(${hue}, 20%, 60%, 0.85)`,
    border: `1px solid hsla(${hue}, 15%, 30%, 0.3)`,
  };
}

type Row =
  | { rowKind: "section"; id: string; label: string }
  | { rowKind: "hit"; id: string; hit: CmdKResult }
  | { rowKind: "recent"; id: string; hit: CmdKRecent };

export default function GlobalCommandPalette() {
  const { open, closeSearch } = useGlobalSearch();
  const router = useRouter();
  const pathname = usePathname();
  const { teams } = useTeams();
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const [activeFlat, setActiveFlat] = useState(0);
  const [recents, setRecents] = useState<CmdKRecent[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const index = useMemo(() => buildCmdKIndex(), []);

  useEffect(() => {
    if (open) setRecents(getCmdKRecents());
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (q) {
      // Use globalSearch for actual search queries
      return globalSearch(q);
    } else {
      // Use default index for empty query (recents shown separately)
      const base = filterCmdKIndex(index, "");
      return sortCmdKByPathScope(pathname, base);
    }
  }, [index, query, pathname]);

  const rows = useMemo((): Row[] => {
    const out: Row[] = [];
    const q = query.trim();

    if (!q && recents.length > 0) {
      out.push({ rowKind: "section", id: "sec-recent", label: "Recent" });
      recents.slice(0, 6).forEach((r, i) => {
        out.push({ rowKind: "recent", id: `recent-${i}-${r.href}`, hit: r });
      });
    }

    const docs = filtered.filter((x): x is Extract<CmdKResult, { kind: "doc" }> => x.kind === "doc");
    const products = filtered.filter((x): x is Extract<CmdKResult, { kind: "product" }> => x.kind === "product");
    const vics = filtered.filter((x): x is Extract<CmdKResult, { kind: "vic" }> => x.kind === "vic");
    const itineraries = filtered.filter((x): x is Extract<CmdKResult, { kind: "itinerary" }> => x.kind === "itinerary");

    if (docs.length > 0) {
      out.push({ rowKind: "section", id: "sec-docs", label: "Documents" });
      docs.forEach((d, i) => out.push({ rowKind: "hit", id: `doc-${d.id}-${i}`, hit: d }));
    }
    if (products.length > 0) {
      out.push({ rowKind: "section", id: "sec-products", label: "Products" });
      products.forEach((p, i) => out.push({ rowKind: "hit", id: `prod-${p.id}-${i}`, hit: p }));
    }
    if (vics.length > 0) {
      out.push({ rowKind: "section", id: "sec-vics", label: "VICs" });
      vics.forEach((v, i) => out.push({ rowKind: "hit", id: `vic-${v.id}-${i}`, hit: v }));
    }
    if (itineraries.length > 0) {
      out.push({ rowKind: "section", id: "sec-itineraries", label: "Itineraries" });
      itineraries.forEach((itin, i) => out.push({ rowKind: "hit", id: `itin-${itin.id}-${i}`, hit: itin }));
    }

    return out;
  }, [filtered, query, recents]);

  const selectable = useMemo(
    () => rows.filter((r): r is Extract<Row, { rowKind: "hit" | "recent" }> => r.rowKind !== "section"),
    [rows]
  );

  useEffect(() => {
    setActiveFlat(0);
  }, [query, open, selectable.length]);

  useEffect(() => {
    if (activeFlat >= selectable.length) setActiveFlat(Math.max(0, selectable.length - 1));
  }, [activeFlat, selectable.length]);

  const go = useCallback(
    (href: string, title: string, kind: CmdKRecent["kind"]) => {
      pushCmdKRecent({ href, title, kind });
      closeSearch();
      startTransition(() => router.push(href));
    },
    [closeSearch, router]
  );

  const activateCurrent = useCallback(() => {
    const sel = selectable[activeFlat];
    if (!sel) return;
    if (sel.rowKind === "recent") {
      go(sel.hit.href, sel.hit.title, sel.hit.kind);
      return;
    }
    const h = sel.hit;
    if (h.kind === "doc") go(h.href, h.title, "doc");
    else if (h.kind === "product") go(h.href, h.title, "product");
    else if (h.kind === "itinerary") go(h.href, h.title, "doc"); // treat itinerary as doc for recent
    else go(h.href, h.title, "vic");
  }, [selectable, activeFlat, go]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSearch();
        return;
      }

      const n = selectable.length;
      if (n === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveFlat((i) => (i + 1) % n);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveFlat((i) => (i - 1 + n) % n);
        return;
      }
      if (e.key === "Enter") {
        const t = e.target as HTMLElement;
        if (t.closest("input")) {
          e.preventDefault();
          activateCurrent();
        }
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, closeSearch, selectable.length, activateCurrent]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-cmdk-active="true"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeFlat, open, selectable]);

  if (!open) return null;

  const activeId = selectable[activeFlat]?.id;

  let flat = -1;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close search"
        onClick={closeSearch}
      />
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search everything…"
            aria-autocomplete="list"
            aria-controls="cmdk-listbox"
            className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground/65 outline-none"
          />
          <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground/65">
            ESC
          </kbd>
        </div>

        <div
          ref={listRef}
          id="cmdk-listbox"
          role="listbox"
          aria-activedescendant={activeId ? `cmdk-${activeId}` : undefined}
          className="max-h-[50vh] overflow-y-auto py-2"
        >
          {rows.length === 0 || selectable.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">No matches</div>
          ) : (
            rows.map((row) => {
              if (row.rowKind === "section") {
                return (
                  <div key={row.id} className="px-3 py-1" role="presentation">
                    <span className="px-2 text-[9px] uppercase tracking-[0.08em] text-muted-foreground/65">
                      {row.label}
                    </span>
                  </div>
                );
              }

              flat += 1;
              const isActive = flat === activeFlat;
              const optId = `cmdk-${row.id}`;

              if (row.rowKind === "recent") {
                const r = row.hit;
                return (
                  <button
                    key={row.id}
                    id={optId}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    data-cmdk-active={isActive ? "true" : undefined}
                    onClick={() => go(r.href, r.title, r.kind)}
                    onMouseEnter={() => setActiveFlat(flat)}
                    className={cn(
                      "flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors",
                      isActive ? "bg-muted/80" : "hover:bg-muted/50"
                    )}
                  >
                    <span className="shrink-0 text-2xs uppercase tracking-wide text-muted-foreground/65">
                      {r.kind}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-compact text-foreground">{r.title}</span>
                  </button>
                );
              }

              const data = row.hit;
              if (data.kind === "doc") {
                return (
                  <button
                    key={row.id}
                    id={optId}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    data-cmdk-active={isActive ? "true" : undefined}
                    onClick={() => go(data.href, data.title, "doc")}
                    onMouseEnter={() => setActiveFlat(flat)}
                    className={cn(
                      "flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors",
                      isActive ? "bg-muted/80" : "hover:bg-muted/50"
                    )}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground/65" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <span className="text-compact block truncate text-foreground">{data.title}</span>
                      <span className="text-2xs text-muted-foreground/65">{data.subtitle}</span>
                    </div>
                    <ScopeBadge scope={data.scope} teams={teams} />
                  </button>
                );
              }

              if (data.kind === "product") {
                const chip = chipStyleFromProductTypeLabel(data.typeLabel);
                return (
                  <button
                    key={row.id}
                    id={optId}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    data-cmdk-active={isActive ? "true" : undefined}
                    onClick={() => go(data.href, data.title, "product")}
                    onMouseEnter={() => setActiveFlat(flat)}
                    className={cn(
                      "flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors",
                      isActive ? "bg-muted/80" : "hover:bg-muted/50"
                    )}
                  >
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground/65" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <span className="text-compact block truncate text-foreground">{data.title}</span>
                      <span className="text-2xs text-muted-foreground/65">{data.subtitle}</span>
                    </div>
                    <span
                      className="shrink-0 rounded border px-2 py-0.5 text-[9px] tracking-[0.04em]"
                      style={{
                        background: chip.bg,
                        color: chip.color,
                        borderColor: chip.border,
                      }}
                    >
                      {data.typeLabel}
                    </span>
                  </button>
                );
              }

              if (data.kind === "itinerary") {
                return (
                  <button
                    key={row.id}
                    id={optId}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    data-cmdk-active={isActive ? "true" : undefined}
                    onClick={() => go(data.href, data.title, "doc")}
                    onMouseEnter={() => setActiveFlat(flat)}
                    className={cn(
                      "flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors",
                      isActive ? "bg-muted/80" : "hover:bg-muted/50"
                    )}
                  >
                    <Map className="h-4 w-4 shrink-0 text-muted-foreground/65" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <span className="text-compact block truncate text-foreground">{data.title}</span>
                      <span className="text-2xs text-muted-foreground/65">{data.subtitle}</span>
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={row.id}
                  id={optId}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  data-cmdk-active={isActive ? "true" : undefined}
                  onClick={() => go(data.href, data.title, "vic")}
                  onMouseEnter={() => setActiveFlat(flat)}
                  className={cn(
                    "flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors",
                    isActive ? "bg-muted/80" : "hover:bg-muted/50"
                  )}
                >
                  <div
                    style={avatarStyle(data.initials)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px]"
                  >
                    {data.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-compact block truncate text-foreground">{data.title}</span>
                    <span className="text-2xs text-muted-foreground/65">{data.subtitle}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-border px-5 py-2.5 text-[9px] text-muted-foreground/65">
          <span>
            <kbd className="mr-1 rounded border border-border px-1 py-0.5">↑↓</kbd>
            Navigate
          </span>
          <span>
            <kbd className="mr-1 rounded border border-border px-1 py-0.5">↵</kbd>
            Open
          </span>
          <span>
            <kbd className="mr-1 rounded border border-border px-1 py-0.5">ESC</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
