import { NextResponse } from "next/server";
import { getVicById, removeAdvisorShare } from "@/lib/server/vicMockStore";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; advisorId: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id, advisorId } = await ctx.params;
  if (!getVicById(id)) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  const v = removeAdvisorShare(id, advisorId);
  if (!v) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json(v);
}
