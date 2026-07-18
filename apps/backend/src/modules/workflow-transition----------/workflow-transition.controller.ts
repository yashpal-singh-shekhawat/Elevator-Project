import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { WorkflowTransitionService } from './workflow-transition.service';

export const listTransitionsQuerySchema = z.object({
  entityType: z.string().min(1),
  entityId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export class WorkflowTransitionController {
  constructor(private readonly service: WorkflowTransitionService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const { entityType, entityId, page, limit } = req.query as any;
    const p = Number(page || 1);
    const l = Number(limit || 50);
    const result = await this.service.list(req.tenantContext, entityType, Number(entityId), p, l);
    ApiResponse.success(res, {
      data: result.items,
      total: result.totalItems,
      page: p,
      limit: l,
      totalPages: Math.ceil(result.totalItems / l),
    });
  });
}
