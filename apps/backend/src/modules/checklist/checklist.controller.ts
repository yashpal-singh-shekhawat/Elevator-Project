import { Request, Response } from 'express';
import { ChecklistService } from './checklist.service';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { CreateChecklistItemInput, ListChecklistItemsQuery, UpdateChecklistItemInput } from './checklist.validation';
import { IdParam } from '@common/validation/common.schemas';

export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListChecklistItemsQuery;
    await respondWithList(res, query, () => this.checklistService.list(req.tenantContext, query));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const item = await this.checklistService.create(req.tenantContext, req.body as CreateChecklistItemInput);
    ApiResponse.created(res, item);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const item = await this.checklistService.update(req.tenantContext, id, req.user!, req.body as UpdateChecklistItemInput);
    ApiResponse.success(res, item);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    await this.checklistService.remove(req.tenantContext, id, req.user!);
    ApiResponse.noContent(res);
  });
}
