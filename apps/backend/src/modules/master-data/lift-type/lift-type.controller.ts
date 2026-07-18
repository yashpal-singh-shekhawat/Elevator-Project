import { Request, Response } from 'express';
import { LiftTypeService } from './lift-type.service';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { ListQuery } from '@common/utils/pagination';
import { CreateLiftTypeInput, UpdateLiftTypeInput } from './lift-type.validation';
import { IdParam } from '@common/validation/common.schemas';

export class LiftTypeController {
  constructor(private readonly liftTypeService: LiftTypeService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListQuery;
    await respondWithList(res, query, () => this.liftTypeService.list(req.tenantContext, query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.liftTypeService.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const liftType = await this.liftTypeService.create(req.tenantContext, req.body as CreateLiftTypeInput);
    await req.audit.log({ entityType: 'LIFT_TYPE', entityId: liftType.id, action: 'CREATE' });
    ApiResponse.created(res, liftType);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const liftType = await this.liftTypeService.update(req.tenantContext, id, req.body as UpdateLiftTypeInput);
    await req.audit.log({ entityType: 'LIFT_TYPE', entityId: liftType.id, action: 'UPDATE' });
    ApiResponse.success(res, liftType);
  });
}
