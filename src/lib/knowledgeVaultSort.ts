export type KvSortOption =
  | "updated_desc"
  | "updated_asc"
  | "title_asc"
  | "title_desc"
  | "size_desc"
  | "size_asc";

const KV_SORT_VALUES: KvSortOption[] = [
  "updated_desc",
  "updated_asc",
  "title_asc",
  "title_desc",
  "size_desc",
  "size_asc",
];

export function isKvSortOption(v: string): v is KvSortOption {
  return (KV_SORT_VALUES as string[]).includes(v);
}

export type KvSortColumn = "title" | "last_updated" | "file_size_kb";

export function kvSortToApi(option: KvSortOption): { sort_by: string; sort_order: "asc" | "desc" } {
  const m: Record<KvSortOption, { sort_by: string; sort_order: "asc" | "desc" }> = {
    updated_desc: { sort_by: "last_updated", sort_order: "desc" },
    updated_asc: { sort_by: "last_updated", sort_order: "asc" },
    title_asc: { sort_by: "title", sort_order: "asc" },
    title_desc: { sort_by: "title", sort_order: "desc" },
    size_desc: { sort_by: "file_size_kb", sort_order: "desc" },
    size_asc: { sort_by: "file_size_kb", sort_order: "asc" },
  };
  return m[option];
}

export function kvSortActiveColumn(option: KvSortOption): KvSortColumn {
  if (option.startsWith("title_")) return "title";
  if (option.startsWith("size_")) return "file_size_kb";
  return "last_updated";
}

export function kvSortIsAsc(option: KvSortOption): boolean {
  return option.endsWith("_asc");
}

/** Same column: flip order. New column: sensible default (title A–Z, updated newest, size largest). */
export function kvToggleSortColumn(option: KvSortOption, column: KvSortColumn): KvSortOption {
  const cur = kvSortActiveColumn(option);
  const asc = kvSortIsAsc(option);
  if (cur === column) {
    if (column === "title") return asc ? "title_desc" : "title_asc";
    if (column === "file_size_kb") return asc ? "size_desc" : "size_asc";
    return asc ? "updated_desc" : "updated_asc";
  }
  if (column === "title") return "title_asc";
  if (column === "file_size_kb") return "size_desc";
  return "updated_desc";
}
