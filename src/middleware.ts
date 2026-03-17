import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Auth checks disabled — all routes are open. */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
