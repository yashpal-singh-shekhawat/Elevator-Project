import { NextFunction, Request, Response } from 'express';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { verifyAccessToken } from '@common/utils/jwt';
import { UnauthorizedError, ForbiddenError } from '@common/errors';

const AUTH_HEADER = 'authorization';
const BEARER_PREFIX = 'Bearer ';

/**
 * Verifies the TENANT access token from `Authorization: Bearer <token>` and:
 *   1. populates req.user (tenant-scoped identity + permissions), and
 *   2. DERIVES req.tenantContext directly from the token's claims.
 *
 * (2) is the multi-tenant pivot: previously tenant.middleware.ts injected a
 * static { tenantId: 1, organizationId: 1 } for everyone. Now the tenant is
 * whatever the caller's own JWT says it is — so every repository (which already
 * filters by the tenantContext it's handed) becomes automatically isolated to
 * the caller's tenant, with ZERO change to any service or repository.
 *
 * Mounted per-router (not globally), so public routes (login/refresh) stay open.
 * MUST run before any tenant-scoped route handler.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header(AUTH_HEADER);

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    next(new UnauthorizedError('Missing or malformed Authorization header'));
    return;
  }

  const token = header.slice(BEARER_PREFIX.length);

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      tenantId: payload.tenantId,
      organizationId: payload.organizationId,
      companyCode: payload.companyCode,
      roleId: payload.roleId,
      roleCode: payload.roleCode,
      email: payload.email,
      permissions: payload.permissions
    };

    // Override the static tenant context with the authenticated tenant. From
    // here down, every query is scoped to the token's tenant.
    req.tenantContext = {
      tenantId: payload.tenantId,
      organizationId: payload.organizationId,
      companyCode: payload.companyCode
    };

    // Cross-tenant guard, folded in so EVERY tenant router that already calls
    // authenticate() gets it with no router changes: if the URL claims a
    // different company than the JWT, reject with 403.
    const urlCode = req.urlCompanyCode;
    if (urlCode && urlCode !== payload.companyCode) {
      next(new ForbiddenError('Tenant mismatch: this session is not permitted to access this company'));
      return;
    }

    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      next(new UnauthorizedError('Access token has expired'));
      return;
    }
    if (err instanceof JsonWebTokenError) {
      next(new UnauthorizedError('Invalid access token'));
      return;
    }
    next(new UnauthorizedError('Authentication failed'));
  }
}

/**
 * Cross-tenant guard. Compares the tenant code carried in the URL/header
 * (set by tenantResolver) against the tenant code inside the verified JWT.
 * If a user authenticated for ACME tries to hit an OTIS URL, this returns 403.
 *
 * Mounted AFTER `authenticate` on tenant routers. If the request never carried
 * a URL tenant code (e.g. a direct API call without the header), we do not
 * block — the JWT's own tenant already scopes the data; this guard exists to
 * catch an *explicit mismatch*, not to require the header.
 */
export function enforceTenantMatch(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new UnauthorizedError());
    return;
  }

  const urlCode = req.urlCompanyCode;
  if (urlCode && urlCode !== req.user.companyCode) {
    next(new ForbiddenError('Tenant mismatch: this session is not permitted to access this company'));
    return;
  }

  next();
}
