import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { validate } from '@common/middlewares/validate.middleware';
import { authenticatePlatform } from '@common/middlewares/platform-auth.middleware';
import { PlatformAdminRepository } from './platform-admin.repository';
import { PlatformAdminService } from './platform-admin.service';
import { PlatformAdminController } from './platform-admin.controller';
import {
  platformLoginSchema,
  createTenantSchema,
  updateTenantSchema,
  setTenantStatusSchema,
  listTenantsQuerySchema
} from './platform-admin.validation';

container.register('PlatformAdminRepository', () => new PlatformAdminRepository(prisma));
container.register(
  'PlatformAdminService',
  (c) => new PlatformAdminService(c.resolve('PlatformAdminRepository'))
);

const ctrl = new PlatformAdminController(container.resolve<PlatformAdminService>('PlatformAdminService'));

export const platformAdminRouter = Router();

// Super-admin auth — completely separate from tenant /auth, own cookie/path.
platformAdminRouter.post('/auth/login', validate(platformLoginSchema, 'body'), ctrl.login);
platformAdminRouter.post('/auth/refresh', ctrl.refresh);
platformAdminRouter.post('/auth/logout', ctrl.logout);
platformAdminRouter.get('/auth/me', authenticatePlatform, ctrl.me);

// Dashboard aggregates — platform scope only.
platformAdminRouter.get('/dashboard', authenticatePlatform, ctrl.dashboard);

// Tenant management — platform scope only.
platformAdminRouter.get('/tenants', authenticatePlatform, validate(listTenantsQuerySchema, 'query'), ctrl.listTenants);
platformAdminRouter.post('/tenants', authenticatePlatform, validate(createTenantSchema, 'body'), ctrl.createTenant);
platformAdminRouter.get('/tenants/:id', authenticatePlatform, ctrl.getTenant);
platformAdminRouter.put(
  '/tenants/:id',
  authenticatePlatform,
  validate(updateTenantSchema, 'body'),
  ctrl.updateTenant
);
platformAdminRouter.patch(
  '/tenants/:id/status',
  authenticatePlatform,
  validate(setTenantStatusSchema, 'body'),
  ctrl.setTenantStatus
);
