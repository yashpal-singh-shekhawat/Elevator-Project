import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { idParamSchema } from '@common/validation/common.schemas';
import { QuotationRepository } from './quotation.repository';
import { QuotationService } from './quotation.service';
import { QuotationController } from './quotation.controller';
import {
  createQuotationSchema,
  updateQuotationSchema,
  listQuotationsQuerySchema,
  approveQuotationSchema,
  rejectQuotationSchema,
} from './quotation.validation';

container.register('QuotationRepository', () => new QuotationRepository(prisma));
container.register('QuotationService', (c) => new QuotationService(c.resolve('QuotationRepository')));

const ctrl = new QuotationController(container.resolve<QuotationService>('QuotationService'));

export const quotationRouter = Router();
quotationRouter.use(authenticate);

quotationRouter.get('/',    requirePermissions(['quotation.view']),   validate(listQuotationsQuerySchema, 'query'), ctrl.list);
quotationRouter.get('/:id', requirePermissions(['quotation.view']),   validate(idParamSchema, 'params'),           ctrl.getById);
quotationRouter.post('/',   requirePermissions(['quotation.create']), validate(createQuotationSchema, 'body'),     ctrl.create);

quotationRouter.patch('/:id',
  requirePermissions(['quotation.manage']),
  validate(idParamSchema, 'params'),
  validate(updateQuotationSchema, 'body'),
  ctrl.update
);

quotationRouter.post('/:id/approve',
  requirePermissions(['quotation.approve']),
  validate(idParamSchema, 'params'),
  validate(approveQuotationSchema, 'body'),
  ctrl.approve
);

quotationRouter.post('/:id/reject',
  requirePermissions(['quotation.approve']),
  validate(idParamSchema, 'params'),
  validate(rejectQuotationSchema, 'body'),
  ctrl.reject
);

quotationRouter.post('/:id/revise',
  requirePermissions(['quotation.create']),
  validate(idParamSchema, 'params'),
  ctrl.revise
);
