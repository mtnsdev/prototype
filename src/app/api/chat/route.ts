import { NextResponse } from "next/server";
import { z } from "zod";

const chatSchema = z.object({
    message: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
    const body = await req.json().catch(() => null);
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.flatten() },
            { status: 400 },
        );
    }

    const { message } = parsed.data;

    const reply = `You said: "${message}"`;

    return NextResponse.json({ reply });
}
