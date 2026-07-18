import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { SiteRepository } from './site.repository';
import { SiteService } from './site.service';
import { SiteController } from './site.controller';
import { CustomerRepository } from '@modules/customers/customer.repository';
import { createSiteSchema, listSitesQuerySchema, updateSiteSchema } from './site.validation';
import { idParamSchema } from '@common/validation/common.schemas';

container.register('SiteRepository', () => new SiteRepository(prisma));
container.register(
  'SiteService',
  (c) => new SiteService(c.resolve('SiteRepository'), c.resolve<CustomerRepository>('CustomerRepository'))
);

const siteController = new SiteController(container.resolve<SiteService>('SiteService'));

export const siteRouter = Router();
siteRouter.use(authenticate);

siteRouter.get('/', requirePermissions(['customer.view']), validate(listSitesQuerySchema, 'query'), siteController.list);
siteRouter.get('/:id', requirePermissions(['customer.view']), validate(idParamSchema, 'params'), siteController.getById);
siteRouter.post('/', requirePermissions(['customer.manage']), validate(createSiteSchema, 'body'), siteController.create);
siteRouter.patch(
  '/:id',
  requirePermissions(['customer.manage']),
  validate(idParamSchema, 'params'),
  validate(updateSiteSchema, 'body'),
  siteController.update
);
siteRouter.delete('/:id', requirePermissions(['customer.manage']), validate(idParamSchema, 'params'), siteController.remove);
