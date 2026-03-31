import { PIPELINE_STAGES } from "@/config/pipelineStages";
import { ALL_COUNTRIES } from "@/components/products/locationGroups";
import type { ItineraryStatus, PipelineStage } from "@/types/itinerary";

export type ItineraryListTab = "mine" | "agency";

const STATUS_SET = new Set<string>([
  "draft",
  "proposed",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);

const PIPELINE_KEYS = new Set<PipelineStage>(PIPELINE_STAGES.map((s) => s.key));

function parseDestinationCountries(sp: URLSearchParams): string[] {
  const raw = sp.get("destinations")?.trim();
  if (raw) {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  const legacy = sp.get("destination")?.trim();
  if (!legacy) return [];
  const parts = legacy.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1) return parts;
  const single = parts[0];
  if (!single) return [];
  const exact = ALL_COUNTRIES.find((c) => c.toLowerCase() === single.toLowerCase());
  return exact ? [exact] : [];
}

export type ParsedItinerariesUrl = {
  tab: ItineraryListTab;
  q: string;
  status: ItineraryStatus | null;
  /** Country names from the shared location catalog (OR match on itinerary destination strings). */
  destinationCountries: string[];
  /** List filter — maps to API `vic_id` */
  vic: string | null;
  dateFrom: string;
  dateTo: string;
  pipeline: PipelineStage | null;
  upcoming: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  view: "list" | "cards" | "board";
};

function parseTab(raw: string | null): ItineraryListTab {
  return raw === "agency" ? "agency" : "mine";
}

export const ITINERARIES_LIST_DEFAULTS = {
  tab: "mine" as ItineraryListTab,
  sortBy: "updated_at",
  sortOrder: "desc" as const,
  view: "list" as const,
};

export function parseItinerariesSearchParams(sp: URLSearchParams): ParsedItinerariesUrl {
  const tab = parseTab(sp.get("tab"));
  const q = sp.get("q") ?? "";
  const statusRaw = sp.get("status");
  const status =
    statusRaw && STATUS_SET.has(statusRaw) ? (statusRaw as ItineraryStatus) : null;
  const destinationCountries = parseDestinationCountries(sp);
  const vic = sp.get("vic")?.trim() || null;
  const dateFrom = sp.get("date_from")?.trim() ?? "";
  const dateTo = sp.get("date_to")?.trim() ?? "";
  const pipeRaw = sp.get("pipeline");
  const pipeline =
    pipeRaw && PIPELINE_KEYS.has(pipeRaw as PipelineStage)
      ? (pipeRaw as PipelineStage)
      : null;
  const upcoming = sp.get("filter") === "upcoming";
  const sortBy = sp.get("sort_by")?.trim() || ITINERARIES_LIST_DEFAULTS.sortBy;
  const orderRaw = sp.get("sort_order");
  const sortOrder = orderRaw === "asc" ? "asc" : "desc";
  const viewRaw = sp.get("view");
  const view =
    viewRaw === "cards" ? "cards" : viewRaw === "board" ? "board" : "list";

  return {
    tab,
    q,
    status,
    destinationCountries,
    vic,
    dateFrom,
    dateTo,
    pipeline,
    upcoming,
    sortBy,
    sortOrder,
    view,
  };
}

export function buildItinerariesSearchParams(args: {
  tab: ItineraryListTab;
  q: string;
  status: ItineraryStatus | null;
  destinationCountries: string[];
  vic: string | null;
  dateFrom: string;
  dateTo: string;
  pipeline: PipelineStage | null;
  upcoming: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  view: "list" | "cards" | "board";
}): URLSearchParams {
  const p = new URLSearchParams();
  const d = ITINERARIES_LIST_DEFAULTS;
  if (args.tab !== d.tab) p.set("tab", args.tab);
  const q = args.q.trim();
  if (q) p.set("q", q);
  if (args.status) p.set("status", args.status);
  if (args.destinationCountries.length > 0) p.set("destinations", args.destinationCountries.join(","));
  if (args.vic) p.set("vic", args.vic);
  if (args.dateFrom) p.set("date_from", args.dateFrom);
  if (args.dateTo) p.set("date_to", args.dateTo);
  if (args.pipeline) p.set("pipeline", args.pipeline);
  if (args.upcoming) p.set("filter", "upcoming");
  if (args.sortBy !== d.sortBy) p.set("sort_by", args.sortBy);
  if (args.sortOrder !== d.sortOrder) p.set("sort_order", args.sortOrder);
  if (args.view !== d.view) p.set("view", args.view);
  return p;
}

const LIST_KEYS = [
  "tab",
  "q",
  "status",
  "destination",
  "destinations",
  "vic",
  "date_from",
  "date_to",
  "pipeline",
  "filter",
  "sort_by",
  "sort_order",
  "view",
] as const;

/** Preserves e.g. `create=1`, `vic_id` (create prefill), unrelated keys. */
export function mergeItinerariesListIntoUrl(
  current: URLSearchParams,
  built: URLSearchParams
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  for (const k of LIST_KEYS) next.delete(k);
  for (const [k, v] of built) next.set(k, v);
  return next;
}
