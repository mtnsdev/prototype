import { getMockDocuments } from "@/components/knowledge-vault/knowledgeVaultMockData";
import { knowledgeDocumentUiScope } from "@/lib/knowledgeDocumentScope";
import type { KnowledgeDocument } from "@/types/knowledge-vault";
import { FAKE_VICS } from "@/components/vic/fakeData";
import { FAKE_PRODUCTS } from "@/components/products/fakeData";
import { MOCK_DIRECTORY_PRODUCTS } from "@/components/products/productDirectoryMock";
import {
  directoryProductSearchHaystack,
  directoryProductTypeShortLabel,
} from "@/components/products/directoryProductTypeHelpers";
import { FAKE_ITINERARIES } from "@/components/itineraries/fakeData";

export type CmdKResult =
  | {
      kind: "doc";
      id: string;
      title: string;
      subtitle: string;
      scope: string;
      href: string;
    }
  | {
      kind: "product";
      id: string;
      title: string;
      subtitle: string;
      typeLabel: string;
      href: string;
    }
  | {
      kind: "vic";
      id: string;
      title: string;
      subtitle: string;
      initials: string;
      href: string;
    }
  | {
      kind: "itinerary";
      id: string;
      title: string;
      subtitle: string;
      initials: string;
      href: string;
    };

const TYPE_LABEL: Record<string, string> = {
  hotel: "Hotel / Resort",
  accommodation: "Accommodation",
  dmc: "DMC",
  experience: "Experience / Tour",
  activity: "Activity",
  cruise: "Cruise",
  restaurant: "Restaurant",
  transportation: "Transportation",
  service_provider: "Service Provider",
};

function docScope(doc: KnowledgeDocument): string {
  return knowledgeDocumentUiScope(doc);
}

/**
 * Fuzzy search helper: case-insensitive substring matching.
 * Returns a score based on match quality (higher is better).
 */
function fuzzySearch(haystack: string, needle: string): number {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (!n) return 0;
  if (h === n) return 100;
  if (h.startsWith(n)) return 50;
  if (h.includes(n)) return 25;
  return 0;
}

/**
 * Search all mock data and return results grouped by type.
 */
export function globalSearch(query: string): CmdKResult[] {
  const q = query.trim();
  if (!q) return [];

  const results: CmdKResult[] = [];

  // Search VICs by name, email, tags, home_city
  const vicResults = FAKE_VICS.map((vic) => {
    const nameScore = fuzzySearch(vic.full_name, q);
    const emailScore = fuzzySearch(vic.email || "", q);
    const homeScore = fuzzySearch(vic.home_city || "", q);
    const tagsScore = (vic.tags || []).some((t) => fuzzySearch(t, q) > 0) ? 15 : 0;
    const score = nameScore + emailScore + homeScore + tagsScore;

    return { vic, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((r) => {
      const v = r.vic;
      const parts = v.full_name.split(/\s+/).filter(Boolean);
      const initials =
        parts.length >= 2
          ? `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase()
          : (v.full_name.slice(0, 2).toUpperCase() || "??");
      return {
        kind: "vic" as const,
        id: v.id,
        title: v.full_name,
        subtitle: [v.home_city, v.home_country].filter(Boolean).join(", ") || "—",
        initials,
        href: `/dashboard/vics/${v.id}`,
      };
    });

  // Search legacy registry products + advisor directory catalog (includes DMC operational text)
  const legacyProductRows = FAKE_PRODUCTS.map((prod) => {
    const nameScore = fuzzySearch(prod.name, q);
    const cityScore = fuzzySearch(prod.city || "", q);
    const countryScore = fuzzySearch(prod.country || "", q);
    const catScore = fuzzySearch(prod.category || "", q);
    const tagsScore = (prod.tags || []).some((t) => fuzzySearch(t, q) > 0) ? 10 : 0;
    const score = nameScore + cityScore + countryScore + catScore + tagsScore;
    return { source: "legacy" as const, prod, score };
  }).filter((r) => r.score > 0);

  const directoryProductRows = MOCK_DIRECTORY_PRODUCTS.map((p) => {
    const nameScore = fuzzySearch(p.name, q);
    const hayScore = fuzzySearch(directoryProductSearchHaystack(p), q);
    const tagScore = (p.tags ?? []).some((t) => fuzzySearch(t, q) > 0) ? 12 : 0;
    const score = Math.max(nameScore, hayScore) + tagScore;
    return { source: "directory" as const, product: p, score };
  }).filter((r) => r.score > 0);

  const productResults = [...legacyProductRows, ...directoryProductRows]
    .sort((a, b) => b.score - a.score)
    .slice(0, 14)
    .map((row) => {
      if (row.source === "legacy") {
        const p = row.prod;
        const typeLabel = TYPE_LABEL[p.category] || p.category || "Product";
        return {
          kind: "product" as const,
          id: p.id,
          title: p.name,
          subtitle: [p.city, p.country].filter(Boolean).join(", ") || "—",
          typeLabel,
          href: `/dashboard/products/${p.id}`,
        };
      }
      const p = row.product;
      return {
        kind: "product" as const,
        id: p.id,
        title: p.name,
        subtitle: [p.city, p.country].filter(Boolean).join(", ") || p.location || "—",
        typeLabel: directoryProductTypeShortLabel(p),
        href: `/dashboard/products/${p.id}`,
      };
    });

  // Search Itineraries by trip_name, destinations, vic_name
  const itineraryResults = FAKE_ITINERARIES.map((itin) => {
    const nameScore = fuzzySearch(itin.trip_name || "", q);
    const destScore = (itin.destinations || []).some((d) => fuzzySearch(d, q) > 0) ? 15 : 0;
    const vicScore = fuzzySearch(itin.primary_vic_name || "", q);
    const score = nameScore + destScore + vicScore;

    return { itin, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((r) => {
      const i = r.itin;
      const parts = (i.primary_vic_name || "?").split(/\s+/).filter(Boolean);
      const initials =
        parts.length >= 2
          ? `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase()
          : ((i.primary_vic_name || "??").slice(0, 2).toUpperCase() || "??");
      return {
        kind: "itinerary" as const,
        id: i.id,
        title: i.trip_name || "Untitled Trip",
        subtitle: (i.destinations || []).join(", ") || "—",
        initials,
        href: `/dashboard/itineraries/${i.id}`,
      };
    });

  // Search Knowledge Vault documents by title and tags
  const docResults = getMockDocuments()
    .map((doc) => {
      const titleScore = fuzzySearch(doc.title, q);
      const tagsScore = (doc.tags || []).some((t) => fuzzySearch(t, q) > 0) ? 10 : 0;
      const score = titleScore + tagsScore;

      return { doc, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((r) => ({
      kind: "doc" as const,
      id: r.doc.id,
      title: r.doc.title,
      subtitle: `${r.doc.source_name} · ${new Date(r.doc.last_updated).toLocaleDateString()}`,
      scope: docScope(r.doc),
      href: `/dashboard/knowledge-vault?doc=${encodeURIComponent(r.doc.id)}`,
    }));

  // Return results organized by type
  results.push(...docResults, ...productResults, ...vicResults, ...itineraryResults);
  return results;
}

export function buildCmdKIndex(): CmdKResult[] {
  const docs = getMockDocuments()
    .slice(0, 45)
    .map((d) => ({
      kind: "doc" as const,
      id: d.id,
      title: d.title,
      subtitle: `${d.source_name} · ${new Date(d.last_updated).toLocaleDateString()}`,
      scope: docScope(d),
      href: `/dashboard/knowledge-vault?doc=${encodeURIComponent(d.id)}`,
    }));

  const directoryShowcase: CmdKResult[] = MOCK_DIRECTORY_PRODUCTS.slice(0, 6).map((p) => ({
    kind: "product" as const,
    id: p.id,
    title: p.name,
    subtitle: [p.city, p.country].filter(Boolean).join(", ") || p.location || "—",
    typeLabel: directoryProductTypeShortLabel(p),
    href: `/dashboard/products/${p.id}`,
  }));
  const legacyShowcase: CmdKResult[] = FAKE_PRODUCTS.slice(0, 6).map((p) => ({
    kind: "product" as const,
    id: p.id,
    title: p.name,
    subtitle: [p.city, p.country].filter(Boolean).join(", ") || "—",
    typeLabel: TYPE_LABEL[p.category] || p.category || "Product",
    href: `/dashboard/products/${p.id}`,
  }));
  const seenProductIds = new Set<string>();
  const products: CmdKResult[] = [];
  for (const row of [...directoryShowcase, ...legacyShowcase]) {
    if (seenProductIds.has(row.id)) continue;
    seenProductIds.add(row.id);
    products.push(row);
    if (products.length >= 10) break;
  }

  const vics: CmdKResult[] = FAKE_VICS.slice(0, 12).map((v) => {
    const parts = v.full_name.split(/\s+/).filter(Boolean);
    const initials =
      parts.length >= 2
        ? `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase()
        : (v.full_name.slice(0, 2).toUpperCase() || "??");
    return {
      kind: "vic" as const,
      id: v.id,
      title: v.full_name,
      subtitle: [v.home_city, v.home_country].filter(Boolean).join(", ") || "—",
      initials,
      href: `/dashboard/vics/${v.id}`,
    };
  });

  const itineraries: CmdKResult[] = FAKE_ITINERARIES.slice(0, 10).map((i) => {
    const parts = (i.primary_vic_name || "?").split(/\s+/).filter(Boolean);
    const initials =
      parts.length >= 2
        ? `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase()
        : ((i.primary_vic_name || "??").slice(0, 2).toUpperCase() || "??");
    return {
      kind: "itinerary" as const,
      id: i.id,
      title: i.trip_name || "Untitled trip",
      subtitle: (i.destinations || []).join(", ") || "—",
      initials,
      href: `/dashboard/itineraries/${i.id}`,
    };
  });

  return [...docs, ...products, ...vics, ...itineraries];
}

export function filterCmdKIndex(items: CmdKResult[], q: string): CmdKResult[] {
  const s = q.trim().toLowerCase();
  if (!s) return items.slice(0, 40);
  return items
    .filter((it) => {
      if (it.kind === "doc")
        return it.title.toLowerCase().includes(s) || it.subtitle.toLowerCase().includes(s);
      if (it.kind === "product")
        return (
          it.title.toLowerCase().includes(s) ||
          it.subtitle.toLowerCase().includes(s) ||
          it.typeLabel.toLowerCase().includes(s)
        );
      return it.title.toLowerCase().includes(s) || it.subtitle.toLowerCase().includes(s);
    })
    .slice(0, 24);
}

/** Boost results that match the current dashboard section (Cmd+K scope). */
export function cmdKScopeScore(pathname: string, it: CmdKResult): number {
  let score = 0;
  if (pathname.startsWith("/dashboard/products") && it.kind === "product") score += 4;
  else if (pathname.startsWith("/dashboard/knowledge") && it.kind === "doc") score += 4;
  else if (pathname.startsWith("/dashboard/vics") && it.kind === "vic") score += 4;
  else if (pathname.startsWith("/dashboard/itineraries") && it.kind === "itinerary") score += 4;
  else if (pathname.startsWith("/dashboard/chat") && it.kind === "doc") score += 1;
  return score;
}

export function sortCmdKByPathScope(pathname: string, items: CmdKResult[]): CmdKResult[] {
  return [...items].sort((a, b) => {
    const ds = cmdKScopeScore(pathname, b) - cmdKScopeScore(pathname, a);
    if (ds !== 0) return ds;
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}
