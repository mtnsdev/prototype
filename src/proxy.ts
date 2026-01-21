import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = process.env.COOKIE_NAME || "session";

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // protect everything under /chat
    if (pathname.startsWith("/chat")) {
        const token = req.cookies.get(COOKIE_NAME)?.value;
        if (!token) {
            const url = req.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/chat/:path*"],
};
