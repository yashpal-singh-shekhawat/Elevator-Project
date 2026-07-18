import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { AmcContractRepository } from './amc-contract.repository';
import { AmcContractService } from './amc-contract.service';
import { AmcContractController } from './amc-contract.controller';
import { CustomerRepository } from '@modules/customers/customer.repository';
import { LiftRepository } from '@modules/lifts/lift.repository';
import { ServiceTypeRepository } from '@modules/master-data/service-type/service-type.repository';
import { StatusRepository } from '@modules/master-data/status/status.repository';
import { createAmcContractSchema, listAmcContractsQuerySchema, updateAmcContractSchema } from './amc-contract.validation';
import { idParamSchema } from '@common/validation/common.schemas';

container.register('AmcContractRepository', () => new AmcContractRepository(prisma));
container.register(
  'AmcContractService',
  (c) =>
    new AmcContractService(
      c.resolve('AmcContractRepository'),
      c.resolve<CustomerRepository>('CustomerRepository'),
      c.resolve<LiftRepository>('LiftRepository'),
      c.resolve<ServiceTypeRepository>('ServiceTypeRepository'),
      c.resolve<StatusRepository>('StatusRepository')
    )
);

const contractController = new AmcContractController(container.resolve<AmcContractService>('AmcContractService'));

export const amcContractRouter = Router();
amcContractRouter.use(authenticate);

amcContractRouter.get('/', requirePermissions(['amc.view']), validate(listAmcContractsQuerySchema, 'query'), contractController.list);
amcContractRouter.get('/:id', requirePermissions(['amc.view']), validate(idParamSchema, 'params'), contractController.getById);
amcContractRouter.post('/', requirePermissions(['amc.create']), validate(createAmcContractSchema, 'body'), contractController.create);
amcContractRouter.patch(
  '/:id',
  requirePermissions(['amc.update']),
  validate(idParamSchema, 'params'),
  validate(updateAmcContractSchema, 'body'),
  contractController.update
);
amcContractRouter.delete('/:id', requirePermissions(['amc.update']), validate(idParamSchema, 'params'), contractController.remove);
