import { Request, Response } from 'express';
import { AmcVisitService } from './amc-visit.service';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { CreateAmcVisitInput, ListAmcVisitsQuery, UpdateAmcVisitInput } from './amc-visit.validation';
import { IdParam } from '@common/validation/common.schemas';

export class AmcVisitController {
  constructor(private readonly visitService: AmcVisitService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListAmcVisitsQuery;
    await respondWithList(res, query, () => this.visitService.list(req.tenantContext, query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.visitService.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const visit = await this.visitService.create(req.tenantContext, req.body as CreateAmcVisitInput);
    await req.audit.log({ entityType: 'AMC_VISIT', entityId: visit.id, action: 'CREATE' });
    ApiResponse.created(res, visit);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const visit = await this.visitService.update(req.tenantContext, id, req.body as UpdateAmcVisitInput);
    await req.audit.log({ entityType: 'AMC_VISIT', entityId: visit.id, action: 'UPDATE' });
    ApiResponse.success(res, visit);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    await this.visitService.softDelete(req.tenantContext, id);
    await req.audit.log({ entityType: 'AMC_VISIT', entityId: id, action: 'DELETE' });
    ApiResponse.noContent(res);
  });
}
