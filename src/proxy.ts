/**
 * Next.js Proxy (Route Protection)
 * 
 * This file handles route protection for the application:
 * - Redirects unauthenticated users to /login
 * - Protects admin routes for admin users only
 * - Handles access denied scenarios
 * 
 * Note: Next.js 16+ uses proxy.ts instead of middleware.ts
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/access-denied']

// Routes that require admin role
const ADMIN_ROUTES = ['/dashboard/settings/admin']

/**
 * Decode JWT token payload without verification
 * (verification is done by the backend)
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = parts[1]
    const decoded = Buffer.from(payload, 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }
  
  // Allow static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  // Get auth token from localStorage is not possible in proxy
  // We need to check for a cookie or header
  // For now, we'll use the auth_token cookie if set, or check Authorization header
  const token = request.cookies.get('auth_token')?.value
  
  // If no token in cookie, check for token in localStorage via a custom header
  // This is set by the client on each request
  const authHeader = request.headers.get('Authorization')
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  
  const effectiveToken = token || headerToken
  
  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!effectiveToken) {
      // No token - redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Decode token to check role and status
    const payload = decodeJwtPayload(effectiveToken)
    
    if (!payload) {
      // Invalid token - redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Check if token is expired
    const exp = payload.exp as number | undefined
    if (exp && Date.now() >= exp * 1000) {
      // Token expired - redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      loginUrl.searchParams.set('reason', 'session_expired')
      return NextResponse.redirect(loginUrl)
    }
    
    // Check user status
    const status = payload.status as string | undefined
    if (status === 'disabled') {
      // User is disabled - redirect to access denied
      return NextResponse.redirect(new URL('/access-denied?reason=disabled', request.url))
    }
    
    // Check admin routes
    if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
      const role = payload.role as string | undefined
      if (role !== 'admin') {
        // Not an admin - redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }
  
  // Root path - redirect to dashboard or login
  if (pathname === '/') {
    if (effectiveToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
