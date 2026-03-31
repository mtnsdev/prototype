import { NextResponse } from "next/server";
import { deleteVic, getVicById, putVic } from "@/lib/server/vicMockStore";
import type { VIC } from "@/types/vic";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const v = getVicById(id);
  if (!v) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json(v);
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Partial<VIC>;
  const v = putVic(id, body);
  if (!v) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json(v);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!deleteVic(id)) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
