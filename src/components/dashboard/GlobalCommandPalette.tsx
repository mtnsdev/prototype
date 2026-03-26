"use client";

import { useEffect, useMemo, useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Building2, FileText, Search } from "lucide-react";
import { useGlobalSearch } from "@/contexts/GlobalSearchContext";
import { useTeams } from "@/contexts/TeamsContext";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import { buildCmdKIndex, filterCmdKIndex, type CmdKResult } from "@/lib/globalSearchIndex";
import { cn } from "@/lib/utils";

function categoryBadgeClass(typeLabel: string): string {
  if (typeLabel.includes("DMC")) return "bg-[rgba(130,160,160,0.08)] text-[#82A0A0] border-[rgba(130,160,160,0.12)]";
  if (typeLabel.includes("Experience")) return "bg-[rgba(160,140,170,0.08)] text-[#A08CAA] border-[rgba(160,140,170,0.12)]";
  if (typeLabel.includes("Cruise")) return "bg-[rgba(130,150,180,0.08)] text-[#8296B4] border-[rgba(130,150,180,0.12)]";
  return "bg-[rgba(180,160,130,0.08)] text-[#B8A082] border-[rgba(180,160,130,0.12)]";
}

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

export default function GlobalCommandPalette() {
  const { open, closeSearch } = useGlobalSearch();
  const router = useRouter();
  const { teams } = useTeams();
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const index = useMemo(() => buildCmdKIndex(), []);

  const filtered = useMemo(() => filterCmdKIndex(index, query), [index, query]);

  const grouped = useMemo(() => {
    const docs = filtered.filter((x): x is Extract<CmdKResult, { kind: "doc" }> => x.kind === "doc");
    const products = filtered.filter((x): x is Extract<CmdKResult, { kind: "product" }> => x.kind === "product");
    const vics = filtered.filter((x): x is Extract<CmdKResult, { kind: "vic" }> => x.kind === "vic");
    return { docs, products, vics };
  }, [filtered]);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  if (!open) return null;

  const go = (href: string) => {
    closeSearch();
    startTransition(() => router.push(href));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close search"
        onClick={closeSearch}
      />
      <div className="relative w-full max-w-xl bg-[#0c0c12] border border-[rgba(255,255,255,0.06)] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[rgba(255,255,255,0.03)]">
          <Search className="w-4 h-4 text-[#6B6560] shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search everything…"
            className="flex-1 bg-transparent text-[14px] text-[#F5F0EB] placeholder:text-[#4A4540] outline-none"
          />
          <kbd className="text-[9px] text-[#4A4540] border border-[rgba(255,255,255,0.06)] rounded px-1.5 py-0.5 shrink-0">
            ESC
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-2">
          {grouped.docs.length > 0 && (
            <>
              <div className="px-3 py-1">
                <span className="text-[9px] tracking-[0.08em] uppercase text-[#4A4540] px-2">Documents</span>
              </div>
              {grouped.docs.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => go(doc.href)}
                  className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-[rgba(255,255,255,0.02)] transition-colors text-left"
                >
                  <FileText className="w-4 h-4 text-[#4A4540] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] text-[#F5F0EB] block truncate">{doc.title}</span>
                    <span className="text-[10px] text-[#4A4540]">{doc.subtitle}</span>
                  </div>
                  <ScopeBadge scope={doc.scope} teams={teams} />
                </button>
              ))}
            </>
          )}

          {grouped.products.length > 0 && (
            <>
              <div className="px-3 py-1 mt-1">
                <span className="text-[9px] tracking-[0.08em] uppercase text-[#4A4540] px-2">Products</span>
              </div>
              {grouped.products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => go(p.href)}
                  className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-[rgba(255,255,255,0.02)] transition-colors text-left"
                >
                  <Building2 className="w-4 h-4 text-[#4A4540] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] text-[#F5F0EB] block truncate">{p.title}</span>
                    <span className="text-[10px] text-[#4A4540]">{p.subtitle}</span>
                  </div>
                  <span
                    className={cn(
                      "text-[9px] tracking-[0.04em] px-2 py-0.5 rounded border shrink-0",
                      categoryBadgeClass(p.typeLabel)
                    )}
                  >
                    {p.typeLabel}
                  </span>
                </button>
              ))}
            </>
          )}

          {grouped.vics.length > 0 && (
            <>
              <div className="px-3 py-1 mt-1">
                <span className="text-[9px] tracking-[0.08em] uppercase text-[#4A4540] px-2">Clients</span>
              </div>
              {grouped.vics.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => go(v.href)}
                  className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-[rgba(255,255,255,0.02)] transition-colors text-left"
                >
                  <div
                    style={avatarStyle(v.initials)}
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[9px]"
                  >
                    {v.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] text-[#F5F0EB] block truncate">{v.title}</span>
                    <span className="text-[10px] text-[#4A4540]">{v.subtitle}</span>
                  </div>
                </button>
              ))}
            </>
          )}

          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-[12px] text-[#6B6560]">No matches</div>
          )}
        </div>

        <div className="px-5 py-2.5 border-t border-[rgba(255,255,255,0.03)] flex items-center gap-4 text-[9px] text-[#4A4540]">
          <span>
            <kbd className="border border-[rgba(255,255,255,0.06)] rounded px-1 py-0.5 mr-1">↑↓</kbd>
            Navigate
          </span>
          <span>
            <kbd className="border border-[rgba(255,255,255,0.06)] rounded px-1 py-0.5 mr-1">↵</kbd>
            Open
          </span>
          <span>
            <kbd className="border border-[rgba(255,255,255,0.06)] rounded px-1 py-0.5 mr-1">ESC</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
