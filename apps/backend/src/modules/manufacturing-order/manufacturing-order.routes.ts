import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { idParamSchema } from '@common/validation/common.schemas';
import { ManufacturingOrderRepository } from './manufacturing-order.repository';
import { ManufacturingOrderService } from './manufacturing-order.service';
import { ManufacturingOrderController } from './manufacturing-order.controller';
import {
  createManufacturingOrderSchema,
  updateManufacturingOrderSchema,
  qcFailSchema,
  listManufacturingOrdersQuerySchema,
} from './manufacturing-order.validation';

container.register('ManufacturingOrderRepository', () => new ManufacturingOrderRepository(prisma));
container.register('ManufacturingOrderService', (c) => new ManufacturingOrderService(c.resolve('ManufacturingOrderRepository'), prisma));

const ctrl = new ManufacturingOrderController(container.resolve<ManufacturingOrderService>('ManufacturingOrderService'));

export const manufacturingOrderRouter = Router();
manufacturingOrderRouter.use(authenticate);

manufacturingOrderRouter.get('/',    requirePermissions(['manufacturing.view']),   validate(listManufacturingOrdersQuerySchema, 'query'), ctrl.list);
manufacturingOrderRouter.get('/:id', requirePermissions(['manufacturing.view']),   validate(idParamSchema, 'params'),                     ctrl.getById);
manufacturingOrderRouter.post('/',   requirePermissions(['manufacturing.manage']), validate(createManufacturingOrderSchema, 'body'),       ctrl.create);

manufacturingOrderRouter.patch('/:id',
  requirePermissions(['manufacturing.manage']),
  validate(idParamSchema, 'params'),
  validate(updateManufacturingOrderSchema, 'body'),
  ctrl.update
);

manufacturingOrderRouter.post('/:id/qc-pass',
  requirePermissions(['manufacturing.qc']),
  validate(idParamSchema, 'params'),
  ctrl.qcPass
);

manufacturingOrderRouter.post('/:id/qc-fail',
  requirePermissions(['manufacturing.qc']),
  validate(idParamSchema, 'params'),
  validate(qcFailSchema, 'body'),
  ctrl.qcFail
);

manufacturingOrderRouter.post('/:id/ready-for-dispatch',
  requirePermissions(['manufacturing.manage']),
  validate(idParamSchema, 'params'),
  ctrl.markReadyForDispatch
);
