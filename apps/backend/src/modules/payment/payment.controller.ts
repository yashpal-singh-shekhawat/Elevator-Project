import { Request, Response } from 'express';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { IdParam } from '@common/validation/common.schemas';
import { PaymentService } from './payment.service';
import { CreatePaymentInput, ListPaymentsQuery } from './payment.validation';

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListPaymentsQuery;
    await respondWithList(res, query, () => this.paymentService.list(req.tenantContext, query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.paymentService.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const payment = await this.paymentService.create(req.tenantContext, req.body as CreatePaymentInput);
    await req.audit.log({ entityType: 'PAYMENT', entityId: payment.id, action: 'CREATE' });
    await req.audit.activity('PAYMENT', payment.id, `Payment of ₹${payment.amount} recorded`);
    ApiResponse.created(res, payment);
  });

  verify = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const payment = await this.paymentService.verify(req.tenantContext, id, req.user!.id, req.body?.notes);
    await req.audit.log({ entityType: 'PAYMENT', entityId: payment.id, action: 'VERIFY' });
    await req.audit.activity('PAYMENT', payment.id, `Payment of ₹${payment.amount} verified`);
    ApiResponse.success(res, payment);
  });
}
