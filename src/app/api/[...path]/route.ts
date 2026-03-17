import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function proxy(req: Request, pathParts: string[]) {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (!backend) {
    return new NextResponse(
      JSON.stringify({
        detail:
          "NEXT_PUBLIC_BACKEND_URL is not configured. Set it in your environment (e.g. Vercel Project → Settings → Environment Variables).",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const targetUrl = new URL(`${backend}/api/${pathParts.join("/")}`);

  // Preserve query string (?a=b)
  const incomingUrl = new URL(req.url);
  incomingUrl.searchParams.forEach((v, k) => targetUrl.searchParams.append(k, v));

  const headers = new Headers(req.headers);
  headers.delete("host");

  let body: ArrayBuffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await req.arrayBuffer();
    } catch {
      body = undefined;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body,
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      return new NextResponse(JSON.stringify({ detail: "Backend request timed out" }), {
        status: 504,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new NextResponse(JSON.stringify({ detail: "Backend unreachable" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
  clearTimeout(timeoutId);

  return new NextResponse(res.body, {
    status: res.status,
    headers: res.headers,
  });
}

// Note: in newer Next, ctx.params can be a Promise
type Ctx = { params: Promise<{ path?: string[] }> | { path?: string[] } };

async function getPath(ctx: Ctx): Promise<string[]> {
  const p = await (ctx.params as Promise<{ path?: string[] }>);
  return p?.path ?? [];
}

export async function GET(req: Request, ctx: Ctx) {
  return proxy(req, await getPath(ctx));
}
export async function POST(req: Request, ctx: Ctx) {
  return proxy(req, await getPath(ctx));
}
export async function PUT(req: Request, ctx: Ctx) {
  return proxy(req, await getPath(ctx));
}
export async function PATCH(req: Request, ctx: Ctx) {
  return proxy(req, await getPath(ctx));
}
export async function DELETE(req: Request, ctx: Ctx) {
  return proxy(req, await getPath(ctx));
}
