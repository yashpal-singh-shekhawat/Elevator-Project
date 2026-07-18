import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { InstallationTaskRepository } from './installation-task.repository';
import { InstallationTaskService } from './installation-task.service';
import { InstallationTaskController } from './installation-task.controller';
import { InstallationProjectRepository } from '@modules/installation-project/installation-project.repository';
import { StatusRepository } from '@modules/master-data/status/status.repository';
import { UserRepository } from '@modules/users/user.repository';
import {
  createInstallationTaskSchema,
  listInstallationTasksQuerySchema,
  updateInstallationTaskSchema
} from './installation-task.validation';
import { idParamSchema } from '@common/validation/common.schemas';

container.register('InstallationTaskRepository', () => new InstallationTaskRepository(prisma));
container.register(
  'InstallationTaskService',
  (c) =>
    new InstallationTaskService(
      c.resolve('InstallationTaskRepository'),
      c.resolve<InstallationProjectRepository>('InstallationProjectRepository'),
      c.resolve<StatusRepository>('StatusRepository'),
      c.resolve<UserRepository>('UserRepository')
    )
);

const taskController = new InstallationTaskController(container.resolve<InstallationTaskService>('InstallationTaskService'));

export const installationTaskRouter = Router();
installationTaskRouter.use(authenticate);

installationTaskRouter.get(
  '/',
  requirePermissions(['installation.view']),
  validate(listInstallationTasksQuerySchema, 'query'),
  taskController.list
);
installationTaskRouter.get(
  '/:id',
  requirePermissions(['installation.view']),
  validate(idParamSchema, 'params'),
  taskController.getById
);
installationTaskRouter.post(
  '/',
  requirePermissions(['installation.update']),
  validate(createInstallationTaskSchema, 'body'),
  taskController.create
);
installationTaskRouter.patch(
  '/:id',
  requirePermissions(['installation.update']),
  validate(idParamSchema, 'params'),
  validate(updateInstallationTaskSchema, 'body'),
  taskController.update
);
installationTaskRouter.delete(
  '/:id',
  requirePermissions(['installation.update']),
  validate(idParamSchema, 'params'),
  taskController.remove
);
