import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { idParamSchema } from '@common/validation/common.schemas';
import { DispatchRepository } from './dispatch.repository';
import { DispatchService } from './dispatch.service';
import { DispatchController } from './dispatch.controller';
import {
  createDispatchSchema,
  updateDispatchSchema,
  validateDeliverySchema,
  listDispatchesQuerySchema,
} from './dispatch.validation';

container.register('DispatchRepository', () => new DispatchRepository(prisma));
container.register('DispatchService', (c) => new DispatchService(c.resolve('DispatchRepository'), prisma));

const ctrl = new DispatchController(container.resolve<DispatchService>('DispatchService'));

export const dispatchRouter = Router();
dispatchRouter.use(authenticate);

dispatchRouter.get('/',    requirePermissions(['dispatch.view']),   validate(listDispatchesQuerySchema, 'query'), ctrl.list);
dispatchRouter.get('/:id', requirePermissions(['dispatch.view']),   validate(idParamSchema, 'params'),            ctrl.getById);
dispatchRouter.post('/',   requirePermissions(['dispatch.manage']), validate(createDispatchSchema, 'body'),       ctrl.create);

dispatchRouter.patch('/:id',
  requirePermissions(['dispatch.manage']),
  validate(idParamSchema, 'params'),
  validate(updateDispatchSchema, 'body'),
  ctrl.update
);

dispatchRouter.post('/:id/validate-delivery',
  requirePermissions(['dispatch.validate']),
  validate(idParamSchema, 'params'),
  validate(validateDeliverySchema, 'body'),
  ctrl.validateDelivery
);
