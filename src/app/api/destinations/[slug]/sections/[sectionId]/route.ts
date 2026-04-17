import { NextResponse } from "next/server";
import { findDestinationSectionPayload } from "@/lib/destinationApiPayload";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; sectionId: string }> },
) {
  const { slug, sectionId } = await params;
  const payload = findDestinationSectionPayload(slug, sectionId);
  if (!payload) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(payload);
}
