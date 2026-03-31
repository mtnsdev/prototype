import { NextResponse } from "next/server";
import { appendVic, listVics } from "@/lib/server/vicMockStore";
import type { VIC } from "@/types/vic";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mockUserId = req.headers.get("x-mock-advisor-id")?.trim() || "1";
  const { vics, total } = listVics({
    tab: url.searchParams.get("tab") ?? "mine",
    mockUserId,
    search: url.searchParams.get("search") ?? undefined,
    country: url.searchParams.get("country") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    acuity_status: url.searchParams.get("acuity_status") ?? undefined,
    sort_by: url.searchParams.get("sort_by") ?? undefined,
    sort_order: url.searchParams.get("sort_order") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  return NextResponse.json({ vics, total });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<VIC>;
  const v = appendVic(body);
  return NextResponse.json(v);
}
