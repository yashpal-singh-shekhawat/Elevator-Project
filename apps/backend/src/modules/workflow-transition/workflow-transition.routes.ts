import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { WorkflowTransitionRepository } from './workflow-transition.repository';
import { WorkflowTransitionService } from './workflow-transition.service';
import { WorkflowTransitionController, listTransitionsQuerySchema } from './workflow-transition.controller';

container.register('WorkflowTransitionRepository', () => new WorkflowTransitionRepository(prisma));
container.register('WorkflowTransitionService', (c) => new WorkflowTransitionService(c.resolve('WorkflowTransitionRepository')));

const ctrl = new WorkflowTransitionController(
  container.resolve<WorkflowTransitionService>('WorkflowTransitionService')
);

export const workflowTransitionRouter = Router();
workflowTransitionRouter.use(authenticate);

// Read-only for users — writes happen automatically inside other modules' service methods
workflowTransitionRouter.get('/',
  requirePermissions(['workflow.transition']),
  validate(listTransitionsQuerySchema, 'query'),
  ctrl.list
);
