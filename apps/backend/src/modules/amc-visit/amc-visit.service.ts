import { Prisma } from '@prisma/client';
import { AmcVisitRepository } from './amc-visit.repository';
import { AmcContractRepository } from '@modules/amc-contract/amc-contract.repository';
import { AmcScheduleRepository } from '@modules/amc-schedule/amc-schedule.repository';
import { ServiceTypeRepository } from '@modules/master-data/service-type/service-type.repository';
import { StatusRepository } from '@modules/master-data/status/status.repository';
import { UserRepository } from '@modules/users/user.repository';
import { TenantContext } from '@common/types/tenant-context';
import { ListQuery, toPrismaListArgs } from '@common/utils/pagination';
import { BadRequestError, NotFoundError } from '@common/errors';
import { CreateAmcVisitInput, ListAmcVisitsQuery, UpdateAmcVisitInput } from './amc-visit.validation';

const SORT_FIELDS = ['visitDate', 'createdAt'] as const;
const VISIT_STATUS_ENTITY_TYPE = 'AMC_VISIT';
const SCHEDULE_STATUS_ENTITY_TYPE = 'AMC_SCHEDULE';
const COMPLETED_STATUS_CODE = 'COMPLETED';

export class AmcVisitService {
  constructor(
    private readonly visitRepository: AmcVisitRepository,
    private readonly contractRepository: AmcContractRepository,
    private readonly scheduleRepository: AmcScheduleRepository,
    private readonly serviceTypeRepository: ServiceTypeRepository,
    private readonly statusRepository: StatusRepository,
    private readonly userRepository: UserRepository
  ) {}

  async list(tenant: TenantContext, query: ListAmcVisitsQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'visitDate');
    const where: Prisma.AmcVisitWhereInput = {
      ...(query.amcContractId ? { amcContractId: query.amcContractId } : {}),
      ...(query.liftId ? { liftId: query.liftId } : {}),
      ...(query.technicianId ? { technicianId: query.technicianId } : {}),
      ...(query.statusId ? { statusId: query.statusId } : {})
    };

    const [items, totalItems] = await Promise.all([
      this.visitRepository.findMany(tenant, where, listArgs),
      this.visitRepository.count(tenant, where)
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const visit = await this.visitRepository.findById(tenant, id);
    if (!visit) throw new NotFoundError('AMC visit');
    return visit;
  }

  async create(tenant: TenantContext, input: CreateAmcVisitInput) {
    const contract = await this.contractRepository.findById(tenant, input.amcContractId);
    if (!contract) throw new BadRequestError('Invalid amcContractId');
    if (contract.lift.id !== input.liftId) {
      throw new BadRequestError('liftId must match the lift covered by this AMC contract');
    }

    if (input.amcScheduleId) {
      const schedule = await this.scheduleRepository.findById(tenant, input.amcScheduleId);
      if (!schedule || schedule.amcContractId !== input.amcContractId) {
        throw new BadRequestError('amcScheduleId does not belong to the given amcContractId');
      }
    }

    const [serviceType, status] = await Promise.all([
      this.serviceTypeRepository.findById(tenant, input.serviceTypeId),
      this.statusRepository.findActiveByEntityTypeAndId(tenant, VISIT_STATUS_ENTITY_TYPE, input.statusId)
    ]);
    if (!serviceType || !serviceType.isActive) throw new BadRequestError('Invalid or inactive serviceTypeId');
    if (!status) throw new BadRequestError(`Invalid statusId for entity type "${VISIT_STATUS_ENTITY_TYPE}"`);

    if (input.technicianId) {
      await this.assertUserValid(tenant, input.technicianId);
    }

    return this.visitRepository.create(tenant, input);
  }

  async update(tenant: TenantContext, id: number, input: UpdateAmcVisitInput) {
    const existing = await this.getById(tenant, id);

    let newStatusCode: string | undefined;
    if (input.statusId) {
      const status = await this.statusRepository.findActiveByEntityTypeAndId(tenant, VISIT_STATUS_ENTITY_TYPE, input.statusId);
      if (!status) throw new BadRequestError(`Invalid statusId for entity type "${VISIT_STATUS_ENTITY_TYPE}"`);
      newStatusCode = status.code;
    }
    if (input.technicianId) {
      await this.assertUserValid(tenant, input.technicianId);
    }

    const visit = await this.visitRepository.update(id, input);

    // Cascade: completing a scheduled visit also marks its AmcSchedule complete,
    // so the schedule list reflects reality without a separate manual step.
    if (newStatusCode === COMPLETED_STATUS_CODE && existing.amcScheduleId) {
      const scheduleCompletedStatus = await this.statusRepository.findByTenantEntityTypeAndCode(
        tenant,
        SCHEDULE_STATUS_ENTITY_TYPE,
        COMPLETED_STATUS_CODE
      );
      if (scheduleCompletedStatus) {
        await this.scheduleRepository.update(existing.amcScheduleId, { status: { connect: { id: scheduleCompletedStatus.id } } });
      }
    }

    return visit;
  }

  async softDelete(tenant: TenantContext, id: number): Promise<void> {
    await this.getById(tenant, id);
    await this.visitRepository.softDelete(id);
  }

  private async assertUserValid(tenant: TenantContext, userId: number): Promise<void> {
    const user = await this.userRepository.findById(tenant, userId);
    if (!user) throw new BadRequestError('Invalid technicianId');
  }
}
