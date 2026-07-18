import { Request, Response } from 'express';
import { LiftService } from './lift.service';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { CreateLiftInput, ListLiftsQuery, UpdateLiftInput } from './lift.validation';
import { IdParam } from '@common/validation/common.schemas';

export class LiftController {
  constructor(private readonly liftService: LiftService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListLiftsQuery;
    await respondWithList(res, query, () => this.liftService.list(req.tenantContext, query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.liftService.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const lift = await this.liftService.create(req.tenantContext, req.body as CreateLiftInput);
    await req.audit.log({ entityType: 'LIFT', entityId: lift.id, action: 'CREATE' });
    await req.audit.activity('LIFT', lift.id, `Lift ${lift.serialNumber} registered`);
    ApiResponse.created(res, lift);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const lift = await this.liftService.update(req.tenantContext, id, req.body as UpdateLiftInput);
    await req.audit.log({ entityType: 'LIFT', entityId: lift.id, action: 'UPDATE' });
    ApiResponse.success(res, lift);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    await this.liftService.softDelete(req.tenantContext, id);
    await req.audit.log({ entityType: 'LIFT', entityId: id, action: 'DELETE' });
    ApiResponse.noContent(res);
  });
}
