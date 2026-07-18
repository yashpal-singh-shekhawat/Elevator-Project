import { Request, Response } from 'express';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { IdParam } from '@common/validation/common.schemas';
import { GadDesignService } from './gad-design.service';
import { CreateGadDesignInput, UpdateGadDesignInput } from './gad-design.validation';

export class GadDesignController {
  constructor(private readonly service: GadDesignService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    await respondWithList(res, req.query as any, () => this.service.list(req.tenantContext, req.query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.service.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const design = await this.service.create(req.tenantContext, req.body as CreateGadDesignInput);
    await req.audit.log({ entityType: 'GAD_DESIGN', entityId: design.id, action: 'CREATE' });
    await req.audit.activity('GAD_DESIGN', design.id, `GAD design v${design.version} created`);
    ApiResponse.created(res, design);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const design = await this.service.update(req.tenantContext, id, req.body as UpdateGadDesignInput);
    await req.audit.log({ entityType: 'GAD_DESIGN', entityId: design.id, action: 'UPDATE' });
    ApiResponse.success(res, design);
  });

  submit = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const design = await this.service.submit(req.tenantContext, id);
    await req.audit.log({ entityType: 'GAD_DESIGN', entityId: design.id, action: 'SUBMIT' });
    await req.audit.activity('GAD_DESIGN', design.id, `GAD design submitted for review`);
    ApiResponse.success(res, design);
  });

  approve = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const design = await this.service.approve(req.tenantContext, id, req.user!.id);
    await req.audit.log({ entityType: 'GAD_DESIGN', entityId: design.id, action: 'APPROVE' });
    await req.audit.activity('GAD_DESIGN', design.id, `GAD design approved`);
    ApiResponse.success(res, design);
  });

  requestChanges = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const design = await this.service.requestChanges(req.tenantContext, id, req.user!.id, req.body.revisionNotes);
    await req.audit.log({ entityType: 'GAD_DESIGN', entityId: design.id, action: 'REQUEST_CHANGES' });
    await req.audit.activity('GAD_DESIGN', design.id, `Revision requested: ${req.body.revisionNotes}`);
    ApiResponse.success(res, design);
  });
}
