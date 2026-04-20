import { NextResponse } from "next/server";
import { buildMockUser, mockAccessToken } from "@/lib/mockAuthUser";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ detail: "Email and password are required" }, { status: 400 });
  }

  const user = buildMockUser(email);

  return NextResponse.json({
    token: { access_token: mockAccessToken(email.toLowerCase()) },
    user,
  });
}
