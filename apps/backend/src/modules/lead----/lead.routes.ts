import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { idParamSchema } from '@common/validation/common.schemas';
import { LeadRepository } from './lead.repository';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import {
  createLeadSchema,
  updateLeadSchema,
  listLeadsQuerySchema,
  assignLeadSchema,
  transitionLeadSchema,
} from './lead.validation';

container.register('LeadRepository', () => new LeadRepository(prisma));
container.register('LeadService', (c) => new LeadService(c.resolve('LeadRepository')));

const ctrl = new LeadController(container.resolve<LeadService>('LeadService'));

export const leadRouter = Router();
leadRouter.use(authenticate);

leadRouter.get('/',    requirePermissions(['lead.view']),   validate(listLeadsQuerySchema, 'query'), ctrl.list);
leadRouter.get('/:id', requirePermissions(['lead.view']),   validate(idParamSchema, 'params'),       ctrl.getById);
leadRouter.post('/',   requirePermissions(['lead.create']), validate(createLeadSchema, 'body'),      ctrl.create);

leadRouter.patch('/:id',
  requirePermissions(['lead.update']),
  validate(idParamSchema, 'params'),
  validate(updateLeadSchema, 'body'),
  ctrl.update
);

leadRouter.post('/:id/assign',
  requirePermissions(['lead.assign']),
  validate(idParamSchema, 'params'),
  validate(assignLeadSchema, 'body'),
  ctrl.assign
);

leadRouter.post('/:id/transition',
  requirePermissions(['lead.update']),
  validate(idParamSchema, 'params'),
  validate(transitionLeadSchema, 'body'),
  ctrl.transition
);

leadRouter.delete('/:id', requirePermissions(['lead.manage']), validate(idParamSchema, 'params'), ctrl.remove);
