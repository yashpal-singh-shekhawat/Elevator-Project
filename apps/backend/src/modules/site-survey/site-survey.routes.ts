import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { idParamSchema } from '@common/validation/common.schemas';
import { SiteSurveyRepository } from './site-survey.repository';
import { SiteSurveyService } from './site-survey.service';
import { SiteSurveyController } from './site-survey.controller';
import { createSiteSurveySchema, updateSiteSurveySchema, listSiteSurveysQuerySchema } from './site-survey.validation';

container.register('SiteSurveyRepository', () => new SiteSurveyRepository(prisma));
container.register('SiteSurveyService', (c) => new SiteSurveyService(c.resolve('SiteSurveyRepository')));

const ctrl = new SiteSurveyController(container.resolve<SiteSurveyService>('SiteSurveyService'));

export const siteSurveyRouter = Router();
siteSurveyRouter.use(authenticate);

siteSurveyRouter.get('/',    requirePermissions(['survey.view']),   validate(listSiteSurveysQuerySchema, 'query'), ctrl.list);
siteSurveyRouter.get('/:id', requirePermissions(['survey.view']),   validate(idParamSchema, 'params'),             ctrl.getById);
siteSurveyRouter.post('/',   requirePermissions(['survey.create']), validate(createSiteSurveySchema, 'body'),      ctrl.create);
siteSurveyRouter.patch('/:id',
  requirePermissions(['survey.create']),
  validate(idParamSchema, 'params'),
  validate(updateSiteSurveySchema, 'body'),
  ctrl.update
);
