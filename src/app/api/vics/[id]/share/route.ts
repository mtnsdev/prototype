import { NextResponse } from "next/server";
import { applyShare } from "@/lib/server/vicMockStore";
import type { AccessLevel, SharingLevel } from "@/types/vic";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    advisor_id?: string;
    team_id?: string;
    access_level?: AccessLevel;
    sharing_level?: SharingLevel;
  };
  if (!body.access_level || (body.access_level !== "view" && body.access_level !== "edit")) {
    return NextResponse.json({ detail: "access_level required (view | edit)" }, { status: 400 });
  }
  if (!body.advisor_id && !body.team_id) {
    return NextResponse.json({ detail: "advisor_id or team_id required" }, { status: 400 });
  }
  const v = applyShare(id, {
    advisor_id: body.advisor_id,
    team_id: body.team_id,
    access_level: body.access_level,
    sharing_level: body.sharing_level,
  });
  if (!v) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json(v);
}
