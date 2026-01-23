import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z
    .object({
        uri: z
            .string()
            .optional()
            .refine((v) => {
                if (!v) return true; // allow missing uri if path is used
                try {
                    const u = new URL(v);
                    return u.protocol === "https:" || u.protocol === "http:";
                } catch {
                    return false;
                }
            }, "Invalid URL"),
        path: z.string().min(1).optional(),
        filename: z.string().optional(),
    })
    .refine((d) => Boolean(d.uri) || Boolean(d.path), {
        message: "Provide either uri or path",
        path: ["uri"],
    });

function getEnvOrThrow(name: string) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing ${name}`);
    return v;
}

function normalizeHost(host: string) {
    if (host.startsWith("http://") || host.startsWith("https://"))
        return host.replace(/\/+$/, "");
    return `https://${host.replace(/\/+$/, "")}`;
}

function buildBasicAuthHeader() {
    const user = getEnvOrThrow("TL_USERNAME");
    const pass = getEnvOrThrow("TL_PASSWORD");
    const token = Buffer.from(`${user}:${pass}`).toString("base64");
    return `Basic ${token}`;
}

function sanitizeFilename(name: string) {
    // keep it simple + safe for headers
    return name.replace(/["\\]/g, "").trim() || "document";
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const parsed = schema.safeParse({
            uri: searchParams.get("uri") ?? undefined,
            path: searchParams.get("path") ?? undefined,
            filename: searchParams.get("filename") ?? undefined,
        });

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.flatten() },
                { status: 400 },
            );
        }

        const { uri, path, filename } = parsed.data;

        if (!uri && !path) {
            return NextResponse.json(
                { error: "Provide either uri or path" },
                { status: 400 },
            );
        }

        const base = normalizeHost(getEnvOrThrow("TL_HOSTNAME"));
        const targetUrl = uri ? new URL(uri) : new URL(`${base}${path}`);

        // Allowlist: only proxy your Claromentis host
        if (targetUrl.host !== new URL(base).host) {
            return NextResponse.json(
                { error: "Target host not allowed" },
                { status: 400 },
            );
        }

        // Forward Range header for streaming video / large files
        const range = req.headers.get("range");

        const res = await fetch(targetUrl.toString(), {
            method: "GET",
            headers: {
                Authorization: buildBasicAuthHeader(),
                Accept: "*/*",
                ...(range ? { Range: range } : {}),
            },
            cache: "no-store",
        });

        if (!res.ok && res.status !== 206) {
            // 206 is partial content (valid for Range requests)
            const text = await res.text().catch(() => "");
            return NextResponse.json(
                {
                    error: `Claromentis error ${res.status}: ${text || res.statusText}`,
                },
                { status: 500 },
            );
        }

        const headers = new Headers();

        // Preserve important streaming headers
        const ct = res.headers.get("content-type");
        const cl = res.headers.get("content-length");
        const ar = res.headers.get("accept-ranges");
        const cr = res.headers.get("content-range");

        if (ct) headers.set("content-type", ct);
        if (cl) headers.set("content-length", cl);
        if (ar) headers.set("accept-ranges", ar);
        if (cr) headers.set("content-range", cr);

        // Force inline preview (prevents "download" behavior)
        // Some servers send attachment; we override it.
        const safeName = sanitizeFilename(filename ?? "preview");
        headers.set("content-disposition", `inline; filename="${safeName}"`);

        // Optional: helpful caching headers (still dynamic; browser may cache short-term)
        headers.set("cache-control", "private, max-age=0, no-store");

        return new NextResponse(res.body, {
            status: res.status, // 200 or 206
            headers,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
