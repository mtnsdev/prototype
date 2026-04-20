import { NextResponse } from "next/server";
import { buildMockUser, mockAccessToken } from "@/lib/mockAuthUser";

export const runtime = "nodejs";

/** Best-effort decode Google credential JWT payload for email (prototype only). */
function emailFromGoogleCredential(credential: string): string | null {
  try {
    const parts = credential.split(".");
    if (parts.length < 2) return null;
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(json) as { email?: string };
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let body: { token?: string };
  try {
    body = (await req.json()) as { token?: string };
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  const credential = String(body.token ?? "");
  const email =
    emailFromGoogleCredential(credential) ?? "google-user@prototype.local";

  const user = buildMockUser(email);

  return NextResponse.json({
    token: { access_token: mockAccessToken(email.toLowerCase()) },
    user,
  });
}
