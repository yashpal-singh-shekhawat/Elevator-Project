import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { idParamSchema } from '@common/validation/common.schemas';
import { ChecklistTemplateRepository } from './checklist-template.repository';
import { ChecklistTemplateService } from './checklist-template.service';
import { ChecklistTemplateController } from './checklist-template.controller';
import {
  createTemplateSchema,
  updateTemplateSchema,
  applyTemplateSchema,
  listTemplatesQuerySchema,
} from './checklist-template.validation';

container.register('ChecklistTemplateRepository', () => new ChecklistTemplateRepository(prisma));
container.register('ChecklistTemplateService', (c) => new ChecklistTemplateService(c.resolve('ChecklistTemplateRepository')));

const ctrl = new ChecklistTemplateController(
  container.resolve<ChecklistTemplateService>('ChecklistTemplateService')
);

export const checklistTemplateRouter = Router();
checklistTemplateRouter.use(authenticate);

checklistTemplateRouter.get('/',
  requirePermissions(['checklist.template.view']),
  validate(listTemplatesQuerySchema, 'query'),
  ctrl.list
);
checklistTemplateRouter.get('/:id',
  requirePermissions(['checklist.template.view']),
  validate(idParamSchema, 'params'),
  ctrl.getById
);
checklistTemplateRouter.post('/',
  requirePermissions(['checklist.template.manage']),
  validate(createTemplateSchema, 'body'),
  ctrl.create
);
checklistTemplateRouter.patch('/:id',
  requirePermissions(['checklist.template.manage']),
  validate(idParamSchema, 'params'),
  validate(updateTemplateSchema, 'body'),
  ctrl.update
);
checklistTemplateRouter.post('/:id/apply',
  requirePermissions(['checklist.template.manage']),
  validate(idParamSchema, 'params'),
  validate(applyTemplateSchema, 'body'),
  ctrl.apply
);
