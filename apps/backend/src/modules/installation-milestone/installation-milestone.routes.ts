import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { InstallationMilestoneRepository } from './installation-milestone.repository';
import { InstallationMilestoneService } from './installation-milestone.service';
import { InstallationMilestoneController } from './installation-milestone.controller';
import { InstallationProjectRepository } from '@modules/installation-project/installation-project.repository';
import { StatusRepository } from '@modules/master-data/status/status.repository';
import {
  createInstallationMilestoneSchema,
  listInstallationMilestonesQuerySchema,
  signOffMilestoneSchema,
  updateInstallationMilestoneSchema
} from './installation-milestone.validation';
import { idParamSchema } from '@common/validation/common.schemas';

container.register('InstallationMilestoneRepository', () => new InstallationMilestoneRepository(prisma));
container.register(
  'InstallationMilestoneService',
  (c) =>
    new InstallationMilestoneService(
      c.resolve('InstallationMilestoneRepository'),
      c.resolve<InstallationProjectRepository>('InstallationProjectRepository'),
      c.resolve<StatusRepository>('StatusRepository')
    )
);

const milestoneController = new InstallationMilestoneController(
  container.resolve<InstallationMilestoneService>('InstallationMilestoneService')
);

export const installationMilestoneRouter = Router();
installationMilestoneRouter.use(authenticate);

installationMilestoneRouter.get(
  '/',
  requirePermissions(['installation.view']),
  validate(listInstallationMilestonesQuerySchema, 'query'),
  milestoneController.list
);
installationMilestoneRouter.get(
  '/:id',
  requirePermissions(['installation.view']),
  validate(idParamSchema, 'params'),
  milestoneController.getById
);
installationMilestoneRouter.post(
  '/',
  requirePermissions(['installation.update']),
  validate(createInstallationMilestoneSchema, 'body'),
  milestoneController.create
);
installationMilestoneRouter.patch(
  '/:id',
  requirePermissions(['installation.update']),
  validate(idParamSchema, 'params'),
  validate(updateInstallationMilestoneSchema, 'body'),
  milestoneController.update
);
installationMilestoneRouter.post(
  '/:id/sign-off',
  requirePermissions(['installation.signoff']),
  validate(idParamSchema, 'params'),
  validate(signOffMilestoneSchema, 'body'),
  milestoneController.signOff
);
