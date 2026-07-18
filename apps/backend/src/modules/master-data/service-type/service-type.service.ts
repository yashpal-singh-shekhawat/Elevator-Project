import { ServiceTypeRepository } from './service-type.repository';
import { TenantContext } from '@common/types/tenant-context';
import { ListQuery, toPrismaListArgs } from '@common/utils/pagination';
import { ConflictError, NotFoundError } from '@common/errors';
import { CreateServiceTypeInput, UpdateServiceTypeInput } from './service-type.validation';

const SORT_FIELDS = ['name', 'code', 'createdAt'] as const;

export class ServiceTypeService {
  constructor(private readonly serviceTypeRepository: ServiceTypeRepository) {}

  async list(tenant: TenantContext, query: ListQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'name');
    const [items, totalItems] = await Promise.all([
      this.serviceTypeRepository.findMany(tenant, listArgs),
      this.serviceTypeRepository.count(tenant)
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const serviceType = await this.serviceTypeRepository.findById(tenant, id);
    if (!serviceType) throw new NotFoundError('Service type');
    return serviceType;
  }

  async create(tenant: TenantContext, input: CreateServiceTypeInput) {
    const existing = await this.serviceTypeRepository.findByCode(tenant, input.code);
    if (existing) throw new ConflictError(`Service type code "${input.code}" already exists`);
    return this.serviceTypeRepository.create(tenant, input);
  }

  async update(tenant: TenantContext, id: number, input: UpdateServiceTypeInput) {
    await this.getById(tenant, id);
    return this.serviceTypeRepository.update(id, input);
  }
}
