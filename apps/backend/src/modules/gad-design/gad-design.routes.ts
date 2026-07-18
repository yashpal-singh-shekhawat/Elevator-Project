import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { idParamSchema } from '@common/validation/common.schemas';
import { GadDesignRepository } from './gad-design.repository';
import { GadDesignService } from './gad-design.service';
import { GadDesignController } from './gad-design.controller';
import {
  createGadDesignSchema,
  updateGadDesignSchema,
  reviewGadDesignSchema,
  listGadDesignsQuerySchema,
} from './gad-design.validation';

container.register('GadDesignRepository', () => new GadDesignRepository(prisma));
container.register('GadDesignService', (c) => new GadDesignService(c.resolve('GadDesignRepository'), prisma));

const ctrl = new GadDesignController(container.resolve<GadDesignService>('GadDesignService'));

export const gadDesignRouter = Router();
gadDesignRouter.use(authenticate);

gadDesignRouter.get('/',    requirePermissions(['design.view']),   validate(listGadDesignsQuerySchema, 'query'), ctrl.list);
gadDesignRouter.get('/:id', requirePermissions(['design.view']),   validate(idParamSchema, 'params'),            ctrl.getById);
gadDesignRouter.post('/',   requirePermissions(['design.create']), validate(createGadDesignSchema, 'body'),      ctrl.create);

gadDesignRouter.patch('/:id',
  requirePermissions(['design.create']),
  validate(idParamSchema, 'params'),
  validate(updateGadDesignSchema, 'body'),
  ctrl.update
);

gadDesignRouter.post('/:id/submit',
  requirePermissions(['design.create']),
  validate(idParamSchema, 'params'),
  ctrl.submit
);

gadDesignRouter.post('/:id/approve',
  requirePermissions(['design.review']),
  validate(idParamSchema, 'params'),
  ctrl.approve
);

gadDesignRouter.post('/:id/request-changes',
  requirePermissions(['design.review']),
  validate(idParamSchema, 'params'),
  validate(reviewGadDesignSchema, 'body'),
  ctrl.requestChanges
);
