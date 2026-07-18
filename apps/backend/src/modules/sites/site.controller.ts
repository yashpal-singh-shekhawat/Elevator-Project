import { Request, Response } from 'express';
import { SiteService } from './site.service';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { CreateSiteInput, ListSitesQuery, UpdateSiteInput } from './site.validation';
import { IdParam } from '@common/validation/common.schemas';

export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListSitesQuery;
    await respondWithList(res, query, () => this.siteService.list(req.tenantContext, query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.siteService.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const site = await this.siteService.create(req.tenantContext, req.body as CreateSiteInput);
    await req.audit.log({ entityType: 'SITE', entityId: site.id, action: 'CREATE' });
    ApiResponse.created(res, site);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const site = await this.siteService.update(req.tenantContext, id, req.body as UpdateSiteInput);
    await req.audit.log({ entityType: 'SITE', entityId: site.id, action: 'UPDATE' });
    ApiResponse.success(res, site);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    await this.siteService.softDelete(req.tenantContext, id);
    await req.audit.log({ entityType: 'SITE', entityId: id, action: 'DELETE' });
    ApiResponse.noContent(res);
  });
}
