import { Prisma } from '@prisma/client';
import { AmcScheduleRepository } from './amc-schedule.repository';
import { AmcContractRepository } from '@modules/amc-contract/amc-contract.repository';
import { ServiceTypeRepository } from '@modules/master-data/service-type/service-type.repository';
import { StatusRepository } from '@modules/master-data/status/status.repository';
import { TenantContext } from '@common/types/tenant-context';
import { ListQuery, toPrismaListArgs } from '@common/utils/pagination';
import { BadRequestError, NotFoundError } from '@common/errors';
import {
  CreateAmcScheduleInput,
  GenerateAmcSchedulesInput,
  ListAmcSchedulesQuery,
  UpdateAmcScheduleInput
} from './amc-schedule.validation';

const SORT_FIELDS = ['scheduledDate', 'createdAt'] as const;
const SCHEDULE_STATUS_ENTITY_TYPE = 'AMC_SCHEDULE';
const PLANNED_STATUS_CODE = 'PLANNED';

export class AmcScheduleService {
  constructor(
    private readonly scheduleRepository: AmcScheduleRepository,
    private readonly contractRepository: AmcContractRepository,
    private readonly serviceTypeRepository: ServiceTypeRepository,
    private readonly statusRepository: StatusRepository
  ) {}

  async list(tenant: TenantContext, query: ListAmcSchedulesQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'scheduledDate');
    const where: Prisma.AmcScheduleWhereInput = {
      amcContractId: query.amcContractId,
      ...(query.statusId ? { statusId: query.statusId } : {})
    };

    const [items, totalItems] = await Promise.all([
      this.scheduleRepository.findMany(tenant, where, listArgs),
      this.scheduleRepository.count(tenant, where)
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const schedule = await this.scheduleRepository.findById(tenant, id);
    if (!schedule) throw new NotFoundError('AMC schedule');
    return schedule;
  }

  async create(tenant: TenantContext, input: CreateAmcScheduleInput) {
    const contractExists = await this.contractRepository.exists(tenant, input.amcContractId);
    if (!contractExists) throw new BadRequestError('Invalid amcContractId');

    const [serviceType, status] = await Promise.all([
      this.serviceTypeRepository.findById(tenant, input.serviceTypeId),
      this.statusRepository.findActiveByEntityTypeAndId(tenant, SCHEDULE_STATUS_ENTITY_TYPE, input.statusId)
    ]);

    if (!serviceType || !serviceType.isActive) throw new BadRequestError('Invalid or inactive serviceTypeId');
    if (!status) throw new BadRequestError(`Invalid statusId for entity type "${SCHEDULE_STATUS_ENTITY_TYPE}"`);

    return this.scheduleRepository.create(tenant, input);
  }

  async update(tenant: TenantContext, id: number, input: UpdateAmcScheduleInput) {
    await this.getById(tenant, id);

    if (input.statusId) {
      const status = await this.statusRepository.findActiveByEntityTypeAndId(tenant, SCHEDULE_STATUS_ENTITY_TYPE, input.statusId);
      if (!status) throw new BadRequestError(`Invalid statusId for entity type "${SCHEDULE_STATUS_ENTITY_TYPE}"`);
    }
    if (input.serviceTypeId) {
      const serviceType = await this.serviceTypeRepository.findById(tenant, input.serviceTypeId);
      if (!serviceType || !serviceType.isActive) throw new BadRequestError('Invalid or inactive serviceTypeId');
    }

    return this.scheduleRepository.update(id, input);
  }

  /**
   * Bulk-creates evenly spaced PLANNED schedules across the contract's
   * [startDate, endDate] window, one per `numberOfServicesPerYear`.
   * E.g. a 1-year contract with 4 services/year gets a visit roughly every
   * ~91 days, first one ~91 days after startDate, last one before endDate.
   */
  async generate(tenant: TenantContext, input: GenerateAmcSchedulesInput) {
    const contract = await this.contractRepository.findById(tenant, input.amcContractId);
    if (!contract) throw new BadRequestError('Invalid amcContractId');

    const serviceTypeId = input.serviceTypeId ?? contract.serviceType.id;
    const plannedStatus = await this.statusRepository.findByTenantEntityTypeAndCode(
      tenant,
      SCHEDULE_STATUS_ENTITY_TYPE,
      PLANNED_STATUS_CODE
    );
    if (!plannedStatus) {
      throw new BadRequestError(`Master data missing: no "${PLANNED_STATUS_CODE}" status seeded for ${SCHEDULE_STATUS_ENTITY_TYPE}`);
    }

    const n = contract.numberOfServicesPerYear;
    const startMs = contract.startDate.getTime();
    const endMs = contract.endDate.getTime();
    const interval = (endMs - startMs) / (n + 1);

    const rows = Array.from({ length: n }, (_, i) => ({
      amcContractId: contract.id,
      serviceTypeId,
      statusId: plannedStatus.id,
      scheduledDate: new Date(startMs + interval * (i + 1))
    }));

    await this.scheduleRepository.createMany(tenant, rows);
    return { generatedCount: rows.length, scheduledDates: rows.map((r) => r.scheduledDate) };
  }
}
