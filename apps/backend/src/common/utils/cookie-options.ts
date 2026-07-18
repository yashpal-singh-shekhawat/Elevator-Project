import { CookieOptions } from 'express';
import { env } from '@config/env';
import { parseDurationMs } from './duration';

// In production the frontend (Vercel) and backend (Render) live on DIFFERENT
// domains, so the refresh-token cookie is cross-site. Browsers only send a
// cross-site cookie when it is `SameSite=None; Secure`. In local dev everything
// is same-site on localhost, where `lax` (and non-secure) is correct.
const isProd = env.NODE_ENV === 'production';
const crossSite: Pick<CookieOptions, 'sameSite' | 'secure'> = isProd
  ? { sameSite: 'none', secure: true }
  : { sameSite: 'lax', secure: false };

// Scoped to /auth so the refresh token cookie is never sent on ordinary API
// requests — only to the endpoints that actually need it (refresh, logout).
export function refreshTokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    ...crossSite,
    path: `${env.API_PREFIX}/auth`,
    maxAge: parseDurationMs(env.JWT_REFRESH_EXPIRES_IN)
  };
}

export function clearRefreshTokenCookieOptions(): CookieOptions {
  const { maxAge: _maxAge, ...rest } = refreshTokenCookieOptions();
  return rest;
}

// Super-admin refresh cookie — a DIFFERENT name and path so it can never be
// sent to tenant auth endpoints and vice-versa (full session isolation).
export function platformRefreshTokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    ...crossSite,
    path: `${env.API_PREFIX}/platform-admin/auth`,
    maxAge: parseDurationMs(env.JWT_REFRESH_EXPIRES_IN)
  };
}

export function clearPlatformRefreshTokenCookieOptions(): CookieOptions {
  const { maxAge: _maxAge, ...rest } = platformRefreshTokenCookieOptions();
  return rest;
}
