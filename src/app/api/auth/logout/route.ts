import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/cookies";

export async function POST() {
    clearSessionCookie();
    return NextResponse.json({ ok: true });
}
