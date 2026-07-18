import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '@common/errors';
import { CHECKLIST_MANAGE_PERMISSION, CHECKLIST_VIEW_PERMISSION } from './checklist.validation';

type PermissionLevel = 'view' | 'manage';

/**
 * Unlike a static requirePermissions([...]) route guard, the checklist
 * module's required permission depends on which parent entity type the
 * request targets — so this reads entityType from the already-validated
 * query (list) or body (create) and looks up the matching permission.
 *
 * update()/remove() can't use this (entityType isn't known until the item
 * is fetched by id) — see checklist.service.ts's assertManagePermission.
 */
export function requireChecklistPermission(source: 'query' | 'body', level: PermissionLevel) {
  const permissionMap = level === 'view' ? CHECKLIST_VIEW_PERMISSION : CHECKLIST_MANAGE_PERMISSION;

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    const entityType = req[source].entityType as keyof typeof permissionMap;
    const required = permissionMap[entityType];

    if (!required || !req.user.permissions.includes(required)) {
      next(new ForbiddenError(`Missing required permission: ${required ?? `unknown for entityType "${entityType}"`}`));
      return;
    }

    next();
  };
}
