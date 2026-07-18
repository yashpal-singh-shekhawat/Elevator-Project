import { Request, Response } from 'express';
import { InstallationTaskService } from './installation-task.service';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import {
  CreateInstallationTaskInput,
  ListInstallationTasksQuery,
  UpdateInstallationTaskInput
} from './installation-task.validation';
import { IdParam } from '@common/validation/common.schemas';

export class InstallationTaskController {
  constructor(private readonly taskService: InstallationTaskService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListInstallationTasksQuery;
    await respondWithList(res, query, () => this.taskService.list(req.tenantContext, query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.taskService.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const task = await this.taskService.create(req.tenantContext, req.body as CreateInstallationTaskInput);
    await req.audit.log({ entityType: 'INSTALLATION_TASK', entityId: task.id, action: 'CREATE' });
    ApiResponse.created(res, task);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const task = await this.taskService.update(req.tenantContext, id, req.body as UpdateInstallationTaskInput);
    await req.audit.log({ entityType: 'INSTALLATION_TASK', entityId: task.id, action: 'UPDATE' });
    ApiResponse.success(res, task);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    await this.taskService.softDelete(req.tenantContext, id);
    await req.audit.log({ entityType: 'INSTALLATION_TASK', entityId: id, action: 'DELETE' });
    ApiResponse.noContent(res);
  });
}
