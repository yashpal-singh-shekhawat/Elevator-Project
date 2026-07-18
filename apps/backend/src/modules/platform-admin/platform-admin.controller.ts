import { Request, Response } from 'express';
import { PlatformAdminService } from './platform-admin.service';
import {
  CreateTenantInput,
  UpdateTenantInput,
  PlatformLoginInput,
  SetTenantStatusInput,
  ListTenantsQuery
} from './platform-admin.validation';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { UnauthorizedError, BadRequestError } from '@common/errors';
import { env } from '@config/env';
import {
  platformRefreshTokenCookieOptions,
  clearPlatformRefreshTokenCookieOptions
} from '@common/utils/cookie-options';

export class PlatformAdminController {
  constructor(private readonly service: PlatformAdminService) {}

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as PlatformLoginInput;
    const result = await this.service.login(email, password, {
      ipAddress: req.ip,
      userAgent: req.header('user-agent')
    });
    res.cookie(env.REFRESH_TOKEN_COOKIE_NAME + '_platform', result.refreshToken, platformRefreshTokenCookieOptions());
    ApiResponse.success(res, { accessToken: result.accessToken, user: result.user });
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const presented = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME + '_platform'];
    if (!presented) throw new UnauthorizedError('No refresh token provided');
    const result = await this.service.refresh(presented, {
      ipAddress: req.ip,
      userAgent: req.header('user-agent')
    });
    res.cookie(env.REFRESH_TOKEN_COOKIE_NAME + '_platform', result.refreshToken, platformRefreshTokenCookieOptions());
    ApiResponse.success(res, { accessToken: result.accessToken, user: result.user });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const presented = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME + '_platform'];
    await this.service.logout(presented);
    res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME + '_platform', clearPlatformRefreshTokenCookieOptions());
    ApiResponse.noContent(res);
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.service.getCurrentUser(req.platformUser!.id);
    ApiResponse.success(res, user);
  });

  dashboard = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await this.service.getDashboardStats();
    ApiResponse.success(res, stats);
  });

  listTenants = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListTenantsQuery;
    const result = await this.service.listTenants({
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status
    });
    ApiResponse.paginated(res, result.data, {
      page: result.meta.page,
      limit: result.meta.limit,
      totalItems: result.meta.total,
      totalPages: result.meta.totalPages
    });
  });

  getTenant = asyncHandler(async (req: Request, res: Response) => {
    const id = this.parseId(req.params.id);
    const tenant = await this.service.getTenant(id);
    ApiResponse.success(res, tenant);
  });

  createTenant = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateTenantInput;
    const tenant = await this.service.createTenant({
      name: body.name,
      companyCode: body.companyCode,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      address: body.address,
      logoBase64: body.logoBase64
    });
    ApiResponse.created(res, tenant);
  });

  updateTenant = asyncHandler(async (req: Request, res: Response) => {
    const id = this.parseId(req.params.id);
    const body = req.body as UpdateTenantInput;
    const tenant = await this.service.updateTenant(id, {
      name: body.name,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      address: body.address,
      logoBase64: body.logoBase64
    });
    ApiResponse.success(res, tenant);
  });

  setTenantStatus = asyncHandler(async (req: Request, res: Response) => {
    const id = this.parseId(req.params.id);
    const { isActive } = req.body as SetTenantStatusInput;
    const tenant = await this.service.setTenantStatus(id, isActive);
    ApiResponse.success(res, tenant);
  });

  private parseId(raw: string): number {
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('Invalid tenant id');
    return id;
  }
}
