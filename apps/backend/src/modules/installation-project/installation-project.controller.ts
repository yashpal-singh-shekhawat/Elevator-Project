import { Request, Response } from 'express';
import { InstallationProjectService } from './installation-project.service';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import {
  CompleteInstallationProjectInput,
  CreateInstallationProjectInput,
  ListInstallationProjectsQuery,
  UpdateInstallationProjectInput
} from './installation-project.validation';
import { IdParam } from '@common/validation/common.schemas';

export class InstallationProjectController {
  constructor(private readonly projectService: InstallationProjectService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListInstallationProjectsQuery;
    await respondWithList(res, query, () => this.projectService.list(req.tenantContext, query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.projectService.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const project = await this.projectService.create(req.tenantContext, req.body as CreateInstallationProjectInput);
    await req.audit.log({ entityType: 'INSTALLATION_PROJECT', entityId: project.id, action: 'CREATE' });
    await req.audit.activity('INSTALLATION_PROJECT', project.id, `Project ${project.projectCode} created`);
    ApiResponse.created(res, project);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const project = await this.projectService.update(req.tenantContext, id, req.body as UpdateInstallationProjectInput);
    await req.audit.log({ entityType: 'INSTALLATION_PROJECT', entityId: project.id, action: 'UPDATE' });
    ApiResponse.success(res, project);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    await this.projectService.softDelete(req.tenantContext, id);
    await req.audit.log({ entityType: 'INSTALLATION_PROJECT', entityId: id, action: 'DELETE' });
    ApiResponse.noContent(res);
  });

  complete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const result = await this.projectService.complete(req.tenantContext, id, req.body as CompleteInstallationProjectInput);
    await req.audit.log({ entityType: 'INSTALLATION_PROJECT', entityId: id, action: 'STATUS_CHANGE' });
    await req.audit.activity(
      'INSTALLATION_PROJECT',
      id,
      `Project completed — Lift ${result.lift.serialNumber} created`
    );
    ApiResponse.success(res, result);
  });
}
