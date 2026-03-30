const STORAGE_KEY = "enable_cmdk_recents_v1";
const MAX = 8;

export type CmdKRecent = {
  href: string;
  title: string;
  kind: "doc" | "product" | "vic";
};

function read(): CmdKRecent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CmdKRecent =>
        x != null &&
        typeof x === "object" &&
        typeof (x as CmdKRecent).href === "string" &&
        typeof (x as CmdKRecent).title === "string" &&
        ["doc", "product", "vic"].includes((x as CmdKRecent).kind)
    );
  } catch {
    return [];
  }
}

function write(items: CmdKRecent[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export function getCmdKRecents(): CmdKRecent[] {
  return read();
}

export function pushCmdKRecent(entry: CmdKRecent) {
  const prev = read().filter((r) => r.href !== entry.href);
  write([entry, ...prev]);
}
