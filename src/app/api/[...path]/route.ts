import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!BACKEND) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not set");
}

async function proxy(req: Request, pathParts: string[]) {
  const targetUrl = new URL(`${BACKEND}/api/${pathParts.join("/")}`);

  // Preserve query string (?a=b)
  const incomingUrl = new URL(req.url);
  incomingUrl.searchParams.forEach((v, k) => targetUrl.searchParams.append(k, v));

  const headers = new Headers(req.headers);
  headers.delete("host");

  let body: Buffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = Buffer.from(await req.arrayBuffer());
    } catch {
      body = undefined;
    }
  }

  const res = await fetch(targetUrl.toString(), {
    method: req.method,
    headers,
    body,
  });

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
