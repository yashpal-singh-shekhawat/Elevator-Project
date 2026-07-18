import { LiftTypeRepository } from './lift-type.repository';
import { TenantContext } from '@common/types/tenant-context';
import { ListQuery, toPrismaListArgs } from '@common/utils/pagination';
import { ConflictError, NotFoundError } from '@common/errors';
import { CreateLiftTypeInput, UpdateLiftTypeInput } from './lift-type.validation';

const SORT_FIELDS = ['name', 'code', 'createdAt'] as const;

export class LiftTypeService {
  constructor(private readonly liftTypeRepository: LiftTypeRepository) {}

  async list(tenant: TenantContext, query: ListQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'name');
    const [items, totalItems] = await Promise.all([
      this.liftTypeRepository.findMany(tenant, listArgs),
      this.liftTypeRepository.count(tenant)
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const liftType = await this.liftTypeRepository.findById(tenant, id);
    if (!liftType) throw new NotFoundError('Lift type');
    return liftType;
  }

  async create(tenant: TenantContext, input: CreateLiftTypeInput) {
    const existing = await this.liftTypeRepository.findByCode(tenant, input.code);
    if (existing) throw new ConflictError(`Lift type code "${input.code}" already exists`);
    return this.liftTypeRepository.create(tenant, input);
  }

  async update(tenant: TenantContext, id: number, input: UpdateLiftTypeInput) {
    await this.getById(tenant, id);
    return this.liftTypeRepository.update(id, input);
  }
}
