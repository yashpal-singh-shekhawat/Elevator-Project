import { Request, Response } from 'express';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { IdParam } from '@common/validation/common.schemas';
import { SiteSurveyService } from './site-survey.service';
import { CreateSiteSurveyInput, UpdateSiteSurveyInput } from './site-survey.validation';

export class SiteSurveyController {
  constructor(private readonly service: SiteSurveyService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    await respondWithList(res, req.query as any, () => this.service.list(req.tenantContext, req.query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.service.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const survey = await this.service.create(req.tenantContext, req.body as CreateSiteSurveyInput);
    await req.audit.log({ entityType: 'SITE_SURVEY', entityId: survey.id, action: 'CREATE' });
    await req.audit.activity('SITE_SURVEY', survey.id, `Site survey created for project #${survey.installationProjectId}`);
    ApiResponse.created(res, survey);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const survey = await this.service.update(req.tenantContext, id, req.body as UpdateSiteSurveyInput);
    await req.audit.log({ entityType: 'SITE_SURVEY', entityId: survey.id, action: 'UPDATE' });
    ApiResponse.success(res, survey);
  });
}
