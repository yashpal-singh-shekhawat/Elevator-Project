import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { RoleRepository } from './role.repository';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { createRoleSchema, updateRoleSchema, setRolePermissionsSchema } from './role.validation';
import { idParamSchema } from '@common/validation/common.schemas';

container.register('RoleRepository', () => new RoleRepository(prisma));
container.register('RoleService', (c) => new RoleService(c.resolve('RoleRepository')));

const roleController = new RoleController(container.resolve<RoleService>('RoleService'));

export const roleRouter = Router();

// Managing roles & their permissions is part of tenant user administration, so
// it reuses the same 'users.manage' permission gate as the users module.
roleRouter.use(authenticate, requirePermissions(['users.manage']));

// Master permission list (grouped by module) — powers the checkbox matrix.
roleRouter.get('/permissions', roleController.listPermissions);

roleRouter.get('/', roleController.list);
roleRouter.get('/:id', validate(idParamSchema, 'params'), roleController.getById);
roleRouter.post('/', validate(createRoleSchema, 'body'), roleController.create);
roleRouter.patch('/:id', validate(idParamSchema, 'params'), validate(updateRoleSchema, 'body'), roleController.update);
roleRouter.put(
  '/:id/permissions',
  validate(idParamSchema, 'params'),
  validate(setRolePermissionsSchema, 'body'),
  roleController.setPermissions
);
roleRouter.delete('/:id', validate(idParamSchema, 'params'), roleController.remove);
