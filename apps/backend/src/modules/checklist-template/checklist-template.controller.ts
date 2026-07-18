import { Request, Response } from 'express';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { IdParam } from '@common/validation/common.schemas';
import { ChecklistTemplateService } from './checklist-template.service';
import { CreateTemplateInput, UpdateTemplateInput, ApplyTemplateInput } from './checklist-template.validation';

export class ChecklistTemplateController {
  constructor(private readonly service: ChecklistTemplateService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, entityType, search } = req.query as any;
    const p = Number(page || 1);
    const l = Number(limit || 20);
    const result = await this.service.list(req.tenantContext, { page: p, limit: l, entityType, search });
    ApiResponse.success(res, {
      data: result.items,
      total: result.totalItems,
      page: p,
      limit: l,
      totalPages: Math.ceil(result.totalItems / l),
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.service.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const template = await this.service.create(req.tenantContext, req.body as CreateTemplateInput);
    await req.audit.log({ entityType: 'CHECKLIST_TEMPLATE', entityId: template!.id, action: 'CREATE' });
    ApiResponse.created(res, template);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const template = await this.service.update(req.tenantContext, id, req.body as UpdateTemplateInput);
    await req.audit.log({ entityType: 'CHECKLIST_TEMPLATE', entityId: template.id, action: 'UPDATE' });
    ApiResponse.success(res, template);
  });

  apply = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const { entityType, entityId } = req.body as ApplyTemplateInput;
    const result = await this.service.applyTemplate(req.tenantContext, id, entityType, entityId);
    await req.audit.log({ entityType, entityId, action: 'CHECKLIST_TEMPLATE_APPLIED' });
    ApiResponse.success(res, result);
  });
}
