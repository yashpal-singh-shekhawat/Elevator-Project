import { StatusRepository } from './status.repository';
import { TenantContext } from '@common/types/tenant-context';
import { ListQuery, toPrismaListArgs } from '@common/utils/pagination';
import { ConflictError, NotFoundError } from '@common/errors';
import { CreateStatusInput, UpdateStatusInput } from './status.validation';

const SORT_FIELDS = ['sortOrder', 'code', 'label', 'createdAt'] as const;

export class StatusService {
  constructor(private readonly statusRepository: StatusRepository) {}

  async list(tenant: TenantContext, query: ListQuery & { entityType?: string }) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'sortOrder');
    const [items, totalItems] = await Promise.all([
      this.statusRepository.findMany(tenant, query.entityType, listArgs),
      this.statusRepository.count(tenant, query.entityType)
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const status = await this.statusRepository.findById(tenant, id);
    if (!status) throw new NotFoundError('Status');
    return status;
  }

  async create(tenant: TenantContext, input: CreateStatusInput) {
    const existing = await this.statusRepository.findByTenantEntityTypeAndCode(tenant, input.entityType, input.code);
    if (existing) {
      throw new ConflictError(`Status code "${input.code}" already exists for entity type "${input.entityType}"`);
    }
    return this.statusRepository.create(tenant, input);
  }

  async update(tenant: TenantContext, id: number, input: UpdateStatusInput) {
    await this.getById(tenant, id); // 404s if missing/wrong tenant
    return this.statusRepository.update(id, input);
  }
}
