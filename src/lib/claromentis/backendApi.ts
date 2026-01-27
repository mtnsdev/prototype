const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

if (!BACKEND) {
    // This runs at build time too; keep it explicit.
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
}

export function backendUrl(path: string) {
    // path like "/api/library/folders"
    return `${BACKEND.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function backendGet<T>(
    path: string,
    params?: Record<string, string | number | undefined>,
) {
    const url = new URL(backendUrl(path));

    if (params) {
        for (const [k, v] of Object.entries(params)) {
            if (v === undefined) continue;
            url.searchParams.set(k, String(v));
        }
    }

    const res = await fetch(url.toString(), {
        method: "GET",
        // If you use cookies/auth later, you might want:
        // credentials: "include",
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `Backend error ${res.status}: ${text || res.statusText}`,
        );
    }

    return (await res.json()) as T;
}
