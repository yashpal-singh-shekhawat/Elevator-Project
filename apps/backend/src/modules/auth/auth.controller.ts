import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginInput } from './auth.validation';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { UnauthorizedError } from '@common/errors';
import { env } from '@config/env';
import { refreshTokenCookieOptions, clearRefreshTokenCookieOptions } from '@common/utils/cookie-options';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, companyCode: bodyCode } = req.body as LoginInput & { companyCode?: string };

    // Tenant code comes from the /:companyCode/login URL (preferred) or the
    // request body as a fallback for direct API clients. It is the ONLY thing
    // that selects which tenant's users are searched.
    const companyCode = (req.params.companyCode ?? bodyCode ?? '').trim();
    if (!companyCode) {
      throw new UnauthorizedError('Company code is required to sign in');
    }

    const result = await this.authService.login(companyCode, email, password, {
      ipAddress: req.ip,
      userAgent: req.header('user-agent')
    });

    res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, refreshTokenCookieOptions());

    await req.audit.log({ entityType: 'USER', entityId: result.user.id, action: 'UPDATE' });

    ApiResponse.success(res, { accessToken: result.accessToken, user: result.user });
  });

  // Public: GET /api/v1/auth/:companyCode/branding — name + logo for the login
  // screen. No auth required; returns null branding for unknown tenants.
  branding = asyncHandler(async (req: Request, res: Response) => {
    const companyCode = (req.params.companyCode ?? '').trim();
    const branding = await this.authService.getPublicBranding(companyCode);
    ApiResponse.success(res, branding);
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const presentedToken = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];
    if (!presentedToken) {
      throw new UnauthorizedError('No refresh token provided');
    }

    const result = await this.authService.refresh(presentedToken, {
      ipAddress: req.ip,
      userAgent: req.header('user-agent')
    });

    res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, refreshTokenCookieOptions());

    ApiResponse.success(res, { accessToken: result.accessToken, user: result.user });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const presentedToken = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];
    await this.authService.logout(presentedToken);
    res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, clearRefreshTokenCookieOptions());
    ApiResponse.noContent(res);
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    // authenticate() middleware guarantees req.user is set on this route.
    const user = await this.authService.getCurrentUser(req.tenantContext, req.user!.id);
    ApiResponse.success(res, user);
  });
}
