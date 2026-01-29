const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

if (!BACKEND) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL");
}

export async function backendGet<T>(
    path: string,
    params?: Record<string, string | number | undefined>,
): Promise<T> {
    // Force relative API paths so Next rewrites can apply
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (!normalizedPath.startsWith("/api/")) {
        throw new Error(
            `backendGet path must start with "/api/". Received: ${path}`,
        );
    }

    // Build a relative URL (no origin needed)
    const url = new URL(normalizedPath, "http://localhost"); // base is irrelevant for relative URL building

    if (params) {
        for (const [k, v] of Object.entries(params)) {
            if (v === undefined) continue;
            url.searchParams.set(k, String(v));
        }
    }

    const res = await fetch(url.pathname + url.search, {
        method: "GET",
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
