import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongo";
import { User } from "@/models/User";
import { signupSchema } from "@/lib/auth/validate";
import { hashPassword } from "@/lib/auth/password";
import { signSession } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/cookies";

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.flatten() },
            { status: 400 },
        );
    }

    const { email, password } = parsed.data;

    await connectMongo();

    const existing = await User.findOne({ email }).select("_id").lean();
    if (existing) {
        return NextResponse.json(
            { error: "Email already in use" },
            { status: 409 },
        );
    }

    const passwordHash = await hashPassword(password);
    const created = await User.create({ email, passwordHash });

    const token = signSession({
        sub: created._id.toString(),
        email: created.email,
    });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true });
}
