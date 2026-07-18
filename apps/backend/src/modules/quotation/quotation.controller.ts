import { Request, Response } from 'express';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { IdParam } from '@common/validation/common.schemas';
import { QuotationService } from './quotation.service';
import { CreateQuotationInput, UpdateQuotationInput, ListQuotationsQuery } from './quotation.validation';

export class QuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListQuotationsQuery;
    await respondWithList(res, query, () => this.quotationService.list(req.tenantContext, query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.quotationService.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const quotation = await this.quotationService.create(req.tenantContext, req.body as CreateQuotationInput);
    await req.audit.log({ entityType: 'QUOTATION', entityId: quotation.id, action: 'CREATE' });
    await req.audit.activity('QUOTATION', quotation.id, `Quotation "${quotation.quotationCode}" v${quotation.version} created`);
    ApiResponse.created(res, quotation);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const quotation = await this.quotationService.update(req.tenantContext, id, req.body as UpdateQuotationInput);
    await req.audit.log({ entityType: 'QUOTATION', entityId: quotation.id, action: 'UPDATE' });
    ApiResponse.success(res, quotation);
  });

  approve = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const quotation = await this.quotationService.approve(req.tenantContext, id, req.user!.id, req.body?.notes);
    await req.audit.log({ entityType: 'QUOTATION', entityId: quotation.id, action: 'APPROVE' });
    await req.audit.activity('QUOTATION', quotation.id, `Quotation approved`);
    ApiResponse.success(res, quotation);
  });

  reject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const quotation = await this.quotationService.reject(req.tenantContext, id, req.body.rejectionReason);
    await req.audit.log({ entityType: 'QUOTATION', entityId: quotation.id, action: 'REJECT' });
    await req.audit.activity('QUOTATION', quotation.id, `Quotation rejected: ${req.body.rejectionReason}`);
    ApiResponse.success(res, quotation);
  });

  revise = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const quotation = await this.quotationService.revise(req.tenantContext, id);
    await req.audit.log({ entityType: 'QUOTATION', entityId: quotation.id, action: 'REVISE' });
    await req.audit.activity('QUOTATION', quotation.id, `New revision v${quotation.version} created`);
    ApiResponse.created(res, quotation);
  });
}
