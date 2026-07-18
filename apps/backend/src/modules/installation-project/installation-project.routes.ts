import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { InstallationProjectRepository } from './installation-project.repository';
import { InstallationProjectService } from './installation-project.service';
import { InstallationProjectController } from './installation-project.controller';
import { CustomerRepository } from '@modules/customers/customer.repository';
import { SiteRepository } from '@modules/sites/site.repository';
import { LiftTypeRepository } from '@modules/master-data/lift-type/lift-type.repository';
import { StatusRepository } from '@modules/master-data/status/status.repository';
import { UserRepository } from '@modules/users/user.repository';
import {
  completeInstallationProjectSchema,
  createInstallationProjectSchema,
  listInstallationProjectsQuerySchema,
  updateInstallationProjectSchema
} from './installation-project.validation';
import { idParamSchema } from '@common/validation/common.schemas';

container.register('InstallationProjectRepository', () => new InstallationProjectRepository(prisma));
container.register(
  'InstallationProjectService',
  (c) =>
    new InstallationProjectService(
      c.resolve('InstallationProjectRepository'),
      c.resolve<CustomerRepository>('CustomerRepository'),
      c.resolve<SiteRepository>('SiteRepository'),
      c.resolve<LiftTypeRepository>('LiftTypeRepository'),
      c.resolve<StatusRepository>('StatusRepository'),
      c.resolve<UserRepository>('UserRepository')
    )
);

const projectController = new InstallationProjectController(
  container.resolve<InstallationProjectService>('InstallationProjectService')
);

export const installationProjectRouter = Router();
installationProjectRouter.use(authenticate);

installationProjectRouter.get(
  '/',
  requirePermissions(['installation.view']),
  validate(listInstallationProjectsQuerySchema, 'query'),
  projectController.list
);
installationProjectRouter.get(
  '/:id',
  requirePermissions(['installation.view']),
  validate(idParamSchema, 'params'),
  projectController.getById
);
installationProjectRouter.post(
  '/',
  requirePermissions(['installation.create']),
  validate(createInstallationProjectSchema, 'body'),
  projectController.create
);
installationProjectRouter.patch(
  '/:id',
  requirePermissions(['installation.update']),
  validate(idParamSchema, 'params'),
  validate(updateInstallationProjectSchema, 'body'),
  projectController.update
);
installationProjectRouter.delete(
  '/:id',
  requirePermissions(['installation.update']),
  validate(idParamSchema, 'params'),
  projectController.remove
);
installationProjectRouter.post(
  '/:id/complete',
  requirePermissions(['installation.signoff']),
  validate(idParamSchema, 'params'),
  validate(completeInstallationProjectSchema, 'body'),
  projectController.complete
);
