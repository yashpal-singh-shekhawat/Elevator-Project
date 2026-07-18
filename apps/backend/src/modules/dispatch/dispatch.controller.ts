import { Request, Response } from 'express';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { IdParam } from '@common/validation/common.schemas';
import { DispatchService } from './dispatch.service';
import { CreateDispatchInput, UpdateDispatchInput } from './dispatch.validation';

export class DispatchController {
  constructor(private readonly service: DispatchService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    await respondWithList(res, req.query as any, () => this.service.list(req.tenantContext, req.query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.service.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const dispatch = await this.service.create(req.tenantContext, req.body as CreateDispatchInput, req.user!.id);
    await req.audit.log({ entityType: 'DISPATCH', entityId: dispatch.id, action: 'CREATE' });
    await req.audit.activity('DISPATCH', dispatch.id, `Dispatch "${dispatch.dispatchCode}" created`);
    ApiResponse.created(res, dispatch);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const dispatch = await this.service.update(req.tenantContext, id, req.body as UpdateDispatchInput);
    await req.audit.log({ entityType: 'DISPATCH', entityId: dispatch.id, action: 'UPDATE' });
    ApiResponse.success(res, dispatch);
  });

  validateDelivery = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const { hasException, exceptionNotes } = req.body;
    const dispatch = await this.service.validateDelivery(req.tenantContext, id, hasException, exceptionNotes, req.user!.id);
    await req.audit.log({ entityType: 'DISPATCH', entityId: dispatch.id, action: 'VALIDATE_DELIVERY' });
    await req.audit.activity('DISPATCH', dispatch.id, hasException ? `Delivery exception: ${exceptionNotes}` : 'Delivery validated');
    ApiResponse.success(res, dispatch);
  });
}
