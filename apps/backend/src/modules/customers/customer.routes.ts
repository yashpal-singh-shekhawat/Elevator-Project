import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { CustomerRepository } from './customer.repository';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { createCustomerSchema, listCustomersQuerySchema, updateCustomerSchema } from './customer.validation';
import { idParamSchema } from '@common/validation/common.schemas';

container.register('CustomerRepository', () => new CustomerRepository(prisma));
container.register('CustomerService', (c) => new CustomerService(c.resolve('CustomerRepository')));

const customerController = new CustomerController(container.resolve<CustomerService>('CustomerService'));

export const customerRouter = Router();
customerRouter.use(authenticate);

customerRouter.get('/', requirePermissions(['customer.view']), validate(listCustomersQuerySchema, 'query'), customerController.list);
customerRouter.get('/:id', requirePermissions(['customer.view']), validate(idParamSchema, 'params'), customerController.getById);
customerRouter.post('/', requirePermissions(['customer.manage']), validate(createCustomerSchema, 'body'), customerController.create);
customerRouter.patch(
  '/:id',
  requirePermissions(['customer.manage']),
  validate(idParamSchema, 'params'),
  validate(updateCustomerSchema, 'body'),
  customerController.update
);
customerRouter.delete('/:id', requirePermissions(['customer.manage']), validate(idParamSchema, 'params'), customerController.remove);
