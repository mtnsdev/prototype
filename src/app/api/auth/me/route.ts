import { NextResponse } from "next/server";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/jwt";

export async function GET() {
    const token = await getSessionCookie();
    if (!token) return NextResponse.json({ user: null }, { status: 200 });

    try {
        const payload = verifySession(token);
        return NextResponse.json({ user: payload }, { status: 200 });
    } catch {
        return NextResponse.json({ user: null }, { status: 200 });
    }
}
