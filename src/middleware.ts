import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth checks disabled — all routes are open in the prototype.
 * Production: validate session/JWT here and attach agency/team claims for server-rendered
 * routes; destination and catalog APIs should enforce the same scopes as client-side checks.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
