import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongo";
import { User } from "@/models/User";
import { loginSchema } from "@/lib/auth/validate";
import { verifyPassword } from "@/lib/auth/password";
import { signSession } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/cookies";

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.flatten() },
            { status: 400 },
        );
    }

    const { email, password } = parsed.data;

    await connectMongo();

    // lean() is fine, but make sure you actually get passwordHash
    const user = await User.findOne({ email }).select("+passwordHash").exec();

    if (!user || !user.passwordHash) {
        return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 },
        );
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
        return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 },
        );
    }

    const token = signSession({ sub: user._id.toString(), email: user.email });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true });
}
