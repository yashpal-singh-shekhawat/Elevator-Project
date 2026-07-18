import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { idParamSchema } from '@common/validation/common.schemas';
import { PaymentRepository } from './payment.repository';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { createPaymentSchema, verifyPaymentSchema, listPaymentsQuerySchema } from './payment.validation';

container.register('PaymentRepository', () => new PaymentRepository(prisma));
container.register('PaymentService', (c) => new PaymentService(c.resolve('PaymentRepository')));

const ctrl = new PaymentController(container.resolve<PaymentService>('PaymentService'));

export const paymentRouter = Router();
paymentRouter.use(authenticate);

paymentRouter.get('/',    requirePermissions(['payment.view']),   validate(listPaymentsQuerySchema, 'query'), ctrl.list);
paymentRouter.get('/:id', requirePermissions(['payment.view']),   validate(idParamSchema, 'params'),         ctrl.getById);
paymentRouter.post('/',   requirePermissions(['payment.manage']), validate(createPaymentSchema, 'body'),     ctrl.create);

paymentRouter.post('/:id/verify',
  requirePermissions(['payment.verify']),
  validate(idParamSchema, 'params'),
  validate(verifyPaymentSchema, 'body'),
  ctrl.verify
);
