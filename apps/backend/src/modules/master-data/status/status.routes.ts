import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { StatusRepository } from './status.repository';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { createStatusSchema, listStatusesQuerySchema, updateStatusSchema } from './status.validation';
import { idParamSchema } from '@common/validation/common.schemas';

container.register('StatusRepository', () => new StatusRepository(prisma));
container.register('StatusService', (c) => new StatusService(c.resolve('StatusRepository')));

const statusController = new StatusController(container.resolve<StatusService>('StatusService'));

export const statusRouter = Router();
statusRouter.use(authenticate);

statusRouter.get('/', requirePermissions(['masterdata.view']), validate(listStatusesQuerySchema, 'query'), statusController.list);
statusRouter.get('/:id', requirePermissions(['masterdata.view']), validate(idParamSchema, 'params'), statusController.getById);
statusRouter.post('/', requirePermissions(['masterdata.manage']), validate(createStatusSchema, 'body'), statusController.create);
statusRouter.patch(
  '/:id',
  requirePermissions(['masterdata.manage']),
  validate(idParamSchema, 'params'),
  validate(updateStatusSchema, 'body'),
  statusController.update
);
