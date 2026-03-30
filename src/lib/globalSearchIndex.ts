import { getMockDocuments } from "@/components/knowledge-vault/knowledgeVaultMockData";
import { knowledgeDocumentUiScope } from "@/lib/knowledgeDocumentScope";
import type { KnowledgeDocument } from "@/types/knowledge-vault";
import { FAKE_VICS } from "@/components/vic/fakeData";

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
    };

const TYPE_LABEL: Record<string, string> = {
  hotel: "Hotel / Resort",
  dmc: "DMC",
  experience: "Experience / Tour",
  cruise: "Cruise",
};

const PRODUCT_SEED: { id: string; name: string; city: string; country: string; type: string }[] = [
  { id: "prod-001", name: "Aman Tokyo", city: "Tokyo", country: "Japan", type: TYPE_LABEL.hotel! },
  { id: "prod-002", name: "Four Seasons Kyoto", city: "Kyoto", country: "Japan", type: TYPE_LABEL.hotel! },
  { id: "prod-003", name: "One&Only Reethi Rah", city: "North Malé Atoll", country: "Maldives", type: TYPE_LABEL.hotel! },
  { id: "prod-004", name: "Cheval Blanc St-Barth", city: "St. Barthélemy", country: "France", type: TYPE_LABEL.hotel! },
  { id: "prod-005", name: "Belmond Hotel Caruso", city: "Ravello", country: "Italy", type: TYPE_LABEL.hotel! },
  { id: "prod-dmc-001", name: "Bali Luxury Concierge — Dima", city: "Ubud", country: "Indonesia", type: TYPE_LABEL.dmc! },
  { id: "prod-exp-001", name: "Private Tea Ceremony — Kyoto", city: "Kyoto", country: "Japan", type: TYPE_LABEL.experience! },
  { id: "prod-cruise-001", name: "Silversea — Mediterranean Grand Voyage", city: "Monte Carlo", country: "Monaco", type: TYPE_LABEL.cruise! },
];

function docScope(doc: KnowledgeDocument): string {
  return knowledgeDocumentUiScope(doc);
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

  const products: CmdKResult[] = PRODUCT_SEED.map((p) => ({
    kind: "product",
    id: p.id,
    title: p.name,
    subtitle: `${p.city}, ${p.country}`,
    typeLabel: p.type,
    href: `/dashboard/products/${p.id}`,
  }));

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
      subtitle: [v.city, v.country].filter(Boolean).join(", ") || "—",
      initials,
      href: `/dashboard/vics/${v.id}`,
    };
  });

  return [...docs, ...products, ...vics];
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
