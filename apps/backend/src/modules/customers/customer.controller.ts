import { Request, Response } from 'express';
import { CustomerService } from './customer.service';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { ListQuery } from '@common/utils/pagination';
import { CreateCustomerInput, UpdateCustomerInput } from './customer.validation';
import { IdParam } from '@common/validation/common.schemas';

export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListQuery;
    await respondWithList(res, query, () => this.customerService.list(req.tenantContext, query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.customerService.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const customer = await this.customerService.create(req.tenantContext, req.body as CreateCustomerInput);
    await req.audit.log({ entityType: 'CUSTOMER', entityId: customer.id, action: 'CREATE' });
    await req.audit.activity('CUSTOMER', customer.id, `Customer "${customer.name}" created`);
    ApiResponse.created(res, customer);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const customer = await this.customerService.update(req.tenantContext, id, req.body as UpdateCustomerInput);
    await req.audit.log({ entityType: 'CUSTOMER', entityId: customer.id, action: 'UPDATE' });
    ApiResponse.success(res, customer);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    await this.customerService.softDelete(req.tenantContext, id);
    await req.audit.log({ entityType: 'CUSTOMER', entityId: id, action: 'DELETE' });
    ApiResponse.noContent(res);
  });
}
