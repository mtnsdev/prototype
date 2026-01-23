import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchFolderChildren } from "@/lib/claromentis/claromentis";

export const dynamic = "force-dynamic";

const schema = z.object({
    id: z.coerce.number().int().nonnegative(), // allows 0
    metadata: z.string().optional(),
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const parsed = schema.safeParse({
            id: searchParams.get("id"),
            metadata: searchParams.get("metadata") ?? undefined,
        });

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.flatten() },
                { status: 400 },
            );
        }

        const { id, metadata } = parsed.data;

        // Now returns TLItem[] (folder/document union)
        const items = await fetchFolderChildren(id.toString(), { metadata });

        return NextResponse.json({ items }, { status: 200 });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
