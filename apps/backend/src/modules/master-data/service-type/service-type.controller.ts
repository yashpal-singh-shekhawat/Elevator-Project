import { Request, Response } from 'express';
import { ServiceTypeService } from './service-type.service';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { ListQuery } from '@common/utils/pagination';
import { CreateServiceTypeInput, UpdateServiceTypeInput } from './service-type.validation';
import { IdParam } from '@common/validation/common.schemas';

export class ServiceTypeController {
  constructor(private readonly serviceTypeService: ServiceTypeService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListQuery;
    await respondWithList(res, query, () => this.serviceTypeService.list(req.tenantContext, query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.serviceTypeService.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const serviceType = await this.serviceTypeService.create(req.tenantContext, req.body as CreateServiceTypeInput);
    await req.audit.log({ entityType: 'SERVICE_TYPE', entityId: serviceType.id, action: 'CREATE' });
    ApiResponse.created(res, serviceType);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const serviceType = await this.serviceTypeService.update(req.tenantContext, id, req.body as UpdateServiceTypeInput);
    await req.audit.log({ entityType: 'SERVICE_TYPE', entityId: serviceType.id, action: 'UPDATE' });
    ApiResponse.success(res, serviceType);
  });
}
