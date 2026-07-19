import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@config/env';

export interface AccessTokenPayload {
  sub: number; // userId
  tenantId: number;
  organizationId: number;
  companyCode: string; // Tenant.slug — the tenant code used in every URL (/:companyCode/...)
  roleId: number;
  roleCode: string;
  email: string;
  permissions: string[];
}

/**
 * Super-admin access token. Deliberately a DIFFERENT shape (no tenantId /
 * companyCode) so a platform token can never satisfy a tenant-scoped guard,
 * and a tenant token can never satisfy a platform-scoped guard.
 */
export interface PlatformAccessTokenPayload {
  sub: number; // platformUserId
  scope: 'PLATFORM';
  email: string;
}

export interface RefreshTokenPayload {
  sub: number; // userId (or platformUserId, for platform refresh tokens)
  jti: string; // unique token id, also used as the DB lookup correlation key
  scope?: 'PLATFORM'; // present only for super-admin refresh tokens
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as AccessTokenPayload & { scope?: string };
  // A platform (super-admin) token is signed with the same secret but has
  // scope:'PLATFORM' and no tenant claims. Reject it here so it can never be
  // used to drive a tenant-scoped request (which would otherwise filter data
  // by an undefined tenantId).
  if ((payload as { scope?: string }).scope === 'PLATFORM' || typeof payload.tenantId !== 'number') {
    throw new Error('Not a tenant access token');
  }
  return payload;
}

export function signPlatformAccessToken(payload: PlatformAccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN
  } as SignOptions);
}

export function verifyPlatformAccessToken(token: string): PlatformAccessTokenPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as PlatformAccessTokenPayload;
  if (payload.scope !== 'PLATFORM') {
    throw new Error('Not a platform access token');
  }
  return payload;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN
  } as SignOptions);
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as unknown as RefreshTokenPayload;
}
