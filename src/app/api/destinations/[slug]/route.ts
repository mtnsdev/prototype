import { NextResponse } from "next/server";
import { getDestinationApiPayload } from "@/lib/destinationApiPayload";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const payload = getDestinationApiPayload(slug);
  if (!payload) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(payload);
}
