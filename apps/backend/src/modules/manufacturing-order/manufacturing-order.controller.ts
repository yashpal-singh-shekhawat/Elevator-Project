import { Request, Response } from 'express';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { IdParam } from '@common/validation/common.schemas';
import { ManufacturingOrderService } from './manufacturing-order.service';
import { CreateManufacturingOrderInput, UpdateManufacturingOrderInput } from './manufacturing-order.validation';

export class ManufacturingOrderController {
  constructor(private readonly service: ManufacturingOrderService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    await respondWithList(res, req.query as any, () => this.service.list(req.tenantContext, req.query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.service.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const order = await this.service.create(req.tenantContext, req.body as CreateManufacturingOrderInput, req.user!.id);
    await req.audit.log({ entityType: 'MANUFACTURING_ORDER', entityId: order.id, action: 'CREATE' });
    await req.audit.activity('MANUFACTURING_ORDER', order.id, `Order "${order.orderCode}" released`);
    ApiResponse.created(res, order);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const order = await this.service.update(req.tenantContext, id, req.body as UpdateManufacturingOrderInput);
    await req.audit.log({ entityType: 'MANUFACTURING_ORDER', entityId: order.id, action: 'UPDATE' });
    ApiResponse.success(res, order);
  });

  qcPass = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const order = await this.service.qcPass(req.tenantContext, id, req.user!.id);
    await req.audit.log({ entityType: 'MANUFACTURING_ORDER', entityId: order.id, action: 'QC_PASS' });
    await req.audit.activity('MANUFACTURING_ORDER', order.id, `QC passed`);
    ApiResponse.success(res, order);
  });

  qcFail = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const order = await this.service.qcFail(req.tenantContext, id, req.body.reason);
    await req.audit.log({ entityType: 'MANUFACTURING_ORDER', entityId: order.id, action: 'QC_FAIL' });
    await req.audit.activity('MANUFACTURING_ORDER', order.id, `QC failed: ${req.body.reason}`);
    ApiResponse.success(res, order);
  });

  markReadyForDispatch = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const order = await this.service.markReadyForDispatch(req.tenantContext, id);
    await req.audit.log({ entityType: 'MANUFACTURING_ORDER', entityId: order.id, action: 'READY_FOR_DISPATCH' });
    ApiResponse.success(res, order);
  });
}
