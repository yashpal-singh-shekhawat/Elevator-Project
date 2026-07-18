import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { ChecklistRepository } from './checklist.repository';
import { ChecklistService } from './checklist.service';
import { ChecklistController } from './checklist.controller';
import { requireChecklistPermission } from './checklist-permission.middleware';
import { InstallationTaskRepository } from '@modules/installation-task/installation-task.repository';
import { AmcVisitRepository } from '@modules/amc-visit/amc-visit.repository';
import { createChecklistItemSchema, listChecklistItemsQuerySchema, updateChecklistItemSchema } from './checklist.validation';
import { idParamSchema } from '@common/validation/common.schemas';

container.register('ChecklistRepository', () => new ChecklistRepository(prisma));
container.register(
  'ChecklistService',
  (c) =>
    new ChecklistService(
      c.resolve('ChecklistRepository'),
      c.resolve<InstallationTaskRepository>('InstallationTaskRepository'),
      c.resolve<AmcVisitRepository>('AmcVisitRepository')
    )
);

const checklistController = new ChecklistController(container.resolve<ChecklistService>('ChecklistService'));

// List/create know entityType up-front (query/body) so permission is
// resolved by requireChecklistPermission before the controller runs.
// Update/delete only know entityType after fetching the item by id, so
// that check lives in checklist.service.ts instead — see the comment there.
export const checklistRouter = Router();
checklistRouter.use(authenticate);

checklistRouter.get(
  '/',
  validate(listChecklistItemsQuerySchema, 'query'),
  requireChecklistPermission('query', 'view'),
  checklistController.list
);
checklistRouter.post(
  '/',
  validate(createChecklistItemSchema, 'body'),
  requireChecklistPermission('body', 'manage'),
  checklistController.create
);
checklistRouter.patch('/:id', validate(idParamSchema, 'params'), validate(updateChecklistItemSchema, 'body'), checklistController.update);
checklistRouter.delete('/:id', validate(idParamSchema, 'params'), checklistController.remove);
