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

  /**
   * @param viewer  The authenticated caller. `list()` is permission-scoped:
   *   a caller holding `lead.view.all` sees every lead in the tenant, while a
   *   caller with only `lead.view` is transparently restricted to the leads
   *   assigned to them (assignedToId === viewer.id). This is role-agnostic —
   *   which roles carry `lead.view.all` is decided entirely by the tenant admin
   *   from the Roles & Permissions screen, never hardcoded here.
   */
  async list(
    tenant: TenantContext,
    query: ListLeadsQuery,
    viewer: { id: number; permissions: string[] }
  ) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'createdAt');
    const searchWhere = buildSearchWhere(query.search, SEARCH_FIELDS) ?? {};

    // Callers without the tenant-wide `lead.view.all` grant only ever see leads
    // assigned to them. If they additionally pass an ?assignedToId filter, it is
    // ignored in favour of the enforced self-scope so it can't be bypassed.
    const canViewAll = viewer.permissions.includes('lead.view.all');
    const scopedAssignedToId = canViewAll ? query.assignedToId : viewer.id;

    const where: Prisma.LeadWhereInput = {
      ...searchWhere,
      ...(query.vertical ? { vertical: query.vertical } : {}),
      ...(query.statusId ? { statusId: query.statusId } : {}),
      ...(scopedAssignedToId ? { assignedToId: scopedAssignedToId } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.leadRepository.findMany(tenant, where, listArgs),
      this.leadRepository.count(tenant, where),
    ]);
    return { items, totalItems };
  }

  /**
   * @param viewer  Optional. When supplied (from the HTTP getById endpoint), a
   *   caller without `lead.view.all` may only open a lead assigned to them —
   *   otherwise it 404s, so scoped users can't read siblings' leads by guessing
   *   ids. Internal callers (update/assign/transition/delete) omit `viewer` and
   *   are never self-scoped.
   */
  async getById(tenant: TenantContext, id: number, viewer?: { id: number; permissions: string[] }) {
    const lead = await this.leadRepository.findById(tenant, id);
    if (!lead) throw new NotFoundError('Lead');
    if (viewer && !viewer.permissions.includes('lead.view.all') && lead.assignedToId !== viewer.id) {
      throw new NotFoundError('Lead');
    }
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
