import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { ServiceTypeRepository } from './service-type.repository';
import { ServiceTypeService } from './service-type.service';
import { ServiceTypeController } from './service-type.controller';
import { createServiceTypeSchema, listServiceTypesQuerySchema, updateServiceTypeSchema } from './service-type.validation';
import { idParamSchema } from '@common/validation/common.schemas';

container.register('ServiceTypeRepository', () => new ServiceTypeRepository(prisma));
container.register('ServiceTypeService', (c) => new ServiceTypeService(c.resolve('ServiceTypeRepository')));

const serviceTypeController = new ServiceTypeController(container.resolve<ServiceTypeService>('ServiceTypeService'));

export const serviceTypeRouter = Router();
serviceTypeRouter.use(authenticate);

serviceTypeRouter.get('/', requirePermissions(['masterdata.view']), validate(listServiceTypesQuerySchema, 'query'), serviceTypeController.list);
serviceTypeRouter.get('/:id', requirePermissions(['masterdata.view']), validate(idParamSchema, 'params'), serviceTypeController.getById);
serviceTypeRouter.post('/', requirePermissions(['masterdata.manage']), validate(createServiceTypeSchema, 'body'), serviceTypeController.create);
serviceTypeRouter.patch(
  '/:id',
  requirePermissions(['masterdata.manage']),
  validate(idParamSchema, 'params'),
  validate(updateServiceTypeSchema, 'body'),
  serviceTypeController.update
);
