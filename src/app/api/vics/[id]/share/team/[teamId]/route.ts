import { NextResponse } from "next/server";
import { getVicById, removeTeamShare } from "@/lib/server/vicMockStore";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; teamId: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id, teamId } = await ctx.params;
  if (!getVicById(id)) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  const v = removeTeamShare(id, teamId);
  if (!v) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json(v);
}
