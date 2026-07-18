import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { AmcScheduleRepository } from './amc-schedule.repository';
import { AmcScheduleService } from './amc-schedule.service';
import { AmcScheduleController } from './amc-schedule.controller';
import { AmcContractRepository } from '@modules/amc-contract/amc-contract.repository';
import { ServiceTypeRepository } from '@modules/master-data/service-type/service-type.repository';
import { StatusRepository } from '@modules/master-data/status/status.repository';
import {
  createAmcScheduleSchema,
  generateAmcSchedulesSchema,
  listAmcSchedulesQuerySchema,
  updateAmcScheduleSchema
} from './amc-schedule.validation';
import { idParamSchema } from '@common/validation/common.schemas';

container.register('AmcScheduleRepository', () => new AmcScheduleRepository(prisma));
container.register(
  'AmcScheduleService',
  (c) =>
    new AmcScheduleService(
      c.resolve('AmcScheduleRepository'),
      c.resolve<AmcContractRepository>('AmcContractRepository'),
      c.resolve<ServiceTypeRepository>('ServiceTypeRepository'),
      c.resolve<StatusRepository>('StatusRepository')
    )
);

const scheduleController = new AmcScheduleController(container.resolve<AmcScheduleService>('AmcScheduleService'));

export const amcScheduleRouter = Router();
amcScheduleRouter.use(authenticate);

amcScheduleRouter.get('/', requirePermissions(['amc.view']), validate(listAmcSchedulesQuerySchema, 'query'), scheduleController.list);
amcScheduleRouter.get('/:id', requirePermissions(['amc.view']), validate(idParamSchema, 'params'), scheduleController.getById);
amcScheduleRouter.post('/', requirePermissions(['amc.update']), validate(createAmcScheduleSchema, 'body'), scheduleController.create);
amcScheduleRouter.post(
  '/generate',
  requirePermissions(['amc.update']),
  validate(generateAmcSchedulesSchema, 'body'),
  scheduleController.generate
);
amcScheduleRouter.patch(
  '/:id',
  requirePermissions(['amc.update']),
  validate(idParamSchema, 'params'),
  validate(updateAmcScheduleSchema, 'body'),
  scheduleController.update
);
