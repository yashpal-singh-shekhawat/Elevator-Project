import { TenantContext } from '@common/types/tenant-context';
import { WorkflowTransitionRepository } from './workflow-transition.repository';

export class WorkflowTransitionService {
  constructor(private readonly repo: WorkflowTransitionRepository) {}

  async list(tenant: TenantContext, entityType: string, entityId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, totalItems] = await Promise.all([
      this.repo.findMany(tenant, entityType, entityId, skip, limit),
      this.repo.count(tenant, entityType, entityId),
    ]);
    return { items, totalItems };
  }

  create(
    tenant: TenantContext,
    entityType: string,
    entityId: number,
    fromStatusId: number | undefined,
    toStatusId: number,
    actionedById: number,
    remarks?: string
  ) {
    return this.repo.create(tenant, entityType, entityId, fromStatusId, toStatusId, actionedById, remarks);
  }
}
