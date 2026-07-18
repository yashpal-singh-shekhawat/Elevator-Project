import { Prisma } from '@prisma/client';
import { AmcContractRepository } from './amc-contract.repository';
import { CustomerRepository } from '@modules/customers/customer.repository';
import { LiftRepository } from '@modules/lifts/lift.repository';
import { ServiceTypeRepository } from '@modules/master-data/service-type/service-type.repository';
import { StatusRepository } from '@modules/master-data/status/status.repository';
import { TenantContext } from '@common/types/tenant-context';
import { ListQuery, toPrismaListArgs, buildSearchWhere } from '@common/utils/pagination';
import { BadRequestError, NotFoundError } from '@common/errors';
import {
  CreateAmcContractInput,
  ListAmcContractsQuery,
  UpdateAmcContractInput
} from './amc-contract.validation';

const SORT_FIELDS = ['contractNumber', 'startDate', 'endDate', 'createdAt'] as const;
const SEARCH_FIELDS = ['contractNumber'] as const;
const CONTRACT_STATUS_ENTITY_TYPE = 'AMC_CONTRACT';

export class AmcContractService {
  constructor(
    private readonly contractRepository: AmcContractRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly liftRepository: LiftRepository,
    private readonly serviceTypeRepository: ServiceTypeRepository,
    private readonly statusRepository: StatusRepository
  ) {}

  async list(tenant: TenantContext, query: ListAmcContractsQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'createdAt');
    const where: Prisma.AmcContractWhereInput = {
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.liftId ? { liftId: query.liftId } : {}),
      ...(query.statusId ? { statusId: query.statusId } : {}),
      ...(buildSearchWhere(query.search, SEARCH_FIELDS) ?? {})
    };

    const [items, totalItems] = await Promise.all([
      this.contractRepository.findMany(tenant, where, listArgs),
      this.contractRepository.count(tenant, where)
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const contract = await this.contractRepository.findById(tenant, id);
    if (!contract) throw new NotFoundError('AMC contract');
    return contract;
  }

  async create(tenant: TenantContext, input: CreateAmcContractInput) {
    const [customer, lift, serviceType, status] = await Promise.all([
      this.customerRepository.findById(tenant, input.customerId),
      this.liftRepository.findById(tenant, input.liftId),
      this.serviceTypeRepository.findById(tenant, input.serviceTypeId),
      this.statusRepository.findActiveByEntityTypeAndId(tenant, CONTRACT_STATUS_ENTITY_TYPE, input.statusId)
    ]);

    if (!customer) throw new BadRequestError('Invalid customerId');
    if (!lift) throw new BadRequestError('Invalid liftId');
    if (lift.site.customerId !== input.customerId) {
      throw new BadRequestError('liftId does not belong to a site owned by the given customerId');
    }
    if (!serviceType || !serviceType.isActive) throw new BadRequestError('Invalid or inactive serviceTypeId');
    if (!status) throw new BadRequestError(`Invalid statusId for entity type "${CONTRACT_STATUS_ENTITY_TYPE}"`);

    return this.contractRepository.create(tenant, input);
  }

  async update(tenant: TenantContext, id: number, input: UpdateAmcContractInput) {
    await this.getById(tenant, id);

    if (input.statusId) {
      const status = await this.statusRepository.findActiveByEntityTypeAndId(tenant, CONTRACT_STATUS_ENTITY_TYPE, input.statusId);
      if (!status) throw new BadRequestError(`Invalid statusId for entity type "${CONTRACT_STATUS_ENTITY_TYPE}"`);
    }
    if (input.serviceTypeId) {
      const serviceType = await this.serviceTypeRepository.findById(tenant, input.serviceTypeId);
      if (!serviceType || !serviceType.isActive) throw new BadRequestError('Invalid or inactive serviceTypeId');
    }

    return this.contractRepository.update(id, input);
  }

  async softDelete(tenant: TenantContext, id: number): Promise<void> {
    await this.getById(tenant, id);
    await this.contractRepository.softDelete(id);
  }
}
