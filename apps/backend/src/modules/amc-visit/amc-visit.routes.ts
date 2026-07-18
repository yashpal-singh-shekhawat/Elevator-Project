import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { AmcVisitRepository } from './amc-visit.repository';
import { AmcVisitService } from './amc-visit.service';
import { AmcVisitController } from './amc-visit.controller';
import { AmcContractRepository } from '@modules/amc-contract/amc-contract.repository';
import { AmcScheduleRepository } from '@modules/amc-schedule/amc-schedule.repository';
import { ServiceTypeRepository } from '@modules/master-data/service-type/service-type.repository';
import { StatusRepository } from '@modules/master-data/status/status.repository';
import { UserRepository } from '@modules/users/user.repository';
import { createAmcVisitSchema, listAmcVisitsQuerySchema, updateAmcVisitSchema } from './amc-visit.validation';
import { idParamSchema } from '@common/validation/common.schemas';

container.register('AmcVisitRepository', () => new AmcVisitRepository(prisma));
container.register(
  'AmcVisitService',
  (c) =>
    new AmcVisitService(
      c.resolve('AmcVisitRepository'),
      c.resolve<AmcContractRepository>('AmcContractRepository'),
      c.resolve<AmcScheduleRepository>('AmcScheduleRepository'),
      c.resolve<ServiceTypeRepository>('ServiceTypeRepository'),
      c.resolve<StatusRepository>('StatusRepository'),
      c.resolve<UserRepository>('UserRepository')
    )
);

const visitController = new AmcVisitController(container.resolve<AmcVisitService>('AmcVisitService'));

export const amcVisitRouter = Router();
amcVisitRouter.use(authenticate);

amcVisitRouter.get('/', requirePermissions(['amc.view']), validate(listAmcVisitsQuerySchema, 'query'), visitController.list);
amcVisitRouter.get('/:id', requirePermissions(['amc.view']), validate(idParamSchema, 'params'), visitController.getById);
amcVisitRouter.post('/', requirePermissions(['amc.update']), validate(createAmcVisitSchema, 'body'), visitController.create);
// Update is shared by managers editing visit details (amc.update), technicians
// logging findings/actions (amc.visit.log), and whoever assigns the technician
// (amc.assign) — any one of the three is sufficient at the route level for
// Phase 1; field-level enforcement (e.g. only amc.assign can set technicianId)
// can be added later if needed.
amcVisitRouter.patch(
  '/:id',
  requirePermissions(['amc.update', 'amc.visit.log', 'amc.assign'], { any: true }),
  validate(idParamSchema, 'params'),
  validate(updateAmcVisitSchema, 'body'),
  visitController.update
);
amcVisitRouter.delete('/:id', requirePermissions(['amc.update']), validate(idParamSchema, 'params'), visitController.remove);
