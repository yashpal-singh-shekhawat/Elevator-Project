import { Request, Response } from 'express';
import { StatusService } from './status.service';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { CreateStatusInput, ListStatusesQuery, UpdateStatusInput } from './status.validation';
import { IdParam } from '@common/validation/common.schemas';

export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListStatusesQuery;
    await respondWithList(res, query, () => this.statusService.list(req.tenantContext, query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const status = await this.statusService.getById(req.tenantContext, id);
    ApiResponse.success(res, status);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as CreateStatusInput;
    const status = await this.statusService.create(req.tenantContext, input);
    await req.audit.log({ entityType: 'STATUS', entityId: status.id, action: 'CREATE' });
    ApiResponse.created(res, status);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const input = req.body as UpdateStatusInput;
    const status = await this.statusService.update(req.tenantContext, id, input);
    await req.audit.log({ entityType: 'STATUS', entityId: status.id, action: 'UPDATE' });
    ApiResponse.success(res, status);
  });
}
