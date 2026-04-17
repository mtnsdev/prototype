import { NextResponse } from "next/server";
import { findDestinationItemPayload } from "@/lib/destinationApiPayload";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; itemId: string }> },
) {
  const { slug, itemId } = await params;
  const payload = findDestinationItemPayload(slug, itemId);
  if (!payload) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(payload);
}
