import { NextFunction, Request, Response } from 'express';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { verifyPlatformAccessToken } from '@common/utils/jwt';
import { UnauthorizedError } from '@common/errors';

const AUTH_HEADER = 'authorization';
const BEARER_PREFIX = 'Bearer ';

/**
 * Verifies a PLATFORM (super-admin) access token and populates req.platformUser.
 * A tenant token can never pass here (verifyPlatformAccessToken rejects any
 * token whose scope !== 'PLATFORM'), and this middleware never sets tenant
 * context — super admins operate entirely outside tenant scope.
 */
export function authenticatePlatform(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header(AUTH_HEADER);

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    next(new UnauthorizedError('Missing or malformed Authorization header'));
    return;
  }

  const token = header.slice(BEARER_PREFIX.length);

  try {
    const payload = verifyPlatformAccessToken(token);
    req.platformUser = { id: payload.sub, scope: 'PLATFORM', email: payload.email };
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
