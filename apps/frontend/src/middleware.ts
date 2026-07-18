import { NextRequest, NextResponse } from 'next/server';
import {
  extractTenantCode,
  isAppRouteSegment,
  RESERVED_SEGMENTS,
  TENANT_COOKIE
} from '@/lib/tenant';

// ---------------------------------------------------------------------------
// Multi-tenant URL routing (edge middleware).
//
// The browser address bar always shows the tenant-scoped URL (/acme/leads,
// /acme/login). Internally we REWRITE to the existing route-group pages
// (/leads, /login) so none of the ~30 dashboard route files had to move.
// The tenant code stays visible in window.location / usePathname(), so the UI
// and API client can always recover it.
//
// Two cases handled:
//   1. /acme/leads      -> rewrite to /leads, remember code=acme (cookie).
//   2. /leads (bare)     -> a legacy in-page <Link href="/leads">. Redirect to
//                           /<code>/leads using the remembered tenant cookie so
//                           the URL never loses tenant context.
//
// SECURITY NOTE: this rewrite/redirect is UX only. The real cross-tenant
// boundary is enforced server-side — the backend scopes every query from the
// JWT and returns 403 when the URL's company code disagrees with the token
// (see apps/backend .../auth.middleware.ts + tenant-resolver.middleware.ts).
//
// FUTURE (custom domains): to support acme.company.com without an /acme prefix,
// resolve the code from request.headers.get('host') here and rewrite the same
// way. The rest of the app already reads the code from a single helper.
// ---------------------------------------------------------------------------

function isBypassed(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    /\.[a-z0-9]+$/i.test(pathname) // has a file extension
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isBypassed(pathname)) return NextResponse.next();

  const firstSeg = pathname.split('/').filter(Boolean)[0];

  // Super-admin space is completely separate — never tenant-scoped, pass through.
  if (firstSeg === 'super-admin') return NextResponse.next();

  // Bare root: nothing to resolve. Let the app's landing/login redirect run.
  if (!firstSeg) return NextResponse.next();

  // Other reserved first segments pass through untouched.
  if (RESERVED_SEGMENTS.has(firstSeg)) return NextResponse.next();

  // Case 2: a bare, un-prefixed app route (legacy in-page link like /leads/5).
  // Redirect it under the remembered tenant so context is never lost.
  if (isAppRouteSegment(firstSeg)) {
    const code = request.cookies.get(TENANT_COOKIE)?.value;
    if (code) {
      const url = request.nextUrl.clone();
      url.pathname = `/${code}${pathname}`;
      return NextResponse.redirect(url);
    }
    // No tenant known — leave as-is (login/refresh flow will sort it out).
    return NextResponse.next();
  }

  // Case 1: tenant-scoped URL /<code>/...  -> rewrite to the real page.
  const code = extractTenantCode(pathname);
  if (!code) return NextResponse.next();

  const rest = pathname.slice(`/${firstSeg}`.length) || '/';
  const url = request.nextUrl.clone();
  url.pathname = rest;

  const res = NextResponse.rewrite(url);
  // Remember the active tenant for bare-route redirects and expose it to
  // server components / route handlers that want it.
  res.cookies.set(TENANT_COOKIE, code, { sameSite: 'lax', path: '/' });
  res.headers.set('x-tenant-code', code);
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
