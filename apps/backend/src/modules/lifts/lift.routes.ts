import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { LiftRepository } from './lift.repository';
import { LiftService } from './lift.service';
import { LiftController } from './lift.controller';
import { SiteRepository } from '@modules/sites/site.repository';
import { LiftTypeRepository } from '@modules/master-data/lift-type/lift-type.repository';
import { StatusRepository } from '@modules/master-data/status/status.repository';
import { createLiftSchema, listLiftsQuerySchema, updateLiftSchema } from './lift.validation';
import { idParamSchema } from '@common/validation/common.schemas';

container.register('LiftRepository', () => new LiftRepository(prisma));
container.register(
  'LiftService',
  (c) =>
    new LiftService(
      c.resolve('LiftRepository'),
      c.resolve<SiteRepository>('SiteRepository'),
      c.resolve<LiftTypeRepository>('LiftTypeRepository'),
      c.resolve<StatusRepository>('StatusRepository')
    )
);

const liftController = new LiftController(container.resolve<LiftService>('LiftService'));

export const liftRouter = Router();
liftRouter.use(authenticate);

liftRouter.get('/', requirePermissions(['lift.view']), validate(listLiftsQuerySchema, 'query'), liftController.list);
liftRouter.get('/:id', requirePermissions(['lift.view']), validate(idParamSchema, 'params'), liftController.getById);
liftRouter.post('/', requirePermissions(['lift.manage']), validate(createLiftSchema, 'body'), liftController.create);
liftRouter.patch(
  '/:id',
  requirePermissions(['lift.manage']),
  validate(idParamSchema, 'params'),
  validate(updateLiftSchema, 'body'),
  liftController.update
);
liftRouter.delete('/:id', requirePermissions(['lift.manage']), validate(idParamSchema, 'params'), liftController.remove);
