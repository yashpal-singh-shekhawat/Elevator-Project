import { NextFunction, Request, Response } from 'express';

/**
 * Reads the tenant code the CLIENT is claiming to act under, from either:
 *   - the `x-tenant-code` header (sent by the frontend api-client, derived
 *     from the /:companyCode/... URL the user is on), or
 *   - a `/api/v1/t/:companyCode/...` path prefix (future / direct API use).
 *
 * This is UNTRUSTED input — it is NEVER used to scope data. It is only stashed
 * on req.urlCompanyCode so `enforceTenantMatch` (after auth) can compare it to
 * the trusted tenant code inside the verified JWT and reject cross-tenant URLs
 * with a 403. Data scoping always comes from req.tenantContext (JWT-derived).
 *
 * Future-ready: to support custom domains (acme.company.com) later, resolve the
 * code from req.hostname here as well — nothing downstream changes.
 */
const HEADER = 'x-tenant-code';
const CODE_PATTERN = /^[a-z0-9-]{2,64}$/i;

export function tenantResolver(req: Request, _res: Response, next: NextFunction): void {
  const headerCode = req.header(HEADER);
  if (headerCode && CODE_PATTERN.test(headerCode)) {
    // Normalize casing so the URL-vs-JWT guard never trips on case alone
    // (slugs are stored lowercase).
    req.urlCompanyCode = headerCode.toLowerCase();
  }
  next();
}
