import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Mock success for forced password change flow (real backend not available). */
export async function PATCH() {
  return NextResponse.json({ ok: true });
}
