import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function proxy(req: Request, pathParts: string[]) {
  return new NextResponse(
    JSON.stringify({
      detail: "Backend proxy is disabled (mock-only mode).",
      path: `/api/${pathParts.join("/")}`,
      method: req.method,
    }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }
  );
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
