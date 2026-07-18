import { Request, Response } from 'express';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { IdParam } from '@common/validation/common.schemas';
import { LeadService } from './lead.service';
import { CreateLeadInput, UpdateLeadInput, ListLeadsQuery } from './lead.validation';

export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListLeadsQuery;
    await respondWithList(res, query, () => this.leadService.list(req.tenantContext, query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.leadService.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const lead = await this.leadService.create(req.tenantContext, req.body as CreateLeadInput);
    await req.audit.log({ entityType: 'LEAD', entityId: lead.id, action: 'CREATE' });
    await req.audit.activity('LEAD', lead.id, `Lead "${lead.leadCode}" created (${lead.vertical})`);
    ApiResponse.created(res, lead);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const lead = await this.leadService.update(req.tenantContext, id, req.body as UpdateLeadInput);
    await req.audit.log({ entityType: 'LEAD', entityId: lead.id, action: 'UPDATE' });
    ApiResponse.success(res, lead);
  });

  assign = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const { assignedToId } = req.body as { assignedToId: number };
    const lead = await this.leadService.assign(req.tenantContext, id, assignedToId);
    await req.audit.log({ entityType: 'LEAD', entityId: lead.id, action: 'ASSIGN' });
    await req.audit.activity('LEAD', lead.id, `Lead assigned to user #${assignedToId}`);
    ApiResponse.success(res, lead);
  });

  transition = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const { statusId, remarks } = req.body as { statusId: number; remarks?: string };
    const lead = await this.leadService.transition(req.tenantContext, id, statusId);
    await req.audit.log({ entityType: 'LEAD', entityId: lead.id, action: 'STATUS_CHANGE' });
    await req.audit.activity('LEAD', lead.id, `Lead status changed${remarks ? ': ' + remarks : ''}`);
    ApiResponse.success(res, lead);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    await this.leadService.softDelete(req.tenantContext, id);
    await req.audit.log({ entityType: 'LEAD', entityId: id, action: 'DELETE' });
    ApiResponse.noContent(res);
  });
}
