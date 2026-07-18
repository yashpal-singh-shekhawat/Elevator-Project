import { Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { NotFoundError } from '@common/errors';
import { ListQuery, toPrismaListArgs, buildSearchWhere } from '@common/utils/pagination';
import { LeadRepository } from './lead.repository';
import { CreateLeadInput, UpdateLeadInput, ListLeadsQuery } from './lead.validation';

const SORT_FIELDS = ['id', 'leadCode', 'createdAt', 'updatedAt'] as const;
const SEARCH_FIELDS = ['leadCode', 'contactName', 'contactPhone', 'contactEmail'] as const;

export class LeadService {
  constructor(private readonly leadRepository: LeadRepository) {}

  async list(tenant: TenantContext, query: ListLeadsQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'createdAt');
    const searchWhere = buildSearchWhere(query.search, SEARCH_FIELDS) ?? {};
    const where: Prisma.LeadWhereInput = {
      ...searchWhere,
      ...(query.vertical ? { vertical: query.vertical } : {}),
      ...(query.statusId ? { statusId: query.statusId } : {}),
      ...(query.assignedToId ? { assignedToId: query.assignedToId } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.leadRepository.findMany(tenant, where, listArgs),
      this.leadRepository.count(tenant, where),
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const lead = await this.leadRepository.findById(tenant, id);
    if (!lead) throw new NotFoundError('Lead');
    return lead;
  }

  create(tenant: TenantContext, input: CreateLeadInput) {
    return this.leadRepository.create(tenant, input as any);
  }

  async update(tenant: TenantContext, id: number, input: UpdateLeadInput) {
    await this.getById(tenant, id);
    return this.leadRepository.update(id, input as any);
  }

  async assign(tenant: TenantContext, id: number, assignedToId: number) {
    await this.getById(tenant, id);
    return this.leadRepository.update(id, { assignedTo: { connect: { id: assignedToId } } });
  }

  async transition(tenant: TenantContext, id: number, statusId: number, actionedById: number, remarks?: string) {
    const lead = await this.getById(tenant, id);

    // Log to WorkflowTransition first, same pattern as InstallationProject's
    // transition endpoint — this is what makes the audit trail queryable.
    await this.leadRepository.logTransition(tenant, {
      entityType: 'LEAD',
      entityId: id,
      fromStatusId: lead.statusId,
      toStatusId: statusId,
      actionedById,
      remarks,
    });

    return this.leadRepository.update(id, { status: { connect: { id: statusId } } });
  }

  async softDelete(tenant: TenantContext, id: number): Promise<void> {
    await this.getById(tenant, id);
    await this.leadRepository.softDelete(id);
  }
}
