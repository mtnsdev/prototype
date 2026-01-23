import "server-only";
import { TLItem } from "./types";
import { getCached, setCached, getInflight, setInflight } from "./folder-cache";

export type TLFolderRaw = {
    id?: number;
    parent_id?: number;
    title?: string;
    URI?: string;
    type?: string; // "folder" | "document"
    obj_type?: string; // "folder" | "document";
    doc_id?: number;
    version_num?: number;
    pc_title?: string;
    has_children?: boolean;
    refcode?: string;
};

function getEnvOrThrow(name: string) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing ${name}`);
    return v;
}

function buildBasicAuthHeader() {
    const user = getEnvOrThrow("TL_USERNAME");
    const pass = getEnvOrThrow("TL_PASSWORD");
    const token = Buffer.from(`${user}:${pass}`).toString("base64");
    return `Basic ${token}`;
}

function normalizeHost(host: string) {
    if (host.startsWith("http://") || host.startsWith("https://"))
        return host.replace(/\/+$/, "");
    return `https://${host.replace(/\/+$/, "")}`;
}

function normalizeFolder(
    raw: TLFolderRaw,
): Extract<TLItem, { kind: "folder" }> | null {
    const t = raw.type ?? raw.obj_type;
    if (t !== "folder") return null;

    const id = Number(raw.id);
    if (!Number.isFinite(id)) return null;

    return {
        kind: "folder",
        id,
        parent_id: Number(raw.parent_id ?? 0),
        title: raw.title ?? "folder",
        has_children: raw.has_children ?? undefined,
        URI: raw.URI,
    };
}

function normalizeDocument(
    raw: TLFolderRaw,
): Extract<TLItem, { kind: "document" }> | null {
    const t = raw.type ?? raw.obj_type;
    if (t !== "document") return null;

    const docId = Number(raw.doc_id);
    const version = Number(raw.version_num);

    if (!Number.isFinite(docId) || !Number.isFinite(version)) return null;

    return {
        kind: "document",
        doc_id: docId,
        version_num: version,
        parent_id: Number(raw.parent_id ?? 0),
        title: raw.title ?? raw.pc_title ?? "document",
        URI: raw.URI,
    };
}

function normalizeItems(data: unknown): TLItem[] {
    const arr = Array.isArray(data) ? (data as TLFolderRaw[]) : [];
    const items = arr
        .map((x) => normalizeFolder(x) ?? normalizeDocument(x))
        .filter(Boolean) as TLItem[];

    // folders first
    items.sort((a, b) =>
        a.kind === b.kind ? 0 : a.kind === "folder" ? -1 : 1,
    );
    return items;
}

async function fetchJson(url: URL) {
    const auth = buildBasicAuthHeader();

    const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Authorization: auth,
            Accept: "application/json",
        },
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `Claromentis error ${res.status}: ${text || res.statusText}`,
        );
    }

    return res.json();
}

/**
 * 1) /folder/:id/folders  -> subfolders only
 * 2) if empty -> /folder/:id -> documents/mixed
 */
export async function fetchFolderChildren(
    folderId: string,
    opts?: { metadata?: string },
): Promise<TLItem[]> {
    const cacheKey = `children-merged:${folderId}:${opts?.metadata ?? ""}`;
    const cached = getCached<TLItem[]>(cacheKey);
    if (cached) return cached;

    const inflight = getInflight<TLItem[]>(cacheKey);
    if (inflight) return inflight;

    const p = (async () => {
        const hostname = normalizeHost(getEnvOrThrow("TL_HOSTNAME"));

        const foldersUrl = new URL(
            `${hostname}/intranet/rest/documents/folder/${folderId}/folders`,
        );
        if (opts?.metadata)
            foldersUrl.searchParams.set("metadata", opts.metadata);

        const contentUrl = new URL(
            `${hostname}/intranet/rest/documents/folder/${folderId}`,
        );
        if (opts?.metadata)
            contentUrl.searchParams.set("metadata", opts.metadata);

        // run in parallel
        const [foldersRaw, contentRaw] = await Promise.all([
            fetchJson(foldersUrl),
            fetchJson(contentUrl),
        ]);

        const a = normalizeItems(foldersRaw);
        const b = normalizeItems(contentRaw);

        // merge + dedupe
        const seen = new Set<string>();
        const merged: TLItem[] = [];

        const push = (it: TLItem) => {
            const key =
                it.kind === "folder"
                    ? `f:${it.id}`
                    : `d:${it.doc_id}:${it.version_num}`;
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(it);
        };

        [...a, ...b].forEach(push);

        // folders first
        merged.sort((x, y) =>
            x.kind === y.kind ? 0 : x.kind === "folder" ? -1 : 1,
        );

        setCached(cacheKey, merged);
        return merged;
    })();

    setInflight(cacheKey, p);
    return p;
}
