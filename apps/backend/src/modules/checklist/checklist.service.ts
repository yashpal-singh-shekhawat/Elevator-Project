import { ChecklistRepository } from './checklist.repository';
import { InstallationTaskRepository } from '@modules/installation-task/installation-task.repository';
import { AmcVisitRepository } from '@modules/amc-visit/amc-visit.repository';
import { TenantContext, AuthenticatedUser } from '@common/types/tenant-context';
import { ListQuery, toPrismaListArgs } from '@common/utils/pagination';
import { BadRequestError, ForbiddenError, NotFoundError } from '@common/errors';
import {
  CHECKLIST_MANAGE_PERMISSION,
  CreateChecklistItemInput,
  ListChecklistItemsQuery,
  UpdateChecklistItemInput
} from './checklist.validation';

const SORT_FIELDS = ['sortOrder', 'createdAt'] as const;

export class ChecklistService {
  constructor(
    private readonly checklistRepository: ChecklistRepository,
    private readonly installationTaskRepository: InstallationTaskRepository,
    private readonly amcVisitRepository: AmcVisitRepository
  ) {}

  async list(tenant: TenantContext, query: ListChecklistItemsQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'sortOrder');
    const [items, totalItems] = await Promise.all([
      this.checklistRepository.findMany(tenant, query.entityType, query.entityId, listArgs),
      this.checklistRepository.count(tenant, query.entityType, query.entityId)
    ]);
    return { items, totalItems };
  }

  async create(tenant: TenantContext, input: CreateChecklistItemInput) {
    await this.assertParentEntityExists(tenant, input.entityType, input.entityId);
    return this.checklistRepository.create(tenant, input);
  }

  async update(tenant: TenantContext, id: number, user: AuthenticatedUser, input: UpdateChecklistItemInput) {
    const existing = await this.checklistRepository.findById(tenant, id);
    if (!existing) throw new NotFoundError('Checklist item');
    this.assertManagePermission(user, existing.entityType);

    const checkStateChange =
      input.isChecked === true
        ? { checkedById: user.id, checkedAt: new Date() }
        : input.isChecked === false
          ? { checkedById: null, checkedAt: null }
          : {};

    return this.checklistRepository.update(id, { ...input, ...checkStateChange });
  }

  async remove(tenant: TenantContext, id: number, user: AuthenticatedUser): Promise<void> {
    const existing = await this.checklistRepository.findById(tenant, id);
    if (!existing) throw new NotFoundError('Checklist item');
    this.assertManagePermission(user, existing.entityType);
    await this.checklistRepository.delete(id);
  }

  /**
   * Confirms the polymorphic parent (entityType + entityId) actually exists
   * for this tenant. Add a new case (and an entry in CHECKLIST_ENTITY_TYPES /
   * CHECKLIST_*_PERMISSION in checklist.validation.ts) to onboard a new
   * checklist-bearing entity type.
   */
  private async assertParentEntityExists(tenant: TenantContext, entityType: string, entityId: number): Promise<void> {
    switch (entityType) {
      case 'INSTALLATION_TASK': {
        const exists = await this.installationTaskRepository.exists(tenant, entityId);
        if (!exists) throw new BadRequestError('Invalid entityId: no matching installation task for this tenant');
        return;
      }
      case 'AMC_VISIT': {
        const exists = await this.amcVisitRepository.exists(tenant, entityId);
        if (!exists) throw new BadRequestError('Invalid entityId: no matching AMC visit for this tenant');
        return;
      }
      default:
        throw new BadRequestError(`Unsupported checklist entityType "${entityType}"`);
    }
  }

  /**
   * update()/remove() only learn the parent entityType after fetching the
   * item (the client sends just an id), so — unlike list/create — this
   * permission check can't live in route middleware and is enforced here.
   */
  private assertManagePermission(user: AuthenticatedUser, entityType: string): void {
    const required = CHECKLIST_MANAGE_PERMISSION[entityType as keyof typeof CHECKLIST_MANAGE_PERMISSION];
    if (!required || !user.permissions.includes(required)) {
      throw new ForbiddenError(`Missing required permission: ${required ?? 'unknown for entityType ' + entityType}`);
    }
  }
}
