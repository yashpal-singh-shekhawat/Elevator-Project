import { Request, Response } from 'express';
import { InstallationMilestoneService } from './installation-milestone.service';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import {
  CreateInstallationMilestoneInput,
  ListInstallationMilestonesQuery,
  SignOffMilestoneInput,
  UpdateInstallationMilestoneInput
} from './installation-milestone.validation';
import { IdParam } from '@common/validation/common.schemas';

export class InstallationMilestoneController {
  constructor(private readonly milestoneService: InstallationMilestoneService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListInstallationMilestonesQuery;
    await respondWithList(res, query, () => this.milestoneService.list(req.tenantContext, query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.milestoneService.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const milestone = await this.milestoneService.create(req.tenantContext, req.body as CreateInstallationMilestoneInput);
    await req.audit.log({ entityType: 'INSTALLATION_MILESTONE', entityId: milestone.id, action: 'CREATE' });
    ApiResponse.created(res, milestone);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const milestone = await this.milestoneService.update(req.tenantContext, id, req.body as UpdateInstallationMilestoneInput);
    await req.audit.log({ entityType: 'INSTALLATION_MILESTONE', entityId: milestone.id, action: 'UPDATE' });
    ApiResponse.success(res, milestone);
  });

  signOff = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const milestone = await this.milestoneService.signOff(req.tenantContext, id, req.user!, req.body as SignOffMilestoneInput);
    await req.audit.log({ entityType: 'INSTALLATION_MILESTONE', entityId: milestone.id, action: 'STATUS_CHANGE' });
    await req.audit.activity('INSTALLATION_MILESTONE', milestone.id, `Milestone "${milestone.name}" signed off`);
    ApiResponse.success(res, milestone);
  });
}
