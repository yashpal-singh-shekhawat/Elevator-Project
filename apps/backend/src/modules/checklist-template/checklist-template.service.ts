import { Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { NotFoundError } from '@common/errors';
import { ChecklistTemplateRepository } from './checklist-template.repository';
import { CreateTemplateInput, UpdateTemplateInput } from './checklist-template.validation';

export class ChecklistTemplateService {
  constructor(private readonly repo: ChecklistTemplateRepository) {}

  async list(tenant: TenantContext, query: { page: number; limit: number; entityType?: string; search?: string }) {
    const skip = (query.page - 1) * query.limit;
    const where: Prisma.ChecklistTemplateWhereInput = {
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.repo.findMany(tenant, where, skip, query.limit),
      this.repo.count(tenant, where),
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const t = await this.repo.findById(tenant, id);
    if (!t) throw new NotFoundError('ChecklistTemplate');
    return t;
  }

  async create(tenant: TenantContext, input: CreateTemplateInput) {
    const template = await this.repo.create(tenant, {
      name: input.name,
      description: input.description,
      entityType: input.entityType,
    });
    await this.repo.createItems(tenant.tenantId, tenant.organizationId, template.id, input.items);
    return this.repo.findById(tenant, template.id);
  }

  async update(tenant: TenantContext, id: number, input: UpdateTemplateInput) {
    await this.getById(tenant, id);
    return this.repo.update(id, input as any);
  }

  async applyTemplate(tenant: TenantContext, templateId: number, entityType: string, entityId: number) {
    const result = await this.repo.applyTemplate(tenant, templateId, entityType, entityId);
    if (!result) throw new NotFoundError('ChecklistTemplate');
    return result;
  }
}
