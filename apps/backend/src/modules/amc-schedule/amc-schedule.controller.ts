import { Request, Response } from 'express';
import { AmcScheduleService } from './amc-schedule.service';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import {
  CreateAmcScheduleInput,
  GenerateAmcSchedulesInput,
  ListAmcSchedulesQuery,
  UpdateAmcScheduleInput
} from './amc-schedule.validation';
import { IdParam } from '@common/validation/common.schemas';

export class AmcScheduleController {
  constructor(private readonly scheduleService: AmcScheduleService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListAmcSchedulesQuery;
    await respondWithList(res, query, () => this.scheduleService.list(req.tenantContext, query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.scheduleService.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const schedule = await this.scheduleService.create(req.tenantContext, req.body as CreateAmcScheduleInput);
    await req.audit.log({ entityType: 'AMC_SCHEDULE', entityId: schedule.id, action: 'CREATE' });
    ApiResponse.created(res, schedule);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const schedule = await this.scheduleService.update(req.tenantContext, id, req.body as UpdateAmcScheduleInput);
    await req.audit.log({ entityType: 'AMC_SCHEDULE', entityId: schedule.id, action: 'UPDATE' });
    ApiResponse.success(res, schedule);
  });

  generate = asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as GenerateAmcSchedulesInput;
    const result = await this.scheduleService.generate(req.tenantContext, input);
    await req.audit.activity('AMC_CONTRACT', input.amcContractId, `Generated ${result.generatedCount} service schedules`);
    ApiResponse.created(res, result);
  });
}
