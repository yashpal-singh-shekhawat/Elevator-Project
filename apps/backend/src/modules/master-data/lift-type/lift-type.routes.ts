import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { LiftTypeRepository } from './lift-type.repository';
import { LiftTypeService } from './lift-type.service';
import { LiftTypeController } from './lift-type.controller';
import { createLiftTypeSchema, listLiftTypesQuerySchema, updateLiftTypeSchema } from './lift-type.validation';
import { idParamSchema } from '@common/validation/common.schemas';

container.register('LiftTypeRepository', () => new LiftTypeRepository(prisma));
container.register('LiftTypeService', (c) => new LiftTypeService(c.resolve('LiftTypeRepository')));

const liftTypeController = new LiftTypeController(container.resolve<LiftTypeService>('LiftTypeService'));

export const liftTypeRouter = Router();
liftTypeRouter.use(authenticate);

liftTypeRouter.get('/', requirePermissions(['masterdata.view']), validate(listLiftTypesQuerySchema, 'query'), liftTypeController.list);
liftTypeRouter.get('/:id', requirePermissions(['masterdata.view']), validate(idParamSchema, 'params'), liftTypeController.getById);
liftTypeRouter.post('/', requirePermissions(['masterdata.manage']), validate(createLiftTypeSchema, 'body'), liftTypeController.create);
liftTypeRouter.patch(
  '/:id',
  requirePermissions(['masterdata.manage']),
  validate(idParamSchema, 'params'),
  validate(updateLiftTypeSchema, 'body'),
  liftTypeController.update
);
