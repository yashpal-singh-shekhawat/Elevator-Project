import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '@common/errors';
import { FILE_MANAGE_PERMISSION, FILE_VIEW_PERMISSION } from './file.validation';

type PermissionLevel = 'view' | 'manage';

export function requireFilePermission(source: 'query' | 'body', level: PermissionLevel) {
  const permissionMap = level === 'view' ? FILE_VIEW_PERMISSION : FILE_MANAGE_PERMISSION;

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
