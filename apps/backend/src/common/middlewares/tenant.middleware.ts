import { NextFunction, Request, Response } from 'express';
import { env } from '@config/env';
import { TenantContext } from '@common/types/tenant-context';

/**
 * PHASE 1: Always resolves to the static tenant/org from env config.
 *
 * PHASE 2 (future): Replace the body of this function with JWT claim
 * decoding, e.g.:
 *
 *   const claims = req.user; // set by auth.middleware after verifying JWT
 *   req.tenantContext = { tenantId: claims.tenantId, organizationId: claims.organizationId };
 *
 * No controller, service, or repository needs to change — they all already
 * consume `req.tenantContext`, never the static env values directly.
 */
export function tenantContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const context: TenantContext = {
    tenantId: env.DEFAULT_TENANT_ID,
    organizationId: env.DEFAULT_ORGANIZATION_ID
  };

  req.tenantContext = context;
  next();
}
