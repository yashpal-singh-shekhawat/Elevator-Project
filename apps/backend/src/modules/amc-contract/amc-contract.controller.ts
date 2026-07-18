import { Request, Response } from 'express';
import { AmcContractService } from './amc-contract.service';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import {
  CreateAmcContractInput,
  ListAmcContractsQuery,
  UpdateAmcContractInput
} from './amc-contract.validation';
import { IdParam } from '@common/validation/common.schemas';

export class AmcContractController {
  constructor(private readonly contractService: AmcContractService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListAmcContractsQuery;
    await respondWithList(res, query, () => this.contractService.list(req.tenantContext, query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.contractService.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const contract = await this.contractService.create(req.tenantContext, req.body as CreateAmcContractInput);
    await req.audit.log({ entityType: 'AMC_CONTRACT', entityId: contract.id, action: 'CREATE' });
    await req.audit.activity('AMC_CONTRACT', contract.id, `Contract ${contract.contractNumber} created`);
    ApiResponse.created(res, contract);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const contract = await this.contractService.update(req.tenantContext, id, req.body as UpdateAmcContractInput);
    await req.audit.log({ entityType: 'AMC_CONTRACT', entityId: contract.id, action: 'UPDATE' });
    ApiResponse.success(res, contract);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    await this.contractService.softDelete(req.tenantContext, id);
    await req.audit.log({ entityType: 'AMC_CONTRACT', entityId: id, action: 'DELETE' });
    ApiResponse.noContent(res);
  });
}
