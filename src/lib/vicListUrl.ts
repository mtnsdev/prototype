import type { AcuityStatus, RelationshipStatus } from "@/types/vic";

export type VicListTab = "mine" | "shared";

const REL_SET = new Set<string>([
  "active",
  "inactive",
  "prospect",
  "past",
  "do_not_contact",
]);
const ACUITY_SET = new Set<string>(["not_run", "running", "complete", "failed"]);

export type ParsedVicListUrl = {
  tab: VicListTab;
  q: string;
  country: string | null;
  status: RelationshipStatus | null;
  acuity: AcuityStatus | null;
  sortBy: string;
  sortOrder: "asc" | "desc";
  view: "list" | "cards";
  page: number;
};

function parseTab(raw: string | null): VicListTab {
  if (raw === "shared") return "shared";
  return "mine";
}

export const VIC_LIST_DEFAULTS = {
  tab: "mine" as VicListTab,
  sortBy: "full_name",
  sortOrder: "asc" as const,
  view: "list" as const,
  page: 1,
};

export function parseVicListSearchParams(sp: URLSearchParams): ParsedVicListUrl {
  const tab = parseTab(sp.get("tab"));
  const q = sp.get("q") ?? "";
  const country = sp.get("country")?.trim() || null;
  const statusRaw = sp.get("status");
  const status =
    statusRaw && REL_SET.has(statusRaw) ? (statusRaw as RelationshipStatus) : null;
  const acuityRaw = sp.get("acuity");
  const acuity =
    acuityRaw && ACUITY_SET.has(acuityRaw) ? (acuityRaw as AcuityStatus) : null;
  const sortBy = sp.get("sort_by")?.trim() || VIC_LIST_DEFAULTS.sortBy;
  const orderRaw = sp.get("sort_order");
  const sortOrder = orderRaw === "desc" ? "desc" : "asc";
  const viewRaw = sp.get("view");
  const view = viewRaw === "cards" ? "cards" : "list";
  const pageRaw = sp.get("page");
  const pageNum = pageRaw ? Number.parseInt(pageRaw, 10) : NaN;
  const page = Number.isFinite(pageNum) && pageNum >= 1 ? pageNum : VIC_LIST_DEFAULTS.page;

  return { tab, q, country, status, acuity, sortBy, sortOrder, view, page };
}

export function buildVicListSearchParams(args: {
  tab: VicListTab;
  q: string;
  country: string | null;
  status: RelationshipStatus | null;
  acuity: AcuityStatus | null;
  sortBy: string;
  sortOrder: "asc" | "desc";
  view: "list" | "cards";
  page: number;
}): URLSearchParams {
  const p = new URLSearchParams();
  const d = VIC_LIST_DEFAULTS;
  if (args.tab !== d.tab) p.set("tab", args.tab);
  const q = args.q.trim();
  if (q) p.set("q", q);
  if (args.country) p.set("country", args.country);
  if (args.status) p.set("status", args.status);
  if (args.acuity) p.set("acuity", args.acuity);
  if (args.sortBy !== d.sortBy) p.set("sort_by", args.sortBy);
  if (args.sortOrder !== d.sortOrder) p.set("sort_order", args.sortOrder);
  if (args.view !== d.view) p.set("view", args.view);
  if (args.page > 1) p.set("page", String(args.page));
  return p;
}

/** Remove list-state keys, then apply `built` (for deep links + modals that use other query keys). */
export function mergeVicListIntoUrl(current: URLSearchParams, built: URLSearchParams): URLSearchParams {
  const KEYS = [
    "tab",
    "q",
    "country",
    "status",
    "acuity",
    "sort_by",
    "sort_order",
    "view",
    "page",
  ] as const;
  const next = new URLSearchParams(current.toString());
  for (const k of KEYS) next.delete(k);
  for (const [k, v] of built) next.set(k, v);
  return next;
}
