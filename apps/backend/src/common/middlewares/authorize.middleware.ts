import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '@common/errors';

/**
 * requireRoles('Admin', 'Manager') — coarse guard by static role code.
 * Must run after `authenticate`.
 */
export function requireRoles(...allowedRoleCodes: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!allowedRoleCodes.includes(req.user.roleCode)) {
      next(new ForbiddenError(`Requires one of roles: ${allowedRoleCodes.join(', ')}`));
      return;
    }
    next();
  };
}

/**
 * requirePermissions('installation.create') — fine-grained guard, checked
 * against the permission snapshot embedded in the access token at login.
 * This is the modular piece: Phase 1 permissions are seeded rows resolved
 * once per login; Phase 2 can move to a live per-request DB/cache lookup
 * without changing any route's usage of this middleware.
 *
 * By default ALL listed permissions are required; pass { any: true } to
 * require at least one.
 */
export function requirePermissions(permissionCodes: string[], options: { any?: boolean } = {}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    const granted = new Set(req.user.permissions);
    const satisfied = options.any
      ? permissionCodes.some((code) => granted.has(code))
      : permissionCodes.every((code) => granted.has(code));

    if (!satisfied) {
      next(new ForbiddenError(`Missing required permission(s): ${permissionCodes.join(', ')}`));
      return;
    }
    next();
  };
}
