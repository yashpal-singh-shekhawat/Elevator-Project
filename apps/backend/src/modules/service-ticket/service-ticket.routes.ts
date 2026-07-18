import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { idParamSchema } from '@common/validation/common.schemas';
import { ServiceTicketRepository } from './service-ticket.repository';
import { ServiceTicketService } from './service-ticket.service';
import { ServiceTicketController } from './service-ticket.controller';
import {
  createServiceTicketSchema,
  updateServiceTicketSchema,
  categorizeTicketSchema,
  assignTicketSchema,
  resolveTicketSchema,
  listServiceTicketsQuerySchema,
} from './service-ticket.validation';

container.register('ServiceTicketRepository', () => new ServiceTicketRepository(prisma));
container.register('ServiceTicketService', (c) => new ServiceTicketService(c.resolve('ServiceTicketRepository'), prisma));

const ctrl = new ServiceTicketController(container.resolve<ServiceTicketService>('ServiceTicketService'));

export const serviceTicketRouter = Router();
serviceTicketRouter.use(authenticate);

serviceTicketRouter.get('/',    requirePermissions(['ticket.view']),   validate(listServiceTicketsQuerySchema, 'query'), ctrl.list);
serviceTicketRouter.get('/:id', requirePermissions(['ticket.view']),   validate(idParamSchema, 'params'),                ctrl.getById);
serviceTicketRouter.post('/',   requirePermissions(['ticket.create']), validate(createServiceTicketSchema, 'body'),      ctrl.create);

serviceTicketRouter.patch('/:id',
  requirePermissions(['ticket.update']),
  validate(idParamSchema, 'params'),
  validate(updateServiceTicketSchema, 'body'),
  ctrl.update
);

serviceTicketRouter.post('/:id/categorize',
  requirePermissions(['ticket.manage']),
  validate(idParamSchema, 'params'),
  validate(categorizeTicketSchema, 'body'),
  ctrl.categorize
);

serviceTicketRouter.post('/:id/assign',
  requirePermissions(['ticket.assign']),
  validate(idParamSchema, 'params'),
  validate(assignTicketSchema, 'body'),
  ctrl.assign
);

serviceTicketRouter.post('/:id/start',
  requirePermissions(['ticket.update']),
  validate(idParamSchema, 'params'),
  ctrl.start
);

serviceTicketRouter.post('/:id/resolve',
  requirePermissions(['ticket.update']),
  validate(idParamSchema, 'params'),
  validate(resolveTicketSchema, 'body'),
  ctrl.resolve
);

serviceTicketRouter.post('/:id/close',
  requirePermissions(['ticket.close']),
  validate(idParamSchema, 'params'),
  ctrl.close
);
