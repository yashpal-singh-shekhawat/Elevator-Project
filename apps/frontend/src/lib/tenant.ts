// Tenant-code helpers shared by middleware (edge), the API client, and UI.
// The "company unique code" is the first path segment of every tenant URL,
// e.g. /acme/leads -> "acme". It is pure UX/context here: the real data
// boundary is enforced server-side from the JWT (see backend auth.middleware).

// First segments that are NOT tenant codes and must never be rewritten.
export const RESERVED_SEGMENTS = new Set([
  'super-admin',
  'api',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml'
]);

// Known application route segments (the pages under the (dashboard)/(auth)
// route groups). If the FIRST path segment is one of these, the URL is a bare,
// un-prefixed app route (e.g. a legacy in-page <Link href="/leads/5">) — NOT a
// tenant code. Middleware redirects those back under the active tenant prefix.
// Consequence: a company_unique_code may never equal one of these words.
export const APP_ROUTE_SEGMENTS = new Set([
  'login',
  'leads',
  'installation-projects',
  'amc-contracts',
  'service-tickets',
  'inventory',
  'vendors',
  'invoices',
  'escalations',
  'customers',
  'sites',
  'lifts',
  'master-data',
  'users',
  'quotations',
  'dashboard'
]);

// Non-httpOnly cookie mirroring the active tenant code so edge middleware can
// recover it for bare app-route URLs. Not a security token — the real boundary
// is the httpOnly JWT/refresh cookie enforced server-side.
export const TENANT_COOKIE = 'tenant_code';

// Same shape the backend validates (tenant slug): 2–64 chars, alnum + dash.
const CODE_RE = /^[a-z0-9-]{2,64}$/i;

/** True when the first path segment is a known app route, not a tenant code. */
export function isAppRouteSegment(segment: string): boolean {
  return APP_ROUTE_SEGMENTS.has(segment.toLowerCase());
}

/** Extract the tenant code from a pathname, or null if the path is not tenant-scoped. */
export function extractTenantCode(pathname: string): string | null {
  const seg = pathname.split('/').filter(Boolean)[0];
  if (!seg) return null;
  if (RESERVED_SEGMENTS.has(seg)) return null;
  if (isAppRouteSegment(seg)) return null;
  if (!CODE_RE.test(seg)) return null;
  return seg.toLowerCase();
}

/** Build a tenant-scoped href: tenantHref('acme', '/leads') -> '/acme/leads'. */
export function tenantHref(code: string, path: string): string {
  const clean = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/${code}${clean}`;
}

/** The tenant code for the page currently in the browser (client-only). */
export function currentTenantCode(): string | null {
  if (typeof window === 'undefined') return null;
  return extractTenantCode(window.location.pathname);
}
